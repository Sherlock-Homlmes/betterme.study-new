<template>
  <p>Loading...</p>
</template>

<script setup lang="ts">
import { getCurrentInstance, onMounted } from "vue";
import { useRuntimeConfig } from "nuxt/app";
import { fetchWithAuth } from "@utils/betterFetch";

const config = useRuntimeConfig();
const { fetchLink } = config.public;

const vm = getCurrentInstance().proxy;
onMounted(async () => {
	// get oauth code from url
	const code = vm.$route.query?.code;
	let isAuth = false;
	if (code) {
		const response = await fetch(
			`${fetchLink}/auth/discord-oauth?code=${code}`,
		);
		const data = await response.json();
		if (data?.token) {
			// set auth to localstorage
			localStorage.removeItem("Authorization");
			localStorage.setItem("Authorization", data.token);
			// check if user is accessable or not
			const response = await fetchWithAuth(`${fetchLink}/auth/self`);
			if (response.ok) isAuth = true;
		}
	}
	// Case 1: if auth: redirect to posts page
	// Case 2: if not auth: redirect login page
	vm.$router.push(isAuth ? "/posts" : "/");
});
</script>
