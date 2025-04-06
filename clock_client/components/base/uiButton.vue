<script setup lang="ts">
import { type PropType } from "vue";
import { ButtonImportance, ButtonTheme, MotionTheme } from "./types/button";

const props = defineProps({
	disabled: {
		default: false,
		type: Boolean,
	},

	loading: {
		default: false,
		type: Boolean,
	},

	/** Classes to be applied to the background of the button */
	bgClass: {
		default: "",
		type: String,
	},

	/** Classes to apply to the inner element (contents) */
	innerClass: {
		default: "",
		type: String,
	},

	/** If true, the component is rendered as an anchor (`<a>`) instead of a `<button>` */
	link: {
		default: false,
		type: Boolean,
	},

	/// The button's colour theme
	theme: {
		type: String as PropType<ButtonTheme>,
		default: "primary",
	},

	/// Defines whether the button should have a scaling animation when pressed
	motion: {
		type: String as PropType<MotionTheme>,
		default: "all",
	},

	/// Remove the default padding on the contents of the button
	noPadding: {
		type: Boolean,
		default: false,
	},

	/// Disable colour theming the contents of the button
	noContentTheme: {
		type: Boolean,
		default: false,
	},

	/** Apply default colour scheme to the button */
	noDefaultStyle: {
		default: false,
		type: Boolean,
	},

	/** Indicates that the button is dark. Classes will be adjusted to it. */
	dark: {
		default: false,
		type: Boolean,
	},

	/** Make padding equal on all sides for circular buttons */
	circle: {
		default: false,
		type: Boolean,
	},

	/** Defines how important a button appears to be. */
	importance: {
		type: String as PropType<ButtonImportance>,
		default: ButtonImportance.Filled,
	},
});
</script>

