import { reactive, computed, type UnwrapNestedRefs } from "vue";
import { createGlobalState } from "@vueuse/core";
import isPlainObject from "lodash/isPlainObject";
import { EventType, useEvents } from "./events";
import TickMultipliers from "@/assets/settings/adaptiveTickingMultipliers";
import timerPresets from "@/assets/settings/timerPresets";

export enum TimerType {
	Traditional = "traditional",
	Approximate = "approximate",
	Percentage = "percentage",
}

export enum SectionEndAction {
	/** Continue ticking after the section ended */
	KeepTicking = "continue",
	/** Stop the timer after the section ended, displaying a checkmark */
	Stop = "stop",
	/** Automatically start the next section as soon as the previous one ended */
	Skip = "skip",
}

export enum SoundSet {
	Musical = "musical",
}

export enum Section {
	work = "work",
	shortpause = "shortpause",
	longpause = "longpause",
}

export interface Settings {
	_updated: boolean;
	lang?: string;
	visuals: {
		theme: {
			work: number[];
			shortpause: number[];
			longpause: number[];
		};
		darkMode: boolean;
	};
	performance: {
		showProgressBar: boolean;
	};
	schedule: {
		lengths: {
			work: number;
			shortpause: number;
			longpause: number;
		};
		longPauseInterval: number; // every 3rd pause is a long one,
		autoStartNextTimer: {
			wait: number;
			autostart: boolean;
		};
		numScheduleEntries: number;
		visibility: {
			enabled: boolean;
			showSectionType: boolean;
		};
	};
	eventLoggingEnabled: boolean;
	currentTimer: TimerType;
	sectionEndAction: SectionEndAction;
	adaptiveTicking: {
		enabled: boolean;
		baseTickRate: number;
		registeredHidden: boolean | null;
	};
	permissions: {
		notifications: boolean | null;
		audio: boolean;
	};
	audio: {
		volume: number;
		repeatTimes: number;
		soundSet: SoundSet;
	};
	timerControls: {
		enableKeyboardShortcuts: boolean;
	};
	tasks: {
		enabled: boolean;
		maxActiveTasks: number;
		removeCompletedTasks: boolean;
	};
	pageTitle: {
		useTickEmoji: boolean;
	};
	mobile: {
		notifications: {
			sectionOver: true;
			persistent: boolean;
		};
	};
	reset: boolean;
}

export enum ColorMethod {
	/** `rgb(r, g, b)` */
	classic,

	/** `r g b` */
	modern,
}

export const AvailableSoundSets = {
	SOUNDSET_MUSICAL: "musical",
};

/** Shape exposed by useSettings() — settings state + getters + actions. */
export type SettingsStore = UnwrapNestedRefs<Settings> & {
	getCurrentLocale: string;
	getActiveSchedulePreset: string | null;
	getAdaptiveTickRate: number;
	performanceSettings: Settings["performance"];
	getColor: (
		color: keyof Settings["visuals"]["theme"],
		method?: ColorMethod,
	) => string;
	registerNewHidden: (newHidden?: boolean) => void;
	applyPreset: (id: string) => void;
	setReset: (shouldReset: boolean) => void;
	/** Compat shim for former Pinia API. Raw state for path-based access. */
	$state: Settings;
	/** Compat shim for former Pinia API. Deep-merges a patch into the state. */
	$patch: (patch: Record<string, unknown>) => void;
};

const defaultSettings: Settings = {
	_updated: false,
	lang: undefined,
	visuals: {
		theme: {
			work: [255, 107, 107],
			shortpause: [244, 162, 97],
			longpause: [46, 196, 182],
		},
		darkMode: false,
	},
	performance: {
		showProgressBar: true,
	},
	schedule: {
		lengths: {
			work: 25 * 60 * 1000, // 25 minutes
			shortpause: 5 * 60 * 1000, // 5 minutes
			longpause: 15 * 60 * 1000, // 15 minutes
		},
		longPauseInterval: 3, // every 3rd pause is a long one,
		autoStartNextTimer: {
			wait: 8 * 1000,
			autostart: true,
		},
		numScheduleEntries: 3,
		visibility: {
			enabled: true,
			showSectionType: true,
		},
	},
	eventLoggingEnabled: false,
	sectionEndAction: SectionEndAction.Stop,
	currentTimer: TimerType.Traditional,
	adaptiveTicking: {
		enabled: true,
		baseTickRate: 1000,
		registeredHidden: null,
	},
	permissions: {
		notifications: false,
		audio: true,
	},
	audio: {
		volume: 0.9,
		repeatTimes: 2,
		soundSet: SoundSet.Musical,
	},
	timerControls: {
		enableKeyboardShortcuts: false,
	},
	tasks: {
		enabled: false,
		maxActiveTasks: 3,
		removeCompletedTasks: true,
	},
	pageTitle: {
		useTickEmoji: true,
	},
	mobile: {
		notifications: {
			sectionOver: true,
			persistent: false,
		},
	},
	reset: false,
};

