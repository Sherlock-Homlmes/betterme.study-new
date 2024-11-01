import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { StorageSerializers, createGlobalState, useStorage } from '@vueuse/core'

export enum TaskStatus {
  TODO = "TO-DO",
  DOING = "DOING",
  DONE = "DONE",
  EXPIRED = "EXPIRED"
}

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

  const patchTask = async (taskId: string, change = {}) =>  {
    if(_isEmpty(change)) return
    const response = await fetchWithAuth(`${API_URL}/todolist/${taskId}`,
    {
      method: "PATCH",
      body: JSON.stringify(change)})
    if (!response.ok) throw new Error('abc?');
    }

  const deleteTask = async (taskId: string) =>  {
      const response = await fetchWithAuth(`${API_URL}/todolist/${taskId}`, {method: "DELETE"})
      if (response.ok) tasks.value = tasks.value.filter(task => task.id !== taskId)
      else throw new Error('abc?');
      
    }

  const moveTask = (task, newIndex: number) => {
      const oldIndex = tasks.value.indexOf(task)
      console.log(oldIndex, newIndex)
      if (oldIndex < 0 || newIndex >= tasks.value.length) { return }
      tasks.value.splice(newIndex, 0, tasks.value.splice(oldIndex, 1)[0])
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
moveTask,
  }
})
