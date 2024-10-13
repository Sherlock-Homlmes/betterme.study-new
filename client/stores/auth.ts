import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { StorageSerializers, createGlobalState, useStorage } from '@vueuse/core'

export const useAuthStore = createGlobalState( () => {
  const API_URL = useRuntimeConfig().public.API_URL

  // state
  const userInfo = ref()
  const isAuthOnceLocalStorage = useStorage('isAuthOnce', false, undefined, { serializer: StorageSerializers.boolean })


  // getters
  const isAuth = computed(()=>!!userInfo.value)
  const isAuthOnce = computed(()=>isAuth.value || isAuthOnceLocalStorage.value)

  // actions
  const   getCurrentUser = async() =>  {
        const response = await fetchWithAuth(`${API_URL}/auth/self`);
        if (response.ok) userInfo.value = await response.json();
        else{
          userInfo.value = null
          throw new Error('Fail to get self');
        } 
    }

  const   loginByDiscord = async(code: string) => {
      const response = await fetch(
        `${API_URL}/auth/discord-oauth?code=${code}`,
      );
      const data = await response.json();
      if (data?.token) {
        // set auth to localstorage
        localStorage.removeItem("Authorization");
        localStorage.setItem("Authorization", data.token);
        // check if user is accessable or not
        await getCurrentUser()
        isAuthOnceLocalStorage.value = true
      }
    }

  return {
    // state
    userInfo,
    // getters
    isAuth,
    isAuthOnce,
    // actions
    getCurrentUser,
    loginByDiscord
  }
})
