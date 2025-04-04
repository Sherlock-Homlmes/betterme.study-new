import { reactive, computed, watch } from "vue";

import { TimerState, usePomodoroStore } from "~~/stores/pomodoros";
import { SectionEndAction, useSettings } from "~~/stores/settings";
import { useTasklist } from "~~/stores/tasklist";
import { useEvents, EventType } from "~~/stores/events";

interface TickState {
	lastUpdate: number;
	nextTickDelta: number;
	timerHandle: number | null;
}

export function useTicker() {
	const settingsStore = useSettings();
	const { items, getCurrentItem, timerState, advance, lockInfo } =
		usePomodoroStore();
	const tasklistStore = useTasklist();
	const eventsStore = useEvents();

	const state = reactive<TickState>({
		/** Timestamp of the last tick */
		lastUpdate: new Date().getTime(),

		/** The tick interval */
		nextTickDelta: 1,

		/** Handle to keep track of the set timer */
		timerHandle: null,
	});

	const timeOriginal = computed(() => getCurrentItem.value.length);
	const scheduleId = computed(() => getCurrentItem.value.id);

	const timeElapsed = computed({
		get() {
			return items.value[0].timeElapsed as number;
		},
		set(newValue) {
			items.value[0].timeElapsed = newValue;
		},
	});

	const timeRemaining = computed(() => timeOriginal.value - timeElapsed.value);

	/** Watcher to automatically reset timer if schedule changes */
	watch(scheduleId, (newValue, oldValue) => {
		if (newValue !== oldValue) {
			resetTimer();

			if (settingsStore.tasks.removeCompletedTasks) {
				tasklistStore.removeCompleted();
			}
		}
	});

	watch(
		() => settingsStore.getAdaptiveTickRate,
		(newValue, oldValue) => {
			if (timerState.value === TimerState.RUNNING && newValue !== oldValue) {
				scheduleNextTick({});
			}
		},
	);

	/** Start/pause/stop timer if timerState changes */
	watch(
		() => timerState.value,
		(newValue, oldValue) => {
			if (oldValue === TimerState.COMPLETED) {
				resetTimer();
			}

			if (newValue !== oldValue) {
				switch (newValue) {
					case TimerState.RUNNING:
						startTimer();
						break;
					case TimerState.STOPPED:
						pauseOrStopTimer(true);
						break;
					case TimerState.PAUSED:
						pauseOrStopTimer(false);
						break;
					default:
						break;
				}
			}
		},
	);

	/** Resets the remaining time to the original value, resetting the timer to 0% */
	const resetTimer = () => {
		const nextState =
			timerState.value === TimerState.RUNNING
				? timerState.value
				: TimerState.STOPPED;
		timeElapsed.value = 0;
		timerTick({ nextState, decrement: false });
	};

	/** Useful when dayjs locale has changed (forces an update on the timer) */
	// const refreshTime = () => {
	//   timeElapsed.value -= 1
	//   timeElapsed.value += 1
	// }

	/** Clears the tick handle and stops ticking */
	const clearTickHandle = () => {
		clearTimeout(state.timerHandle as number);
		state.timerHandle = null;
	};

	const scheduleNextTick = ({ decrement = true }) => {
		timerTick({ decrement });

		if (timerState.value === TimerState.RUNNING) {
			// check adaptive ticking settings
			let nextTickMs = settingsStore.getAdaptiveTickRate;

			// schedule next tick
			if (Math.abs(nextTickMs - state.nextTickDelta) > 50) {
				state.nextTickDelta = nextTickMs;
			}

			// if there was a timer handle, clear it
			clearTickHandle();

			nextTickMs =
				timeRemaining.value > 0
					? Math.min(nextTickMs, timeRemaining.value)
					: nextTickMs;
			const timeoutHandle = setTimeout(() => {
				clearTickHandle();
				scheduleNextTick({});
			}, nextTickMs);

			state.timerHandle = timeoutHandle;
		}
	};

	/**
	 * Adaptable tick function for handling the timer
	 * @param {*} state The Vuex store state
	 * @param {timerState} nextState The next state the timer will be in (if not RUNNING), it won't tick further
	 * @param {boolean} decrement If set to false, the timer will tick this time, but won't affect the remaining time
	 */
	const timerTick = ({ nextState = TimerState.RUNNING, decrement = true }) => {
		const newUpdate = new Date().getTime();
		const elapsedDelta = (newUpdate - state.lastUpdate) / 1000;
		// console.log(elapsedDelta)

		// update remaining time if the timer is still running
		if (decrement) {
			timeElapsed.value += elapsedDelta;
		}

		state.lastUpdate = newUpdate;

		// check if timer completed and schedule next tick
		const isTimerJustFinished =
			timeElapsed.value >= timeOriginal.value &&
			timeElapsed.value - elapsedDelta < timeOriginal.value;
		if (nextState === TimerState.RUNNING && isTimerJustFinished) {
			// timer completed, notify participants
			eventsStore.recordEvent(EventType.TIMER_FINISH);

			if (settingsStore.sectionEndAction === SectionEndAction.Stop) {
				timerState.value = TimerState.COMPLETED;
			} else if (settingsStore.sectionEndAction === SectionEndAction.Skip) {
				nextTick(() => {
					advance();
				});
			}
		}
	};

	/** Starts or resumes the timer */
	const startTimer = () => {
		eventsStore.recordEvent(EventType.TIMER_START);
		lockInfo({
			length: timeOriginal.value,
			type: getCurrentItem.value.type,
		});
		scheduleNextTick({ decrement: false });
	};

	const pauseOrStopTimer = (stop = false) => {
		clearTickHandle();
		timerTick({ nextState: stop ? TimerState.STOPPED : TimerState.PAUSED });

		eventsStore.recordEvent(
			stop ? EventType.TIMER_STOP : EventType.TIMER_PAUSE,
		);

		if (stop) {
			lockInfo({
				length: undefined,
				type: undefined,
			});
			resetTimer();
		}
	};
}
