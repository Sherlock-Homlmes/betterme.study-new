<script setup lang="ts">
import { reactive, defineAsyncComponent, watch } from "vue";
import {
	SettingsIcon,
	AdjustmentsIcon as TabIconGeneral,
	AlarmIcon as TabIconClock,
	MusicIcon as TabIconMusic,
	InfoCircleIcon as TabIconAbout,
	UserIcon as TabIconAccount,
	ChartBarIcon as TabIconStatistic,
} from "vue-tabler-icons";
import Panel from "@/components/panel.vue";
import TabHeader from "@/components/common/panel/tabHeader.vue";
import CoreSettingTab from "./coreSettingTab/index.vue";
import AudioSettingTab from "./audioTab/index.vue";
import { useAudioStore } from "@/stores/audios";

const ClockSettingTab = defineAsyncComponent(() => import('./clockTab.vue'))
const AboutTab = defineAsyncComponent(() => import('./aboutTab.vue'))
const UserSettingTab = defineAsyncComponent(() => import('./userSettingTab.vue'))
const StatisticTab = defineAsyncComponent(() => import('./statisticTab.vue'))

const { audioTabActive } = useAudioStore();

const state = reactive({
	activeTab: 1,
	resetConfirm: false,
});

watch(() => state.activeTab, (newTab) => {
	if (newTab === 3) {
		audioTabActive.value = true;
	}
});
</script>

<template lang="pug">
Panel(:panel-name="'settings'")
  template(#header-icon)
    SettingsIcon(:size="24" class="text-primary-500")
  template(#content)
    div.flex.flex-col.h-full
      div.flex-grow
        CoreSettingTab(v-if="state.activeTab === 1" @openLogin="state.activeTab = 5")
        ClockSettingTab(v-if="state.activeTab === 2")
        AudioSettingTab(v-show="state.activeTab === 3")
        StatisticTab(v-if="state.activeTab === 4")
        UserSettingTab(v-if="state.activeTab === 5")
        div(v-if="state.activeTab === 6" class="grid grid-cols-1 gap-2 py-3 px-4")
          AboutTab
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
        TabHeader(:active="state.activeTab === 4" :text="$t('settings.tabs.statistic')" @click="state.activeTab = 4")
          template(#icon)
            TabIconStatistic(role="presentation")
        TabHeader(:active="state.activeTab === 5" :text="$t('settings.tabs.account')" @click="state.activeTab = 5")
          template(#icon)
            TabIconAccount(role="presentation")
        TabHeader(:active="state.activeTab === 6" :text="$t('settings.tabs.about')" @click="state.activeTab = 6")
          template(#icon)
            TabIconAbout(role="presentation")
</template>