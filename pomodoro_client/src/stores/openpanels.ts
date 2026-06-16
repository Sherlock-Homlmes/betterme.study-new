import { reactive } from "vue";
import { createGlobalState } from "@vueuse/core";

/**
 * Which side panels are open. Accessed by dot in templates and assigned
 * directly (`openPanels.todo = false`), so it is a reactive object.
 */
export const useOpenPanels = createGlobalState(() =>
	reactive({
		music: false,
		ai: false,
		settings: false,
		todo: false,
		statistic: false,
		pomodoroRoom: false,
	}),
);
