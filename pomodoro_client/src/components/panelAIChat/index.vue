<template lang="pug">
  Panel(
    :panel-name='"ai"'
    :require-auth='true'
    :use-divider='true'
  )
    template(#extra-content)
      div(v-if='isAuth')
        div(class="relative z-[-1]")
          button(
            class="absolute top-0 left-[-50px] top-[80px] w-full p-4 text-sm disabled:bg-gray-100 dark:disabled:bg-gray-100 disabled:text-gray-300 text-white rounded-lg bg-primary dark:bg-surface-darkvariant dark:text-white"
            @click='createChannel'
            :disabled='loadingMessage || loadingChannel'
          )
            PlusIcon
      div(v-if="channelIds.length > 1")
        div(class="relative z-[-1]" v-for='(channelId, idx) in channelIds' :key="channelId")
          button(
            class="absolute top-0 left-[-50px] hover:left-[-60px] w-full p-4 text-sm disabled:bg-gray-100 dark:disabled:bg-gray-100 disabled:text-gray-300 text-white rounded-lg bg-primary dark:bg-surface-darkvariant dark:text-white"
            :class="{'left-[-70px] outline outline-offset-[-3px]': selectedChannelId === channelId}"
            :style="{top: `${80+56*(idx+1)}px`}"
            :disabled='(loadingMessage || loadingChannel) && selectedChannelId !== channelId'
            @click='changeChannel(channelId)'
          )
            MessageIcon
    template(#content)
      ChatBox
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

<script setup lang="ts">
import { computed, reactive } from "vue"; // Added vue imports
import { useMobileSettings } from "../../stores/platforms/mobileSettings"; // Changed to relative path
import { useAuthStore } from "../../stores/auth"; // Changed to relative path
import { useOpenPanels } from "../../stores/openpanels"; // Changed to relative path
import { runtimeConfig } from "@/config/runtimeConfig";

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
import Panel from "@/components/panel.vue"
import Divider from "../base/uiDivider.vue"; // Changed to relative path

import TabHeader from "@/components/common/panel/tabHeader.vue";
import LoginTab from "@/components/common/loginTab.vue"; // Changed to relative path
import ChatBox from "./chatBox.vue"; // Corrected casing
import { useAIChatStore } from "../../stores/aichat"; // Changed to relative path
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

const state = reactive({
	activeTab: 1,
	resetConfirm: false,
});
</script>
