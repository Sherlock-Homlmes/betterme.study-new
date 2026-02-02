import { runtimeConfig } from "@/config/runtimeConfig";
import { createGlobalState, useLocalStorage } from "@vueuse/core";
import { isEmpty } from "lodash";
import { fetchWithAuth } from "@/utils/betterFetch";
import { useAuthStore } from "./auth";
import { useErrorStore } from "./common";

export enum TaskStatus {
	TODO = "TO-DO",
	DOING = "DOING",
	DONE = "DONE",
	EXPIRED = "EXPIRED",
}

export interface Task {
	id: number;
	title: string;
	description: string | null;
	priority: number;
    status: TaskStatus
    index: number
    // necessary: string
    // difficult: number
    // deadline: datetime.datetime
    // task_category_ids: string[]
}

export enum TaskMoveDirection {
	up = 1,
	down = -1,
}

export const useTaskStore = createGlobalState(() => {
	const API_URL = runtimeConfig.public.API_URL;
	const { isAuth } = useAuthStore();
	const { showError } = useErrorStore();

	// state
	const tasks = useLocalStorage("tasks", []);
	const enableTodoListTask = useLocalStorage("enableTodoListTask", true);

	// getters

	// actions
	const getTaskList = async () => {
		if (!isAuth.value) return;
		const response = await fetchWithAuth(`${API_URL}/todolist`);
		if (response?.ok) tasks.value = await response.json();
		else {
			const errorMsg = "Failed to get newest task list";
			showError(errorMsg);
			throw new Error(errorMsg);
		}
		tasks.value = tasks.value.map((task) => ({
			...task,
			section: "work",
		}));
	};

	const postTask = async (title: string) => {
		if (!isAuth.value) {
			tasks.value.push({
				title,
				status: TaskStatus.DOING,
				section: "work",
			});
			return;
		}
		const index = isEmpty(tasks.value)
			? 1
			: Math.max(...tasks.value.map((task) => task.index)) + 1;
		const response = await fetchWithAuth(`${API_URL}/todolist`, {
			method: "POST",
			body: JSON.stringify({ title, index }),
		});
		if (response?.ok) await getTaskList();
		else {
			const errorMsg = "Failed to create task";
			showError(errorMsg);
			throw new Error(errorMsg);
		}
	};

	const patchTask = async (taskId: string, change = {}) => {
		if (!isAuth.value) return;
		if (isEmpty(change)) return;
		const response = await fetchWithAuth(`${API_URL}/todolist/${taskId}`, {
			method: "PATCH",
			body: JSON.stringify(change),
		});
		if (!response?.ok) {
			const errorMsg = "Failed to update task";
			showError(errorMsg);
			throw new Error(errorMsg);
		}
	};

	const deleteTask = async (taskId: string) => {
		if (!isAuth.value) {
			tasks.value = tasks.value.filter((task) => task.id !== taskId);
			return
		};
		const response = await fetchWithAuth(`${API_URL}/todolist/${taskId}`, {
			method: "DELETE",
		});
		if (response?.ok)
			tasks.value = tasks.value.filter((task) => task.id !== taskId);
		else {
			const errorMsg = "Failed to delete task";
			showError(errorMsg);
			throw new Error(errorMsg);
		}
	};

	const moveTask = (task, newIndex: number) => {
		const oldIndex = tasks.value.indexOf(task);
		if (oldIndex < 0 || newIndex >= tasks.value.length) return;

		const swapProp = (obj1, obj2, prop) => {
			if (!(prop in obj1) || !(prop in obj2)) return;
			[obj1[prop], obj2[prop]] = [obj2[prop], obj1[prop]];
		};
		swapProp(tasks.value[oldIndex], tasks.value[newIndex], "index");
		tasks.value.splice(newIndex, 0, tasks.value.splice(oldIndex, 1)[0]);
	};

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
	};
});
