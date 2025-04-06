<script setup lang="ts">
// TODO: fix min value
const props = defineProps({
	value: {
		type: Number,
		required: true,
	},
	min: {
		type: Number,
		default: -Infinity,
	},
	max: {
		type: Number,
		default: Infinity,
	},
});

const timeToObject = (timeInSecond: number) => {
	return {
		min: Math.floor(timeInSecond / 60),
		sec: timeInSecond % 60,
	};
};

const innerValue = reactive(timeToObject(props.value));

const innerValueSeconds = computed(() => innerValue.min * 60 + innerValue.sec);
const valid = computed(
	() =>
		innerValueSeconds.value <= props.max &&
		innerValueSeconds.value >= props.min,
);

const emit = defineEmits({
	input(value: number) {
		return value >= 5;
	},
});

// Emit 'input' if innerValue changes
watch(innerValue, (newValue) => {
	if (
		newValue.min >= 0 &&
		newValue.sec >= 0 &&
		!(newValue.min === 0 && newValue.sec === 0)
	) {
		emit("input", innerValueSeconds.value);
	}
});

// Update innerValue if the "value" prop changes
watch(
	() => props.value,
	(newValue) => {
		const newTime = timeToObject(newValue);
		innerValue.min = newTime.min;
		innerValue.sec = newTime.sec;
	},
);

const updateMin = (newValue: string) => {
	const newValueNum = Number.parseInt(newValue);

	if (!isNaN(newValueNum) && newValueNum >= 0) {
		innerValue.min = newValueNum;
	}
};

const updateSec = (newValue: string) => {
	const newValueNum = Number.parseInt(newValue);

	if (!isNaN(newValueNum) && newValueNum >= 0 && newValueNum <= 59) {
		innerValue.sec = newValueNum;
	}
};
</script>

<template>
<!-- TODO: fix bg-error value -->
  <div class="flex flex-row items-center gap-2 relative rounded-lg overflow-hidden outline outline-1 outline-surface-outline dark:outline-surface-darkoutline focus-within:ring focus-within:ring-primary dark:focus-within:ring-primary-dark transition"
      :class="{ 'bg-error-dark dark:bg-error-light outline outline-1 ring ring-primary': !valid, 'bg-transparent': valid }"
  >
    <input
      :value="innerValue.min"
      type="text"
      pattern="[0-9]*"
      inputmode="numeric"
      class="w-full py-2 pl-2 focus:ring-0 focus:bg-primary-container focus:text-primary-oncontainer dark:focus:bg-primary-darkcontainer dark:focus:text-primary-darkoncontainer focus:outline-none"
      :class="{ 'bg-error-dark dark:bg-error-light': !valid, 'bg-transparent': valid }"
      @input="(e) => updateMin((e.target as HTMLInputElement).value)"
    >
    <span>:</span>
    <input
      :value="innerValue.sec"
      type="text"
      pattern="[0-9]*"
      inputmode="numeric"
      class="w-full py-2 pl-2 focus:ring-0 focus:bg-primary-container focus:text-primary-oncontainer dark:focus:bg-primary-darkcontainer dark:focus:text-primary-darkoncontainer focus:outline-none"
      :class="{ 'bg-error-dark dark:bg-error-light': !valid, 'bg-transparent': valid }"
      @input="(e) => updateSec((e.target as HTMLInputElement).value)"
    >
  </div>
</template>
