<script setup lang="ts">
import { computed } from "vue";
import {
	NewsIcon,
	BrandDiscordIcon,
	BrandFacebookIcon,
} from "vue-tabler-icons";
import Button from "@/components/base/uiButton.vue";
import { ButtonImportance } from "@/components/base/types/button";
import { AppPlatform } from "@/platforms/platforms";
import { runtimeConfig } from "@/config/runtimeConfig";

const isMobile = computed(
	() => runtimeConfig.public.PLATFORM === AppPlatform.mobile,
);
</script>

<template lang="pug">
div.flex.flex-col.items-center.gap-2.py-6
  img(src="/favicon.svg" width="64" height="64" class="inline-block p-3 mb-2 bg-gradient-to-br from-red-400 to-red-600 rounded-xl shadow-lg" alt='app-icon')
  div.flex.flex-col.items-center.gap-1
    div.inline-block.text-2xl.font-bold.bg-gradient-to-r.from-red-600.to-red-800.bg-clip-text.text-transparent Betterme Pomodoro
    sup.text-base.text-muted-foreground.font-medium(v-text="runtimeConfig.public.PACKAGE_VERSION")
    div.text-sm.text-muted-foreground(v-text="$t('settings.about.madeby')")

  div.flex.flex-col.items-center.justify-center.text-center.max-w-md.px-4
    div.mb-3
      span.text-muted-foreground(v-text="$t('settings.about.supportBody')")
    div(v-if="isMobile" class="px-4 py-2 mb-3 text-sm bg-muted/50 rounded-lg border border-border/50" v-text="$t('settings.about.mobileSupport')")

    div.flex.flex-row.flex-wrap.justify-center.gap-3.mt-2
      a(href="https://discord.gg/betterme" target="_blank" rel="noopener noreferrer")
        Button(
          :importance="ButtonImportance.Filled"
          dark
          link
          no-default-style
          no-content-theme
          inner-class="flex flex-row items-center gap-1 text-slate-50 text-gray-50"
          bg-class="bg-slate-900 dark:bg-slate-700 shadow-md"
        )
          BrandDiscordIcon
          span(v-text="$t('loginBy.discord')")
      a(href="https://news.betterme.study" target="_blank" rel="noopener noreferrer")
        Button(
          :importance="ButtonImportance.Filled"
          dark
          link
          no-default-style
          no-content-theme
          inner-class="flex flex-row items-center gap-1 text-slate-50 text-gray-50"
          bg-class="bg-yellow-500 shadow-md"
        )
          NewsIcon
          span(v-text="$t('settings.about.betterme_news')")

    div.mt-5.mb-2.text-sm.font-medium.text-foreground(v-text="$t('settings.about.share')")
    div.flex.flex-row.items-center.justify-center.gap-2
      a(
        :href="`http://www.facebook.com/share.php?u=${runtimeConfig.public.URL}`"
        target="_blank"
        rel="noopener noreferrer"
      )
        Button(
          :importance="ButtonImportance.Filled"
          dark
          link
          no-default-style
          no-content-theme
          inner-class="flex flex-row items-center gap-1 text-slate-50 text-gray-50"
          bg-class="bg-[#1877f2] hover:bg-[#166fe5] text-white shadow-md transition-all hover:scale-105 shadow-md"
          )
          BrandFacebookIcon(:aria-label="$t('support.share.facebook')")
</template>
