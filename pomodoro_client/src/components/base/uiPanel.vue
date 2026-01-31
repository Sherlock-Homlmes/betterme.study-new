<script setup lang="ts">
import { computed } from "vue";
import { useMobileSettings } from "@/stores/platforms/mobileSettings";

interface Props {
	/** Whether to show the panel */
	show?: boolean;
	/** Maximum width of the panel */
	maxWidth?: string;
	/** Whether to use mobile padding */
	useMobilePadding?: boolean;
	/** Custom class for the panel container */
	panelClass?: string;
	/** Custom style for the panel container */
	panelStyle?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
	show: true,
	maxWidth: "md:max-w-screen-sm",
	useMobilePadding: true,
	panelClass: "",
	panelStyle: () => ({}),
});

const mobileSettingsStore = useMobileSettings();

const paddingStyle = computed(() => {
	if (!props.useMobilePadding) return {};
	return {
		"padding-top": `${mobileSettingsStore.padding.top}px`,
		"padding-bottom": `${mobileSettingsStore.padding.bottom}px`,
	};
});
</script>

<template>
	<section
		v-if="show"
		class="fixed z-40 w-full h-full p-0 md:p-4"
		:class="maxWidth"
	>
		<div
			class="flex flex-col h-full overflow-hidden rounded-none shadow-lg bg-surface-light text-surface-onlight md:rounded-xl md:dark:ring-1 dark:ring-surface-ondark dark:ring-opacity-20 ring-inset dark:bg-surface-dark dark:text-surface-ondark"
			:class="panelClass"
			:style="{ ...paddingStyle, ...panelStyle }"
		>
			<!-- Header slot -->
			<slot name="header">
				<!-- Default header if no slot provided -->
			</slot>

			<!-- Content slot -->
			<div class="flex-grow overflow-y-auto">
				<slot name="content">
					<!-- Default content if no slot provided -->
				</slot>
			</div>

			<!-- Footer slot -->
			<slot name="footer">
				<!-- Default footer if no slot provided -->
			</slot>
		</div>
	</section>
</template>

<style lang="scss" scoped>
/* Add any panel-specific styles here */
</style>
