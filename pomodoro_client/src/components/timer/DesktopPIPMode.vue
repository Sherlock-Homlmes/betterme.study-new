<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { usePIPWindow } from "@/composables/usePIPWindow";

const { openPIP, closePIP } = usePIPWindow();

const isMinimized = ref(false);

onMounted(async () => {
	const currentWindow = getCurrentWindow();

	// Check window minimized state periodically
	const checkMinimized = setInterval(async () => {
		const minimized = await currentWindow.isMinimized();
		if (minimized && !isMinimized.value) {
			console.log('Window minimized, opening PIP');
			isMinimized.value = true;
			await openPIP();
		} else if (!minimized && isMinimized.value) {
			console.log('Window restored, closing PIP');
			isMinimized.value = false;
			await closePIP();
		}
	}, 500);

	onUnmounted(() => {
		clearInterval(checkMinimized);
	});
});
</script>

<template>
    <!-- No video element needed for Tauri desktop PIP mode -->
    <div style="display: none;"></div>
</template>
