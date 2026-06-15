import { useErrorStore } from "@/stores/common";
import { runtimeConfig } from "@/config/runtimeConfig";

const REQUEST_TIMEOUT_MS = 30_000;

// Centralized token management
class TokenManager {
	private static readonly TOKEN_KEY = 'Authorization';
	private static readonly COOKIE_DOMAIN = runtimeConfig.public.COOKIE_DOMAIN;

	static getToken(): string | null {
		const getCookie = (name: string): string | null => {
			const value = `; ${document.cookie}`;
			const parts = value.split(`; ${name}=`);
			if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
			return null;
		};

		return getCookie(TokenManager.TOKEN_KEY) || window.localStorage.getItem(TokenManager.TOKEN_KEY);
	}

	static setToken(token: string): void {
		window.localStorage.setItem(TokenManager.TOKEN_KEY, token);

		const expires = new Date();
		expires.setDate(expires.getDate() + 30);
		document.cookie = `${TokenManager.TOKEN_KEY}=${token}; expires=${expires.toUTCString()}; path=/; domain=${TokenManager.COOKIE_DOMAIN}; SameSite=Lax`;
	}

	static removeToken(): void {
		window.localStorage.removeItem(TokenManager.TOKEN_KEY);
		document.cookie = `${TokenManager.TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${TokenManager.COOKIE_DOMAIN}; SameSite=Lax`;
	}
}

class Api {
	private getAuthHeaders(isMultiPart: boolean = false): Record<string, string> {
		const token = TokenManager.getToken();
		const headers: Record<string, string> = {
			Authorization: `Bearer ${token}`,
		};

		if (!isMultiPart) {
			headers["Content-Type"] = "application/json";
		}

		return headers;
	}

	private async makeRequest(url: string, options: RequestInit): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
		try {
			return await fetch(url, { ...options, signal: controller.signal });
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				const { showError } = useErrorStore();
				showError("Request timed out. Please check your connection and try again.");
			} else if (error instanceof TypeError) {
				const { showError } = useErrorStore();
				showError("Network error: Check your internet connection.");
			} else {
				const { showError } = useErrorStore();
				showError("An unexpected error occurred during fetch.");
			}
			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	async get(url: string): Promise<Response> {
		return this.makeRequest(url, {
			method: "GET",
			headers: this.getAuthHeaders(),
		});
	}

	async post(url: string, data?: object, isMultiPart: boolean = false): Promise<Response> {
		return this.makeRequest(url, {
			method: "POST",
			headers: this.getAuthHeaders(isMultiPart),
			body: isMultiPart ? data as unknown as BodyInit : JSON.stringify(data),
		});
	}

	async put(url: string, data?: object, isMultiPart: boolean = false): Promise<Response> {
		return this.makeRequest(url, {
			method: "PUT",
			headers: this.getAuthHeaders(isMultiPart),
			body: isMultiPart ? data as unknown as BodyInit : JSON.stringify(data),
		});
	}

	async patch(url: string, data?: object, isMultiPart: boolean = false): Promise<Response> {
		return this.makeRequest(url, {
			method: "PATCH",
			headers: this.getAuthHeaders(isMultiPart),
			body: isMultiPart ? data as unknown as BodyInit : JSON.stringify(data),
		});
	}

	async delete(url: string): Promise<Response> {
		return this.makeRequest(url, {
			method: "DELETE",
			headers: this.getAuthHeaders(),
		});
	}

	async multipart(url: string, options?: RequestInit): Promise<Response> {
		return this.makeRequest(url, {
			method: options?.method || "POST",
			headers: this.getAuthHeaders(true),
			...options,
		});
	}
}

export const api = new Api();
export { TokenManager };
