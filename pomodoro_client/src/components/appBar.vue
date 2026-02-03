<script setup>
import {
	SettingsIcon,
	ChecklistIcon,
	ChartBarIcon,
	MessageChatbotIcon,
	VideoIcon,
} from "vue-tabler-icons";
import { ButtonImportance, ButtonTheme } from "./base/types/button";
import CButton from "@/components/base/uiButton.vue";
import ScheduleView from "@/components/schedule/scheduleDisplay.vue";
import { useOpenPanels } from "@/stores/openpanels";
import { useSettings } from "@/stores/settings";
import { usePomodoroStore } from "@/stores/pomodoros";

const { getCurrentItem } = usePomodoroStore();

const openPanels = useOpenPanels();
const settingsStore = useSettings();

const appBarButtons = [
	{
		key: 'ai',
		panel: 'ai',
		icon: MessageChatbotIcon,
		ariaLabel: 'appbar.ai',
	},
	{
		key: 'todo',
		panel: 'todo',
		icon: ChecklistIcon,
		ariaLabel: 'appbar.todo',
	},
	{
		key: 'statistic',
		panel: 'statistic',
		icon: ChartBarIcon,
		ariaLabel: 'appbar.settings',
	},
	// {
	// 	key: 'voiceChannel',
	// 	panel: 'voiceChannel',
	// 	icon: VideoIcon,
	// 	ariaLabel: 'appbar.voiceChannel',
	// },
	{
		key: 'setting',
		panel: 'settings',
		icon: SettingsIcon,
		ariaLabel: 'appbar.settings',
	},
];
</script>

<template lang="pug">
div.flex.flex-row.items-center.w-full.gap-2.px-4.my-1.isolate.h-14
	div(v-show="settingsStore.schedule.visibility.enabled" class="flex-shrink-0 h-10 px-2 py-2 rounded-full bg-surface-dark dark:ring-1 ring-inset dark:ring-surface-ondark dark:ring-opacity-20 overflow-hidden")
		ScheduleView
	div(v-show="settingsStore.schedule.visibility.enabled && settingsStore.schedule.visibility.showSectionType" class="flex-shrink overflow-hidden text-lg whitespace-pre select-none text-ellipsis text-surface-onlight dark:text-surface-ondark" v-text="$t('section.' + getCurrentItem.type).toLowerCase()")
	div.flex-grow
	CButton(
		v-for="btn in appBarButtons"
		:key="btn.key"
		circle
		:theme="openPanels[btn.panel] ? ButtonTheme.Primary : ButtonTheme.Neutral"
		:importance="ButtonImportance.Tonal"
		:class="['transition', 'rounded-full', 'h-11']"
		no-content-theme
		no-padding
		inner-class="p-1"
		:aria-label="$t(btn.ariaLabel)"
		@click="openPanels[btn.panel] = !openPanels[btn.panel]"
	)
		component(:is="btn.icon" class="inline-block")
</template>
