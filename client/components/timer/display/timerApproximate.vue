<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { TimerState, usePomodoroStore } from "~~/stores/pomodoros";

const { t } = useI18n();
const { timerState, getCurrentItem } = usePomodoroStore();
const running = computed(() => timerState.value === TimerState.RUNNING);

const emit = defineEmits<{ (event: "tick", timeString: string): void }>();

const time = computed(
	() => {
		const remainingMinutes =
			(getCurrentItem.value.length - getCurrentItem.value.timeElapsed) / 60;

		const timeObject = {
			value: 0,
			string: "",
		};
		if (Math.abs(remainingMinutes) > 59) {
			timeObject.value =
				remainingMinutes >= 0
					? Math.round(remainingMinutes / 60)
					: Math.ceil(remainingMinutes / 60);
			timeObject.string = t("timer.approximate.hours", timeObject.value);
		} else {
			timeObject.value =
				remainingMinutes > 0
					? Math.ceil(remainingMinutes)
					: Math.min(-1, Math.floor(remainingMinutes));
			timeObject.string = t("timer.approximate.minutes", timeObject.value);
		}

		emit(
			"tick",
			`${timeObject.value < 0 ? "+" : ""}${Math.abs(timeObject.value)} ${timeObject.string}`,
		);
		return timeObject;
	},
	{ cache: false },
);
</script>

<template>
  <div :class="['timer-display select-none flex flex-col md:flex-row gap-2 items-center leading-none text-9xl xl:text-[12rem]', { 'active': running }]">
    <div class="flex flex-row">
      <transition name="transition-approximate-up">
        <div v-show="time.value < 0" class="-mr-2 font-bold">
          +
        </div>
      </transition>
      <transition name="transition-approximate-up" mode="out-in">
        <div :key="time.value" :style="{ '--ch': Math.max(1, Math.ceil(Math.log10(Math.abs(time.value) + 1))) }" class="font-bold text-center md:text-right time-value">
          {{ Math.abs(time.value) }}
        </div>
      </transition>
    </div>
    <transition name="transition-approximate-up" mode="out-in">
      <div :key="time.string" class="text-[.5em]">
        {{ time.string }}
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
div.time-value {
  width: calc(var(--ch) * 1ch);
}

.transition-approximate-up-enter-active,
.transition-approximate-up-leave-active {
  transition: 300ms ease-out;
  transition-property: opacity, transform;
}

.transition-approximate-up-enter {
  opacity: 0 !important;
  transform: translateY(30px) !important;
}

.transition-approximate-up-leave-to {
  opacity: 0 !important;
  transform: translateY(-30px) !important;
}
</style>
