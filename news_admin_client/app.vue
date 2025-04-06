<template>
  <v-card>
    <v-layout>
      <v-navigation-drawer expand-on-hover rail :width="350">
        <v-list>
          <v-list-item
            :prepend-avatar="user?.avatar_url"
            :title="user?.name"
            :subtitle="`Discord id: ${user.discord_id}`"
          ></v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-newspaper"
            title="Posts"
            value="posts"
            @click="$router.push({ path: '/posts' })"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-rake"
            title="Crawlers"
            value="crawlers"
            @click="$router.push({ path: '/crawlers' })"
          ></v-list-item>
        </v-list>
      </v-navigation-drawer>

      <v-main>
        <NuxtPage />
      </v-main>
    </v-layout>
  </v-card>
</template>

<script setup>
import { getCurrentInstance, onMounted, ref } from "vue";
import { useRuntimeConfig } from "nuxt/app";
import { fetchWithAuth } from "@utils/betterFetch";

const config = useRuntimeConfig();
const { fetchLink } = config.public;
const vm = getCurrentInstance().proxy;
const user = ref({});
onMounted(async () => {
	if (vm.$route.name === "auth-discord-oauth") return;
	const response = await fetchWithAuth(`${fetchLink}/auth/self`);
	if (!response.ok) vm.$router.push("/");
	user.value = await response.json();
});
</script>
