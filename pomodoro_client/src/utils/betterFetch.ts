import { useErrorStore } from "@/stores/common";
import { runtimeConfig } from "@/config/runtimeConfig";

/** Request is aborted if the server doesn't respond within this window. */
const DEFAULT_TIMEOUT_MS = 30_000;
/** How many times to retry a transient (network / aborted) failure. */
const MAX_RETRIES = 2;
/** Base backoff (ms) for retry; doubled per attempt. */
const RETRY_BASE_DELAY_MS = 400;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Centralized auth-token management.
 *
 * The token is ONLY kept in a cookie (set by the landing OAuth flow, see
 * landing/src/pages/auth/discord-oauth.astro). localStorage is intentionally
 * NOT used so an XSS can't exfiltrate it from there. True httpOnly protection
 * requires the backend to issue the cookie; until then this is the best the
 * client can do on its own.
 */
class TokenManager {
	private static readonly TOKEN_KEY = "Authorization";
	private static readonly COOKIE_DOMAIN = runtimeConfig.public.COOKIE_DOMAIN;

	private static getCookie(name: string): string | null {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
		return null;
	}

	static getToken(): string | null {
		return TokenManager.getCookie(TokenManager.TOKEN_KEY);
	}

	static setToken(token: string): void {
		const expires = new Date();
		expires.setDate(expires.getDate() + 30); // 30 days
		document.cookie = `${TokenManager.TOKEN_KEY}=${token}; expires=${expires.toUTCString()}; path=/; domain=${TokenManager.COOKIE_DOMAIN}; SameSite=Lax`;
	}

	static removeToken(): void {
		document.cookie = `${TokenManager.TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${TokenManager.COOKIE_DOMAIN}; SameSite=Lax`;
	}
}

/** Error thrown for non-2xx responses by the JSON helper. */
export class ApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

class Api {
	private getAuthHeaders(isMultiPart = false): Record<string, string> {
		const token = TokenManager.getToken();
		const headers: Record<string, string> = {};
		if (token) headers["Authorization"] = `Bearer ${token}`;
		if (!isMultiPart) headers["Content-Type"] = "application/json";
		return headers;
	}

	private isRetryable(error: unknown): boolean {
		// Abort (timeout) and network failures are worth another attempt.
		if (error instanceof DOMException && error.name === "AbortError") return true;
		return error instanceof TypeError;
	}

	private async makeRequest(
		url: string,
		options: RequestInit,
		attempt = 0,
	): Promise<Response> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

		// Honour a caller-provided signal too.
		const externalSignal = options.signal;
		if (externalSignal) {
			if (externalSignal.aborted) controller.abort();
			else externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
		}

		try {
			return await fetch(url, { ...options, signal: controller.signal });
		} catch (error) {
			if (attempt < MAX_RETRIES && this.isRetryable(error)) {
				await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
				return this.makeRequest(url, options, attempt + 1);
			}

			const { showError } = useErrorStore();
			if (error instanceof DOMException && error.name === "AbortError") {
				showError("Request timed out. Please check your connection and try again.");
			} else if (error instanceof TypeError) {
				showError("Network error: Check your internet connection.");
			} else {
				showError("An unexpected error occurred during the request.");
			}
			throw error;
		} finally {
			clearTimeout(timeout);
		}
	}

	/** Centralized response handling: drop stale auth on 401. */
	private async handleResponse(response: Response): Promise<Response> {
		if (response.status === 401) {
			TokenManager.removeToken();
		}
		return response;
	}

	private async request(
		url: string,
		options: RequestInit & { isMultiPart?: boolean },
	): Promise<Response> {
		const { isMultiPart, ...init } = options;
		const headers = { ...this.getAuthHeaders(isMultiPart), ...(init.headers as Record<string, string> | undefined) };
		return this.handleResponse(await this.makeRequest(url, { ...init, headers }));
	}

	async get(url: string): Promise<Response> {
		return this.request(url, { method: "GET" });
	}

	async post(url: string, data?: unknown, isMultiPart = false): Promise<Response> {
		return this.request(url, {
			method: "POST",
			body: isMultiPart ? (data as BodyInit) : JSON.stringify(data),
			isMultiPart,
		});
	}

	async put(url: string, data?: unknown, isMultiPart = false): Promise<Response> {
		return this.request(url, {
			method: "PUT",
			body: isMultiPart ? (data as BodyInit) : JSON.stringify(data),
			isMultiPart,
		});
	}

	async patch(url: string, data?: unknown, isMultiPart = false): Promise<Response> {
		return this.request(url, {
			method: "PATCH",
			body: isMultiPart ? (data as BodyInit) : JSON.stringify(data),
			isMultiPart,
		});
	}

	async delete(url: string): Promise<Response> {
		return this.request(url, { method: "DELETE" });
	}

	/** For backward compatibility with multipart requests. */
	async multipart(url: string, options?: RequestInit): Promise<Response> {
		return this.request(url, {
			method: options?.method || "POST",
			isMultiPart: true,
			body: options?.body,
			headers: options?.headers as Record<string, string> | undefined,
		});
	}

	/**
	 * Convenience helper that parses JSON and throws ApiError on non-2xx.
	 * Prefer this for new code instead of hand-checking `response.ok`.
	 */
	async requestJson<T = unknown>(
		url: string,
		options: RequestInit & { isMultiPart?: boolean } = {},
	): Promise<T> {
		const response = await this.request(url, { ...options, method: options.method || "GET" });
		if (!response.ok) {
			throw new ApiError(response.status, `HTTP ${response.status} for ${url}`);
		}
		return (await response.json()) as T;
	}
}

export const api = new Api();
export { TokenManager };
