<script setup lang="ts">
import { reactive, watch, onMounted } from "vue";
import { markRaw } from "vue";
import tutorialOnboarding from "./tutorialOnboarding.vue";
import tutorialOldDomain from "./tutorialOldDomain.vue";
import { useTutorialStore } from "@/stores/tutorials";
import { useAuthStore } from "@/stores/auth";

const {currentTutorial, openTutorial, closeTutorial, isTutorialOpen} = useTutorialStore();
const { isOnboarded } = useAuthStore();

const tutorials = {
	onboarding: markRaw(tutorialOnboarding),
	oldDomain: markRaw(tutorialOldDomain),
};

const state = reactive({
	/** Controls whether the darkening backdrop is shown */
	enableComponent: false,
});

watch(
	() => currentTutorial.value,
	(newValue) => {
		// if a tutorial is to be shown, enable the backdrop
		if (newValue !== null) {
			state.enableComponent = true;
		}
	},
);

onMounted(() => {
	state.enableComponent = currentTutorial.value != null;
	if (!isOnboarded.value) {
		openTutorial("onboarding");
	}

});

const onCloseTutorial = (tutorialId) => {
	isOnboarded.value = true;
	closeTutorial(tutorialId);
};
</script>

<template lang="pug">
div(
	v-show="state.enableComponent"
	class="fixed top-0 left-0 z-40 w-screen h-screen transition"
)
	transition(
		leave-to-class="opacity-0"
		enter-from-class="opacity-0"
		appear
		@after-leave="state.enableComponent = false")
		div(v-show="currentTutorial !== null" class="fixed top-0 left-0 w-full h-full transition-all duration-500 bg-slate-900/40 dark:bg-slate-900/70")
	transition-group(
		enter-from-class="!translate-y-full"
		enter-active-class="transition duration-500 ease-out"
		leave-to-class="!translate-y-full"
		leave-active-class="transition duration-300"
		appear
	)
		component(
			v-for="tutorialId in Object.keys(tutorials)"
			:is="tutorials[tutorialId]"
			:key="tutorialId"
			:open="isTutorialOpen(tutorialId)"
			@close="onCloseTutorial"
		)
</template>
