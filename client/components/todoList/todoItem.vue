<script setup lang="ts">
import { nextTick, type Ref, type PropType, watch } from "vue";
import { MenuIcon, TrashIcon, PencilIcon } from "vue-tabler-icons";
import { ButtonImportance } from "../base/types/button";
import { TaskState, useTasklist, type Task } from "~~/stores/tasklist";
import { useTaskStore } from "~~/stores/todolist";
import type TaskStatus from "~~/stores/todolist";
import { useSettings, ColorMethod } from "~~/stores/settings";
import Button from "~~/components/base/uiButton.vue";
import ChangeTracker from "../../utils/changeTracker";

// declare refs
const editbox: Ref<HTMLInputElement | null> = ref(null);

const changeTracker = new ChangeTracker();
const tasksStore = useTasklist();
const settingsStore = useSettings();
const { patchTask, deleteTask } = useTaskStore();

const props = defineProps({
	item: {
		type: Object as PropType<Task>,
		required: true,
	},
	manage: {
		type: Boolean,
		default: false,
	},
	/** Whether a dragged item is over this one */
	droptarget: {
		type: Boolean,
		default: false,
	},
	moveable: {
		type: Boolean,
		default: false,
	},
});
changeTracker.track(props.item);

const state = reactive({
	hovering: false,
	dragged: false,
	editing: false,
	editedTitle: null as string | null,
});

const emit = defineEmits<{
	(event: "input", checked: boolean): void;
	(event: "delete"): void;
	(event: "dropstart", item: unknown): void;
	(event: "dropfinish", item: unknown): void;
	(event: "droptarget", item: unknown): void;
}>();

const handleEdit = (newValue: string) => {
	if (isValid.value && props.item.title !== displayedTitle.value)
		props.item.title = newValue;
	state.editedTitle = null;
};

const checked = computed({
	get() {
		return props.item.status === TaskStatus.DONE;
	},
	set(newValue) {
		if (newValue) props.item.status = TaskStatus.DONE;
		else props.item.status = TaskStatus.DOING;
	},
});
const showReorder = computed(
	() => state.editing || (props.moveable && state.hovering),
);
const displayedTitle = computed({
	get() {
		return state.editedTitle ?? props.item.title;
	},
	set(newValue: string) {
		state.editedTitle = newValue;
	},
});
const isValid = computed(
	() =>
		!tasksStore.tasks.some(
			(task) =>
				task.id !== props.item.id &&
				task.title === displayedTitle.value &&
				task.section === props.item.section,
		),
);

watch(
	() => state.editing,
	(newValue: boolean) => {
		if (newValue) {
			// only focus on <input> in the next tick (when it is rendered)
			nextTick(() => {
				(editbox.value as HTMLInputElement).focus();
			});
		}
	},
);

// methods
const startDrag = (evt: DragEvent, item: Task) => {
	if (evt.dataTransfer) {
		evt.dataTransfer.dropEffect = "move";
		evt.dataTransfer.effectAllowed = "move";
		evt.dataTransfer.setData("source.title", item.title);
		evt.dataTransfer.setData("source.section", item.section);
		state.dragged = true;
	}
};

// TODO: change to debounce watch
watch(
	() => props.item,
	(newValue) => {
		const change = changeTracker.getChange(newValue);
		patchTask(props.item.id, change);
		changeTracker.track(newValue);
	},
	{ deep: true, immediate: true },
);
</script>

<template>
  <div
    class="relative flex flex-row items-center px-2 py-3 transition-all duration-200 border-l-8 rounded-md hover:shadow-sm border-themed md:py-2"
    :class="[{ 'opacity-50 line-through italic': props.item.status === TaskStatus.DONE, 'cursor-move': showReorder, 'ring ring-themed': state.dragged || props.droptarget, 'bg-themed !text-white': props.manage && state.editing }, props.manage && state.editing ? 'bg-themed' : 'bg-surface-light dark:bg-surface-dark hover:shadow-md hover:ring-1 hover:ring-themed']"
    :style="{ '--theme': settingsStore.getColor(props.item.section, ColorMethod.modern) }"
    draggable="true"
    @mouseenter="state.hovering = true"
    @mouseleave="state.hovering = false"
    @dragstart="(event) => { startDrag(event, item), emit('dropstart', props.item) }"
    @dragover.prevent
    @dragend="(event) => { state.dragged = false, emit('dropfinish', props.item) }"
    @dragenter="emit('droptarget', props.item)"
  >
    <div :class="['absolute left-0 top-0 h-full self-stretch bg-themed transition-all duration-75 text-white flex flex-row items-center flex-shrink-0 cursor-move', showReorder ? 'w-6' : 'w-0']">
      <span v-show="showReorder">
        <PencilIcon v-if="props.manage && state.editing" size="16" />
        <MenuIcon v-else size="16" />
      </span>
    </div>
    <div class="flex flex-col flex-grow w-full min-w-0 py-2 -my-2 transition-all duration-75 select-none mr-7" :class="[showReorder ? 'translate-x-6' : 'translate-x-0']" @click="state.editing = true">
      <input
        v-if="props.manage && state.editing"
        ref="editbox"
        v-model="displayedTitle"
        class="py-2 pl-1 -my-2 -ml-1 text-white bg-transparent outline-none"
        @blur="state.editing = false, handleEdit(displayedTitle)"
        @keyup.enter.exact="state.editing = false, handleEdit(displayedTitle)"
      >
      <span v-else class="break-words">{{ props.item.title }}</span>
      <!-- <span class="text-sm">Description</span> -->
    </div>

    <span class="flex-grow" />

    <div class="flex flex-row items-center flex-shrink-0 gap-4 md:gap-3">
      <transition name="slidein">
        <Button
          v-show="manage"
          circle
          :importance="ButtonImportance.Text"
          class="-m-3 md:-m-2"
          inner-class="p-3 md:p-2"
          bg-class="ring-themed bg-themed"
          @click="deleteTask(props.item.id)"
        >
          <TrashIcon size="18" />
        </Button>
      </transition>
      <input v-model="checked" type="checkbox" class="w-6 h-6 mr-1 rounded accent-themed text-themed dark:text-themed md:w-5 md:h-5">
    </div>
  </div>
</template>

<style lang="scss">
.themed-border {
  border-color: var(--theme);
}

.themed-bg {
  background-color: var(--theme);
}

.themed-checkbox {
  color: var(--theme) !important;

  &:focus {
    --tw-ring-color: var(--theme);
  }

  .dark &:checked {
    background-color: var(--theme);
  }
}

.themed-ring {
  --tw-ring-color: var(--theme);
}

.slidein-enter,
.slidein-leave-to {
  @apply opacity-0 translate-x-1;
}
</style>
