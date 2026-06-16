import { reactive } from "vue";
import { createGlobalState } from "@vueuse/core";

/**
 * Mobile safe-area padding reported by the native shell. Accessed by dot
 * (`mobileSettingsStore.padding.top`), so the state is a reactive object.
 */
export const useMobileSettings = createGlobalState(() =>
	reactive({
		padding: {
			top: 0,
			bottom: 0,
		},
	}),
);
