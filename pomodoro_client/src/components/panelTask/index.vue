<script setup lang="ts">
import { reactive, onBeforeMount } from "vue";
import { XIcon } from "vue-tabler-icons";

import { ButtonImportance, ButtonTheme } from "../base/types/button";
import ControlButton from "@/components/base/uiButton.vue";
import TaskItem from "./todoItem.vue";
import TaskAdd from "./addTask.vue";
import { useSettings } from "@/stores/settings";
import { type Task, useTasklist } from "@/stores/tasklist";
import { useOpenPanels } from "@/stores/openpanels";
import { usePomodoroStore } from "@/stores/pomodoros";
import { useTaskStore } from "@/stores/todolist";

const openPanels = useOpenPanels();
const settingsStore = useSettings();
const tasklistStore = useTasklist();
const { tasks, getTaskList, moveTask } = useTaskStore();

onBeforeMount(async () => {
	await getTaskList();
});

const state = reactive({
	manageMode: true,

	/** Is a task being dragged to another place? */
	dragging: false,
	/** The task that is being moved */
	draggedItem: null as Task | null,
	/** The task that the moved item will be dropped onto */
	dropTarget: null as Task | null,
});

const updateDropTarget = (item: Task) => {
	state.dropTarget = item;
};

const handleDrop = () => {
	// move `draggedItem` around `dropTarget`
	const newIndex = tasks.value.indexOf(state.dropTarget as Task);
	moveTask(state.draggedItem, newIndex);

	// reset drag-and-drop variables
	state.draggedItem = null;
	state.dragging = false;
	state.dropTarget = null;
};
</script>

<template>
  <div class="px-4 py-4 shadow-lg border-surface-dark dark:border-surface-light bg-surface-variant text-surface-onvariant dark:bg-surface-darkvariant dark:text-surface-ondarkvariant border-opacity-20 dark:border-opacity-20 md:border md:py-3" @keyup.stop="">
    <div class="relative flex flex-row items-center justify-center h-10">
      <p class="text-xl font-bold tracking-tighter text-gray-800 uppercase dark:text-gray-100" v-text="$t('tasks.title')" />
      <div class="absolute right-0 float-right -mr-2">
        <ControlButton circle default-style :theme="ButtonTheme.Primary" :importance="ButtonImportance.Text" @click="openPanels.todo = false">
          <XIcon />
        </ControlButton>
      </div>
    </div>
    <div v-show="tasks.length < 1" key="notask" class="mt-3 italic text-black dark:text-gray-200 text-opacity-70" v-text="$t('tasks.empty')" />
    <transition-group
      tag="div"
      name="transition-item"
      class="flex flex-col px-2 py-1 mt-2 -mx-2 space-y-2 overflow-x-hidden overflow-y-auto max-h-64"
    >
      <TaskItem
        v-for="task in tasks"
        :key="task.id"
        :manage="state.manageMode"
        :item="task"
        :droptarget="task === state.dropTarget"
        moveable
        @dropstart="state.draggedItem = task, state.dragging = true"
        @dropfinish="handleDrop"
        @droptarget="updateDropTarget"
      />
    </transition-group>
    <TaskAdd class="mt-3" />
  </div>
</template>

<style lang="scss">
.transition-item-enter {
  opacity: 0;
  transform: translateY(0.5rem);
}

.transition-item-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.transition-item-move {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 75ms;
}
</style>
