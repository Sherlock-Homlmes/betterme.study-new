<script setup lang="ts">
import { watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import { getCurrentWindow } from '@tauri-apps/api/window';
import { confirm } from '@tauri-apps/plugin-dialog';
import Alert from "@/components/base/uiAlert.vue";
import { TimerLayout } from "@/layouts";
import {useAuthStore} from "@/stores/auth";
import {usePomodoroStore, TimerState} from "@/stores/pomodoros";
import {usePlatformStore} from "@/stores/platforms";

const { isRunning } = usePomodoroStore();
const { isDarkMode } = useAuthStore();
const { isWeb, isDesktop } = usePlatformStore();

	// useHead({
	// 	link: [
	// 		{
	// 			rel: "manifest",
	// 			href: "/app_manifest.json",
	// 		},
	// 		{
	// 			rel: "apple-touch-icon",
	// 			href: "/icons/icon-apple-192.png",
	// 		},
	// 	],
	// });

	// onMounted(() => {
	// 	if (typeof window !== "undefined") {
	// 		if ("serviceWorker" in navigator) {
	// 			const registerSw = () => {
	// 				console.debug("Registering service worker at /serviceworker.js");
	// 				navigator.serviceWorker.register("/serviceworker.js");
	// 			};

	// 			if (document.readyState === "complete") {
	// 				registerSw();
	// 			} else {
	// 				window.addEventListener("load", registerSw);
	// 			}
	// 		}
	// 	}
	// });

// TODO: seperate this to other file to platforms folder
const useWebConfirmOnClose = () => {
	useEventListener(window, 'beforeunload', (event) => {
		if (!isRunning.value) return
		event.preventDefault()
		event.returnValue = ''
	})
}
const useDesktopConfirmOnClose = () => {
	getCurrentWindow().onCloseRequested(async (event) => {
		if (!isRunning.value) return
		const confirmed = await confirm('Are you sure?');
		if (!confirmed)
			event.preventDefault()
		return
	});
}
watch(isWeb, (newVal) => {
	if (newVal) useWebConfirmOnClose()
})
watch(isDesktop, (newVal) => {
	if (newVal) useDesktopConfirmOnClose()
})
</script>

<template lang='pug'>
TimerLayout
	RouterView
	Alert
</template>
