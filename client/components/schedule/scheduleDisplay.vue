<script setup lang="ts">
import { usePomodoroStore } from "~~/stores/pomodoros";
import ScheduleItem from "@/components/schedule/scheduleItem.vue";

const { getSchedule } = usePomodoroStore();
</script>

<template>
  <TransitionGroup
    enter-active-class="transition duration-300 delay-150"
    leave-active-class="absolute transition duration-300"
    enter-from-class="translate-x-8 !opacity-0"
    move-class="transition duration-300 delay-150"
    leave-to-class="scale-90 opacity-0"
    tag="div"
    class="relative flex-grow-0 h-full rounded-full select-none"
  >
    <schedule-item
      v-for="(item, i) in getSchedule"
      :key="item.id"
      :type="item.type"
      :active="i === 0"
    />
  </TransitionGroup>
</template>
