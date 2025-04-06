<template>
  <NuxtLayout name="default">
    <IvolunteerVn :link="link" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, getCurrentInstance } from "vue";
import IvolunteerVn from "@components/Crawlers/IvolunteerVn/index.vue";

const vm = getCurrentInstance().proxy as any;
const link = ref<String>(vm.$route.params.postName);
</script>
