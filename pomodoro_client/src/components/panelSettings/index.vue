<script setup lang="ts">
import {computed, reactive} from "vue";

import {
	XIcon as CloseIcon,
	AdjustmentsIcon as TabIconGeneral,
	AlarmIcon as TabIconClock,
	MusicIcon as TabIconMusic,
	InfoCircleIcon as TabIconAbout,
	UserIcon as TabIconAccount,
} from "vue-tabler-icons";

import { ButtonImportance } from "../base/types/button";
import ControlButton from "@/components/base/uiButton.vue";
import Panel from "@/components/base/uiPanel.vue";

import TabHeader from "@/components/common/panel/tabHeader.vue";
import CoreSettingTab from "./coreSettingTab/index.vue";
import ClockSettingTab from "./clockTab.vue";
import AudioSettingTab from "./audioTab/index.vue";
import AboutTab from "./aboutTab.vue";
import LoginTab from "@/components/common/loginTab.vue";
import UserSettingTab from "./userSettingTab.vue";


import { useOpenPanels } from "@/stores/openpanels";
import { usePlatformStore } from "@/stores/platforms";
import { useAuthStore } from "@/stores/auth";

const { isAuth, loading } = useAuthStore();
const openPanels = useOpenPanels();

const state = reactive({
	activeTab: 1,
	resetConfirm: false,
});

</script>

<template lang="pug">
Panel
  template(#header)
    h1.px-4.mt-4.mb-2.text-xl.font-bold.uppercase
      span {{ $t('settings.heading') }}
      ControlButton(
        :aria-label="$t('settings.buttons.close')"
        default-style
        circle
        :importance="ButtonImportance.Text"
        class="float-right -mt-2 -mr-2"
        tabindex="0"
        @click="openPanels.settings = false"
      )
        CloseIcon(:aria-label="$t('settings.buttons.close')")

  template(#content)
    .relative.w-full.h-full(v-if="!loading || !isAuth")
      CoreSettingTab(v-if="state.activeTab === 1" @openLogin="state.activeTab = 4")
      ClockSettingTab(v-else-if="state.activeTab === 2")
      AudioSettingTab(v-show="state.activeTab === 3")
      UserSettingTab(v-if="state.activeTab === 4")
      div(v-else-if="state.activeTab === 5" class="grid grid-cols-1 gap-2 py-3 px-4")
        AboutTab

  template(#footer)
    div.flex.flex-row.flex-none.h-20.p-4
      TabHeader(:active="state.activeTab === 1" :text="$t('settings.tabs.main')" @click="state.activeTab = 1")
        template(#icon)
          TabIconGeneral(role="presentation")
      TabHeader(:active="state.activeTab === 2" :text="$t('settings.tabs.timer')" @click="state.activeTab = 2")
        template(#icon)
          TabIconClock(role="presentation")
      TabHeader(:active="state.activeTab === 3" :text="$t('settings.tabs.audio')" @click="state.activeTab = 3")
        template(#icon)
          TabIconMusic(role="presentation")
      TabHeader(:active="state.activeTab === 4" :text="$t('settings.tabs.account')" @click="state.activeTab = 4")
        template(#icon)
          TabIconAccount(role="presentation")
      TabHeader(:active="state.activeTab === 5" :text="$t('settings.tabs.about')" @click="state.activeTab = 5")
        template(#icon)
          TabIconAbout(role="presentation")
</template>

<style lang="scss" scoped>
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
