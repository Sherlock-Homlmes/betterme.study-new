<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { usePomodoroStore } from "@/stores/pomodoros";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import { runtimeConfig } from "@/config/runtimeConfig";

const { timerString, currentScheduleColour } = usePomodoroStore();

// Local state for PIP window (synced via Tauri events)
const localTimerString = ref(timerString.value);
const localScheduleColour = ref(currentScheduleColour.value);

// Drag state
const isDragging = ref(false);

const containerStyle = computed(() => ({
	backgroundColor: localScheduleColour.value,
	cursor: isDragging.value ? 'grabbing' : 'grab',
}));

onMounted(async () => {
	// Only allow closing PIP window on desktop platform
	if (runtimeConfig.public.PLATFORM === 'desktop') {
		const currentWindow = getCurrentWindow();

		// Listen for timer updates from main window
		const unlisten = await listen<{ timerString: string; colour: string }>(
			'timer-update',
			(event) => {
				localTimerString.value = event.payload.timerString;
				localScheduleColour.value = event.payload.colour;
			}
		);

		// Cleanup listener when component unmounts
		onUnmounted(() => {
			unlisten();
		});

		// Custom drag implementation for undecorated window
		const handleMouseDown = async (e: MouseEvent) => {
			// Only allow dragging from the window
			if (e.target instanceof HTMLElement && e.target.closest('.pip-container')) {
				isDragging.value = true;
				await currentWindow.startDragging();
				e.preventDefault();
			}
		};

		const handleMouseUp = () => {
			isDragging.value = false;
		};

		document.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mouseup', handleMouseUp);

		onUnmounted(() => {
			document.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('mouseup', handleMouseUp);
		});
	}
});

// Watch for local store changes and emit events (for main window)
watch([timerString, currentScheduleColour], ([newTimer, newColour]) => {
	localTimerString.value = newTimer;
	localScheduleColour.value = newColour;
}, { deep: true });
</script>

<template>
	<div class="pip-container" :style="containerStyle" data-tauri-drag-region>
		<div class="timer-display">{{ localTimerString }}</div>
	</div>
</template>

<style scoped>
.pip-container {
	width: 100%;
	height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	user-select: none;
}

.timer-display {
	font-size: 80px;
	font-weight: bold;
	color: black;
	font-family: 'Lexend', sans-serif;
	pointer-events: none;
}
</style>
