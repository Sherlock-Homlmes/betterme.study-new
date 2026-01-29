import {computed } from "vue";
import { createGlobalState } from "@vueuse/core";
import { runtimeConfig } from "@/config/runtimeConfig";

export const usePlatformStore = createGlobalState(() => {
    const isWeb = computed(() => runtimeConfig.public.PLATFORM === "web");
    const isMobile = computed(() => runtimeConfig.public.PLATFORM === "mobile");
    const isExtension = computed(() => runtimeConfig.public.PLATFORM === "extension");
    const isDesktop = computed(() => runtimeConfig.public.PLATFORM === "desktop");
	return {
        isWeb,
        isMobile,
        isExtension,
        isDesktop
	};
});
