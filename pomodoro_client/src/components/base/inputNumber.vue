<script setup lang="ts">
import { reactive, watch } from "vue";
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
	prefix: {
		type: String,
		default: "",
	},
	postfix: {
		type: String,
		default: "",
	},
	valueClass: {
		type: String,
		default: "",
	},
});

const state = reactive({
	value: JSON.parse(JSON.stringify(props.value)) as number,
});

watch(
	() => state.value,
	(newValue) => {
		if (
			newValue !== null &&
			newValue !== undefined &&
			!isNaN(newValue) &&
			isFinite(newValue) &&
			newValue <= props.max &&
			newValue >= props.min
		) {
			emit("input", newValue);
		}
	},
);

watch(
	() => props.value,
	(newValue) => {
		state.value = newValue;
	},
);

const emit = defineEmits<{ (event: "input", value: number): void }>();

const updateInput = (newValue: string) => {
	const newValueNumber = Number.parseInt(newValue);

	if (!isNaN(newValueNumber)) {
		state.value = newValueNumber;
	}
};
</script>

<template lang="pug">
div(class="flex flex-row items-center gap-2")
  input(
    class="input-number-range relative h-3 min-w-0 bg-transparent appearance-none group isolate w-full"
    :value="state.value"
    :min="props.min"
    :max="props.max"
    type="range"
    @input="(e) => updateInput((e.target as HTMLInputElement).value)"
  )
  span(class="min-w-[2ch] text-center" :class="props.valueClass" v-text="`${props.prefix}${state.value}${props.postfix}`")
</template>


