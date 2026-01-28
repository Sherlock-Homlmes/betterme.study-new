<script setup lang="ts">
import { computed, onMounted } from "vue";
import Alert from "@/components/base/uiAlert.vue";
import { TimerLayout } from "@/layouts";
import {useAuthStore} from "@/stores/auth";

const { isDarkMode } = useAuthStore();

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
</script>

<template lang='pug'>
TimerLayout
	RouterView
	Alert
</template>
