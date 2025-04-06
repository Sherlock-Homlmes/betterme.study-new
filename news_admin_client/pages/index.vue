<!-- refactor this -->
<template>
  <p>Auth page</p>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useRuntimeConfig } from "nuxt/app";

const config = useRuntimeConfig();
const { fetchLink } = config.public;

onMounted(async () => {
	const response = await fetch(`${fetchLink}/auth/oauth-link`);
	const oauthLinks = await response.json();
	window.location.replace(oauthLinks.discord_link);
});
</script>
