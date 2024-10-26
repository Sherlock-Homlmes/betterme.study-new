import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { StorageSerializers, createGlobalState, useStorage } from '@vueuse/core'

export const usePomodoroStore = createGlobalState( () => {
  const API_URL = useRuntimeConfig().public.API_URL

  // state
  const currentPomodoroSection = ref()

  // getters

  // actions
  const startPomodoro = async() =>  {
        const response = await fetchWithAuth(`${API_URL}/pomodoros/`,{
            method: "POST",
        });
        if (response.ok){
            currentPomodoroSection.value = await response.json()
        }
        else throw new Error('Fail to start pomodoro section');
    }

  const pomodoroSectionAction = async(action: string) =>  {
        const response = await fetchWithAuth(`${API_URL}/pomodoros/${currentPomodoroSection.value.id}`,{
            method: "PATCH",
			body: JSON.stringify({action: action}),
        });
        if (!response.ok) throw new Error(`Fail to ${action} pomodoro section`);
    }

  const deletePomodoro = async() =>  {
        const response = await fetchWithAuth(
          `${API_URL}/pomodoros/_last`,
          {method: "DELETE"}
        );
        if (response.ok){
          currentPomodoroSection.value = null
        }
        else throw new Error(`Fail to delete pomodoro section`);

    }

  return {
    // state
    currentPomodoroSection,
    // getters
    // actions
    startPomodoro,
    pomodoroSectionAction,
deletePomodoro,
  }
})