/** Deep-merges `patch` into a reactive target via plain assignment. */
function deepMergeAssign(
	target: Record<string, unknown>,
	patch: Record<string, unknown>,
): void {
	for (const key of Object.keys(patch)) {
		const patchValue = patch[key];
		const targetValue = target[key];
		if (isPlainObject(patchValue) && isPlainObject(targetValue)) {
			deepMergeAssign(
				targetValue as Record<string, unknown>,
				patchValue as Record<string, unknown>,
			);
		} else {
			target[key] = patchValue;
		}
	}
}

export const useSettings = createGlobalState((): SettingsStore => {
	const state = reactive<Settings>(structuredClone(defaultSettings));

	// Getters — assigned as computed refs onto the reactive proxy so they are
	// unwrapped on dot access (e.g. `settingsStore.getAdaptiveTickRate`).
	const getters = {
		getCurrentLocale: computed(() => state.lang ?? "en"),

		getActiveSchedulePreset: computed(() => {
			const index = Object.entries(timerPresets).findIndex(([_key, value]) => {
				const statePreset = {
					pomodoro_study_time: state.schedule.lengths.work / 1000,
					pomodoro_rest_time: state.schedule.lengths.shortpause / 1000,
					pomodoro_long_rest_time: state.schedule.lengths.longpause / 1000,
					long_rest_time_interval: state.schedule.longPauseInterval,
				};
				return JSON.stringify(value) === JSON.stringify(statePreset);
			});
			return index >= 0 ? Object.keys(timerPresets)[index] : null;
		}),

		getAdaptiveTickRate: computed(() => {
			if (
				state.adaptiveTicking.enabled &&
				state.adaptiveTicking.registeredHidden !== null
			) {
				const timerSettings = TickMultipliers[state.currentTimer];
				const tickVersion = state.adaptiveTicking.registeredHidden
					? "hidden"
					: "visible";
				const tickBase = state.adaptiveTicking.baseTickRate;
				const tickMultiplier =
					timerSettings && timerSettings[tickVersion]
						? timerSettings[tickVersion]
						: 1.0;
				return tickBase * tickMultiplier;
			}
			return state.adaptiveTicking.baseTickRate;
		}),

		performanceSettings: computed(() => state.performance),
	};

	const getColor = (
		color: keyof Settings["visuals"]["theme"],
		method: ColorMethod = ColorMethod.classic,
	): string => {
		if (method === ColorMethod.classic) {
			return `rgb(${state.visuals.theme[color].join(",")})`;
		}
		return state.visuals.theme[color].join(" ");
	};

	const registerNewHidden = (newHidden: boolean = document.hidden) => {
		state.adaptiveTicking.registeredHidden = newHidden;
		useEvents().recordEvent(
			newHidden === true ? EventType.FOCUS_LOST : EventType.FOCUS_GAIN,
		);
	};

	const applyPreset = (id: string) => {
		const validate = (id: string): id is keyof typeof timerPresets =>
			Object.keys(timerPresets).includes(id);
		if (validate(id)) {
			const preset = timerPresets[id];
			state.schedule.lengths = {
				work: preset.pomodoro_study_time * 1000,
				shortpause: preset.pomodoro_rest_time * 1000,
				longpause: preset.pomodoro_long_rest_time * 1000,
			};
		}
	};

	const setReset = (shouldReset: boolean) => {
		state.reset = shouldReset;
	};

	const $patch = (patch: Record<string, unknown>) =>
		deepMergeAssign(state as unknown as Record<string, unknown>, patch);

	// Augment the reactive state with getters/actions/Pinia-compat shims.
	// Assigning computed refs onto a reactive proxy unwraps them on access.
	Object.assign(state, {
		...getters,
		getColor,
		registerNewHidden,
		applyPreset,
		setReset,
		$state: state,
		$patch,
	});

	return state as unknown as SettingsStore;
});
