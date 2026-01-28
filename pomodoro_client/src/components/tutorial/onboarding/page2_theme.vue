<script setup lang="ts">
import {computed} from "vue";
import { BrightnessDownIcon, DeviceWatchIcon } from "vue-tabler-icons";
import OnboardingPage from "./onboardingPage.vue";
import OnboardingHeader from "./onboardingHeader.vue";
import OptionGroup from "@/components/base/optionGroup.vue";
import { TimerType, useSettings } from "@/stores/settings";
import { useAuthStore } from "@/stores/auth";

const settingsStore = useSettings();
const { isDarkMode, userSettings } = useAuthStore()!;

const currentTheme = computed(() => (isDarkMode.value ? "dark" : "light"));
const currentTimer = computed(() => userSettings.value.visuals.timer_show);
</script>

<template>
  <OnboardingPage>
    <OnboardingHeader :text="$t('tutorials.onboarding.pages.2.theme.heading')">
      <BrightnessDownIcon :size="42" />
    </OnboardingHeader>

    <OptionGroup :value="currentTheme" :choices="{ 'light': 'Light', 'dark': 'Dark' }" translation-key="tutorials.onboarding.pages.2.theme.options" class="w-full" @input="(newValue) => userSettings.visuals.dark_mode = (newValue === 'dark')" />

    <OnboardingHeader :text="$t('tutorials.onboarding.pages.2.display.heading')">
      <DeviceWatchIcon :size="42" />
    </OnboardingHeader>

    <OptionGroup :value="currentTimer" :choices="{ 'traditional': 'Traditional', 'approximate': 'Approximate', 'percentage': 'Percentage' }" translation-key="settings.values.currentTimer" class="w-full" @input="(newValue) => userSettings.visuals.timer_show = newValue" />
  </OnboardingPage>
</template>
