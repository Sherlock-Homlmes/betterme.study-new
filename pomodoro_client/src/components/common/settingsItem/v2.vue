<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import {get, set} from 'lodash'
import { useSettings } from "@/stores/settings";
import OptionGroup from "@/components/base/optionGroup.vue";
import { Control } from "./type";
import { useAuthStore } from "@/stores/auth";

const controls: Record<Control, unknown> = {
	check: defineAsyncComponent(() => import("@/components/base/uiToggle.vue")),
	text: defineAsyncComponent(() => import("@/components/base/inputText.vue")),
	time: defineAsyncComponent(() => import("@/components/base/inputTime.vue")),
	number: defineAsyncComponent(
		() => import("@/components/base/inputNumber.vue"),
	),
	option: null,
	empty: null,
};
const settingsStore = useSettings();
const { userSettings, isDarkMode } = useAuthStore();

type NestedKeyOf<ObjectType extends object> = {
	[Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
		? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
		: `${Key}`;
}[keyof ObjectType & (string | number)];

interface Props {
	path: NestedKeyOf<typeof settingsStore.$state> | "manage";
	type: Control;
	disabled?: boolean;
	choices?: Record<string, unknown>;
	min?: number;
	max?: number;
}

const props = defineProps<Props>();

const translationKey = "settings.values." + props.path;

const emit = defineEmits<{ (event: "input", value: unknown): void }>();

const value = computed({
	get() {
		if (props.type === Control.Empty) return null;
		return get(userSettings.value, props.path, null);
	},

	set(newValue) {
		if (props.type === Control.Empty) return;
		set(userSettings.value, props.path, newValue);
	},
});

const isSideControls = computed(
	() => ![Control.Option, Control.Empty].includes(props.type),
);
</script>

<template>
<div class="flex flex-col justify-start gap-2" :class="{'pointer-events-none opacity-60': props.disabled }" :tabindex="disabled ? -1 : 0">
  <div class="flex flex-row items-center gap-4">
    <!-- Settings item title and description -->
    <div class="flex-grow select-none">
      <div v-text="$t(translationKey + '._title')" />
      <div class="text-sm opacity-80" v-text="$t(translationKey + '._description')" />
    </div>
    <!-- Settings item control (right side) -->
    <div v-if="isSideControls" class="shrink-0 w-36">
      <Component
        :is="controls[props.type]"
        :disabled="props.disabled"
        :min="props.min"
        :max="props.max"
        :choices="props.choices"
        class="ml-auto"
        :value="value"
        @input="(newValue: any) => value = newValue"
      />
    </div>
  </div>
  <!-- Settings item control (below) -->
  <div v-if="!isSideControls">
    <OptionGroup
      v-if="props.type === Control.Option"
      :choices="props.choices"
      :disabled="props.disabled"
      :value="value ?? ''"
      :translation-key="translationKey"
      @input="(newValue: any) => value = newValue"
    />
    <slot />
  </div>
</div>
</template>
