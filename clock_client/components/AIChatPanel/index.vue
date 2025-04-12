<template>
  <section class="fixed z-40 w-full h-full p-0 md:p-4 md:max-w-screen-sm">
    <div v-if='isAuth'>
      <div class="relative z-[-1]">
        <button
          class="absolute top-0 left-[-50px] top-[80px] w-full p-4 text-sm disabled:bg-gray-100 dark:disabled:bg-gray-100 disabled:text-gray-300 text-white rounded-lg bg-primary dark:bg-surface-darkvariant dark:text-white"
          @click='createChannel'
          :disabled='loadingMessage || loadingChannel'
        >
          <PlusIcon/>
        </button>
      </div>

    <div v-if="channelIds.length > 1" >
      <div class="relative z-[-1]" v-for='(channelId, idx) in channelIds' :key="channelId">
        <button
          class="absolute top-0 left-[-50px] hover:left-[-60px] w-full p-4 text-sm disabled:bg-gray-100 dark:disabled:bg-gray-100 disabled:text-gray-300 text-white rounded-lg bg-primary dark:bg-surface-darkvariant dark:text-white"
          :class="{'left-[-70px] outline outline-offset-[-3px]': selectedChannelId === channelId}"
          :style="{top: `${80+56*(idx+1)}px`}"
          :disabled='(loadingMessage || loadingChannel) && selectedChannelId !== channelId'
          @click='changeChannel(channelId)'
        >
          <MessageIcon/>
        </button>
      </div>
    </div>
</div>

    <div class="flex flex-col h-full overflow-hidden rounded-none shadow-lg bg-surface-light text-surface-onlight md:rounded-xl md:dark:ring-1 dark:ring-surface-ondark dark:ring-opacity-20 ring-inset dark:bg-surface-dark dark:text-surface-ondark" :style="{ 'padding-top': `${mobileSettingsStore.padding.top}px`, 'padding-bottom': `${mobileSettingsStore.padding.bottom}px` }">
      <h1 class="px-4 mt-4 text-xl font-bold uppercase">
        <span>{{ $t('ai.heading') }}</span>
        <ControlButton
          :aria-label="$t('settings.buttons.close')"
          default-style
          circle
          :importance="ButtonImportance.Text"
          class="float-right -mt-2 -mr-2"
          tabindex="0"
          @click="openPanels.ai = false"
        >
          <CloseIcon :aria-label="$t('settings.buttons.close')" />
        </ControlButton>
      </h1>
      <hr class='mx-5 mt-2'>
      <div class="flex-grow overflow-y-auto">
        <Transition tag="div" name="tab-transition" mode="out-in" class="relative w-full">
          <div v-if="!isAuth" class="settings-tab h-full">
            <LoginTab />
          </div>
          <div v-else class="settings-tab h-full">
            <ChatBox/>
          </div>
        </Transition>
      </div>

    </div>
  </section>
</template>

<style lang="scss" scoped>
div.settings-tab {
  @apply grid grid-cols-1 gap-2 py-3 px-4;
}

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

<script setup lang="ts">
import { computed, reactive } from "vue"; // Added vue imports
import { useMobileSettings } from "../../stores/platforms/mobileSettings"; // Changed to relative path
import { useAuthStore } from "../../stores/auth"; // Changed to relative path
import { useOpenPanels } from "../../stores/openpanels"; // Changed to relative path

import {
	PlusIcon,
	MessageIcon,
	XIcon as CloseIcon,
	UserIcon as TabIconUser,
	ChartBarIcon as TabIconStatistic,
	AdjustmentsIcon as TabIconGeneral,
	AlarmIcon as TabIconSchedule,
	ArtboardIcon as TabIconVisuals,
	InfoCircleIcon as InfoIcon,
	InfoCircleIcon as TabIconAbout,
} from "vue-tabler-icons";

import { ButtonImportance } from "../base/types/button";
import ControlButton from "../base/uiButton.vue"; // Changed to relative path
import Divider from "../base/uiDivider.vue"; // Changed to relative path

import TabHeader from "../settings/panel/tabHeader.vue"; // Changed to relative path
import LoginTab from "../settings/loginTab.vue"; // Changed to relative path
import ChatBox from "./chatBox.vue"; // Corrected casing
import { useAIChatStore } from "../../stores/aichat"; // Changed to relative path

const runtimeConfig = useRuntimeConfig();
const { isAuth } = useAuthStore();
const {
	selectedChannelId,
	channelIds,
	createChannel,
	changeChannel,
	loadingChannel,
	loadingMessage,
} = useAIChatStore();
const openPanels = useOpenPanels();
const mobileSettingsStore = useMobileSettings();
const isWeb = computed(() => runtimeConfig.public.PLATFORM === "web");
const isMobile = computed(() => runtimeConfig.public.PLATFORM === "mobile");

const state = reactive({
	activeTab: 1,
	resetConfirm: false,
});
</script>
