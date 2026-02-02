<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { CornerDownLeftIcon } from "vue-tabler-icons";
import { type Ref } from "vue";
import { ButtonImportance } from "../base/types/button";
import Button from "@/components/base/uiButton.vue";
import { useTaskStore } from "@/stores/tasks";
import {cloneDeep} from "lodash";

const addtaskInput: Ref<HTMLElement | null> = ref(null);
const { postTask } = useTaskStore();

const data = reactive({
	taskTitle: "",
	valid: false,
	debug_lastinput: "",
});

watch(
	() => data.taskTitle,
	(newValue) => {
		const newValueString = newValue.trim()
		data.valid = newValueString.length >= 1
	},
);

const addTask = async () => {
	const title = cloneDeep(data.taskTitle);
	data.taskTitle = "";
	await postTask(title);
	const addtaskInputCast = addtaskInput.value as HTMLElement;

	addtaskInputCast.focus();
};

// Add new task when enter is pressed
const checkEnter = (event: KeyboardEvent) => {
	if (
		data.valid &&
		(event.code.toLowerCase() === "enter" || event.keyCode === 13)
	) {
		addTask();
	}
};
//  :style="{ '--theme': currentScheduleColourModern }"
</script>

<template lang='pug'>
	div(class="flex flex-row items-center py-4 pl-4 pr-2 space-x-2 transition-all duration-500 shadow-sm bg-surface-light rounded-xl dark:bg-surface-dark focus-within:shadow-lg focus-within:ring-1 focus-within:ring-opacity-50 dark:focus-within:ring-opacity-50 focus-within:ring-primary dark:focus-within:ring-primary-dark focus-within:duration-200")
		input(
			ref="addtaskInput"
			:value="data.taskTitle"
			type="text"
			required
			class="flex-grow block min-w-0 p-0 bg-transparent border-none dark:bg-transparent focus:ring-transparent focus:ring-offset-0 dark:focus:bg-transparent outline-none peer"
			:placeholder="$t('tasks.addPlaceholder')"
			@input="e => data.taskTitle = e.target?.value"
			@keyup="checkEnter"
		)
		Button(
			:importance="ButtonImportance.Text"
			circle
			class="-my-2"
			:disabled="!data.valid"
			@click="addTask"
		)
			CornerDownLeftIcon(:stroke-width="2" class="relative" size="24")
</template>
