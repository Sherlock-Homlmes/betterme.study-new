<script setup lang="ts">
import { useOpenPanels } from "@/stores/openpanels";
import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { ButtonImportance } from "@/components/base/types/button";
import { watch } from "vue";
import {
	XIcon as CloseIcon,
	// PlayerPlayIcon, // No longer needed for button logic
	// PlayerPauseIcon, // No longer needed for button logic
	// PlayerTrackPrevIcon, // Not used
	// PlayerTrackNextIcon, // Not used
	VolumeIcon,
	VolumeOffIcon,
	// RepeatIcon, // Not used
} from "vue-tabler-icons";
import ControlButton from "@/components/base/uiButton.vue";
import { useSound } from "@vueuse/sound";
import { useStorage, useRefHistory, watchOnce } from "@vueuse/core"; // Import useRefHistory
import { onMounted } from "vue";

const openPanels = useOpenPanels();
const mobileSettingsStore = useMobileSettings();

const sounds = [
	// { name: "Rain", path: "https://new-files.betterme.study/audios/Rain.mp3" },
	// { name: "Fireplace", path: "https://new-files.betterme.study/audios/Fireplace.mp3" },
	// { name: "Cafe", path: "https://new-files.betterme.study/audios/Cafe.mp3" },
	{ name: "Rain", path: "/audio/musical/Rain.mp3" },
	{ name: "Fireplace", path: "/audio/musical/Fireplace.mp3" },
	{ name: "Cafe", path: "/audio/musical/Cafe.mp3" },
];

const soundPlayers = sounds.map((soundInfo) => {
	const volume = useStorage(`sound-volume-${soundInfo.name}`, 0);
	const { history } = useRefHistory(volume, { capacity: 10 }); // Add history tracking
	const { play, stop, sound } = useSound(
		// Removed isPlaying as it's not needed for the button now
		soundInfo.path,
		{
			volume: volume.value, // Use the ref directly
			loop: true,
		},
	);

	watch(volume, (newVolume) => {
		// Watch the ref directly
		if (sound.value) {
			sound.value.volume(newVolume);
		}
	});

	return {
		...soundInfo,
		volume,
		history, // Return history
		play,
		stop,
		// isPlaying, // Removed
		sound,
	};
});

// Replace toggleSound with toggleMute
const toggleMute = (soundPlayer) => {
	if (soundPlayer.volume.value === 0) {
		// Find the last non-zero volume in history
		const lastVolume = soundPlayer.history.value.find(
			(entry) => entry.snapshot > 0,
		)?.snapshot;
		soundPlayer.volume.value = lastVolume || 0.5; // Restore or default to 0.5
		soundPlayer.play();
	} else {
		soundPlayer.volume.value = 0; // Mute
		soundPlayer.stop();
	}
};

watchOnce(
	() => openPanels.music,
	(isPanelOpened) => {
		if (!isPanelOpened) return;
		soundPlayers.forEach((soundPlayer) => {
			if (soundPlayer.volume.value !== 0) soundPlayer.play();
		});
	},
);
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
        <div class="flex flex-col w-full max-w-md">
          <div v-for="soundPlayer in soundPlayers" :key="soundPlayer.name" class="flex items-center space-x-4 py-2">
            <span class="flex-grow">{{ soundPlayer.name }}</span>
            <ControlButton
              :importance="ButtonImportance.Text"
              circle
              @click="toggleMute(soundPlayer)"
            >
              <VolumeIcon v-if="soundPlayer.volume.value > 0" class="w-6 h-6" />
              <VolumeOffIcon v-if="soundPlayer.volume.value === 0" class="w-6 h-6"/>
            </ControlButton>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              v-model.number="soundPlayer.volume.value"
              class="w-24 h-2 bg-primary-container rounded-lg appearance-none cursor-pointer dark:bg-primary-darkcontainer music-slider"
              aria-label="Volume"
            />
          </div>
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
}
</style>
