<script setup lang="ts">
import { ClockPlayIcon } from "vue-tabler-icons";
import OnboardingPage from "./onboardingPage.vue";
import OnboardingHeader from "./onboardingHeader.vue";
import OptionGroup from "~~/components/base/optionGroup.vue";
import { usePomodoroStore } from "~~/stores/auth";

const { getActiveSchedulePreset, applyPreset } = useAuthStore();
</script>

<template>
  <OnboardingPage>
    <OnboardingHeader :text="$t('tutorials.onboarding.pages.1.heading')">
      <ClockPlayIcon :size="42" />
    </OnboardingHeader>

    <div class="text-center -mt-3 mb-4" v-text="$t('tutorials.onboarding.pages.1.text')" />

    <OptionGroup :value="getActiveSchedulePreset" :choices="{ 'default': 'default', 'easy': 'easy', 'advanced': 'advanced', 'workaholic': 'workaholic' }" class="w-full" translation-key="timerpreset" @input="(selectedPreset) => { applyPreset(selectedPreset) }" />
  </OnboardingPage>
</template>
