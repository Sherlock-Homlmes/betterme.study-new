<script setup lang="ts">
import { InfoCircleIcon } from "vue-tabler-icons";
import OnboardingHeader from "./onboardingHeader.vue";
import OnboardingPage from "./onboardingPage.vue";
</script>

<template lang="pug">
OnboardingPage
  OnboardingHeader(:text="$t('tutorials.onboarding.pages.3.heading')")
    InfoCircleIcon(:size="42")
  div(class="text-center" v-text="$t('tutorials.onboarding.pages.3.text')")
</template>
