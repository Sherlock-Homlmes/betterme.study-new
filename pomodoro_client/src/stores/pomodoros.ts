import { computed, ref } from "vue";
import { runtimeConfig } from "@/config/runtimeConfig";
import { createGlobalState } from "@vueuse/core";
import { useAuthStore } from "./auth";
import { useSettings, Section, ColorMethod } from "./settings";
import { useErrorStore } from "./common";

export enum ETimerState {
	STOPPED,
	RUNNING,
	PAUSED,
	COMPLETED,
}
export interface ScheduleEntry {
	id: number;
	timeElapsed: number;
	length?: number;
	type?: Section;
}

export interface ScheduleEntryComplete {
	id: number;
	timeElapsed: number;
	length: number;
	type: Section;
}

export enum ScheduleItemType {
	WORK = "work",
	SHORTPAUSE = "shortpause",
	LONGPAUSE = "longpause",
	WAIT = "wait",
	OTHER = "other",
}

export enum TimerState {
	STOPPED,
	RUNNING,
	PAUSED,
	COMPLETED,
}

export const usePomodoroStore = createGlobalState(() => {
	const API_URL = runtimeConfig.public.API_URL;
	const { isAuth, userSettings } = useAuthStore();
	const { showError } = useErrorStore();

	// TODO: fix this
	const settings = useSettings();

	// state
	const currentPomodoroSection = ref();
	const timerString = ref("");
	const items = ref(createScheduleSeries(10));
	const timerState = ref(TimerState.STOPPED);
	const scheduleItemTypeTimeLengthMap = {
		work: "pomodoro_study_time",
		shortpause: "pomodoro_rest_time",
		longpause: "pomodoro_long_rest_time",
	};

	// getters
	const scheduleTypes = computed(() => {
		const numEntriesInABlock =
			2 * userSettings.value.pomodoro_settings.long_rest_time_interval;
		const scheduleTypes: ScheduleItemType[] = [];

		for (let index = 0; index < numEntriesInABlock; index++) {
			let newType = ScheduleItemType.WORK;

			if (index === numEntriesInABlock - 1) {
				newType = ScheduleItemType.LONGPAUSE;
			} else if (index % 2) {
				newType = ScheduleItemType.SHORTPAUSE;
			}

			scheduleTypes.push(newType);
		}

		return scheduleTypes;
	});

	const getSchedule = computed<ScheduleEntryComplete[]>(() => {
		const numEntities = 3;

		const returnArray =
			items.value.length === 0 ? [] : JSON.parse(JSON.stringify(items.value));

		// add or remove entries if needed
		if (numEntities < returnArray.length) {
			// remove last few entities
			returnArray.splice(numEntities, returnArray.length - numEntities);
		} else if (numEntities > returnArray.length) {
			// add remaining entities
			if (returnArray.length === 0) {
				returnArray.push(createScheduleEntry(0));
			}

			for (let i = 1; i < numEntities - returnArray.length; i++) {
				returnArray.push(
					createScheduleEntry(returnArray[returnArray.length - 1].id + 1),
				);
			}
		}

		for (let index = 0; index < returnArray.length; index++) {
			// set item type if needed
			const itemType: keyof Settings["schedule"]["lengths"] = returnArray[index]
				.type
				? returnArray[index].type
				: scheduleTypes.value[
						returnArray[index].id % scheduleTypes.value.length
					];
			if (returnArray[index].type === undefined) {
				returnArray[index].type = itemType;
			}

			// set length if needed
			if (returnArray[index].length === undefined) {
				returnArray[index].length =
					userSettings.value.pomodoro_settings[
						scheduleItemTypeTimeLengthMap[itemType]
					];
			}

			// set remaining timer field
			returnArray[index].timeRemaining =
				returnArray[index].length - returnArray[index].timeElapsed;
		}

		return returnArray;
	});

	const getCurrentItem = computed<ScheduleEntryComplete>(
		() => getSchedule.value[0],
	);

	const isWorking = computed(() => getCurrentItem.value.type === Section.work);

	const isRunning = computed(() => {
		return [TimerState.RUNNING, TimerState.PAUSED].includes(timerState.value);
	});

	// VISUALS
	const currentScheduleColour = computed<string>(() => {
		return settings.getColor(getCurrentItem.value.type);
	});
	const currentScheduleColourModern = computed<string>(() => {
		return settings.getColor(getCurrentItem.value.type, ColorMethod.modern);
	});

	const nextScheduleColour = computed<string>(() => {
		const nextState = getSchedule.value[1].type;
		if (nextState) {
			return settings.getColor(nextState);
		} else {
			return "transparent";
		}
	});

	const getScheduleColour = computed(() => {
		const colours: string[] = [];
		for (const item of getSchedule.value) {
			colours.push(settings.getColor(item.type));
		}
		return colours;
	});

	const firstFetchStartPomodoro = ref(true);
	const startPomodoro = async () => {
		if (!isAuth.value) return;
		const response = await fetchWithAuth(`${API_URL}/pomodoros/`, {
			method: "POST",
		});
		if (response?.ok) {
			firstFetchStartPomodoro.value = true;
			currentPomodoroSection.value = await response.json();
		} else {
			const errorMsg = "Fail to start pomodoro section";
			if (!firstFetchStartPomodoro.value) showError(errorMsg);
			firstFetchStartPomodoro.value = false;
			throw new Error(errorMsg);
		}
	};

	const pomodoroSectionAction = async (action: string) => {
		if (!isAuth.value) return;
		const response = await fetchWithAuth(
			`${API_URL}/pomodoros/${currentPomodoroSection.value.id}`,
			{
				method: "PATCH",
				body: JSON.stringify({ action: action }),
			},
		);
		if (!response?.ok) throw new Error(`Fail to ${action} pomodoro section`);
	};

	const deletePomodoro = async () => {
		if (!isAuth.value) return;
		const response = await fetchWithAuth(`${API_URL}/pomodoros/_last`, {
			method: "DELETE",
		});
		if (response?.ok) {
			currentPomodoroSection.value = null;
		}
	};

	/** Advances the schedule by removing the first item and adding a new one to the end */
	const advance = () => {
		items.value = items.value.slice(1);
		items.value.push(
			createScheduleEntry(
				items.value.length > 0 ? items.value.slice(-1)[0].id + 1 : 0,
			),
		);
	};

	/** Allows locking information on a schedule item (so the getter will not override it) */
	const lockInfo = ({ index = 0, length = undefined, type = undefined }) => {
		if (index <= items.value.length) {
			items.value[index].length = length;
			items.value[index].type = type;
		}
	};

	return {
		// state
		currentPomodoroSection,
		timerString,
		items,
		timerState,
		// getters
		getSchedule,
		getCurrentItem,
		isWorking,
		isRunning,
		currentScheduleColour,
		currentScheduleColourModern,
		nextScheduleColour,
		getScheduleColour,
		// actions
		startPomodoro,
		pomodoroSectionAction,
		deletePomodoro,
		advance,
		lockInfo,
	};
});

const createScheduleEntry = (id: number): ScheduleEntry => {
	return {
		id,
		timeElapsed: 0,
		length: undefined,
		type: undefined,
	};
};

const createScheduleSeries = (numEntries: number) => {
	const items = [] as ScheduleEntry[];
	for (let i = 0; i < numEntries; i++) {
		items.push(createScheduleEntry(i));
	}

	return items;
};
