// Runtime configuration for Vite/Vue project
// Replaces Nuxt.js useRuntimeConfig()

export interface RuntimeConfig {
	public: {
		API_URL: string;
		PLATFORM: 'mobile' | 'web';
		URL: string;
		PACKAGE_VERSION: string;
	};
}

export const runtimeConfig: RuntimeConfig = {
	public: {
		API_URL: import.meta.env.VITE_API_URL || 'https://api.betterme.study',
		PLATFORM: (import.meta.env.VITE_PLATFORM as 'mobile' | 'web') || 'web',
		URL: import.meta.env.VITE_URL || 'https://betterme.study',
		PACKAGE_VERSION: import.meta.env.VITE_PACKAGE_VERSION || '0.2.0',
	},
};
