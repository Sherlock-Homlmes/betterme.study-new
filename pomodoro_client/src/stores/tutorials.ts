import {ref, computed} from "vue";
import { createGlobalState } from "@vueuse/core";

export const useTutorialStore = createGlobalState(()=>{
	const openTutorials=ref<string[]>([]);
	const isTutorialOpen = computed(() => {
		return (tutorialId: string) => openTutorials.value.indexOf(tutorialId) === 0;
	})
	const currentTutorial = computed(() => {
		return openTutorials.value.length > 0 ? openTutorials.value[0] : null;
	});


	const openTutorial = (tutorialId: string) => {
		if (!openTutorials.value.includes(tutorialId)) openTutorials.value.push(tutorialId);
	}
	const closeTutorial = (tutorialId: string) => {
		const tutorialIndex = openTutorials.value.indexOf(tutorialId);
		if (tutorialIndex >= 0) {
			openTutorials.value.splice(tutorialIndex, 1);
		}
	}
	return {
		openTutorials,
		isTutorialOpen,
		currentTutorial,
		openTutorial,
		closeTutorial,
	};
});
