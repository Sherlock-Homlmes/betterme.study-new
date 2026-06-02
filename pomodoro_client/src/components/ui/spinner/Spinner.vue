<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { LoaderIcon } from "vue-tabler-icons"
import { cn } from '@/utils/index'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <LoaderIcon
    role="status"
    aria-label="Loading"
    :class="cn('size-4 animate-spin', props.class)"
  />
</template>
