<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import {until} from "@vueuse/core";
import type { DateRange } from 'reka-ui';
import { CalendarDate } from '@internationalized/date';
import { XIcon as CloseIcon } from 'vue-tabler-icons';
import DateRangePicker from "@/components/ui/date-picker/DateRangePicker.vue";
import Panel from "@/components/panel.vue"
import { BarChart } from "@/components/ui/chart-bar";
import { Loading } from "@/components/ui/loading";
import ChartTooltipTime from "@/components/ui/chart/ChartTooltipTime.vue";
import { useMobileSettings } from "@/stores/platforms/mobileSettings";
import { useAuthStore } from "@/stores/auth";
import { useOpenPanels } from "@/stores/openpanels";
import { useStatistics } from '@/stores/statistic';
import { useI18n } from 'vue-i18n';
import { ButtonImportance } from "@/components/base/types/button";
import ControlButton from "@/components/base/uiButton.vue";
import LoginTab from "@/components/common/loginTab.vue";

const { t } = useI18n();
const { isAuth } = useAuthStore();
const openPanels = useOpenPanels();
const mobileSettingsStore = useMobileSettings();

const {
  loading,
  error,
  formattedData,
  summary,
  getFormattedData,
  fetchStatistics
} = useStatistics();

// Initialize with last 7 days
const today = new Date();
const lastWeek = new Date(today);
lastWeek.setDate(today.getDate() - 7);

const selectedDateRange = ref<DateRange>({
  start: new CalendarDate(lastWeek.getFullYear(), lastWeek.getMonth() + 1, lastWeek.getDate()),
  end: new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()),
});

// Watch for date range changes
watch(selectedDateRange, (newRange) => {
  if (newRange?.start && newRange?.end) {
    fetchStatistics(newRange);
  }
}, { deep: true });

const handleDateRangeChange = (newRange: DateRange) => {
  selectedDateRange.value = newRange;
};

const formatTime = (minutes: number): string => {
  if (!minutes || minutes === 0) return `0 ${t('statistic.content.minutes')}`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} ${t('statistic.content.hours')} ${remainingMinutes} ${t('statistic.content.minutes')}`;
  } else if (hours > 0) {
    return `${hours} ${t('statistic.content.hours')}`;
  } else {
    return `${remainingMinutes} ${t('statistic.content.minutes')}`;
  }
};

// Load initial data
onMounted(async () => {
  await until(isAuth).toBe(true);
  fetchStatistics(selectedDateRange.value);
});
</script>

<template lang="pug">
Panel(
  :panel-name='"statistic"'
  :require-auth='true'
  :use-divider='true'
)
  template(#content)
    div(class="flex flex-col items-center space-y-6 px-5")
    // Date Range Picker
    div(class="w-full max-w-2xl mx-auto flex justify-center")
      DateRangePicker(v-model="selectedDateRange" @update:modelValue="handleDateRangeChange")
    // Summary Stats
    div(v-if="!loading && !error" class="grid grid-cols-2 gap-4 w-full max-w-4xl mx-auto text-center")
      div(class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg")
        div(class="text-2xl font-bold text-opacity-5") {{ formatTime(summary.totalTime || 0) }}
        div(class="text-sm text-gray-600 dark:text-gray-400") {{ t('statistic.content.total_study_time') }}
      div(class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg")
        div(class="text-2xl font-bold text-opacity-75") {{ formatTime(summary.averageDailyTime || 0) }}
        div(class="text-sm text-gray-600 dark:text-gray-400") {{ t('statistic.content.avg_time_per_day') }}
      div(class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg")
        div(class="text-2xl font-bold text-opacity-75") {{ summary.studyDays || 0 }}
        div(class="text-sm text-gray-600 dark:text-gray-400") {{ t('statistic.content.study_days') }}
      div(class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg")
        div(class="text-2xl font-bold text-opacity-75") {{ summary.pomodoroCount || 0 }}
        div(class="text-sm text-gray-600 dark:text-gray-400") {{ t('statistic.content.pomodoro_count') }}
      div(class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg")
        div(class="text-2xl font-bold text-opacity-75") {{ summary.currentStreak || 0 }}
        div(class="text-sm text-gray-600 dark:text-gray-400") {{ t('statistic.content.study_streak') }}
        div(v-if="summary.streakRange" class="text-xs text-gray-500 dark:text-gray-500 mt-1")
          | {{ summary.streakRange }}
    // Loading State
    div(v-if="loading" class="py-8")
      Loading(size="lg" :text="t('statistic.content.loading_statistics')" class="text-gray-600 dark:text-gray-400")
    // Error State
    div(v-if="error" class="text-red-600 dark:text-red-400 text-center py-4")
      | {{ error }}
    // Chart
    div(v-if="!loading && !error && formattedData.length > 0" class="w-full max-w-4xl mx-auto")
      BarChart(index="name" :data="getFormattedData(t('statistic.content.study_time'))" :categories="[t('statistic.content.study_time')]" :custom-tooltip="ChartTooltipTime" :x-formatter="(tick, i, ticks) => formattedData[i]?.name || ''" :y-formatter="(tick, i) => typeof tick === 'number' ? `${tick}m` : ''" :rounded-corners="4" class="h-64")
    // No Data State
    div(v-if="!loading && !error && formattedData.length === 0" class="text-center py-8 text-gray-600 dark:text-gray-400")
      | {{ t('statistic.content.no_data') }}
</template>
