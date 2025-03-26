import { defineStore } from "pinia";

const useOpenPanels = defineStore("openpanels", {
	state: () => ({
		music: false,
		settings: false,
		todo: false,
		user: false,
	}),
});

export { useOpenPanels };
