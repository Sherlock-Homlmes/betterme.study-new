import { reactive, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useEventListener } from "@vueuse/core";
import { storeToRefs } from "pinia";

import { useSettings } from "@/stores/settings";
import { usePomodoroStore } from "@/stores/pomodoros";
import { EventType, useEvents } from "@/stores/events";

interface SoundSettings {
	source: HTMLAudioElement;
	ready: boolean;
}

export function useWeb() {
	const settingsStore = useSettings();
	const { getSchedule } = usePomodoroStore();
	const eventsStore = useEvents();
	const { lastEvent } = storeToRefs(eventsStore);
	const { recordEvent } = eventsStore;
	const i18n = useI18n();

	const state = reactive({
		currentSoundSet: null as string | null,
		sounds: {
			work: null as SoundSettings | null,
			shortpause: null as SoundSettings | null,
			longpause: null as SoundSettings | null,
		},
	});

	watch(lastEvent, (newValue) => {
		if (newValue !== null && newValue._event === EventType.TIMER_FINISH) {
			showNotification(getSchedule.value[1].type);
		}
	});

	onMounted(() => {
		recordEvent(EventType.APP_STARTED);

		// Track visibility state for adaptive ticking; useEventListener auto-removes on unmount
		if (window && window.document && "hidden" in window.document) {
			useEventListener(document, "visibilitychange", () => {
				settingsStore.registerNewHidden(window.document.hidden);
			});
			settingsStore.registerNewHidden(window.document.hidden);
		} else {
			settingsStore.registerNewHidden(false);
		}
	});

	const loadSoundSet = (setName = settingsStore.audio.soundSet) => {
		if (state.currentSoundSet === setName) {
			return;
		}

		try {
			for (const key in state.sounds) {
				const soundKey = key as keyof typeof state.sounds;
				const newSound = {
					source: new Audio(`/audio/${setName}/${key}.mp3`),
					ready: false,
				};

				newSound.source.addEventListener("canplay", () => {
					newSound.ready = true;
				});

				state.sounds[soundKey] = newSound;
			}

			state.currentSoundSet = setName;
		} catch {
			// Sound loading failure is non-critical
		}
	};

	const playSound = (key: keyof typeof state.sounds) => {
		if (!state.currentSoundSet) {
			loadSoundSet();
		}

		if (state.sounds[key] !== null) {
			state.sounds[key]!.source.volume = settingsStore.audio.volume; // eslint-disable-line @typescript-eslint/no-non-null-assertion
			state.sounds[key]?.source.play();
		}
	};

	const showNotification = (nextState: string) => {
		playSound(nextState as keyof typeof state.sounds);

		if (
			window.Notification.permission !== "granted" ||
			settingsStore.permissions.notifications !== true
		) {
			return;
		}
		const notificationActions: { action: string; title: string }[] = [];
		if (nextState === "work") {
			notificationActions.push({
				action: "ready",
				title: i18n.t("notification.action.ready"),
			});
		}

		try {
			interface ExtendedNotificationOptions extends NotificationOptions {
				actions?: { action: string; title: string }[];
			}
			const options: ExtendedNotificationOptions = {
				tag: "FocusTide-SectionNotify",
				body: i18n.t("notification." + nextState + ".body"),
				actions: notificationActions,
			};
			new Notification(i18n.t("notification." + nextState + ".title"), options);
		} catch {
			// Notification API may not be supported (e.g. Firefox actions)
		}
	};
}
