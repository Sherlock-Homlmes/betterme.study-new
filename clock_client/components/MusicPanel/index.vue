<script setup lang="ts">
import { useOpenPanels } from "@/stores/openpanels";
import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { ButtonImportance } from "@/components/base/types/button";
import {
	XIcon as CloseIcon,
	VolumeIcon,
	VolumeOffIcon,
} from "vue-tabler-icons";
import ControlButton from "@/components/base/uiButton.vue";
import { useSound } from "@vueuse/sound";
import {
	useStorage,
	useRefHistory,
	watchOnce,
	until,
	watchDebounced,
} from "@vueuse/core"; // Import useRefHistory
import { onMounted, ref, watch, computed } from "vue"; // Import ref, watch, computed
import YouTubePlayer from "vue3-youtube"; // Import vue3-youtube

const openPanels = useOpenPanels();
const mobileSettingsStore = useMobileSettings();

const youtubePlayerRef = ref(null); // Ref for the player instance

const youtubeLink = useStorage(
	"youtube-link",
	"https://www.youtube.com/watch?v=jfKfPfyJRdk",
);
const youtubeVolume = useStorage("youtube-volume", 0); // Use useStorage for persistence
const { history: youtubeVolumeHistory } = useRefHistory(youtubeVolume, {
	capacity: 10,
}); // Add history tracking for YouTube volume

// Helper function to extract YouTube video ID from various URL formats
const getYoutubeVideoId = (url: string): string | null => {
	if (!url) return null;
	const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
	const match = url.match(regExp);
	return match && match[2].length === 11 ? match[2] : null;
};

const youtubeVideoId = computed(() => getYoutubeVideoId(youtubeLink.value));

watch(youtubeVolume, (newVolume) => {
	// Update the volume of the YouTube audio player
	if (youtubePlayerRef.value?.player) {
		youtubePlayerRef.value.player.setVolume(newVolume * 100); // YouTube API uses 0-100
	}
});

const toggleYoutubeMute = async (isMountedEvent = false) => {
	const player = youtubePlayerRef.value?.player;
	if (
		!player ||
		!youtubeVideoId.value ||
		typeof player.playVideo !== "function"
	)
		return;

	if (youtubeVolume.value === 0 || isMountedEvent === true) {
		// Find the last non-zero volume in history
		const lastVolume = youtubeVolumeHistory.value.find(
			(entry) => entry.snapshot > 0,
		)?.snapshot;
		youtubeVolume.value = lastVolume || 0.5; // Restore or default to 0.5
		// Ensure volume is set before playing
		await player.setVolume(youtubeVolume.value * 100);
		player.playVideo();
	} else {
		youtubeVolume.value = 0; // Mute
		player.pauseVideo(); // Pause instead of stopping
	}
};

// Handle player state changes for looping
const onPlayerStateChange = (event: any) => {
	// event.data contains the player state code
	// 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
	if (event.data === 0) {
		// Video ended
		console.log("YouTube video ended, looping...");
		youtubePlayerRef.value?.player?.playVideo(); // Replay the video
	}
};

const onYoutubePlayerReady = () => {
	const player = youtubePlayerRef.value?.player;
	if (player && typeof player.setVolume === "function") {
		player.setVolume(youtubeVolume.value * 100);
		player.playVideo();
	}
};

watch(youtubeVolume, (newVolume) => {
	// Update the volume of the YouTube audio player
	if (youtubePlayerRef.value?.player) {
		youtubePlayerRef.value.player.setVolume(newVolume * 100); // YouTube API uses 0-100
	}
});

// Watch for changes in video ID and load the new video
watch(youtubeVideoId, (newVideoId) => {
	const player = youtubePlayerRef.value?.player;
	if (player && newVideoId) {
		// player.loadVideoById(newVideoId); // This might auto-play, consider options
		console.log("YouTube video ID changed to:", newVideoId);
		// Optionally pause existing sounds when YouTube starts
		soundPlayers.forEach((p) => p.stop());
	}
});

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
	const { play, stop, isPlaying, sound } = useSound(soundInfo.path, {
		volume: volume.value,
		loop: true,
	});

	watch(volume, (newVolume) => {
		// Watch the ref directly
		if (sound.value) {
			sound.value.volume(newVolume);
			if (!isPlaying.value && newVolume !== 0) play();
		}
	});

	return {
		...soundInfo,
		volume,
		history,
		play,
		stop,
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
	async (isPanelOpened) => {
		if (!isPanelOpened) return;
		soundPlayers.forEach((soundPlayer) => {
			if (soundPlayer.volume.value !== 0) soundPlayer.play();
		});

		// await until(() => typeof youtubePlayerRef.value?.player?.playVideo === "function").toBe(true)
		// toggleYoutubeMute(true);
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
          <!-- YouTube Link Input and Volume -->
          <div class="flex flex-col w-full max-w-md mt-4">
            <label for="youtube-link" class="text-sm font-bold uppercase mb-2">Youtube Link</label>
            <!-- Hidden YouTube Player -->
            <YouTubePlayer
              v-if="youtubeVideoId"
              ref="youtubePlayerRef"
              :src="youtubeVideoId"
              width="0"
              height="0"
              :vars="{ autoplay: 0, controls: 0, loop: 1, playlist: youtubeVideoId }"
              @ready="onYoutubePlayerReady"
              @stateChange="onPlayerStateChange"
              style="position: absolute; top: -9999px; left: -9999px;"
            />
            <div class="flex items-center space-x-4 py-2"> <!-- New flex container for input and volume -->
              <input
                id="youtube-link"
                type="text"
                v-model="youtubeLink"
                placeholder="https://youtu.be/..."
                class="flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container dark:bg-surface-dark dark:border-surface-ondark dark:text-surface-ondark"
              />
              <!-- Volume controls moved inside the flex container -->
              <ControlButton
                :importance="ButtonImportance.Text"
                circle
                @click="toggleYoutubeMute()"
              >
                <VolumeIcon v-if="youtubeVolume > 0" class="w-6 h-6" />
                <VolumeOffIcon v-if="youtubeVolume === 0" class="w-6 h-6"/>
              </ControlButton>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                v-model.number="youtubeVolume"
                class="w-24 h-2 bg-primary-container rounded-lg appearance-none cursor-pointer dark:bg-primary-darkcontainer music-slider"
                aria-label="YouTube Volume"
              />
            </div>
          </div>
        <div class="flex flex-col w-full max-w-md">
          <label class="text-sm font-bold uppercase mb-2">Ambiance</label>
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
