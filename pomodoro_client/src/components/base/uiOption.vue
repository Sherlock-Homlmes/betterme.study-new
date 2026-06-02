<script setup lang="ts">
const props = defineProps({
	active: {
		type: Boolean,
		default: false,
	},
	title: {
		type: String,
		default: "",
	},
	description: {
		type: String,
		default: "",
	},
});

const emit = defineEmits<{ (type: "click"): void }>();
</script>

<template lang="pug">
button(
  class="flex flex-col justify-start px-3 py-4 text-left transition-colors border border-solid rounded-xl basis-0"
  :class="[active ? 'bg-primary dark:bg-primary-dark border-transparent dark:border-transparent ring ring-primary dark:ring-primary-dark ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark text-white dark:text-primary-darkon' : 'hover:bg-primary-container dark:hover:bg-primary-darkcontainer bg-surface-variant text-surface-onvariant dark:text-surface-ondarkvariant dark:bg-surface-darkvariant dark:border-surface-ondark border-surface-onlight border-opacity-30']"
  @click="emit('click')"
)
  slot(name="pre")
  div(class="text-lg" :class="[{'font-bold uppercase': props.description.length > 0 }]")
    slot(name="title")
      | {{ props.title }}
  div(v-show="props.description.length > 0" class="text-sm text-opacity-75")
    slot(name="description")
      | {{ props.description }}
  slot(name="post")
</template>
