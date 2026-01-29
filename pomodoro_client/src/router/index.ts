import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import Index from '@/pages/index.vue';
import DiscordOAuth from '@/pages/auth/discord-oauth.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/en'
  },
  {
    path: '/en',
    name: 'home-en',
    component: Index,
  },
  {
    path: '/vi',
    name: 'home-vi',
    component: Index,
  },
  {
    path: '/auth/discord-oauth',
    name: 'discord-oauth',
    component: DiscordOAuth,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
