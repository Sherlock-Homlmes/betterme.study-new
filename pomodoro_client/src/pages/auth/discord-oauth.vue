<template lang="pug">
  p Loading...
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchWithAuth } from "@/utils/betterFetch";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const { loginByDiscord, isAuth } = useAuthStore()!;
onMounted(async () => {
	// get oauth code from url
	const code = route.query?.code as string;
	if (code) {
		await loginByDiscord(code);
	}
	// Case 1: if auth: redirect to pomodoro page
	// Case 2: if not auth: redirect error page
	router.push(isAuth ? "/" : "/error");
});
</script>
