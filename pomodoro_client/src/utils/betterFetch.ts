import { useErrorStore } from "@/stores/common";

// Centralized token management
class TokenManager {
	private static readonly TOKEN_KEY = 'Authorization';
	private static readonly COOKIE_DOMAIN = '.betterme.study'; // Domain for cookie sharing
	
	static getToken(): string | null {
		// Try to get token from cookie first, fallback to localStorage
		const getCookie = (name: string): string | null => {
			const value = `; ${document.cookie}`;
			const parts = value.split(`; ${name}=`);
			if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
			return null;
		};
		
		return getCookie(TokenManager.TOKEN_KEY) || window.localStorage.getItem(TokenManager.TOKEN_KEY);
	}
	
	static setToken(token: string): void {
		// Set in both localStorage and cookie
		window.localStorage.setItem(TokenManager.TOKEN_KEY, token);
		
		// Set cookie with proper attributes and domain
		const expires = new Date();
		expires.setDate(expires.getDate() + 30); // 30 days from now
		document.cookie = `${TokenManager.TOKEN_KEY}=${token}; expires=${expires.toUTCString()}; path=/; domain=${TokenManager.COOKIE_DOMAIN}; SameSite=Lax`;
	}
	
	static removeToken(): void {
		// Remove from both localStorage and cookie
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

	private async handleErrors(response: Response): Promise<Response> {
		if (!response.ok) {
			const { showError } = useErrorStore();
			if (response.status === 500) {
				showError("Server error. Please contact admin to fix this!");
			} else {
				showError(`HTTP error! Status: ${response.status}`);
			}
		}
		return response;
	}

	private async makeRequest(url: string, options: RequestInit): Promise<Response> {
		try {
			const response = await fetch(url, options);
			return await this.handleErrors(response);
		} catch (error) {
			if (error instanceof TypeError) {
				const { showError } = useErrorStore();
				showError("Network error: Check your internet connection.");
			} else {
				const { showError } = useErrorStore();
				showError("An unexpected error occurred during fetch.");
			}
			throw error;
		}
	}

	async get(url: string): Promise<Response> {
		return this.makeRequest(url, {
			method: "GET",
			headers: this.getAuthHeaders(),
		});
	}

	async post(url: string, data?: any, isMultiPart: boolean = false): Promise<Response> {
		return this.makeRequest(url, {
			method: "POST",
			headers: this.getAuthHeaders(isMultiPart),
			body: isMultiPart ? data : JSON.stringify(data),
		});
	}

	async put(url: string, data?: any, isMultiPart: boolean = false): Promise<Response> {
		return this.makeRequest(url, {
			method: "PUT",
			headers: this.getAuthHeaders(isMultiPart),
			body: isMultiPart ? data : JSON.stringify(data),
		});
	}

	async patch(url: string, data?: any, isMultiPart: boolean = false): Promise<Response> {
		return this.makeRequest(url, {
			method: "PATCH",
			headers: this.getAuthHeaders(isMultiPart),
			body: isMultiPart ? data : JSON.stringify(data),
		});
	}

	async delete(url: string): Promise<Response> {
		return this.makeRequest(url, {
			method: "DELETE",
			headers: this.getAuthHeaders(),
		});
	}

	// For backward compatibility with multipart requests
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
