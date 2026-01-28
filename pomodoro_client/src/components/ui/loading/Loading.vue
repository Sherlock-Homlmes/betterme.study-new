<script setup lang="ts">
import { cn } from '@/utils/index'
import { Loader2 } from 'lucide-vue-next'

interface LoadingProps {
  class?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
  showText?: boolean
}

const props = withDefaults(defineProps<LoadingProps>(), {
  size: 'md',
  showText: true,
  text: 'Loading...'
})

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}
</script>

<template>
  <div :class="cn('flex items-center justify-center gap-2', props.class)">
    <Loader2 :class="cn('animate-spin', sizeClasses[props.size])" />
    <span v-if="props.showText" class="text-sm text-muted-foreground">
      {{ props.text }}
    </span>
  </div>
</template>
