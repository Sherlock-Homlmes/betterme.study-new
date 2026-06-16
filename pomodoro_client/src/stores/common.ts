import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

export const useErrorStore = createGlobalState(() => {
	const content = ref("");
	const visible = ref(false);
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	const close = () => {
		visible.value = false;
		content.value = "";
		if (closeTimer) {
			clearTimeout(closeTimer);
			closeTimer = undefined;
		}
	};

	const showError = (message: string, showTime: number = 10000) => {
		content.value = message;
		visible.value = true;
		if (closeTimer) clearTimeout(closeTimer);
		if (showTime) closeTimer = setTimeout(close, showTime);
	};

	return { content, visible, showError, close };
});
