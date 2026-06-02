<script setup lang="ts">
import { CheckIcon as CompleteIcon } from "vue-tabler-icons";
</script>

<template lang="pug">
div.timer-complete-icon
  CompleteIcon
</template>

<style lang="scss" scoped>
.timer-complete-icon svg {
  width: calc(max(20vw, 20vh)) !important;
  height: calc(max(20vw, 20vh)) !important;
}
</style>
