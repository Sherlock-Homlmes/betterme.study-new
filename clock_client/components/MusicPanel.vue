<script setup lang="ts">
import { computed, reactive, ref, watch, onUnmounted } from "vue";
import { useSound } from "@vueuse/sound";
import { useStorage, useRefHistory } from "@vueuse/core";
import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { useAuthStore } from "@/stores/auth";
import { useOpenPanels } from "@/stores/openpanels";

import {
	XIcon as CloseIcon,
	PlayerPlayIcon,
	PlayerPauseIcon,
	PlayerTrackPrevIcon,
	PlayerTrackNextIcon,
	VolumeIcon,
	VolumeOffIcon,
	RepeatIcon,
} from "vue-tabler-icons";

import { ButtonImportance } from "@/components/base/types/button";
import ControlButton from "@/components/base/uiButton.vue";

const runtimeConfig = useRuntimeConfig();
const { isAuth } = useAuthStore();
const openPanels = useOpenPanels();
const mobileSettingsStore = useMobileSettings();
const isWeb = computed(() => runtimeConfig.public.PLATFORM === "web");
const isMobile = computed(() => runtimeConfig.public.PLATFORM === "mobile");

const state = reactive({
	activeTab: 1,
	resetConfirm: false,
});

// Loop state
const isLooping = ref(false);

// Volume state with persistence and history
const volumeLevel = useStorage("music-volume", 0.75); // Persisted volume
const { history, undo, redo } = useRefHistory(volumeLevel, { capacity: 10 }); // History for unmute
const isVolumeSliderVisible = ref(false);
const currentTime = ref(0);
const isSeeking = ref(false); // To prevent updates while dragging slider
let playbackInterval: ReturnType<typeof setInterval> | null = null;

