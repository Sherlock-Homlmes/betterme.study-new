import { defineStore } from 'pinia'
import { useRuntimeConfig } from '#app'

export const useAuth = defineStore('auth', {
  state: () => ({
    userInfo: null,
  }),

  getters: {
    isAuth: (state) => !!state.userInfo,
  },

  actions: {
    async getCurrentUser() {
        const API_URL = useRuntimeConfig().public.API_URL
        const response = await fetchWithAuth(`${API_URL}/auth/self`);
        if (response.ok) this.userInfo = await response.json();
        else throw new Error('Fail to login by discord');
    },
    async loginByDiscord(code: string) {
      const API_URL = useRuntimeConfig().public.API_URL
      const response = await fetch(
        `${API_URL}/auth/discord-oauth?code=${code}`,
      );
      const data = await response.json();
      if (data?.token) {
        // set auth to localstorage
        localStorage.removeItem("Authorization");
        localStorage.setItem("Authorization", data.token);
        // check if user is accessable or not
              await this.getCurrentUser()
      }
    },
  }
})
