<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useStorage, useRefHistory } from "@vueuse/core";
import { ButtonImportance } from "@/components/base/types/button";
import {
	VolumeIcon,
	VolumeOffIcon,
} from "vue-tabler-icons";
import ControlButton from "@/components/base/uiButton.vue";
import YouTube from "vue3-youtube";

// ===== YOUTUBE PLAYER =====
const youtubePlayerRef = ref(null);
const youtubeLink = useStorage("youtube-link", "https://www.youtube.com/watch?v=jfKfPfyJRdk");
const youtubeVolume = useStorage("youtube-volume", 0);
const { history: youtubeVolumeHistory } = useRefHistory(youtubeVolume, { capacity: 10 });

// Extract YouTube video ID from URL
const getYoutubeVideoId = (url: string): string | null => {
	if (!url) return null;
	const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
	const match = url.match(regExp);
	return match && match[2].length === 11 ? match[2] : null;
};

const youtubeVideoId = computed(() => getYoutubeVideoId(youtubeLink.value));

// YouTube player event handlers
const onYoutubePlayerReady = () => {
	const player = youtubePlayerRef.value?.player;
	if (player && typeof player.setVolume === "function") {
		player.setVolume(youtubeVolume.value * 100);
		if (youtubeVolume.value > 0) {
			player.playVideo();
		}
	}
};

const onPlayerStateChange = (event: any) => {
	// Auto-replay when video ends (event.data === 0)
	if (event.data === 0) {
		youtubePlayerRef.value?.player?.playVideo();
	}
};

// YouTube volume control
const toggleYoutubeMute = async () => {
	const player = youtubePlayerRef.value?.player;
	if (!player || !youtubeVideoId.value || typeof player.playVideo !== "function") {
		return;
	}

	if (youtubeVolume.value === 0) {
		// Unmute: restore previous volume or default to 0.5
		const lastVolume = youtubeVolumeHistory.value.find(entry => entry.snapshot > 0)?.snapshot;
		youtubeVolume.value = lastVolume || 0.5;
		await player.setVolume(youtubeVolume.value * 100);
		player.playVideo();
	} else {
		// Mute
		youtubeVolume.value = 0;
		player.pauseVideo();
	}
};

// Watch YouTube volume changes
watch(youtubeVolume, (newVolume) => {
	const player = youtubePlayerRef.value?.player;
	if (player) {
		player.setVolume(newVolume * 100);
	}
});

// Expose for parent component
defineExpose({
	youtubeVideoId,
	onYoutubePlayerReady
});
</script>

<template lang="pug">
section(class="w-full max-w-md")
	h2(class="text-sm font-bold uppercase mb-2") Youtube Link

	YouTube(
		v-if="youtubeVideoId"
		ref="youtubePlayerRef"
		:src="youtubeVideoId"
		width="0"
		height="0"
		:vars="{ autoplay: 0, controls: 0, loop: 1, playlist: youtubeVideoId }"
		@ready="onYoutubePlayerReady"
		@stateChange="onPlayerStateChange"
		style="position: absolute; top: -9999px; left: -9999px;"
	)

	div(class="flex items-center space-x-4")
		input(
			id="youtube-link"
			v-model="youtubeLink"
			type="text"
			placeholder="https://youtu.be/..."
			class="flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container dark:bg-surface-dark dark:border-surface-ondark dark:text-surface-ondark"
		)

		ControlButton(
			:importance="ButtonImportance.Text"
			circle
			@click="toggleYoutubeMute"
		)
			VolumeIcon(v-if="youtubeVolume > 0" class="w-6 h-6")
			VolumeOffIcon(v-else class="w-6 h-6")

		input(
			v-model.number="youtubeVolume"
			type="range"
			min="0"
			max="1"
			step="0.01"
			class="w-24 h-2 bg-transparent rounded-lg appearance-none cursor-pointer dark:bg-primary-darkcontainer music-slider"
			aria-label="YouTube Volume"
		)
</template>

<style lang="scss" scoped>
@import "@/assets/css/tailwind.css";

@mixin range-track {
	@apply h-1 min-w-0 rounded-full bg-primary/20 dark:bg-primary-dark/20 active:bg-primary/40 dark:active:bg-primary-dark/40;
}

@mixin range-thumb {
	@apply rounded-full border-none bg-primary dark:bg-primary-dark scale-90 transition-all duration-300 active:scale-125 appearance-none size-4 -mt-1.5;

	&:focus {
		@apply ring ring-primary dark:ring-primary-dark;
	}
}

:deep(.music-slider) {
	&::-moz-range-thumb {
		@include range-thumb;
	}

	&::-moz-range-track {
		@include range-track;
	}

	&::-ms-thumb {
		@include range-thumb;
	}

	&::ms-track {
		@include range-track;
	}

	&::-webkit-slider-thumb {
		@include range-thumb;
	}

	&::-webkit-slider-runnable-track {
		@include range-track;
	}
}
</style>
