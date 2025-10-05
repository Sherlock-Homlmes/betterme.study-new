<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { DateRange } from 'reka-ui';
import { CalendarDate } from '@internationalized/date';
import DateRangePicker from "@/components/ui/date-picker/DateRangePicker.vue";
import { BarChart } from "@/components/ui/chart-bar";
import { Loading } from "@/components/ui/loading";
import ChartTooltipTime from "@/components/ui/chart/ChartTooltipTime.vue";
import { useStatistics } from '~/stores/statistic';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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

// Load initial data
onMounted(() => {
  fetchStatistics(selectedDateRange.value);
});

const handleDateRangeChange = (newRange: DateRange) => {
  selectedDateRange.value = newRange;
};

const formatTime = (minutes: number): string => {
  if (!minutes || minutes === 0) return `0 ${t('user_settings.tabs.statistic.minutes')}`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} ${t('user_settings.tabs.statistic.hours')} ${remainingMinutes} ${t('user_settings.tabs.statistic.minutes')}`;
  } else if (hours > 0) {
    return `${hours} ${t('user_settings.tabs.statistic.hours')}`;
  } else {
    return `${remainingMinutes} ${t('user_settings.tabs.statistic.minutes')}`;
  }
};
</script>

<template>
  <div class="flex flex-col items-center space-y-6 p-5">
    <!-- Date Range Picker -->
    <div class="w-full max-w-2xl mx-auto flex justify-center">
      <DateRangePicker
        v-model="selectedDateRange"
        @update:modelValue="handleDateRangeChange"
      />
    </div>

    <!-- Summary Stats -->
    <div v-if="!loading && !error" class="grid grid-cols-2 gap-4 w-full max-w-4xl mx-auto text-center">
      <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div class="text-2xl font-bold text-opacity-5">{{ formatTime(summary.totalTime || 0) }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">{{ t('user_settings.tabs.statistic.total_study_time') }}</div>
      </div>
      <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div class="text-2xl font-bold text-opacity-75">{{ summary.studyDays || 0 }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">{{ t('user_settings.tabs.statistic.study_days') }}</div>
      </div>
      <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div class="text-2xl font-bold text-opacity-75">{{ formatTime(summary.averageDailyTime || 0) }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">{{ t('user_settings.tabs.statistic.avg_time_per_day') }}</div>
      </div>
      <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div class="text-2xl font-bold text-opacity-75">{{ summary.currentStreak || 0 }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">{{ t('user_settings.tabs.statistic.study_streak') }}</div>
        <div v-if="summary.streakRange" class="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {{ summary.streakRange }}
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-8">
      <Loading
        size="lg"
        :text="t('user_settings.tabs.statistic.loading_statistics')"
        class="text-gray-600 dark:text-gray-400"
      />
    </div>

    <!-- Error State -->
    <div v-if="error" class="text-red-600 dark:text-red-400 text-center py-4">
      {{ error }}
    </div>

    <!-- Chart -->
    <div v-if="!loading && !error && formattedData.length > 0" class="w-full max-w-4xl mx-auto">
      <ClientOnly>
        <BarChart
          index="name"
          :data="getFormattedData(t('user_settings.tabs.statistic.study_time'))"
          :categories="[t('user_settings.tabs.statistic.study_time')]"
          :custom-tooltip="ChartTooltipTime"
          :x-formatter="(tick, i, ticks) => {
            // Always show the label for each data point
            return formattedData[i]?.name || ''
          }"
          :y-formatter="(tick, i) => {
            return typeof tick === 'number'
              ? `${tick}m`
              : ''
          }"
          :rounded-corners="4"
          class="h-64"
        />
      </ClientOnly>
    </div>

    <!-- No Data State -->
    <div v-if="!loading && !error && formattedData.length === 0" class="text-center py-8 text-gray-600 dark:text-gray-400">
      {{ t('user_settings.tabs.statistic.no_data') }}
    </div>
  </div>
</template>
