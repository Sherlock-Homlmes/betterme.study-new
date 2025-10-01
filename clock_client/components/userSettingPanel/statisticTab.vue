<script setup lang="ts">
import {
	NewsIcon,
	BrandDiscordIcon,
	BrandTwitterIcon,
	BrandFacebookIcon,
	BrandRedditIcon,
} from "vue-tabler-icons";
import _ from "lodash";

import { useMain } from "~~/stores/main";
import { useAuthStore } from "~~/stores/auth";
import { Control } from "~~/components/settings/types/settingsItem";
import { fetchWithAuth } from "~~/utils/betterFetch";

import ButtonControl from "~~/components/base/uiButton.vue";
import { ButtonImportance } from "../base/types/button";
import { AppPlatform } from "~~/platforms/platforms";

import SettingsItemV2 from "~~/components/settings/settingsItemV2.vue";
import DateRangePicker from "@/components/ui/date-picker/DateRangePicker.vue";

const { userInfo, getCurrentUser } = useAuthStore();
const runtimeConfig = useRuntimeConfig();
const API_URL = runtimeConfig.public.API_URL;
const isMobile = computed(
	() => runtimeConfig.public.PLATFORM === AppPlatform.mobile,
);
const mainStore = useMain();

const loading = ref(false);
const updateAbleUserInfo = ["avatar_url", "name"];
const updateUserInfo = async () => {
	// userInfo.value
	loading.value = true;
	const payload = _.pick(userInfo.value, updateAbleUserInfo);
	try {
		const response = await fetchWithAuth(`${API_URL}/users/self/info`, {
			method: "PATCH",
			body: JSON.stringify(payload),
		});
		if (!response?.ok) throw new Error(`Fail to update user information`);
		const data = await response.json();
		localStorage.removeItem("Authorization");
		localStorage.setItem("Authorization", data.token);
		await getCurrentUser();
	} finally {
		loading.value = false;
	}
};
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="inline-block text-2xl font-bold">Coming soon...</div>
	<DateRangePicker />
  </div>
</template>
