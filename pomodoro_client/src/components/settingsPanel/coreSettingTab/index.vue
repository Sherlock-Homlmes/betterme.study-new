
<script setup lang="ts">
import { ButtonImportance } from "@/components/base/types/button";
import ButtonControl from "@/components/base/uiButton.vue";
import OptionGroup from "@/components/base/optionGroup.vue";
import SettingsItem from "@/components/common/settingsItem/v1.vue";
import SettingsItemV2 from "@/components/common/settingsItem/v2.vue";
import Divider from "@/components/base/uiDivider.vue";
import ExportButton from "./buttons/export.vue";
import ImportButton from "./buttons/import.vue";
import ResetButton from "./buttons/reset.vue";
import {Control} from "@/components/common/settingsItem/type";

import { useAuthStore } from "@/stores/auth";
import { usePlatformStore } from "@/stores/platforms";

const { isAuth, userSettings } = useAuthStore();
const { isWeb, isDesktop, isExtension } = usePlatformStore();
const isWebBase = isWeb.value || isDesktop.value || isExtension.value;
</script>

<template lang="pug">
div.grid.grid-cols-1.gap-2.py-3.px-4
  OptionGroup(
    :choices="$languages"
    :value="userSettings.language"
    :override-text="{ title: $languages, description: {} }"
    @input="(newLang) => { userSettings.language = newLang }"
  )
  Divider
  SettingsItemV2(:type="Control.Check" path="visuals.dark_mode")
  SettingsItemV2(:type="Control.Check" path="visuals.show_progress_bar")
  SettingsItemV2(:type="Control.Check" path="visuals.show_pip_mode" v-if='isWeb || isDesktop')

  template(v-if="isWebBase && !isAuth")
    Divider
    SettingsItem(:type="Control.Empty" path="manage")
    div.grid.grid-flow-col.grid-cols-12.gap-1.mt-1
      ButtonControl(default-style :importance="ButtonImportance.Filled" @click='$emit("openLogin")' class="col-start-1 col-end-4")
        span(v-text="$t('login')")
      span.flex.justify-center.items-center {{$t('general.or')}}
      div.grid.grid-flow-col.grid-cols-3.gap-2.col-start-5.col-end-13
        ExportButton
        ImportButton
        ResetButton
</template>
