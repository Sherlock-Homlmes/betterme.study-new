<script setup lang="ts">
import { computed, reactive, ref, watch, onUnmounted, onMounted } from "vue";
import { useSound } from "@vueuse/sound";
import { useStorage, useRefHistory } from "@vueuse/core";
import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { useAuthStore } from "@/stores/auth";
import { useOpenPanels } from "@/stores/openpanels";
import { useLocalAudioDBStore, useAudioStore } from "@/stores/audios";


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

// --- Standard Component Setup ---
const runtimeConfig = useRuntimeConfig();
const { isAuth } = useAuthStore();
const { blobUrl, audioDataLoaded, loadAndSetAudio} = useLocalAudioDBStore()
const {} = useAudioStore()
const openPanels = useOpenPanels();
const mobileSettingsStore = useMobileSettings();

const state = reactive({
	activeTab: 1,
	resetConfirm: false,
});

// --- Audio State ---
// Initialize with empty string to satisfy useSound's type requirement (MaybeRef<string>)
const isLooping = ref(false);
const volumeLevel = useStorage("music-volume", 0.75); // Persisted volume
const { history, undo, redo } = useRefHistory(volumeLevel, { capacity: 10 }); // History for unmute
const isVolumeSliderVisible = ref(false);
const currentTime = ref(0);
const isSeeking = ref(false); // To prevent updates while dragging slider
let playbackInterval: ReturnType<typeof setInterval> | null = null;


// --- Sound Setup ---
const { play, pause, isPlaying, duration, sound, stop } = useSound(
	blobUrl, // Use the reactive ref here - useSound will react to its changes
	{
		volume: volumeLevel.value, // Set initial volume from the ref
		interrupt: true,
		html5: true, // Often helps with Blob URLs and seeking accuracy
		format: ["mp3"], // Explicitly tell Howler the format
		onplay: () => {
			// Attempt seek only if sound is loaded and currentTime > 0
			if (
				sound.value &&
				currentTime.value > 0 &&
				sound.value.state() === "loaded"
			) {
				sound.value.seek(currentTime.value);
			}
			if (playbackInterval) clearInterval(playbackInterval);
			playbackInterval = setInterval(() => {
				// Update currentTime only if sound exists, is playing, and not currently seeking
				if (sound.value && !isSeeking.value && sound.value.playing()) {
					const currentSeek = sound.value.seek();
					if (typeof currentSeek === "number") {
						currentTime.value = currentSeek;
					}
				}
			}, 25);
		},
		onpause: () => {
			if (playbackInterval) clearInterval(playbackInterval);
			playbackInterval = null;
		},
		onend: (id: number | undefined) => {
			// Howler passes soundId (number) or undefined if not applicable
			if (playbackInterval) clearInterval(playbackInterval);
			playbackInterval = null;
			currentTime.value = 0;
			if (isLooping.value && sound.value) {
				play(); // Re-play for loop
			}
		},
		onstop: () => {
			// Handle explicit stop if needed (e.g., via stop() call)
			if (playbackInterval) clearInterval(playbackInterval);
			playbackInterval = null;
		},
		onloaderror: (id: number | null, err: unknown) => {
			// id might be null if load fails early
			console.error("Sound load error:", id, err);
			audioDataLoaded.value = false; // Mark as not loaded
			// Clean up blob URL if loading failed
			// Check if blobUrl is not the initial empty string before revoking
			if (blobUrl.value && blobUrl.value !== "") {
				URL.revokeObjectURL(blobUrl.value);
				blobUrl.value = "";
			}
		},
		onplayerror: (id: number | null, err: unknown) => {
			// id might be null
			console.error("Sound play error:", id, err);
			if (playbackInterval) clearInterval(playbackInterval);
			playbackInterval = null;
			// Consider setting isPlaying to false if useSound doesn't handle it reliably on error
		},
		onload: () => {
			if (sound.value) {
				const soundDuration = sound.value.duration();
				// useSound's duration ref should update automatically. Log to confirm.
			}
		},
	},
);

