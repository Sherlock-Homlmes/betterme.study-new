// Runtime configuration for Vite/Vue project
// Replaces Nuxt.js useRuntimeConfig()

export interface RuntimeConfig {
	public: {
		API_URL: string;
		PLATFORM: 'web' | 'desktop' | 'extension' | 'mobile';
		URL: string;
		PACKAGE_VERSION: string;
		LIVEKIT_URL: string;
	};
}

export const runtimeConfig: RuntimeConfig = {
	public: {
		API_URL: import.meta.env.VITE_API_URL || 'https://api.betterme.study/api',
		PLATFORM: (import.meta.env.VITE_PLATFORM as 'web' | 'desktop' | 'extension' | 'mobile') || 'web',
		URL: import.meta.env.VITE_URL || 'https://betterme.study',
		PACKAGE_VERSION: import.meta.env.VITE_PACKAGE_VERSION || '0.2.0',
		LIVEKIT_URL: import.meta.env.VITE_LIVEKIT_URL || 'ws://103.161.171.189:7880/:7880',
	},
};
