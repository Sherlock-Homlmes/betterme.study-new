<script setup lang="ts">
import { ButtonImportance } from "../base/types/button";
import Button from "@/components/base/uiButton.vue";
import _ from "lodash";
import { useAuthStore, defaultSettings } from "@/stores/auth";

const { userSettings } = useAuthStore();
const resetUserSetting = () =>
	(userSettings.value = _.cloneDeep(defaultSettings));
</script>

<template>
  <Button default-style :importance="ButtonImportance.Filled" @click="resetUserSetting" >
    <span v-text="$t('settings.manage.buttons.reset')" />
  </Button>
</template>
