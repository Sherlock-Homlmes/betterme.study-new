<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { runtimeConfig } from "@/config/runtimeConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-vue-next";
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
	div(v-else).flex.flex-col.items-center.gap-6.p-6.h-full.overflow-y-auto
		// Avatar section
		div.flex.flex-col.items-center.gap-3
			div.relative.group
				img(
					:src="userInfo.avatar_url"
					width="120"
					height="120"
					class="rounded-full border-4 border-background shadow-lg object-cover transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
				)
			h2.text-xl.font-semibold.text-foreground {{ userInfo.custom_name || $t('settings.values.account.inputs.name') }}
			p.text-sm.text-muted-foreground {{ userInfo.email }}

		// Form section
		div.w-full.max-w-md.space-y-5
			div.space-y-2
				Label(for="custom-name") {{ $t('settings.values.account.inputs.name') }}
				Input(
					id="custom-name"
					v-model="userInfo.custom_name"
					placeholder="Enter your display name"
					class="transition-all duration-200 focus:ring-2 focus:ring-ring focus:ring-offset-2"
				)

			div.space-y-2
				Label(for="email") {{ $t('settings.values.account.inputs.email') }}
				Input(
					id="email"
					v-model="userInfo.email"
					disabled
					class="cursor-not-allowed opacity-60"
				)

			// Save button
			div.flex.justify-center.mt-4
				Button(
					:disabled="loading"
					@click="updateUserInfo"
					variant="default"
					size="default"
					class="w-fit shadow-md hover:shadow-lg transition-all duration-200"
				)
					Loader2(v-if="loading" class="mr-2 h-4 w-4 animate-spin")
					span(v-if="!loading") {{ $t('settings.values.account.buttons.save') }}
					span(v-else) Saving...
</template>
