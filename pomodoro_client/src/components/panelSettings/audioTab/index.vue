<script setup lang="ts">
import { onMounted, ref, computed, watch } from "vue";
import { watchOnce, useIntersectionObserver, useWindowFocus, until } from "@vueuse/core";
import SettingsItem from "@/components/common/settingsItem/v1.vue";
import SettingsItemV2 from "@/components/common/settingsItem/v2.vue";
import Divider from "@/components/base/uiDivider.vue";
import {Control} from "@/components/common/settingsItem/type";

import { usePlatformStore } from "@/stores/platforms";
import { useOpenPanels } from "@/stores/openpanels";
import { useAuthStore } from "@/stores/auth";

import YouTubePlayer from "./YouTubePlayer.vue";
import AmbientSounds from "./AmbientSounds.vue";

const { isWeb, isDesktop, isExtension, isMobile } = usePlatformStore();
const isWebBase = isWeb.value || isDesktop.value || isExtension.value;

const firstTimeWindowFocus = ref(false)
const windowFocus = useWindowFocus()

const openPanels = useOpenPanels();
const { userSettings } = useAuthStore();
const shouldPlayMusic = ref(false);
const shouldLoadMusic = computed(() =>
  userSettings.value.visuals.enable_music_when_visit_site && firstTimeWindowFocus.value
);
const youtubePlayerRef = ref<InstanceType<typeof YouTubePlayer> | null>(null);
const ambientSoundsRef = ref<InstanceType<typeof AmbientSounds> | null>(null);

const audioTabRef = ref(null)
const { stop } = useIntersectionObserver(
  audioTabRef,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      shouldPlayMusic.value = true;
      stop()
    }
  },
)

// Resume ambient sounds when tab opens or auto-play on app load
onMounted(async () => {
  await until(windowFocus).toBe(true)
  firstTimeWindowFocus.value = true
  await until(shouldLoadMusic).toBe(true)

  // Resume ambient sounds that were playing or auto-play if enabled
  if (ambientSoundsRef.value?.soundPlayers) {
    ambientSoundsRef.value.soundPlayers.forEach((soundPlayer) => {
      // Play if volume is > 0 OR if auto-play is enabled
      const shouldPlay = soundPlayer.volume.value !== 0;

      if (shouldPlay) {
        // Set default volume if auto-play is enabled and volume is 0
        if (soundPlayer.volume.value === 0) {
          soundPlayer.volume.value = 0.3; // Default volume for auto-play
        }

        // Wait for the sound to be loaded before playing
        watch(
          () => soundPlayer.sound.value,
          (sound) => {
            if (sound && soundPlayer.volume.value !== 0) {
              soundPlayer.play();
            }
          },
          { immediate: true }
        );
      }
    });
  }
});
</script>

<template lang="pug">
div.grid-cols-1.py-3.px-4(ref="audioTabRef")
  // Music controls section
  h2.text-sm.font-bold.uppercase.mb-2 Music Player
  div.flex.flex-col.items-center.space-y-6.py-4(v-if="shouldLoadMusic")
    YouTubePlayer(ref="youtubePlayerRef")
    AmbientSounds(ref="ambientSoundsRef")

  Divider

  SettingsItemV2(:type="Control.Check" path="visuals.enable_music_when_visit_site")
  SettingsItemV2(:type="Control.Check" path="visuals.enable_adaptive_ticking")
  template(v-if="isWebBase")
    SettingsItemV2(:type="Control.Check" path="visuals.enable_audio")
  //- template(v-if="isMobile")
    SettingsItem(:type="Control.Check" path="mobile.notifications.sectionOver")
    SettingsItem(:type="Control.Check" path="mobile.notifications.persistent")
</template>
