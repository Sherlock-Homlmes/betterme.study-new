<script setup lang="ts">
import { ref, type Ref } from "vue";
import { ButtonImportance } from "@/components/base/types/button";
import Button from "@/components/base/uiButton.vue";
import { useAuthStore } from "@/stores/auth";

const fileinput: Ref<HTMLInputElement | null> = ref(null);

const openFileDialog = () => {
	fileinput.value?.click();
};

const importFile = () => {
	// try to get file from the input field
	const file = (fileinput.value as HTMLInputElement).files?.item(0);
	if (!file) {
		return;
	}

	// read file
	const reader = new FileReader();
	reader.onload = (e) => {
		if (!e.target) {
			return;
		}
		const fileContents = e.target.result;

		if (!fileContents) {
			return;
		}

		// try to patch settings and task list with the imported values
		try {
			const importedValues = JSON.parse(fileContents as string);

			const { userSettings } = useAuthStore();
			userSettings.value = importedValues.userSettings;
		} catch (err) {
			console.warn(err);
		}
	};
	reader.readAsText(file);
};
</script>

<template lang="pug">
Button(default-style :importance="ButtonImportance.Filled" @click="openFileDialog")
  input(ref="fileinput" accept=".json" type="file" hidden @change="importFile")
  span(v-text="$t('settings.manage.buttons.load')")
</template>
