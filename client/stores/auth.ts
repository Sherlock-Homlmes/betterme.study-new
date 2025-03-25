import { computed, ref, watch } from "vue";
import { useRuntimeConfig } from "#app";
import {
	StorageSerializers,
	createGlobalState,
	useStorage,
} from "@vueuse/core";
import _ from "lodash";
import timerPresets from "~~/assets/settings/timerPresets";
import ChangeTracker from "../utils/changeTracker";

const changeTracker = new ChangeTracker();
const defaultSettings = {
	language: "vi",
	visuals: {
		pomodoro_study: [255, 107, 107],
		pomodoro_rest: [244, 162, 97],
		pomodoro_long_rest: [46, 196, 182],

		timer_show: "traditional",

		background: null,
		custom_backgrounds: [],
		dark_mode: false,
		show_progress_bar: true,
		show_pip_mode: true,

		enable_audio: true,
		enable_adaptive_ticking: true,
		auto_start_next_time: true,
		custom_audios: [],
	},
	pomodoro_settings: {
		pomodoro_study_time: 25 * 60,
		pomodoro_rest_time: 5 * 60,
		pomodoro_long_rest_time: 20 * 60,
		long_rest_time_interval: 3,
	},
};

export const useAuthStore = createGlobalState(() => {
	const API_URL = useRuntimeConfig().public.API_URL;

	// state
	const userInfo = ref();
	const userSettings = useStorage(
		"userSettings",
		_.cloneDeep(defaultSettings),
		undefined,
		{ serializer: StorageSerializers.object },
	);
	changeTracker.track(userSettings.value);
	const loading = ref(true);
	// TODO: move this to tutorial store
	const isOnboarded = useStorage("isOnboarded", false, undefined, {
		serializer: StorageSerializers.boolean,
	});

	// getters
	const isAuth = computed(() => !!userInfo.value);
	const isDarkMode = computed(() =>
		userSettings ? userSettings.value.visuals.dark_mode : false,
	);

	// actions
	const getCurrentUser = async () => {
		const response = await fetchWithAuth(`${API_URL}/auth/self`);
		if (response.ok) userInfo.value = await response.json();
		else {
			userInfo.value = null;
			throw new Error("Fail to get self");
		}
	};

	const getCurrentUserSetting = async () => {
		if (!isAuth.value) return;
		const response = await fetchWithAuth(`${API_URL}/users/self/settings`);
		if (response.ok) userSettings.value = await response.json();
		else throw new Error("Fail to get self setting");
	};

	const updateCurrentUserSetting = async (data: object) => {
		if (!isAuth.value) return;
		const response = await fetchWithAuth(`${API_URL}/users/self/settings`, {
			method: "PATCH",
			body: JSON.stringify(data),
		});
		if (!response.ok) throw new Error("Fail to get self setting");
	};

	const loginByDiscord = async (code: string) => {
		const response = await fetch(`${API_URL}/auth/discord-oauth?code=${code}`);
		const data = await response.json();
		if (data?.token) {
			// set auth to localstorage
			localStorage.removeItem("Authorization");
			localStorage.setItem("Authorization", data.token);
			// check if user is accessable or not
			await getCurrentUser();
		}
	};

	const getActiveSchedulePreset = computed(() => {
		const index = Object.entries(timerPresets).findIndex(([_key, value]) => {
			return (
				JSON.stringify(value) ===
				JSON.stringify(userSettings.value.pomodoro_settings)
			);
		});

		if (index >= 0) {
			return Object.keys(timerPresets)[index];
		} else {
			return null;
		}
	});

	// actions
	const applyPreset = (id: string) => {
		const validate = (id: string): id is keyof typeof timerPresets => {
			return Object.keys(timerPresets).includes(id);
		};

		if (validate(id)) {
			userSettings.value.pomodoro_settings = Object.assign(
				{},
				timerPresets[id],
			);
		}
	};

	// Events
	watch(
		userSettings,
		(newValue) => {
			const change = changeTracker.getChange(newValue);
			if (_isEmpty(change)) return;
			updateCurrentUserSetting(change);
			changeTracker.track(newValue);
		},
		{ deep: true },
	);

	return {
		// state
		userInfo,
		userSettings,
		loading,
		// getters
		isAuth,
		isOnboarded,
		isDarkMode,
		getActiveSchedulePreset,
		// actions
		getCurrentUser,
		getCurrentUserSetting,
		loginByDiscord,
		applyPreset,
	};
});
