<script setup lang="ts">
import Button from "@/components/base/uiButton.vue";
import { ButtonImportance } from "@/components/base/types/button";

import {cloneDeep} from "lodash";

import { useAuthStore, defaultSettings } from "@/stores/auth";

const { userSettings } = useAuthStore();
const resetUserSetting = () =>
	(userSettings.value = cloneDeep(defaultSettings));
</script>

<template lang="pug">
Button(default-style :importance="ButtonImportance.Filled" @click="resetUserSetting")
  span(v-text="$t('settings.manage.buttons.reset')")
</template>