// --- Helper Functions ---
const formatTime = (seconds: number): string => {
	if (isNaN(seconds) || seconds === Infinity) {
		return "00:00";
	}
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

// --- Computed Properties ---
const formattedCurrentTime = computed(() => formatTime(currentTime.value));
// Use the duration ref from useSound, converting from milliseconds if necessary
// (Check @vueuse/sound docs - assuming it provides duration in ms)
const formattedDuration = computed(() =>
	formatTime((duration.value ?? 0) / 1000),
);

// --- Playback Control Methods ---
const handleSeek = (event: Event) => {
	const target = event.target as HTMLInputElement;
	const seekTime = parseFloat(target.value);
	if (sound.value && !isNaN(seekTime) && sound.value.state() === "loaded") {
		sound.value.seek(seekTime); // seekTime is already in seconds
		currentTime.value = seekTime; // Immediately update visual state
	}
	isSeeking.value = false; // Allow interval updates again
};

const onSliderInput = (event: Event) => {
	isSeeking.value = true; // Prevent interval updates while dragging
	const target = event.target as HTMLInputElement;
	// Update visual time immediately while dragging
	currentTime.value = parseFloat(target.value);
};

const togglePlay = () => {
	if (!audioDataLoaded.value || !sound.value) return; // Don't toggle if not ready

	if (isPlaying.value) {
		pause();
	} else {
		play();
	}
};

const toggleLoop = () => {
	isLooping.value = !isLooping.value;
};

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

// --- Watchers ---
// Watch volumeLevel (user input) to update the actual sound volume
watch(volumeLevel, (newVolume) => {
	if (sound.value) {
		sound.value.volume(newVolume);
	}
});

// --- Lifecycle Hooks ---
onMounted(() => {
	loadAndSetAudio(); // Load audio from DB/fetch on mount
});

onUnmounted(() => {
	// Stop sound and cleanup Howler instance
	if (sound.value) {
		stop(); // Use the stop function from useSound
		sound.value.unload(); // Important to free Howler resources
	}
	// Clear interval
	if (playbackInterval) {
		clearInterval(playbackInterval);
		playbackInterval = null;
	}
	// Revoke Blob URL to free memory
	// Check if blobUrl is not the initial empty string before revoking
	if (blobUrl.value && blobUrl.value !== "") {
		URL.revokeObjectURL(blobUrl.value);
		blobUrl.value = ""; // Reset to initial empty string state
	}
});
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

        <!-- Combined Controls Row -->
        <div class="flex items-center justify-center space-x-4 w-full max-w-md mb-4">


          <!-- Playback Controls Group -->
          <div class="flex items-center justify-center space-x-2">

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
                class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-20 h-2 bg-primary-container rounded-md appearance-none cursor-pointer dark:bg-primary-darkcontainer music-slider"
                aria-label="Volume"
                style="transform: rotate(-90deg); bottom: 62px; left: -6px; width: 60px; height: 20px;"
              />
            </Transition>
          </div>

            <ControlButton :importance="ButtonImportance.Text" circle :disabled="!audioDataLoaded">
              <PlayerTrackPrevIcon />
            </ControlButton>
            <ControlButton :importance="ButtonImportance.Text" circle class="w-12 h-12" @click="togglePlay" :disabled="!audioDataLoaded">
              <!-- Toggle between Play and Pause -->
              <PlayerPauseIcon v-if="isPlaying" class="w-6 h-6" />
              <PlayerPlayIcon v-else class="w-6 h-6" />
            </ControlButton>
            <ControlButton :importance="ButtonImportance.Text" circle :disabled="!audioDataLoaded">
              <PlayerTrackNextIcon />
            </ControlButton>
            <ControlButton
              :importance="ButtonImportance.Text"
              circle
              @click="toggleLoop"
              :bgClass="isLooping ? 'border-2 border-primary-light dark:border-primary-dark bg-primary-light dark:bg-primary-dark' : 'border-2 border-transparent'"
              :innerClass="isLooping ? 'text-gray-600 dark:text-gray-400' : ''"
              :disabled="!audioDataLoaded"
            >
              <RepeatIcon class="w-6 h-6" />
            </ControlButton>
          </div>
        </div>

        <!-- Interactive Progress Bar -->
        <div v-if="duration && duration > 0 && audioDataLoaded" class="w-full max-w-md mb-4 px-2">
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
            :disabled="!audioDataLoaded"
          />
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{{ formattedCurrentTime }}</span>
            <span>{{ formattedDuration }}</span>
          </div>
        </div>
        <div v-else-if="!audioDataLoaded" class="w-full max-w-md mb-4 px-2 text-center text-sm text-gray-500">
          Loading audio... {{ blobUrl }}
        </div>
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
