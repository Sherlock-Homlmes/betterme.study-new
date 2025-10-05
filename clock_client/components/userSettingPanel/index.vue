<script setup lang="ts">
import { useMobileSettings } from "~~/stores/platforms/mobileSettings";
import { useAuthStore } from "~~/stores/auth";
import { useOpenPanels } from "~~/stores/openpanels";

import {
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
import ControlButton from "~~/components/base/uiButton.vue";
import Divider from "~~/components/base/uiDivider.vue";

import TabHeader from "@/components/settings/panel/tabHeader.vue";
import InfoTab from "~~/components/userSettingPanel/infoTab.vue";
import StatisticTab from "~~/components/userSettingPanel/statisticTab.vue";
import LoginTab from "~~/components/settings/loginTab.vue";

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
</script>

<template>
  <section class="fixed z-40 w-full h-full p-0 md:p-4 md:max-w-3xl">
    <div class="flex flex-col h-full overflow-hidden rounded-none shadow-lg bg-surface-light text-surface-onlight md:rounded-xl md:dark:ring-1 dark:ring-surface-ondark dark:ring-opacity-20 ring-inset dark:bg-surface-dark dark:text-surface-ondark" :style="{ 'padding-top': `${mobileSettingsStore.padding.top}px`, 'padding-bottom': `${mobileSettingsStore.padding.bottom}px` }">
      <h1 class="px-4 mt-4 mb-2 text-xl font-bold uppercase">
        <span>{{ $t('user_settings.heading') }}</span>
        <ControlButton
          :aria-label="$t('settings.buttons.close')"
          default-style
          circle
          :importance="ButtonImportance.Text"
          class="float-right -mt-2 -mr-2"
          tabindex="0"
          @click="openPanels.user = false"
        >
          <CloseIcon :aria-label="$t('settings.buttons.close')" />
        </ControlButton>
      </h1>
      <div class="flex-grow overflow-y-auto">
        <Transition tag="div" name="tab-transition" mode="out-in" class="relative w-full">
          <div v-if="!isAuth" class="settings-tab h-full">
            <LoginTab />
          </div>
          <div v-else-if="state.activeTab === 1" :key="1" class="user-info">
            <InfoTab />
          </div>
          <div v-else-if="state.activeTab === 2" :key="2" class="user-info">
            <StatisticTab />
          </div>
        </Transition>
      </div>

      <!-- Tab bar -->
      <div v-if="isAuth" class="flex flex-row flex-none h-20 p-4">
        <!-- TODO: refactor -->
        <TabHeader :active="state.activeTab === 1" :text="$t('user_settings.tabs.info.heading')" @click="state.activeTab = 1">
          <template #icon>
            <TabIconUser role="presentation" />
          </template>
        </TabHeader>
        <TabHeader :active="state.activeTab === 2" :text="$t('user_settings.tabs.statistic.heading')" @click="state.activeTab = 2">
          <template #icon>
            <TabIconStatistic role="presentation" />
          </template>
        </TabHeader>
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
