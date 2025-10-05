<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useSound } from "@vueuse/sound";
import { useStorage, useRefHistory, watchOnce } from "@vueuse/core";
import { useOpenPanels } from "@/stores/openpanels";
import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { ButtonImportance } from "@/components/base/types/button";
import {
	XIcon as CloseIcon,
	VolumeIcon,
	VolumeOffIcon,
} from "vue-tabler-icons";
import ControlButton from "@/components/base/uiButton.vue";
import YouTubePlayer from "vue3-youtube";

// ===== STORES =====
const openPanels = useOpenPanels();
const mobileSettingsStore = useMobileSettings();

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

// Watch for video ID changes
watch(youtubeVideoId, (newVideoId) => {
	if (newVideoId) {
		console.log("YouTube video ID changed to:", newVideoId);
		// Stop ambient sounds when YouTube starts
		soundPlayers.forEach(player => player.stop());
	}
});

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

// ===== PANEL LIFECYCLE =====
// Resume ambient sounds when panel opens
watchOnce(
	() => openPanels.music,
	async (isPanelOpened) => {
		if (!isPanelOpened) return;
		
		// Resume ambient sounds that were playing
		soundPlayers.forEach((soundPlayer) => {
			if (soundPlayer.volume.value !== 0) {
				soundPlayer.play();
			}
		});
	}
);

// Close panel handler
const closePanel = () => {
	openPanels.music = false;
};
</script>

<template>
	<section class="fixed z-40 w-full h-full p-0 md:p-4 md:max-w-screen-sm">
		<div 
			class="flex flex-col h-full overflow-hidden rounded-none shadow-lg bg-surface-light text-surface-onlight md:rounded-xl md:dark:ring-1 dark:ring-surface-ondark dark:ring-opacity-20 ring-inset dark:bg-surface-dark dark:text-surface-ondark" 
			:style="{ 
				'padding-top': `${mobileSettingsStore.padding.top}px`, 
				'padding-bottom': `${mobileSettingsStore.padding.bottom}px` 
			}"
		>
			<!-- Header -->
			<header class="px-4 mt-4">
				<h1 class="text-xl font-bold uppercase flex items-center justify-between">
					<span>Music</span>
					<ControlButton
						:aria-label="$t('settings.buttons.close')"
						default-style
						circle
						:importance="ButtonImportance.Text"
						class="-mt-2 -mr-2"
						tabindex="0"
						@click="closePanel"
					>
						<CloseIcon :aria-label="$t('settings.buttons.close')" />
					</ControlButton>
				</h1>
				<hr class="mt-2 mb-4">
			</header>

			<!-- Content -->
			<div class="flex-grow overflow-y-auto px-4 flex flex-col items-center space-y-6">
				<!-- YouTube Section -->
				<section class="w-full max-w-md">
					<h2 class="text-sm font-bold uppercase mb-2">Youtube Link</h2>
					
					<!-- Hidden YouTube Player - only loads when panel is open -->
					<YouTubePlayer
						v-if="youtubeVideoId && openPanels.music"
						ref="youtubePlayerRef"
						:src="youtubeVideoId"
						width="0"
						height="0"
						:vars="{ autoplay: 0, controls: 0, loop: 1, playlist: youtubeVideoId }"
						@ready="onYoutubePlayerReady"
						@stateChange="onPlayerStateChange"
						style="position: absolute; top: -9999px; left: -9999px;"
					/>
					
					<!-- YouTube Controls -->
					<div class="flex items-center space-x-4">
						<input
							id="youtube-link"
							v-model="youtubeLink"
							type="text"
							placeholder="https://youtu.be/..."
							class="flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-container dark:bg-surface-dark dark:border-surface-ondark dark:text-surface-ondark"
						/>
						
						<ControlButton
							:importance="ButtonImportance.Text"
							circle
							@click="toggleYoutubeMute"
						>
							<VolumeIcon v-if="youtubeVolume > 0" class="w-6 h-6" />
							<VolumeOffIcon v-else class="w-6 h-6" />
						</ControlButton>
						
						<input
							v-model.number="youtubeVolume"
							type="range"
							min="0"
							max="1"
							step="0.01"
							class="w-24 h-2 bg-primary-container rounded-lg appearance-none cursor-pointer dark:bg-primary-darkcontainer music-slider"
							aria-label="YouTube Volume"
						/>
					</div>
				</section>

				<!-- Ambient Sounds Section -->
				<section class="w-full max-w-md">
					<h2 class="text-sm font-bold uppercase mb-2">Ambiance</h2>
					
					<div class="space-y-2">
						<div 
							v-for="soundPlayer in soundPlayers" 
							:key="soundPlayer.name" 
							class="flex items-center space-x-4 py-2"
						>
							<span class="flex-grow">{{ soundPlayer.name }}</span>
							
							<ControlButton
								:importance="ButtonImportance.Text"
								circle
								@click="toggleAmbientMute(soundPlayer)"
							>
								<VolumeIcon v-if="soundPlayer.volume.value > 0" class="w-6 h-6" />
								<VolumeOffIcon v-else class="w-6 h-6" />
							</ControlButton>
							
							<input
								v-model.number="soundPlayer.volume.value"
								type="range"
								min="0"
								max="1"
								step="0.01"
								class="w-24 h-2 bg-primary-container rounded-lg appearance-none cursor-pointer dark:bg-primary-darkcontainer music-slider"
								:aria-label="`${soundPlayer.name} Volume`"
							/>
						</div>
					</div>
				</section>
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
		border: none;
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
