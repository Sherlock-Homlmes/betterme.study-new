import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { StorageSerializers, createGlobalState, useStorage } from '@vueuse/core'

export const useAuthStore = createGlobalState( () => {
  const API_URL = useRuntimeConfig().public.API_URL

  // state
  const userInfo = ref()
  const userSetting = ref({
    "dark_mode": false,
    "language": "en",
    "theme_settings": {
        "pomodoro_study": [
            255,
            107,
            107
        ],
        "pomodoro_rest": [
            244,
            162,
            97
        ],
        "pomodoro_long_rest": [
            46,
            196,
            182
        ],
        "background": null
    },
    "pomodoro_settings": {
        "pomodoro_study_time": 25,
        "pomodoro_rest_time": 5,
        "pomodoro_long_rest_time": 20,
        "long_rest_time_interval": 3,
        "auto_start_next_time": true,
        "audio": null,
        "custom_audio": null,
        "show_progress_bar": false
    }
})
  const isAuthOnceLocalStorage = useStorage('isAuthOnce', false, undefined, { serializer: StorageSerializers.boolean })


  // getters
  const isAuth = computed(()=>!!userInfo.value)
  const isAuthOnce = computed(()=>isAuth.value || isAuthOnceLocalStorage.value)
  const isDarkMode = computed(()=> userSetting ? userSetting.value.dark_mode : false)

  // actions
  const getCurrentUser = async() =>  {
        const response = await fetchWithAuth(`${API_URL}/auth/self`);
        if (response.ok) userInfo.value = await response.json();
        else{
          userInfo.value = null
          throw new Error('Fail to get self');
        } 
    }

  const getCurrentUserSetting = async() =>  {
      if(!userInfo.value) throw new Error('Not authenticate yet')
        const response = await fetchWithAuth(`${API_URL}/users/self/settings`);
        if (response.ok) userSetting.value = await response.json();
        else throw new Error('Fail to get self setting');
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
isDarkMode,
    // actions
    getCurrentUser,
    getCurrentUserSetting,
    loginByDiscord
  }
})
