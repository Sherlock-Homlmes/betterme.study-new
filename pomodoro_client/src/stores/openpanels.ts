import { createGlobalState } from "@vueuse/core";
import { ref } from "vue";

export const useOpenPanels = createGlobalState(
	() => ref({
		music: false,
		ai: false,
		settings: false,
		todo: false,
		statistic: false,
	})
);
