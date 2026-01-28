import { useErrorStore } from "@/stores/common";

export const fetchWithAuth = async (url: string, options?: any) => {
	const { showError } = useErrorStore();
	const token = window.localStorage.getItem("Authorization") as string;
	return fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		},
		...options,
	}).catch((error) => {
		if (error instanceof TypeError) {
			showError("Network error:  Check your internet connection.");
		} else if (error.status === 500) {
			showError("Server error. Please contact admin to fix this!");
		} else {
			showError("An unexpected error occurred during fetch.");
		}
	});
};

export const fetchMultiPartWithAuth = async (url: string, options?: any) => {
	const token = window.localStorage.getItem("Authorization");
	return fetch(url, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
		...options,
	});
};
