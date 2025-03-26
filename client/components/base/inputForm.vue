<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
	name: {
		type: String,
		required: true,
	},
	required: {
		type: Boolean,
		default: false,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
});

const model = defineModel();
const validated = computed(() => {
	if (props.required && !model.value?.length) return false;
	return true;
});
</script>

<template>
  <div>
      <div class='flex items-center'>
          <!-- TODO: fix this -->
          <label class='max-w-8'>{{name}}: </label>
          <input
              v-model="model"
              type="text"
              :disabled='disabled'
              class="outline outline-1 outline-surface-outline dark:outline-surface-darkoutline w-full justify-self-end ml-2 py-2 pl-2 rounded-lg focus:ring-0 focus:bg-primary-container focus:text-primary-oncontainer dark:focus:bg-primary-darkcontainer dark:focus:text-primary-darkoncontainer focus:outline-none"
              :class="{
                  'bg-gray-300 dark:bg-gray-700 text-gray-500': disabled,
                  'bg-error-dark text-error-onlight dark:text-error-ondark': !validated,
              }"
          >
      </div>
      <p v-if='!validated' class="mt-2 text-xs text-red-600 dark:text-red-500">The {{name}} field is required</p>
  </div>
</template>
