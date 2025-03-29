<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "~~/stores/auth";
import Alert from "@/components/base/uiAlert.vue";

const { isDarkMode } = useAuthStore()!;

if (!process.server) {
	useHead({
		link: [
			{
				rel: "manifest",
				href: "/app_manifest.json",
			},
			{
				rel: "apple-touch-icon",
				href: "/icons/icon-apple-192.png",
			},
		],
		meta: [{ name: "theme-color", content: "#F87171" }],
		bodyAttrs: {
			class: {
				dark: () => isDarkMode.value,
			},
		},
	});

	onMounted(() => {
		if (typeof window !== "undefined") {
			if ("serviceWorker" in navigator) {
				const registerSw = () => {
					console.debug("Registering service worker at /serviceworker.js");
					navigator.serviceWorker.register("/serviceworker.js");
				};

				if (document.readyState === "complete") {
					registerSw();
				} else {
					window.addEventListener("load", registerSw);
				}
			}
		}
	});
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
	<Alert />
  </NuxtLayout>
</template>
