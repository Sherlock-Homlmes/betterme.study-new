<template>
  <p>Loading...</p>
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted } from "vue";
import { useRuntimeConfig } from "nuxt/app";
import { fetchWithAuth } from "~~/utils/betterFetch";
import { useAuth } from '~~/stores/auth'


const vm = getCurrentInstance().proxy;
const authStore = useAuth()
onMounted(async () => {
	// get oauth code from url
	const code = vm.$route.query?.code;
	if (code) {
		await authStore.loginByDiscord(code)
	}
	// Case 1: if auth: redirect to pomodoro page
	// Case 2: if not auth: redirect error page
	vm.$router.push(authStore.isAuth ? "/" : "/error");
});
</script>
