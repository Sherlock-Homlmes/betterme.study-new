<script setup lang="ts">
import { TimerState, usePomodoroStore } from "~~/stores/pomodoros";

const { timerState, timerString, getCurrentItem } = usePomodoroStore();
const running = computed(() => timerState.value === TimerState.RUNNING);

const emit = defineEmits<{ (event: "tick", timeString: string): void }>();

const timeLeftStructured = computed(
	() => {
		const sLeft = Math.abs(
			Math.round(
				getCurrentItem.value.length - getCurrentItem.value.timeElapsed,
			),
		);

		const hours = Math.floor(sLeft / (60 * 60));
		const minutes = Math.floor((sLeft % (60 * 60)) / 60);
		const seconds = Math.floor(sLeft % 60);

		const timeStructured = { hours, minutes, seconds };

		const displayKeys = (
			Object.keys(timeStructured) as Array<keyof typeof timeStructured>
		).filter((value) => value !== "hours" || hours > 0);
		const completed =
			getCurrentItem.value.timeElapsed > getCurrentItem.value.length &&
			[hours, minutes, seconds].some((num) => num > 0);

		// if (completed) {
		//   displayKeys.unshift('_plus')
		// }

		timerString.value =
			(completed ? "+" : "") +
			displayKeys
				.map((key) => timeStructured[key].toString().padStart(2, "0"))
				.join(":");

		const returnObject = {
			num: timeStructured,
			displayKeys,
			completed,
		};

		return returnObject;
	},
	{ cache: false },
);
</script>

<template>
  <div
    :class="['md:text-[14rem] text-[9rem] leading-none timer-display relative', { 'active': running }]"
  >
    <transition-group
      name="transition-traditional"
      enter-from-class="translate-y-4 opacity-0 md:translate-y-0 md:translate-x-4"
      enter-active-class="duration-500"
      enter-to-class=""
      leave-class=""
      leave-active-class="absolute duration-300"
      leave-to-class="opacity-0 md:-translate-x-8"
      move-class="duration-500"
      class="relative flex flex-col items-center transition md:flex-row isolate"
      tag="div"
    >
      <div v-if="timeLeftStructured.completed" class="font-bold text-[.75em]">
        +
      </div>
      <div
        v-for="key in timeLeftStructured.displayKeys"
        :key="key"
        class="flex flex-row transition"
        :class="{ 'font-bold': key === 'minutes', 'md:text-9xl md:self-start': key === 'seconds', 'md:mr-4': key === 'hours' }"
      >
        <span
          v-for="(char, idx) in timeLeftStructured.num[key].toString().padStart(2, '0')"
          :key="`${key}-${idx}`"
          class="w-[1ch]"
          :class="{ 'md:text-right text-center': idx === 0, 'md:text-left text-center': idx === 1 }"
        >{{char}}</span>
      </div>
    </transition-group>
  </div>
</template>