<template>
  <!--
    Element styling setup:
    - ::before - darkening/lightening on the backdrop (used for hover and active states, effect strength is driven by the opacity of the ::before pseudo-element)
    - bg       - coloured background of the button
  -->

  <Component
    :is="link ? 'a' : 'button'"
    class="group"
    :class="[
      { 'opacity-40 pointer-events-none': props.disabled },
      { 'text-center': props.link },
      { 'aspect-square': props.circle }
    ]"
    :aria-disabled="props.disabled"
    :disabled="props.disabled || props.loading"
    :type="props.link ? undefined : 'button'"
  >
    <!-- Backdrop -->
    <div class="relative w-full h-full isolate">
      <div
        class="absolute w-full h-full overflow-hidden transition duration-300 rounded-full -z-10 before:transition before:absolute before:opacity-0 before:w-full before:h-full before:left-0 before:top-0"
        :class="[
          { 'bg-primary border-primary ring-primary dark:bg-primary-dark dark:border-primary-dark dark:ring-primary-dark': !props.noDefaultStyle && props.theme === ButtonTheme.Primary && props.importance === ButtonImportance.Filled },
          { 'bg-primary-container border-primary-container ring-primary-container dark:bg-primary-darkcontainer dark:border-primary-darkcontainer dark:ring-primary-darkcontainer': !props.noDefaultStyle && props.theme === ButtonTheme.Primary && props.importance === ButtonImportance.Tonal },
          { 'ring-primary dark:ring-primary-dark': !props.noDefaultStyle && props.theme === ButtonTheme.Primary && props.importance === ButtonImportance.Text },
          { 'bg-secondary border-secondary ring-secondary dark:bg-secondary-dark dark:border-secondary-dark dark:ring-secondary-dark': !props.noDefaultStyle && props.theme === ButtonTheme.Secondary && props.importance === ButtonImportance.Filled },
          { 'bg-secondary-container border-secondary-container ring-secondary-container shadow-secondary dark:bg-secondary-darkcontainer dark:border-secondary-darkcontainer dark:ring-secondary-darkcontainer': !props.noDefaultStyle && props.theme === ButtonTheme.Secondary && props.importance === ButtonImportance.Tonal },
          { 'ring-secondary dark:ring-secondary-dark': !props.noDefaultStyle && props.theme === ButtonTheme.Secondary && props.importance === ButtonImportance.Text },
          { 'border-surface-outline dark:border-surface-darkoutline ring-surface-outline dark:ring-surface-outline': !props.noDefaultStyle && props.importance === ButtonImportance.Outline },
          { 'bg-surface-light border-surface-light ring-surface-light dark:bg-surface-dark dark:border-surface-dark dark:ring-surface-dark': !props.noDefaultStyle && props.theme === ButtonTheme.Neutral },
          { 'bg-surface-light border-surface-light ring-surface-light': !props.noDefaultStyle && props.theme === ButtonTheme.NeutralWhite },
          { 'bg-surface-dark border-surface-dark ring-surface-dark': !props.noDefaultStyle && props.theme === ButtonTheme.NeutralDark },
          { 'group-active:scale-x-110': props.motion === MotionTheme.Horizontal || props.motion === MotionTheme.All },
          { 'group-active:scale-y-110': props.motion === MotionTheme.All },
          { 'before:bg-surface-dark dark:before:bg-surface-light': !props.dark, 'before:bg-surface-light': props.dark },
          { 'bg-opacity-100 group-hover:shadow-sm group-hover:before:opacity-10 group-active:before:opacity-25 group-active:shadow-lg ring-0 border-0': [ButtonImportance.Filled, ButtonImportance.Tonal].includes(props.importance) },
          { 'bg-opacity-0 dark:bg-opacity-0 group-hover:bg-opacity-100 group-active:bg-opacity-100 group-focus:ring': [ButtonImportance.Outline, ButtonImportance.Text].includes(props.importance) },
          { 'border-2': props.importance === ButtonImportance.Outline },
          props.bgClass
        ]"
      />

      <!-- Contents -->
      <div
        class="grid items-center justify-center w-full h-full grid-flow-col"
        :class="[
          { 'p-3': !props.noPadding },
          { 'px-4': !props.circle && !props.noPadding },
          { 'text-white dark:text-primary-darkon': !props.noContentTheme && props.theme === ButtonTheme.Primary && props.importance === ButtonImportance.Filled },
          { 'text-primary-oncontainer dark:text-primary-darkoncontainer': !props.noContentTheme && props.theme === ButtonTheme.Primary && props.importance === ButtonImportance.Outline },
          { 'text-primary dark:text-primary-dark ring-primary dark:ring-primary-dark': !props.noContentTheme && props.theme === ButtonTheme.Primary && [ButtonImportance.Outline, ButtonImportance.Text].includes(props.importance) },
          { 'text-white dark:text-secondary-darkon': !props.noContentTheme && props.theme === ButtonTheme.Secondary && props.importance === ButtonImportance.Filled },
          { 'text-secondary-oncontainer dark:text-secondary-darkoncontainer': !props.noContentTheme && props.theme === ButtonTheme.Secondary && props.importance === ButtonImportance.Outline },
          { 'text-secondary dark:text-secondary-dark': !props.noContentTheme && props.theme === ButtonTheme.Secondary && [ButtonImportance.Outline, ButtonImportance.Text].includes(props.importance) },
          { 'text-surface-onlight': !props.noContentTheme && (props.theme === ButtonTheme.NeutralWhite || props.theme === ButtonTheme.Neutral) },
          { 'dark:text-surface-ondark': !props.noContentTheme && props.theme === ButtonTheme.Neutral },
          { 'text-surface-ondark': !props.noContentTheme && props.theme === ButtonTheme.NeutralDark },
          props.innerClass,
        ]"
      >
        <svg v-if='loading' aria-hidden="true" role="status" class="inline w-4 h-4 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
        </svg>
        <slot v-else />
      </div>
    </div>
  </Component>
</template>
