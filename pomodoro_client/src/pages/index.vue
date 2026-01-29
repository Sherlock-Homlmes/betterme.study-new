<script setup lang="ts">
import { ref, watch, computed, defineAsyncComponent, onBeforeMount, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useHead } from "@vueuse/head";
import { useSchemaOrg, defineSoftwareApp } from '@vueuse/schema-org'

import { usePomodoroStore } from "@/stores/pomodoros";
import { useSettings } from "@/stores/settings";
import { runtimeConfig } from "@/config/runtimeConfig";

import { useTicker } from "@/components/ticker";
import { useWeb } from "@/platforms/web";
import { useMobile } from "@/platforms/mobile";

import TimerSwitch from "@/components/timer/display/_timerSwitch.vue";
import TimerProgress from "@/components/timer/timerProgress.vue";
import TimerControls from "@/components/timer/controls/controlsNew.vue";
import TimerPIPMode from "@/components/timer/PIPMode.vue";
import { AppPlatform } from "@/platforms/platforms";

import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { useAuthStore } from "@/stores/auth";

const router = useRouter()

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

const { t, locale } = useI18n();

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
	if ([1, 2, 3].includes(timerState.value))
		return (
			(remainingTimeString.value ? `(${remainingTimeString.value}) ` : "") +
			(getCurrentItem.value
				? t("section." + getCurrentItem.value.type).toLowerCase()
				: "Pomodoro")
		);
	return t('meta.title');
});
const headData = computed(()=>{
  const htmlLangMapper = {
    'en': 'en-US',
    'vi': 'vi-VI',
  }
  return {
    htmlAttrs: {
      lang: htmlLangMapper[locale.value],
    },
    title: pageTitle.value,
    meta: [
      { name: 'description', content: t('meta.description') },
      { name: 'keywords', content: t('meta.keywords') },

      // Open Graph cho Facebook/Zalo
      { property: 'og:title', content: t('meta.title') },
      { property: 'og:description', content: t('meta.description') },

      // Twitter Card
      { name: 'twitter:title', content: t('meta.title') },
      { name: 'twitter:description', content: t('meta.description') }
    ],
    link: [
      {
        rel: 'canonical',
        href: `https://pomodoro.betterme.page/${locale.value}`
      },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: t('meta.title'),
          description: t('meta.description'),
          url: `https://pomodoro.betterme.page/${locale.value}`,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Web Browser',
          inLanguage: locale.value
        })
      }
    ]
  }
})
useHead(headData)

const progressBarSchedules = computed(() => {
	const numSchedules = userSettings.value.visuals.show_progress_bar ? 2 : 1;
	return getSchedule.value.slice(0, numSchedules);
});

const containerStyle = computed(() => ({
	paddingTop: `${mobileSettingsStore.padding.top}px`,
	paddingBottom: `${mobileSettingsStore.padding.bottom}px`
}));

onBeforeMount(async () => {
	if (!isAuth.value) await getCurrentUser();
	if (isAuth.value) await getCurrentUserSetting();
	loading.value = false;
});
  // language
watch(
  () => userSettings.value?.language,
  (newValue) => {
    router.replace({ name: `home-${newValue}` })
  },
  {immediate: true}
)
</script>

<template lang="pug">
section(class="h-full overflow-hidden duration-300 ease-in dark:text-gray-50")
  // Dark mode background override
  div(class="absolute w-full h-full dark:bg-gray-900")

  // Progress bar
  TransitionGroup(name="progress-transition" tag="div" :duration="1000")
    TimerProgress(
      v-for="(scheduleItem, index) in progressBarSchedules"
      :key="scheduleItem.id"
      :colour="getScheduleColour[index]"
      :background="index === 0"
      :time-elapsed="getCurrentItem.timeElapsed"
      :time-original="getCurrentItem.length"
    )
  div.relative.flex.flex-col.items-center.justify-center.w-full.h-full.isolate(:style="containerStyle")
    // Add H1 heading for SEO
    h1(class="absolute -left-[9999px] top-auto") Pomodoro Timer and Online Study Tools
    AppBar
    TimerSwitch(
      key="timerswitch"
      :time-elapsed="getCurrentItem.timeElapsed"
      :time-original="getCurrentItem.length"
      :timer-state="timerState"
      :timer-widget="userSettings.visuals.timer_show"
      class="flex-grow"
    )
    TimerControls(class="mb-8")
  TutorialView(v-if='!isOnboarded')
  TimerPIPMode(v-if='userSettings.visuals.show_pip_mode')
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
  transform: translate3d(0, 0, 0);
}

.progress-transition-enter {
  transform: translate3d(-100%, 0, 0);
}
</style>

<style>
body {
  overscroll-behavior-y: contain;
}
</style>
