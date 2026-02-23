import { ref, computed } from 'vue';
import type { DateRange } from 'reka-ui';
import { runtimeConfig } from '@/config/runtimeConfig';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/utils/betterFetch';
import { toDate } from 'reka-ui/date';

export interface StudyTime {
  total_study_time: number;
  date_range: string;
}

export interface StatisticData {
  name: string;
  total: number;
  date: string;
}

export interface StatisticsResponse {
  total_study_time: number;
  study_day_count: number;
  study_time_per_day: number;
  longest_streak: number;
  pomodoro_count: number;
  data: StudyTime[];
}

export const useStatistics = () => {
  const API_URL = runtimeConfig.public.API_URL;
  const { isAuth } = useAuthStore();

  const loading = ref(false);
  const error = ref<string | null>(null);
  const statisticsData = ref<StatisticData[]>([]);
  const summary = ref({
    totalTime: 0,
    averageSessionTime: 0,
    studyDays: 0,
    averageDailyTime: 0,
    currentStreak: 0,
    streakRange: '',
    pomodoroCount: 0,
  });

  const fetchStatistics = async (dateRange?: DateRange) => {
    if (!isAuth.value) {
      error.value = 'User not authenticated';
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      let url = `${API_URL}/v2/statistics`;

      if (dateRange?.start && dateRange?.end) {
        const startDate = toDate(dateRange.start).toISOString().split('T')[0];
        const endDate = toDate(dateRange.end).toISOString().split('T')[0];
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await api.get(url);

      if (response?.ok) {
        const data: StatisticsResponse = await response.json();

        // Convert StudyTime data to StatisticData format for chart
        statisticsData.value = data.data.map(item => ({
          name: item.date_range,
          total: item.total_study_time,
          date: item.date_range // Use date_range as date since it contains the date info
        }));

        // Update summary with data from API
        summary.value = {
          totalTime: data.total_study_time,
          averageSessionTime: data.study_day_count > 0 ? Math.round(data.total_study_time / data.study_day_count) : 0,
          studyDays: data.study_day_count,
          averageDailyTime: data.study_time_per_day,
          currentStreak: data.longest_streak,
          streakRange: '', // API doesn't provide streak range, could be added later
          pomodoroCount: data.pomodoro_count || 0,
        };
      } else {
        // If API doesn't exist yet, generate mock data based on date range
        generateMockData(dateRange);
      }
    } catch (err) {
      console.warn('Statistics API not available, using mock data');
      generateMockData(dateRange);
    } finally {
      loading.value = false;
    }
  };

  const groupDataByPeriod = (data: StatisticData[], maxItems: number = 10): StatisticData[] => {
    if (data.length <= maxItems) return data;

    // Check if data spans multiple years
    const years = [...new Set(data.map(item => new Date(item.date).getFullYear()))];
    const hasMultipleYears = years.length > 1;

    const totalDays = data.length;
    const daysPerGroup = Math.ceil(totalDays / maxItems);
    const groupedItems: StatisticData[] = [];

    for (let i = 0; i < totalDays; i += daysPerGroup) {
      const groupData = data.slice(i, i + daysPerGroup);

      // Calculate group totals
      const groupTotal = groupData.reduce((sum, item) => sum + item.total, 0);

      // Create group name
      const startDate = new Date(groupData[0].date);
      const endDate = new Date(groupData[groupData.length - 1].date);

      let groupName: string;
      if (groupData.length === 1) {
        // Single day: show year only if data spans multiple years
        groupName = hasMultipleYears
          ? startDate.toLocaleDateString('en-GB')
          : startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      } else {
        // For grouped data
        if (hasMultipleYears) {
          // Show full dates with year
          const startFormatted = startDate.toLocaleDateString('en-GB');
          const endFormatted = endDate.toLocaleDateString('en-GB');
          groupName = `${startFormatted} - ${endFormatted}`;
        } else {
          // Show only day/month
          const startFormatted = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          const endFormatted = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
          groupName = `${startFormatted} - ${endFormatted}`;
        }
      }

      groupedItems.push({
        name: groupName,
        total: groupTotal,
        date: groupData[0].date, // Use first date as representative
      });

      if (groupedItems.length >= maxItems) {
        break;
      }
    }

    return groupedItems;
  };

  const fillMissingDates = (data: StatisticData[], dateRange: DateRange): StatisticData[] => {
    if (!dateRange.start || !dateRange.end) return data;

    const startDate = toDate(dateRange.start);
    const endDate = toDate(dateRange.end);
    const filledData: StatisticData[] = [];

    // Check if date range spans multiple years
    const hasMultipleYears = startDate.getFullYear() !== endDate.getFullYear();

    // Create a map of existing data by date
    const dataMap = new Map<string, StatisticData>();
    data.forEach(item => {
      dataMap.set(item.date, item);
    });

    // Fill in all dates in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];

      if (dataMap.has(dateKey)) {
        // Use existing data
        filledData.push(dataMap.get(dateKey)!);
      } else {
        // Add empty day with appropriate format
        filledData.push({
          name: hasMultipleYears
            ? currentDate.toLocaleDateString('en-GB')
            : currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
          total: 0,
          date: dateKey,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filledData;
  };

  const generateMockData = (dateRange?: DateRange) => {
    const studyTimes: StudyTime[] = [];
    let totalStudyTime = 0;
    let studyDayCount = 0;

    if (dateRange?.start && dateRange?.end) {
      // Generate data for the selected date range
      const startDate = toDate(dateRange.start);
      const endDate = toDate(dateRange.end);

      // Check if date range spans multiple years
      const hasMultipleYears = startDate.getFullYear() !== endDate.getFullYear();

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Randomly decide if this day has data (70% chance) or is empty (30% chance)
        const hasData = Math.random() > 0.3;
        const studyTime = hasData ? Math.floor(Math.random() * 300) + 50 : 0;

        if (studyTime > 0) {
          studyDayCount++;
        }
        totalStudyTime += studyTime;

        const dateRangeStr = hasMultipleYears
          ? currentDate.toLocaleDateString('en-GB')
          : currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });

        studyTimes.push({
          total_study_time: studyTime,
          date_range: dateRangeStr,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Default mock data for last 7 days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        // Randomly decide if this day has data (80% chance)
        const hasData = Math.random() > 0.2;
        const studyTime = hasData ? Math.floor(Math.random() * 300) + 50 : 0;

        if (studyTime > 0) {
          studyDayCount++;
        }
        totalStudyTime += studyTime;

        studyTimes.push({
          total_study_time: studyTime,
          date_range: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
        });
      }
    }

    // Convert to StatisticData format for chart
    statisticsData.value = studyTimes.map(item => ({
      name: item.date_range,
      total: item.total_study_time,
      date: item.date_range,
    }));

    // Calculate summary
    const totalDays = studyTimes.length;
    const averageDailyTime = totalDays > 0 ? Math.round(totalStudyTime / totalDays) : 0;
    const averageSessionTime = studyDayCount > 0 ? Math.round(totalStudyTime / studyDayCount) : 0;

    summary.value = {
      totalTime: totalStudyTime,
      averageSessionTime,
      studyDays: studyDayCount,
      averageDailyTime,
      currentStreak: Math.floor(Math.random() * 10) + 1, // Mock streak
      streakRange: '', // Could be calculated but keeping simple for mock
      pomodoroCount: Math.floor(Math.random() * 50) + 1, // Mock pomodoro count
    };
  };

  const calculateSummaryFromData = (data: StatisticData[]) => {
    // Calculate summary with safe defaults
    const totalTime = data.reduce((sum, item) => sum + (item.total || 0), 0);
    const studyDays = data.filter(item => (item.total || 0) > 0).length;

    // Calculate total days as the difference between last date and first date + 1
    let totalDays = 0;
    if (data.length > 0) {
      const firstDate = new Date(data[0].date);
      const lastDate = new Date(data[data.length - 1].date);
      totalDays = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Average daily time = total_time / total days in range (including days with 0 study time)
    const averageDailyTime = totalDays > 0 ? Math.round(totalTime / totalDays) : 0;

    // Calculate streak
    const { streak, streakRange } = calculateStreak(data);

    summary.value = {
      totalTime: totalTime || 0,
      averageSessionTime: studyDays > 0 ? Math.round(totalTime / studyDays) : 0,
      studyDays: studyDays || 0,
      averageDailyTime: averageDailyTime || 0,
      currentStreak: streak || 0,
      streakRange: streakRange || '',
      pomodoroCount: 0, // Will be updated by API response
    };
  };

  const calculateStreak = (data: StatisticData[]): { streak: number; streakRange: string } => {
    if (!data || data.length === 0) return { streak: 0, streakRange: '' };

    // Sort data by date to ensure chronological order
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.date || '').getTime();
      const dateB = new Date(b.date || '').getTime();
      return dateA - dateB;
    });

    let currentStreak = 0;
    let maxStreak = 0;
    let streakStart = '';
    let streakEnd = '';
    let tempStreakStart = '';

    // Find the longest streak of consecutive study days
    for (let i = 0; i < sortedData.length; i++) {
      const item = sortedData[i];

      if ((item.total || 0) > 0) {
        if (currentStreak === 0) {
          tempStreakStart = item.date || '';
        }
        currentStreak++;

        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          streakStart = tempStreakStart;
          streakEnd = item.date || '';
        }
      } else {
        currentStreak = 0;
      }
    }

    // Format streak range
    let streakRange = '';
    if (maxStreak > 0 && streakStart && streakEnd) {
      try {
        const startDate = new Date(streakStart);
        const endDate = new Date(streakEnd);

        if (streakStart === streakEnd) {
          streakRange = startDate.toLocaleDateString('en-GB');
        } else {
          streakRange = `${startDate.toLocaleDateString('en-GB')} - ${endDate.toLocaleDateString('en-GB')}`;
        }
      } catch (error) {
        console.warn('Error formatting streak range:', error);
        streakRange = '';
      }
    }

    return { streak: maxStreak || 0, streakRange: streakRange || '' };
  };

  const getFormattedData = (categoryKey: string) => {
    return statisticsData.value.map(item => ({
      name: item.name,
      [categoryKey]: item.total,
    }));
  };

  const formattedData = computed(() => {
    return statisticsData.value.map(item => ({
      name: item.name,
      'Thời gian': item.total,
    }));
  });

  return {
    loading,
    error,
    statisticsData,
    summary,
    formattedData,
    getFormattedData,
    fetchStatistics,
  };
};
