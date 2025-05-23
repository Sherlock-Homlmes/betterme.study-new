<script setup lang="ts">
import { defineAsyncComponent, onBeforeMount } from "vue";
import { useHead } from "#app";
import { useI18n } from "vue-i18n";
import { usePomodoroStore } from "~~/stores/pomodoros";
import { useSettings } from "~~/stores/settings";

import { useTicker } from "~~/components/ticker";
import { useWeb } from "~~/platforms/web";
import { useMobile } from "~~/platforms/mobile";

import TimerSwitch from "@/components/timer/display/_timerSwitch.vue";
import TimerProgress from "@/components/timer/timerProgress.vue";
import TimerControls from "@/components/timer/controls/controlsNew.vue";
import TimerPIPMode from "@/components/timer/PIPMode.vue";
import { AppPlatform } from "~~/platforms/platforms";

import { useMobileSettings } from "~~/stores/platforms/mobileSettings";
import { useAuthStore } from "~~/stores/auth";

// components
const AppBar = defineAsyncComponent(() => import("@/components/appBar.vue"));
const TutorialView = defineAsyncComponent(
	() => import("@/components/tutorial/_tutorialView.vue"),
);

const settingsStore = useSettings();
const mobileSettingsStore = useMobileSettings();
const {
	timerState,
	timerString,
	getCurrentItem,
	getSchedule,
	currentScheduleColour,
	getScheduleColour,
} = usePomodoroStore();
const {
	isAuth,
	getCurrentUser,
	getCurrentUserSetting,
	userSettings,
	loading,
	isOnboarded,
} = useAuthStore();

const runtimeConfig = useRuntimeConfig();

const { t } = useI18n();

const iconSvg = computed(
	() => `data:image/svg+xml,
<svg
  width="32"
  height="32"
  viewBox="0 0 32 32"
  fill="none"
  style="color: ${currentScheduleColour};"
  xmlns="http://www.w3.org/2000/svg"
>
<circle cx="16" cy="16" r="14" fill="currentColor" /></svg>`,
);

definePageMeta({ layout: "timer", layoutTransition: false });
useHead({
	link: [
		{
			rel: "icon",
			type: "image/svg+xml",
			href: iconSvg,
		},
	],
});

useTicker();

// Load appropriate platform module based on runtime config
if (runtimeConfig.public.PLATFORM === AppPlatform.web) {
	useWeb();
} else if (runtimeConfig.public.PLATFORM === AppPlatform.mobile) {
	useMobile();
}

const remainingTimeString = computed(() => {
	if (timerState.value === 3) {
		return settingsStore.pageTitle.useTickEmoji
			? "✔"
			: t("ready").toLowerCase();
	}

	return timerString.value;
});

const pageTitle = computed(() => {
	console.log(timerState.value);
	if ([1, 2, 3].includes(timerState.value))
		return (
			(remainingTimeString.value ? `(${remainingTimeString.value}) ` : "") +
			(getCurrentItem.value
				? t("section." + getCurrentItem.value.type).toLowerCase()
				: "Pomodoro")
		);
	return "Pomodoro Timer & Study Tools";
});

const progressBarSchedules = computed(() => {
	const numSchedules = userSettings.value.visuals.show_progress_bar ? 2 : 1;
	return getSchedule.value.slice(0, numSchedules);
});

onBeforeMount(async () => {
	if (!isAuth.value) await getCurrentUser();
	if (isAuth.value) await getCurrentUserSetting();
	loading.value = false;
});
</script>

<template>
  <section
    class="h-full overflow-hidden duration-300 ease-in dark:text-gray-50"
  >
    <Title>{{ pageTitle }}</Title>

    <!-- Dark mode background override -->
    <div class="absolute w-full h-full dark:bg-gray-900" />

    <!-- Progress bar -->
    <TransitionGroup name="progress-transition" tag="div" :duration="1000">
      <TimerProgress
        v-for="(scheduleItem, index) in progressBarSchedules"
        :key="scheduleItem.id"
        :colour="getScheduleColour[index]"
        :background="index === 0"
        :time-elapsed="getCurrentItem.timeElapsed"
        :time-original="getCurrentItem.length"
      />
    </TransitionGroup>
    <div
      class="relative flex flex-col items-center justify-center w-full h-full isolate"
      :style="{
        'padding-top': `${mobileSettingsStore.padding.top}px`,
        'padding-bottom': `${mobileSettingsStore.padding.bottom}px`
      }"
    >
      <!-- Add H1 heading for SEO -->
      <h1 class="absolute -left-[9999px] top-auto">Pomodoro Timer and Online Study Tools</h1>
      <AppBar />
      <TimerSwitch
        key="timerswitch"
        :time-elapsed="getCurrentItem.timeElapsed"
        :time-original="getCurrentItem.length"
        :timer-state="timerState"
        :timer-widget="userSettings.visuals.timer_show"
        class="flex-grow"
      />

      <TimerControls class="mb-8" />
    </div>
    <client-only>
      <TutorialView v-if='!isOnboarded' />
      <TimerPIPMode v-if='userSettings.visuals.show_pip_mode' />
    </client-only>
  </section>
</template>

<style lang="scss" scoped>
.timer-background {
  transition: 300ms ease-in;
  transition-property: background-color;
  position: relative;
  height: 100%;
}

.schedule-transition-enter-active,
.schedule-transition-leave-active {
  transition: transform 300ms ease-out, opacity 200ms ease-out;
}

.schedule-transition-enter,
.schedule-transition-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.progress-transition-leave-to {
  @apply transform-gpu translate-x-0;
}

.progress-transition-enter {
  @apply transform-gpu -translate-x-full;
}
</style>

<style>
body {
  overscroll-behavior-y: contain;
}
</style>
