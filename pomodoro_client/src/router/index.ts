import { createRouter, createWebHistory, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import {runtimeConfig} from '@/config/runtimeConfig';
import Index from '@/pages/index.vue';
import DesktopPIPView from '@/pages/DesktopPIPView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: (to) => ({ path: '/en', query: to.query, hash: to.hash })
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
    path: '/:pathMatch(.*)*',
    redirect: (to) => ({ path: '/en', query: to.query, hash: to.hash }),
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
