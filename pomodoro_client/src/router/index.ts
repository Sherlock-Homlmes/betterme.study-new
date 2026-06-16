import { createRouter, createWebHistory, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import {runtimeConfig} from '@/config/runtimeConfig';
import Index from '@/pages/index.vue';
import DesktopPIPView from '@/pages/DesktopPIPView.vue';

const routes: RouteRecordRaw[] = [
  {
    // Render the app at the root instead of redirecting to /en. The redirect
    // collided with the edge rule (/en -> / 308) inside the betterme.dev iframe
    // and caused an ERR_TOO_MANY_REDIRECTS loop. Non-preview visitors are moved
    // to the locale URL (/en, /vi) by the language watcher in pages/index.vue.
    path: '/',
    name: 'home',
    component: Index,
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
