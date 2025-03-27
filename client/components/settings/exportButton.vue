<script setup lang="ts">
import ButtonControl from "~~/components/base/uiButton.vue";
import { ButtonImportance } from "../base/types/button";
import { useAuthStore } from "~~/stores/auth";

const downloadSettings = () => {
	const { userSettings } = useAuthStore();

	const downloadObject = {
		userSettings: userSettings.value,
	};

	const downloadElement = document.createElement("a");
	downloadElement.href = `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(downloadObject))}`;
	downloadElement.download = "betterme-study-settings.json";
	downloadElement.style.display = "none";
	document.body.appendChild(downloadElement);
	downloadElement.click();
	document.body.removeChild(downloadElement);
};
</script>

<template>
  <ButtonControl default-style :importance="ButtonImportance.Filled" @click="downloadSettings">
    <span v-text="$t('settings.manage.buttons.save')" />
  </ButtonControl>
</template>
