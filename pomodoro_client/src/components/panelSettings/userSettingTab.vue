<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { runtimeConfig } from "@/config/runtimeConfig";
import { ButtonImportance } from "@/components/base/types/button";
import ButtonControl from "@/components/base/uiButton.vue";
import InputForm from "@/components/base/inputForm.vue";
import LoginTab from "@/components/common/loginTab.vue";
import { api, TokenManager } from "@/utils/betterFetch";
import _ from "lodash";

const { isAuth, userInfo, getCurrentUser } = useAuthStore();
const API_URL = runtimeConfig.public.API_URL;
const loading = ref(false);
const updateAbleUserInfo = ["avatar_url", "custom_name"];
const updateUserInfo = async () => {
	loading.value = true;
	const payload = _.pick(userInfo.value, updateAbleUserInfo);
	try {
		const response = await api.patch(`${API_URL}/users/self/info`, payload);
		if (!response?.ok) throw new Error(`Fail to update user information`);
		const data = await response.json();
		
		// Update token using TokenManager
		TokenManager.setToken(data.token);
		
		await getCurrentUser();
	} finally {
		loading.value = false;
	}
};
</script>

<template lang="pug">
div.flex.flex-col.h-full
	div(v-if="!isAuth").grid.grid-cols-1.gap-2.py-3.px-4.h-full
		LoginTab
	div(v-else).user-info
		div.flex.flex-col.items-center
			img(
				:src="userInfo.avatar_url"
				width="128"
				height="128"
				class="inline-block mb-1 rounded-lg"
			)
			div.grid.gap-6.my-6
				InputForm(
					v-model="userInfo.custom_name"
					:name="$t('settings.values.account.inputs.name')"
					required
				)
				InputForm(
					v-model="userInfo.email"
					:name="$t('settings.values.account.inputs.email')"
					required
					disabled
				)
				ButtonControl(
					default-style
					:loading="loading"
					:importance="ButtonImportance.Filled"
					@click="updateUserInfo"
					class="max-w-min justify-self-center"
				)
					span(v-text="$t('settings.values.account.buttons.save')")
</template>
