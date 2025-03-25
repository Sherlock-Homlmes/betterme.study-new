<script setup lang="ts">
import { TimerType } from "~~/stores/settings";
import { useSchedule } from "~~/stores/schedule";
import { TimerState, usePomodoroStore } from "~~/stores/pomodoros";

import TimerTraditional from "@/components/timer/display/timerTraditional.vue";
import TimerApproximate from "@/components/timer/display/timerApproximate.vue";
import TimerPercentage from "@/components/timer/display/timerPercentage.vue";
import CompleteMarker from "@/components/timer/display/timerComplete.vue";

export interface TimerInfo {
	timeElapsed: number;
	timeOriginal: number;
	timerState: number;
}

const scheduleStore = useSchedule();
const { timerState, timerString } = usePomodoroStore();

interface Props {
	timerWidget: TimerType;
}

const props = withDefaults(defineProps<Props>(), {
	timerWidget: "traditional",
});
const updateTimerString = ($event: string) => (timerString.value = $event);

const running = computed(() => timerState === TimerState.RUNNING);
</script>

<template>
  <div class="relative grid text-black transition-opacity duration-500 select-none place-items-center dark:text-gray-100" :class="[{ 'opacity-70': !running, 'opacity-100': running }]">
    <Transition name="timer-switch" mode="out-in">
      <CompleteMarker v-if="timerState === TimerState.COMPLETED" :key="'complete'" />
      <TimerTraditional v-else-if="props.timerWidget === TimerType.Traditional" :key="'traditional'" @tick='updateTimerString'/>
      <TimerApproximate v-else-if="props.timerWidget === TimerType.Approximate" :key="'approximate'" @tick='updateTimerString'/>
      <TimerPercentage v-else-if="props.timerWidget === TimerType.Percentage" :key="'percentage'" @tick='updateTimerString'/>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.timer-switch-enter-active,
.timer-switch-leave-active {
  transition: opacity 0.5s ease-out;
}

.timer-switch-enter,
.timer-switch-leave-to {
  opacity: 0 !important;
}
</style>
