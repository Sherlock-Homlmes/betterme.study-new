<script setup lang="ts">
import { ref, watch, computed, defineAsyncComponent, onBeforeMount, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useHead } from "@vueuse/head";

import { usePomodoroStore } from "@/stores/pomodoros";
import { useSettings } from "@/stores/settings";
import { runtimeConfig } from "@/config/runtimeConfig";

import { useTicker } from "@/components/ticker";
import { useWeb } from "@/platforms/web";
import { useMobile } from "@/platforms/mobile";

import TimerSwitch from "@/components/timer/display/_timerSwitch.vue";
import TimerProgress from "@/components/timer/timerProgress.vue";
import TimerControls from "@/components/timer/controls.vue";
import { AppPlatform } from "@/platforms/platforms";

import {usePlatformStore} from "@/stores/platforms";
import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { useAuthStore } from "@/stores/auth";

const router = useRouter()
const route = useRoute()

const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true'

// components
const AppBar = defineAsyncComponent(() => import("@/components/appBar.vue"));
const TutorialView = defineAsyncComponent(() => import("@/components/tutorial/_tutorialView.vue"));
const WebPIPMode = defineAsyncComponent(() => import("@/components/timer/WebPIPMode.vue"));
const DesktopPIPMode = defineAsyncComponent(() => import("@/components/timer/DesktopPIPMode.vue"));

const { t, locale } = useI18n();
const {isWeb, isDesktop, isExtension, isMobile} = usePlatformStore();
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
if (isWeb.value || isDesktop.value || isExtension.value) {
	useWeb();
} else if (isMobile.value) {
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
  const ogLocaleMapper = {
    'en': 'en_US',
    'vi': 'vi_VN',
  }
  const baseUrl = 'https://pomodoro.betterme.dev'
  const pageUrl = `${baseUrl}/${locale.value}`
  const ogImage = `${baseUrl}/img/OgImage.png`
  return {
    htmlAttrs: {
      lang: htmlLangMapper[locale.value],
    },
    title: pageTitle.value,
    meta: [
      { name: 'description', content: t('meta.description') },
      { name: 'keywords', content: t('meta.keywords') },

      // Open Graph (Facebook/Zalo)
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'BetterMe' },
      { property: 'og:locale', content: ogLocaleMapper[locale.value] },
      { property: 'og:title', content: t('meta.title') },
      { property: 'og:description', content: t('meta.description') },
      { property: 'og:url', content: pageUrl },
      { property: 'og:image', content: ogImage },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: t('meta.title') },
      { name: 'twitter:description', content: t('meta.description') },
      { name: 'twitter:image', content: ogImage }
    ],
    link: [
      {
        rel: 'canonical',
        href: pageUrl
      },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "@id": `${pageUrl}/#webapplication`,
          name: t('meta.title'),
          description: t('meta.description'),
          url: pageUrl,
          image: ogImage,
          applicationCategory: 'ProductivityApplication',
          operatingSystem: 'All',
          browserRequirements: 'Requires HTML5/CSS3',
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD"
          },
          author: {
            "@type": "EducationalOrganization",
            name: "BetterMe Community",
            url: "https://betterme.dev",
            logo: "https://betterme.dev/favicon.svg",
            sameAs: ["https://discord.gg/betterme"]
          },
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
  // language -> keep the URL in sync with the chosen locale (/en, /vi).
  // Skip in preview/iframe mode: the embed loads `/?preview=true`, and forcing a
  // route change to /en collides with the edge rule that 308-redirects /en -> /,
  // producing an ERR_TOO_MANY_REDIRECTS loop inside the iframe. Locale still
  // applies via i18n/userSettings without needing to change the URL.
watch(
  () => userSettings.value?.language,
  (newValue) => {
    if (isPreview) return
    router.replace({ name: `home-${newValue}`, query: route.query, hash: route.hash })
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
  DesktopPIPMode(v-if='userSettings.visuals.show_pip_mode && isDesktop && !isPreview')
  WebPIPMode(v-if='userSettings.visuals.show_pip_mode && isWeb && !isMobile && !isPreview')
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
