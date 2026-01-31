import { createRouter, createWebHistory, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import {runtimeConfig} from '@/config/runtimeConfig';
import Index from '@/pages/index.vue';
import DiscordOAuth from '@/pages/auth/discord-oauth.vue';
import DesktopPIPView from '@/pages/DesktopPIPView.vue';

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
if(runtimeConfig.public.PLATFORM === 'extension' || runtimeConfig.public.PLATFORM === 'desktop')
routes.push(
  {
    path: '/pip-view',
    name: 'pip-view',
    component: DesktopPIPView,
  },
)

const router = createRouter({
  history: runtimeConfig.public.PLATFORM === 'extension'
  ? createWebHashHistory()
  : createWebHistory(),
  routes,
});

export default router;
