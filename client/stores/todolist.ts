import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { StorageSerializers, createGlobalState, useStorage } from '@vueuse/core'

export const useTaskStore = createGlobalState( () => {
  const API_URL = useRuntimeConfig().public.API_URL

  // state
  const tasks = ref([])
  const enableTodoListTask = ref(true)

  // getters

  // actions
  const getTaskList = async() =>  {
        const response = await fetchWithAuth(`${API_URL}/todolist`);
        if (response.ok) tasks.value = await response.json();
        else throw new Error('abc?');
        tasks.value = tasks.value.map((task)=>({
          ...task,
          "priority": 0,
          "section": "work",
          "state": 2,
          "keepOnScreen": true,
        }))
    }

  const postTask = async (title: string) =>  {
    const response = await fetchWithAuth(`${API_URL}/todolist`,
    {
      method: "POST",
      body: JSON.stringify({
        title: title,
      }
    )})
    if (response.ok) await getTaskList()
    else throw new Error('abc?');
    }

  const patchTask = async (id: string, title: string) =>  {
    const response = await fetchWithAuth(`${API_URL}/todolist/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        title: title,
      }
    )})
    if (response.ok) await getTaskList()
    else throw new Error('abc?');
    }

  const deleteTask = async (id: string) =>  {
      const response = await fetchWithAuth(`${API_URL}/todolist/${id}`, {method: "DELETE"})
      if (response.ok) await getTaskList()
      else throw new Error('abc?');
      
    }

  return {
    // state
    tasks,
    enableTodoListTask,
    // getters
    // actions
    getTaskList,
    postTask,
    patchTask,
    deleteTask,
  }
})
