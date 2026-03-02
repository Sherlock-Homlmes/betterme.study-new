<script setup lang="ts">
import { computed } from "vue";
import {
	NewsIcon,
	BrandDiscordIcon,
	BrandFacebookIcon,
} from "vue-tabler-icons";
import { Button } from "@/components/ui/button";
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
          variant="default"
          size="lg"
          class="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 shadow-md cursor-pointer"
        )
          BrandDiscordIcon(:size="24")
          span(v-text="$t('settings.about.discord_betterme')")
      a(href="https://news.betterme.study" target="_blank" rel="noopener noreferrer")
        Button(
          variant="default"
          size="lg"
          class="bg-yellow-400 hover:bg-yellow-500 text-yellow-950 shadow-md cursor-pointer"
        )
          NewsIcon(:size="24")
          span(v-text="$t('settings.about.betterme_news')")

    div.mt-5.mb-2.text-sm.font-medium.text-foreground(v-text="$t('settings.about.share')")
    div.flex.flex-row.items-center.justify-center.gap-2
      a(
        :href="`http://www.facebook.com/share.php?u=${runtimeConfig.public.URL}`"
        target="_blank"
        rel="noopener noreferrer"
      )
        Button(
          variant="default"
          size="lg"
          class="bg-[#1877f2] hover:bg-[#166fe5] text-white shadow-md transition-all hover:scale-105 cursor-pointer"
        )
          BrandFacebookIcon(:size="24" :aria-label="$t('support.share.facebook')")
</template>
