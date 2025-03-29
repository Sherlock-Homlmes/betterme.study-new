import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

export const useErrorStore = createGlobalState(() => {
	const content = ref("");
	const visible = ref(false);

	const showError = (message: string, showTime: number = 10000) => {
		content.value = message;
		visible.value = true;
		if (showTime) setTimeout(close, showTime);
	};

	const close = () => {
		visible.value = false;
		content.value = "";
	};
	return {
		content,
		visible,
		showError,
		close,
	};
});
