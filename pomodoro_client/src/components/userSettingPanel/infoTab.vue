<script setup lang="ts">
import { computed, ref } from "vue";
import {
	NewsIcon,
	BrandDiscordIcon,
	BrandTwitterIcon,
	BrandFacebookIcon,
	BrandRedditIcon,
} from "vue-tabler-icons";
import _ from "lodash";

import { useMain } from "@/stores/main";
import { useAuthStore } from "@/stores/auth";
import { Control } from "@/components/settings/types/settingsItem";
import { fetchWithAuth } from "@/utils/betterFetch";
import { runtimeConfig } from "@/config/runtimeConfig";

import ButtonControl from "@/components/base/uiButton.vue";
import InputForm from "@/components/base/inputForm.vue";
import { ButtonImportance } from "../base/types/button";
import { AppPlatform } from "@/platforms/platforms";

import SettingsItemV2 from "@/components/settings/settingsItemV2.vue";

const { userInfo, getCurrentUser } = useAuthStore();
const API_URL = runtimeConfig.public.API_URL;
const isMobile = computed(
	() => runtimeConfig.public.PLATFORM === AppPlatform.mobile,
);
const mainStore = useMain();

const loading = ref(false);
const updateAbleUserInfo = ["avatar_url", "custom_name"];
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
    <img
      :src="userInfo.avatar_url"
      width="128"
      height="128"
      class="inline-block mb-1 rounded-lg"
    />

    <div class="grid gap-6 my-6">
      <InputForm
        v-model="userInfo.custom_name"
        :name="$t('user_settings.tabs.info.inputs.name')"
        required
      ></InputForm>
      <InputForm
        v-model="userInfo.email"
        :name="$t('user_settings.tabs.info.inputs.email')"
        required
        disabled
      ></InputForm>
      <ButtonControl
        default-style
        :loading="loading"
        :importance="ButtonImportance.Filled"
        @click="updateUserInfo"
        class="max-w-min justify-self-center"
      >
        <span v-text="$t('user_settings.tabs.info.buttons.save')" />
      </ButtonControl>
    </div>
  </div>
</template>
