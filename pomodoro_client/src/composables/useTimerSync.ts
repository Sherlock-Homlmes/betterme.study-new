import { watch } from 'vue';
import { emit } from '@tauri-apps/api/event';
import { usePomodoroStore } from '@/stores/pomodoros';
import { runtimeConfig } from '@/config/runtimeConfig';

export function useTimerSync() {
	const { timerString, currentScheduleColour } = usePomodoroStore();

	// Only emit events on desktop platform
	if (runtimeConfig.public.PLATFORM === 'desktop') {
		// Watch for timer changes and emit events to PIP window
		watch(
			[timerString, currentScheduleColour],
			([newTimer, newColour]) => {
				emit('timer-update', {
					timerString: newTimer,
					colour: newColour,
				});
			},
			{ deep: true }
		);
	}

	return {
		timerString,
		currentScheduleColour,
	};
}