// Helper function for formatting time
const formatTime = (seconds: number): string => {
	if (isNaN(seconds) || seconds === Infinity) {
		return "00:00";
	}
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

// Sound setup
const { play, pause, isPlaying, volume, duration, sound } = useSound(
	"/audio/musical/sample.mp3",
	{
		volume: volumeLevel,
		interrupt: true, // Allow seeking while playing
		onplay: () => {
			if (sound.value && currentTime.value) {
				sound.value.seek(currentTime.value);
			}
			if (playbackInterval) clearInterval(playbackInterval); // Clear existing interval if any
			playbackInterval = setInterval(() => {
				if (sound.value && !isSeeking.value) {
					// Only update if not actively seeking
					const currentSeek = sound.value.seek();
					// Howler returns seek time in seconds, ensure it's a number
					if (typeof currentSeek === "number") {
						currentTime.value = currentSeek;
					}
				}
			}, 25);
			// TODO: Update time roughly depend on duration
			// CURRENT: Update time roughly 40 times per second
		},
		onpause: () => {
			if (playbackInterval) clearInterval(playbackInterval);
			playbackInterval = null;
		},
		onend: () => {
			if (playbackInterval) clearInterval(playbackInterval);
			playbackInterval = null;
			currentTime.value = 0; // Reset time on end unless looping
			if (isLooping.value && sound.value) {
				// Howler's loop doesn't reset seek, so manually seek to 0 then play
				sound.value.seek(0);
				play();
			} else {
				isPlaying.value = false; // Ensure isPlaying reflects the state
			}
		},
	},
);

// Computed properties for display
const formattedCurrentTime = computed(() => formatTime(currentTime.value));
const formattedDuration = computed(() =>
	formatTime((duration.value ?? 0) / 1000),
);

// Function to handle seeking from the input range
const handleSeek = (event: Event) => {
	const target = event.target as HTMLInputElement;
	const seekTime = parseFloat(target.value);
	if (sound.value && !isNaN(seekTime)) {
		sound.value.seek(seekTime); // seekTime is already in seconds
		currentTime.value = seekTime; // Immediately update visual state
	}
	isSeeking.value = false; // Allow interval updates again
};

// Update currentTime visually while dragging
const onSliderInput = (event: Event) => {
	isSeeking.value = true; // Prevent interval updates
	const target = event.target as HTMLInputElement;
	currentTime.value = parseFloat(target.value);
};

// Cleanup interval on component unmount
onUnmounted(() => {
	if (playbackInterval) {
		clearInterval(playbackInterval);
	}
});

const togglePlay = () => {
	if (isPlaying.value) {
		pause();
	} else {
		if (sound.value) {
			sound.value.seek(currentTime.value * 1000);
		}
		play();
	}
};

const toggleLoop = () => {
	isLooping.value = !isLooping.value;
};

// Function to toggle mute/unmute
const toggleMute = () => {
	if (volumeLevel.value === 0) {
		// Find the last non-zero volume in history
		const lastVolume = history.value.find(
			(entry) => entry.snapshot > 0,
		)?.snapshot;
		volumeLevel.value = lastVolume || 0.75; // Restore or default to 0.75
	} else {
		volumeLevel.value = 0; // Mute
	}
};

// Removed the watch function as direct binding should handle it
</script>

<template>
  <section class="fixed z-40 w-full h-full p-0 md:p-4 md:max-w-screen-sm">
    <div class="flex flex-col h-full overflow-hidden rounded-none shadow-lg bg-surface-light text-surface-onlight md:rounded-xl md:dark:ring-1 dark:ring-surface-ondark dark:ring-opacity-20 ring-inset dark:bg-surface-dark dark:text-surface-ondark" :style="{ 'padding-top': `${mobileSettingsStore.padding.top}px`, 'padding-bottom': `${mobileSettingsStore.padding.bottom}px` }">
      <h1 class="px-4 mt-4 text-xl font-bold uppercase">
        <span>Music</span>
        <ControlButton
          :aria-label="$t('settings.buttons.close')"
          default-style
          circle
          :importance="ButtonImportance.Text"
          class="float-right -mt-2 -mr-2"
          tabindex="0"
          @click="openPanels.music = false"
        >
          <CloseIcon :aria-label="$t('settings.buttons.close')" />
        </ControlButton>
      </h1>
      <hr class='mx-5 mt-2 mb-4'>
      <div class="flex-grow overflow-y-auto px-4 flex flex-col items-center">
        <!-- Album Art Placeholder -->
        <div class="w-48 h-48 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4 flex items-center justify-center">
          <span class="text-gray-500 dark:text-gray-400">Album Art</span>
        </div>

        <!-- Track Info -->
        <div class="text-center mb-4">
          <h2 class="text-lg font-semibold">Song Title</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">Artist Name</p>
        </div>

        <!-- Interactive Progress Bar -->
        <div v-if="duration && duration > 0" class="w-full max-w-md mb-4 px-2">
          <input
            type="range"
            min="0"
            :max="duration ? duration / 1000 : 0"
            step="0.01"
            :value="currentTime"
            @input="onSliderInput"
            @change="handleSeek"
            class="w-full h-2 bg-primary-container rounded-lg appearance-none cursor-pointer dark:bg-primary-darkcontainer music-slider"
            aria-label="Seek slider"
          />
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{{ formattedCurrentTime }}</span>
            <span>{{ formattedDuration }}</span>
          </div>
        </div>


        <!-- Combined Controls Row -->
        <div class="flex items-center justify-center space-x-4 w-full max-w-md mb-4">

          <!-- Volume Control -->
          <div
            class="relative"
            @mouseenter="isVolumeSliderVisible = true"
            @mouseleave="isVolumeSliderVisible = false"
          >
            <ControlButton
              :importance="ButtonImportance.Text"
              circle
              @click="toggleMute"
            >
              <VolumeOffIcon v-if="volumeLevel === 0" class="w-6 h-6" />
              <VolumeIcon v-else class="w-6 h-6" />
            </ControlButton>
            <!-- Horizontal Slider - appears on hover -->
            <Transition name="slide-fade">
              <input
                v-if="isVolumeSliderVisible"
                v-model.number="volumeLevel"
                type="range"
                min="0"
                max="1"
                step="0.01"
                class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-20 h-2 bg-primary-container rounded-lg appearance-none cursor-pointer dark:bg-primary-darkcontainer music-slider"
                aria-label="Volume"
              />
            </Transition>
          </div>

          <!-- Playback Controls Group -->
          <div class="flex items-center justify-center space-x-2">
            <ControlButton :importance="ButtonImportance.Text" circle>
              <PlayerTrackPrevIcon />
            </ControlButton>
            <ControlButton :importance="ButtonImportance.Text" circle class="w-12 h-12" @click="togglePlay">
            <!-- Toggle between Play and Pause -->
            <PlayerPauseIcon v-if="isPlaying" class="w-6 h-6" />
            <PlayerPlayIcon v-else class="w-6 h-6" />
          </ControlButton>
          <ControlButton :importance="ButtonImportance.Text" circle>
            <PlayerTrackNextIcon />
          </ControlButton>
          <ControlButton
            :importance="ButtonImportance.Text"
            circle
            @click="toggleLoop"
            :bgClass="isLooping ? 'border-2 border-primary-light dark:border-primary-dark bg-primary-light dark:bg-primary-dark' : 'border-2 border-transparent'"
            :innerClass="isLooping ? 'text-gray-600 dark:text-gray-400' : ''"
          >
              <RepeatIcon class="w-6 h-6" />
            </ControlButton>
          </div>
        </div>
        <!-- Removed old Volume Control Placeholder -->
      </div>
    </div>
  </section>
</template>

<style lang="scss">
.music-slider {
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #a7373a;
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #a7373a;
    border-radius: 50%;
    cursor: pointer;
  }

  &::-ms-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #a7373a;
    border-radius: 50%;
    cursor: pointer;
  }
}
</style>
