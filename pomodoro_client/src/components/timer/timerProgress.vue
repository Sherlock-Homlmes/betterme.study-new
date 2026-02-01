<script setup lang="ts">
import {computed} from "vue";
import { usePomodoroStore } from "@/stores/pomodoros";

const { getScheduleColour } = usePomodoroStore();

const props = defineProps({
	timeElapsed: {
		type: Number,
		required: true,
	},
	timeOriginal: {
		type: Number,
		required: true,
	},
	scheduleEntryId: {
		type: Number,
		default: 1,
	},
	colour: {
		type: String,
		default: null,
	},
	background: {
		type: Boolean,
		default: false,
	},
});

const progressPercentage = computed(() => {
	return Math.min((props.timeElapsed / props.timeOriginal) * 100, 100);
});
const timerStyle = computed(() => (
	{
		'background-color': props.colour || getScheduleColour[props.scheduleEntryId],
		'transform': !props.background
			? `translateX(${-100 + progressPercentage.value}%)`
			: 'translateX(0%)'
	}
))
</script>

<template lang="pug">
.timer-progress(
	class="absolute top-0 left-0 block w-full h-full transition-all duration-500 transform-gpu"
	:class="[{ 'duration-1000': background }]"
	:style="timerStyle"
)
	//- Dark mode background override
	div(class="absolute invisible w-full h-full bg-gray-600 dark:visible mix-blend-multiply")
</template>

<style scoped>
.timer-progress {
  transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1);
}
</style>
