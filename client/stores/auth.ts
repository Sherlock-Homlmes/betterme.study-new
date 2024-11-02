import { computed, ref, watch } from 'vue'
import { useRuntimeConfig } from '#app'
import { StorageSerializers, createGlobalState, useStorage } from '@vueuse/core'
import ChangeTracker from '../utils/changeTracker'

const changeTracker = new ChangeTracker()

export const useAuthStore = createGlobalState( () => {
  const API_URL = useRuntimeConfig().public.API_URL

  // state
  const userInfo = ref()
  const userSettings = ref({
    "language": "vi",
    "visuals": {
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
        "background": null,
        "dark_mode": false,
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
  changeTracker.track(userSettings.value)
  const isAuthOnceLocalStorage = useStorage('isAuthOnce', false, undefined, { serializer: StorageSerializers.boolean })


  // getters
  const isAuth = computed(()=>!!userInfo.value)
  const isAuthOnce = computed(()=>isAuth.value || isAuthOnceLocalStorage.value)
  const isDarkMode = computed(()=> userSettings ? userSettings.value.visuals.dark_mode : false)

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
      if (response.ok) userSettings.value = await response.json();
      else throw new Error('Fail to get self setting');
    }

  const updateCurrentUserSetting = async (data: object) =>  {
      if(!userInfo.value) throw new Error('Not authenticate yet')
      const response = await fetchWithAuth(
        `${API_URL}/users/self/settings`,
        {
          method: "PATCH",
          body: JSON.stringify(data)
        }
      )
      if (!response.ok) throw new Error('Fail to get self setting');
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

  // Events
  watch(
    userSettings,
    (newValue) => {
      const change = changeTracker.getChange(newValue)
      if(_isEmpty(change)) return
      updateCurrentUserSetting(change)
      changeTracker.track(newValue)
    },
    {deep: true}
  )

  return {
    // state
    userInfo,
  userSettings,
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
