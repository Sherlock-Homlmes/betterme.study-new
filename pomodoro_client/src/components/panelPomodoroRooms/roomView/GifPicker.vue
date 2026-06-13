<script setup lang="ts">
import { ref, watch } from 'vue';
import { SearchIcon } from 'vue-tabler-icons';

const emit = defineEmits<{ select: [url: string] }>();

// Get key from env, fallback to Tenor's public demo key for development
const TENOR_KEY = import.meta.env.VITE_TENOR_API_KEY || 'LIVDSRZULELA096';

const searchQuery = ref('');
const gifs = ref<string[]>([]);
const loading = ref(false);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const fetchGifs = async (query?: string) => {
  loading.value = true;
  try {
    const url = query
      ? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_KEY}&client_key=betterme_study&limit=24&media_filter=gif`
      : `https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}&client_key=betterme_study&limit=24&media_filter=gif`;
    const res = await fetch(url);
    const data = await res.json();
    // Use tinygif for faster loading, fallback to gif
    gifs.value = (data.results ?? [])
      .map((r: any) => r.media_formats?.tinygif?.url ?? r.media_formats?.gif?.url)
      .filter(Boolean);
  } catch {
    gifs.value = [];
  } finally {
    loading.value = false;
  }
};

fetchGifs();

watch(searchQuery, (val) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchGifs(val.trim() || undefined), 400);
});
</script>

<template lang="pug">
div(class="flex flex-col gap-2 p-2 w-[300px]")
  div(class="relative")
    SearchIcon(class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" :size="14")
    input(
      v-model="searchQuery"
      type="text"
      placeholder="Search GIFs..."
      class="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
    )

  div(class="h-[260px] overflow-y-auto")
    div(
      v-if="loading"
      class="flex items-center justify-center h-full text-gray-400 text-sm"
    ) Loading...
    div(
      v-else-if="gifs.length === 0"
      class="flex items-center justify-center h-full text-gray-400 text-sm"
    ) No GIFs found
    div(v-else class="grid grid-cols-3 gap-1")
      img(
        v-for="(gif, i) in gifs"
        :key="i"
        :src="gif"
        loading="lazy"
        class="w-full h-20 object-cover rounded cursor-pointer hover:opacity-75 transition-opacity"
        alt="GIF"
        @click="emit('select', gif)"
      )

  p(class="text-[10px] text-gray-400 text-center") Powered by Tenor
</template>
