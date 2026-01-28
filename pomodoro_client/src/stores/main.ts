import { defineStore } from "pinia";
import { runtimeConfig } from "@/config/runtimeConfig";

export const flags = {
	STORE_RESTORED: "store_restored",
};

export const useMain = defineStore("main", {
	state: () => ({
		version: runtimeConfig.public.PACKAGE_VERSION,
		flags: [] as string[],
		restoredStores: [] as string[],
	}),

	getters: {
		isFlagActive: (state) => (flag: string) => state.flags.includes(flag),
	},

	actions: {
		registerFlag(flag: string) {
			if (!this.flags.includes(flag)) {
				this.flags.push(flag);
			}
		},
	},
});
