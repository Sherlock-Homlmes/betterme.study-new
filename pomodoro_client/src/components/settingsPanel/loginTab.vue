<script setup lang="ts">
import {computed, reactive} from "vue";
import { BrandDiscordIcon, BrandGoogleIcon } from "vue-tabler-icons";
import { ButtonImportance } from "../base/types/button";
import Button from "@/components/base/uiButton.vue";
import { AppPlatform } from "@/platforms/platforms";
import { useMain } from "@/stores/main";
import { runtimeConfig } from "@/config/runtimeConfig";

const { API_URL, PLATFORM } = runtimeConfig.public;
const isMobile = computed(() => PLATFORM === AppPlatform.mobile);
const mainStore = useMain();
const oauthLink = reactive({
	discord_link: null,
	google_link: null,
});
const getLoginUrl = async () => {
	const response = await fetch(
		`${API_URL}/auth/oauth-link?discord_link=true&google_link=true`,
	);
	const data = await response.json();
	oauthLink.discord_link = data.discord_link;
	oauthLink.google_link = data.google_link;
};
getLoginUrl();
</script>

<template lang="pug">
div.flex.flex-col.items-center.h-full
  div.flex.flex-col.items-center.justify-center.mt-8.text-center.h-5/6
    div.mb-2
      span.font-bold(v-text="$t('login')")

    div.flex.flex-row.flex-wrap.justify-center.gap-2.mt-3.text-center
      Button(
        :importance="ButtonImportance.Filled"
        dark
        link
        no-default-style
        no-content-theme
        :href="oauthLink.discord_link"
        inner-class="flex flex-row items-center gap-1 text-slate-50 text-gray-50"
        bg-class="bg-slate-900 dark:bg-slate-700"
      )
        BrandDiscordIcon
        span(v-text="$t('loginBy.discord')")
      Button(
        :importance="ButtonImportance.Filled"
        link
        dark
        no-default-style
        no-content-theme
        :href="oauthLink.google_link"
        inner-class="flex flex-row items-center gap-1 text-black"
        bg-class="bg-yellow-300"
      )
        BrandGoogleIcon
        span(v-text="$t('loginBy.google')")
</template>
