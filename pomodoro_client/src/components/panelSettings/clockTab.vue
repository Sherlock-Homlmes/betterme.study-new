<script setup lang="ts">
import { InfoCircleIcon as InfoIcon } from "vue-tabler-icons";
import OptionGroup from "@/components/base/optionGroup.vue";
import SettingsItem from "@/components/common/settingsItem/v1.vue";
import SettingsItemV2 from "@/components/common/settingsItem/v2.vue";
import Divider from "@/components/base/uiDivider.vue";

import presetTimers from "@/assets/settings/timerPresets";
import { useAuthStore } from "@/stores/auth";
import { Control } from "@/components/common/settingsItem/type";

const { getActiveSchedulePreset, applyPreset } = useAuthStore();
</script>

<template lang="pug">
div(class="grid grid-cols-1 gap-2 py-3 px-4")
  SettingsItemV2(:type="Control.Option" path="visuals.timer_show" :choices="{traditional: 'traditional', approximate: 'approximate', percentage: 'percentage'}")
  Divider

  SettingsItem(
    :type="Control.Empty"
    path="schedule.lengths"
  )
    OptionGroup(
      translation-key="timerpreset"
      :choices="presetTimers"
      :value="getActiveSchedulePreset"
      @input="(newPreset) => applyPreset(newPreset)"
    )
  SettingsItemV2(:type="Control.Time" path="pomodoro_settings.pomodoro_study_time" :min="5 * 60")
  SettingsItemV2(:type="Control.Time" path="pomodoro_settings.pomodoro_rest_time" :min="1 * 60")
  SettingsItemV2(:type="Control.Time" path="pomodoro_settings.pomodoro_long_rest_time" :min="1 * 60")
  div(class="flex flex-row items-center px-3 py-4 space-x-2 rounded-lg ring-inset ring ring-primary bg-primary/20 dark:bg-gray-700 dark:text-gray-100")
    InfoIcon
    span(v-text="$t('settings.scheduleMinTime')")
  SettingsItemV2(:type="Control.Number" path="pomodoro_settings.long_rest_time_interval" :min="1" :max="10")
</template>
