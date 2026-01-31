<script setup lang="ts">
import { computed } from "vue";
import {
	NewsIcon,
	BrandDiscordIcon,
	BrandFacebookIcon,
} from "vue-tabler-icons";
import { ButtonImportance } from "../base/types/button";
import Button from "@/components/base/uiButton.vue";
import { AppPlatform } from "@/platforms/platforms";
import { useMain } from "@/stores/main";
import { runtimeConfig } from "@/config/runtimeConfig";

const isMobile = computed(
	() => runtimeConfig.public.PLATFORM === AppPlatform.mobile,
);
const mainStore = useMain();
</script>

<template lang="pug">
div.flex.flex-col.items-center
  img(src="/favicon.svg" width="64" height="64" class="inline-block p-2 mb-1 bg-red-200 rounded-lg" alt='app-icon')
  div
    div.inline-block.text-2xl.font-bold Betterme Pomodoro
    sup.text-base(v-text="mainStore.version")
  div(v-text="$t('settings.about.madeby')")

  div.flex.flex-col.items-center.justify-center.mt-8.text-center
    div.mb-2
      span(v-text="$t('settings.about.supportBody')")
    div(v-if="isMobile" class="px-4 my-2 text-sm" v-text="$t('settings.about.mobileSupport')")

    div.flex.flex-row.flex-wrap.justify-center.gap-2.mt-3.text-center
      Button(
        :importance="ButtonImportance.Filled"
        dark
        link
        no-default-style
        no-content-theme
        href="https://discord.gg/betterme"
        inner-class="flex flex-row items-center gap-1 text-slate-50 text-gray-50"
        bg-class="bg-slate-900 dark:bg-slate-700"
      )
        BrandDiscordIcon
        span(v-text="$t('settings.about.discord_betterme')")
      Button(
        :importance="ButtonImportance.Filled"
        link
        dark
        no-default-style
        no-content-theme
        href="https://news.betterme.study"
        inner-class="flex flex-row items-center gap-1 text-black"
        bg-class="bg-yellow-300"
      )
        NewsIcon
        span(v-text="$t('settings.about.betterme_news')")
    div.my-2(v-text="$t('settings.about.share')")
    div.flex.flex-row.items-center.space-x-2.text-sm
      Button(
        link
        circle
        dark
        no-default-style
        no-content-theme
        :importance="ButtonImportance.Filled"
        :href="`http://www.facebook.com/share.php?u=${runtimeConfig.public.URL}`"
        bg-class="bg-[#1877f2]"
        inner-class="!p-4 text-slate-50"
      )
        BrandFacebookIcon(:aria-label="$t('support.share.facebook')" size="24" class="translate-x-[-1px]")
</template>
