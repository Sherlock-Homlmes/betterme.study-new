<script setup lang="ts">
import { watch } from "vue";
import { useSound } from "@vueuse/sound";
import { useStorage, useRefHistory } from "@vueuse/core";
import { ButtonImportance } from "@/components/base/types/button";
import {
	VolumeIcon,
	VolumeOffIcon,
} from "vue-tabler-icons";
import ControlButton from "@/components/base/uiButton.vue";

// ===== AMBIENT SOUNDS =====
const AMBIENT_SOUNDS = [
	{ name: "Rain", path: "/audio/musical/Rain.mp3" },
	{ name: "Fireplace", path: "/audio/musical/Fireplace.mp3" },
	{ name: "Cafe", path: "/audio/musical/Cafe.mp3" },
];

const createSoundPlayer = (soundInfo: { name: string; path: string }) => {
	const volume = useStorage(`sound-volume-${soundInfo.name}`, 0);
	const { history } = useRefHistory(volume, { capacity: 10 });
	const { play, stop, isPlaying, sound } = useSound(soundInfo.path, {
		volume: volume.value,
		loop: true,
	});

	// Watch volume changes
	watch(volume, (newVolume) => {
		if (sound.value) {
			sound.value.volume(newVolume);
			if (!isPlaying.value && newVolume !== 0) {
				play();
			}
		}
	});

	return {
		...soundInfo,
		volume,
		history,
		play,
		stop,
		sound,
		isPlaying,
	};
};

const soundPlayers = AMBIENT_SOUNDS.map(createSoundPlayer);

// Toggle ambient sound mute/unmute
const toggleAmbientMute = (soundPlayer: any) => {
	if (soundPlayer.volume.value === 0) {
		// Unmute: restore previous volume or default to 0.5
		const lastVolume = soundPlayer.history.value.find(entry => entry.snapshot > 0)?.snapshot;
		soundPlayer.volume.value = lastVolume || 0.5;
		soundPlayer.play();
	} else {
		// Mute
		soundPlayer.volume.value = 0;
		soundPlayer.stop();
	}
};

// Expose for parent component
defineExpose({
	soundPlayers,
});
</script>

<template lang="pug">
section(class="w-full max-w-md")
	h2(class="text-sm font-bold uppercase mb-2") Ambiance

	div(class="space-y-2")
		div(
			v-for="soundPlayer in soundPlayers"
			:key="soundPlayer.name"
			class="flex items-center space-x-4 py-2"
		)
			span(class="flex-grow") {{ soundPlayer.name }}

			ControlButton(
				:importance="ButtonImportance.Text"
				circle
				@click="toggleAmbientMute(soundPlayer)"
			)
				VolumeIcon(v-if="soundPlayer.volume.value > 0" class="w-6 h-6")
				VolumeOffIcon(v-else class="w-6 h-6")

			input(
				v-model.number="soundPlayer.volume.value"
				type="range"
				min="0"
				max="1"
				step="0.01"
				class="w-24 h-2 bg-transparent rounded-lg appearance-none cursor-pointer dark:bg-primary-darkcontainer music-slider"
				:aria-label="`${soundPlayer.name} Volume`"
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
