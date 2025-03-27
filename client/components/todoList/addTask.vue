<script setup lang="ts">
import { CornerDownLeftIcon } from "vue-tabler-icons";
import { type Ref } from "vue";
import { ButtonImportance } from "../base/types/button";
import Button from "~~/components/base/uiButton.vue";
import { TaskState, useTasklist } from "~~/stores/tasklist";
import { usePomodoroStore } from "~~/stores/pomodoros";
import { useTaskStore } from "~~/stores/todolist";
import _ from "lodash";

const tasksStore = useTasklist();
const { getCurrentItem, currentScheduleColourModern } = usePomodoroStore();
const addtaskInput: Ref<HTMLElement | null> = ref(null);
const { postTask } = useTaskStore();

const data = reactive({
	taskTitle: "",
	taskState: TaskState.inProgress,
	valid: false,
	debug_lastinput: "",
});

watch(
	() => data.taskTitle,
	(newValue) => {
		if (newValue.length < 1) {
			data.valid = false;
			return;
		}

		const matchingTasks = tasksStore.tasks.filter(
			(task) =>
				task.title === newValue && task.section === getCurrentItem.value.type,
		);

		data.valid = matchingTasks.length === 0;
	},
);

const addTask = async () => {
	const title = _.cloneDeep(data.taskTitle);
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
</script>

<template>
  <div class="flex flex-row items-center py-4 pl-4 pr-2 space-x-2 transition-all duration-500 shadow-sm bg-surface-light rounded-xl dark:bg-surface-dark focus-within:shadow-lg focus-within:ring-1 focus-within:ring-opacity-50 dark:focus-within:ring-opacity-50 focus-within:ring-primary dark:focus-within:ring-primary-dark focus-within:duration-200" :style="{ '--theme': currentScheduleColourModern }">
    <input
      ref="addtaskInput"
      :value="data.taskTitle"
      type="text"
      required
      class="flex-grow block min-w-0 p-0 bg-transparent border-none dark:bg-transparent focus:ring-transparent focus:ring-offset-0 dark:focus:bg-transparent peer"
      :placeholder="$t('tasks.addPlaceholder')"
      @input="e => data.taskTitle = (e.target as HTMLInputElement)?.value"
      @keyup="checkEnter"
    >
    <Button
      :importance="ButtonImportance.Text"
      circle
      class="-my-2"
      :disabled="!data.valid"
      @click="addTask"
    >
      <CornerDownLeftIcon :stroke-width="2" class="relative" size="24" />
    </Button>
  </div>
</template>
