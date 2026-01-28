<script setup lang="ts">
import { reactive, watch, onMounted } from "vue";
import { markRaw } from "vue";
import tutorialOnboarding from "./tutorialOnboarding.vue";
import tutorialOldDomain from "./tutorialOldDomain.vue";
import { useTutorials } from "@/stores/tutorials";
import { useMain } from "@/stores/main";
import { useAuthStore } from "@/stores/auth";

const tutorialsStore = useTutorials();
const mainStore = useMain();
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
	() => tutorialsStore.currentTutorial,
	(newValue) => {
		// if a tutorial is to be shown, enable the backdrop
		if (newValue !== null) {
			state.enableComponent = true;
		}
	},
);

onMounted(() => {
	state.enableComponent = tutorialsStore.currentTutorial != null;

	if (!mainStore.restoredStores.includes("tutorials")) {
		tutorialsStore.openTutorial("onboarding");
	}

	// Check URL query parameters for olddomain
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.has('olddomain')) {
		tutorialsStore.openTutorial("oldDomain");
	}
});

const closeTutorial = (tutorialId) => {
	isOnboarded.value = true;
	tutorialsStore.closeTutorial(tutorialId);
};
</script>

<template>
  <div v-show="state.enableComponent" class="fixed top-0 left-0 z-40 w-screen h-screen transition">
    <transition leave-to-class="opacity-0" enter-from-class="opacity-0" appear @after-leave="state.enableComponent = false">
  	  <div v-show="tutorialsStore.currentTutorial !== null" class="fixed top-0 left-0 w-full h-full transition-all duration-500 bg-slate-900/40 dark:bg-slate-900/70" />
    </transition>

    <!-- Tutorial component -->
    <transition-group
      enter-from-class="!translate-y-full"
      enter-active-class="transition duration-500 ease-out"
      leave-to-class="!translate-y-full"
      leave-active-class="transition duration-300"
      appear
    >
      <component :is="tutorials[tutorialId]" v-for="tutorialId in (Object.keys(tutorials) as Array<keyof typeof tutorials>)" :key="tutorialId" :open="tutorialsStore.isTutorialOpen(tutorialId)" @close="closeTutorial" />
    </transition-group>
  </div>
</template>
