import { ref } from 'vue'
import { useRuntimeConfig } from '#app'
import { createGlobalState } from '@vueuse/core'
import _ from "lodash";

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
          "section": "work",
        }))
    }

  const postTask = async (title: string) =>  {
    const index = _.isEmpty(tasks.value)
    ? 1
    : Math.max(...tasks.value.map(task => task.index)) + 1
    const response = await fetchWithAuth(`${API_URL}/todolist`,
    {
      method: "POST",
      body: JSON.stringify({title, index}
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
      if (oldIndex < 0 || newIndex >= tasks.value.length) return
      [tasks.value[oldIndex].index, tasks.value[newIndex].index] = [tasks.value[newIndex].index, tasks.value[oldIndex].index]
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
