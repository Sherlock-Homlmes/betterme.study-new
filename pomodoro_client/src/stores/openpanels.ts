import { defineStore } from "pinia";
import { ref } from "vue";

export const useOpenPanels = defineStore('openpanels', () => {
	const music = ref(false);
	const ai = ref(false);
	const settings = ref(false);
	const todo = ref(false);
	const statistic = ref(false);
	const pomodoroRoom = ref(false);
	return { music, ai, settings, todo, statistic, pomodoroRoom };
});
