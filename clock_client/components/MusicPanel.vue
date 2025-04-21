<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useSound } from '@vueuse/sound'
import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { useAuthStore } from "@/stores/auth";
import { useOpenPanels } from "@/stores/openpanels";

import {
	XIcon as CloseIcon,
  PlayerPlayIcon,
  PlayerPauseIcon,
  PlayerTrackPrevIcon,
  PlayerTrackNextIcon,
  VolumeIcon,
  VolumeOffIcon,
  RepeatIcon,
} from "vue-tabler-icons";

import { ButtonImportance } from "@/components/base/types/button";
import ControlButton from "@/components/base/uiButton.vue";

const runtimeConfig = useRuntimeConfig();
const { isAuth } = useAuthStore();
const openPanels = useOpenPanels();
const mobileSettingsStore = useMobileSettings();
const isWeb = computed(() => runtimeConfig.public.PLATFORM === "web");
const isMobile = computed(() => runtimeConfig.public.PLATFORM === "mobile");

const state = reactive({
	activeTab: 1,
	resetConfirm: false,
});

// Loop state
const isLooping = ref(false)

// Sound setup
const { play, pause, isPlaying } = useSound('/audio/musical/sample.mp3', {
  // Remove loop option here
  onend: () => {
    if (isLooping.value) {
      play(); // Re-play if looping is enabled
    }
  }
})

const togglePlay = () => {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

const toggleLoop = () => {
  isLooping.value = !isLooping.value
}
</script>

<template>
  <section class="fixed z-40 w-full h-full p-0 md:p-4 md:max-w-screen-sm">
    <div class="flex flex-col h-full overflow-hidden rounded-none shadow-lg bg-surface-light text-surface-onlight md:rounded-xl md:dark:ring-1 dark:ring-surface-ondark dark:ring-opacity-20 ring-inset dark:bg-surface-dark dark:text-surface-ondark" :style="{ 'padding-top': `${mobileSettingsStore.padding.top}px`, 'padding-bottom': `${mobileSettingsStore.padding.bottom}px` }">
      <h1 class="px-4 mt-4 text-xl font-bold uppercase">
        <span>Music</span>
        <ControlButton
          :aria-label="$t('settings.buttons.close')"
          default-style
          circle
          :importance="ButtonImportance.Text"
          class="float-right -mt-2 -mr-2"
          tabindex="0"
          @click="openPanels.music = false"
        >
          <CloseIcon :aria-label="$t('settings.buttons.close')" />
        </ControlButton>
      </h1>
      <hr class='mx-5 mt-2 mb-4'>
      <div class="flex-grow overflow-y-auto px-4 flex flex-col items-center">
        <!-- Album Art Placeholder -->
        <div class="w-48 h-48 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4 flex items-center justify-center">
          <span class="text-gray-500 dark:text-gray-400">Album Art</span>
        </div>

        <!-- Track Info -->
        <div class="text-center mb-4">
          <h2 class="text-lg font-semibold">Song Title</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">Artist Name</p>
        </div>

        <!-- Progress Bar Placeholder -->
        <div class="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full mb-4">
          <div class="h-full w-1/4 bg-primary-light dark:bg-primary-dark rounded-full"></div>
        </div>

        <!-- Playback Controls -->
        <div class="flex items-center w-full max-w-xs mb-4 align-items-center" style="display: flex;">

          <!-- Main Controls (Centered) -->
          <div class="flex items-center justify-center">
            <ControlButton :importance="ButtonImportance.Text" circle>
              <PlayerTrackPrevIcon />
            </ControlButton>
            <ControlButton :importance="ButtonImportance.Text" circle class="w-12 h-12" @click="togglePlay">
              <!-- Toggle between Play and Pause -->
              <PlayerPauseIcon v-if="isPlaying" class="w-6 h-6" />
              <PlayerPlayIcon v-else class="w-6 h-6" />
            </ControlButton>
            <ControlButton :importance="ButtonImportance.Text" circle>
              <PlayerTrackNextIcon />
            </ControlButton>
          <!-- Repeat Button (Right Aligned within this container) -->
          <ControlButton
            :importance="ButtonImportance.Text"
            circle
            class="items-center"
            style="vertical-align: middle; display: flex; align-items: center; margin-top: auto; margin-bottom: auto; align-self: center;"
            @click="toggleLoop"
            :class="{
              'bg-primary-light dark:bg-primary-dark text-white dark:text-black': isLooping,
              'text-gray-600 dark:text-gray-400': !isLooping
            }"
          >
            <RepeatIcon class="w-6 h-6" />
          </ControlButton>
          </div>

        </div>

        <!-- Volume Control Placeholder -->
        <div class="flex items-center justify-center space-x-2 w-full">
           <VolumeOffIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
           <div class="w-1/2 h-1 bg-gray-300 dark:bg-gray-600 rounded-full">
             <div class="h-full w-3/4 bg-primary-light dark:bg-primary-dark rounded-full"></div>
           </div>
           <VolumeIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>

      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
// ===== TAB TRANSITIONS =====
.tab-transition-enter-active,
.tab-transition-leave-active {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
  // transition: opacity 0.5s ease-out;
  position: relative;
}

.tab-transition-enter-from {
  transform: translateY(10px);
  opacity: 0;
}

.tab-transition-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
