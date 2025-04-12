import { createGlobalState } from "@vueuse/core";
import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";

export const useAIChatStore = createGlobalState(() => {
	const API_URL = useRuntimeConfig().public.API_URL;
	const { showError } = useErrorStore();
	const { isAuth } = useAuthStore();

	const selectedChannelId = ref<string | null>(null);
	const channelIds = useLocalStorage("AIChatChannelIds", []);
	const channels = ref([]);
	const history = ref<
		{
			id?: string;
			content: string;
			sender: "bot" | "user";
		}[]
	>([]);
	const selectedLanguage = ref("en"); // Default language
	const newMessage = ref("");
	const loadingChannel = ref(false);
	const loadingMessage = ref(false);

	async function getAllChannels() {
		if (!isAuth.value) return;

		loadingChannel.value = true;
		const response = await fetchWithAuth(`${API_URL}/channels/`);
		loadingChannel.value = false;
		if (response?.ok) {
			channels.value = await response.json();
		} else showError("Failed to get channels");
	}

	async function createChannel() {
		if (!isAuth.value) return;

		const response = await fetchWithAuth(`${API_URL}/channels/`, {
			method: "POST",
		});
		if (response?.ok) {
			const channel = await response.json();
			selectedChannelId.value = channel.id;
			channels.value.push({ ...channel, history: [] });
			history.value = [];
		} else showError("Failed to create channel");
	}

	async function getHistory() {
		if (!isAuth.value) return;
		loadingChannel.value = true;
		const response = await fetchWithAuth(
			`${API_URL}/channels/${selectedChannelId.value}`,
			{
				method: "GET",
			},
		);
		loadingChannel.value = false;
		if (response?.ok) {
			history.value = (await response.json()).history;
		} else showError("Failed to get history");
	}

	async function sendMessage(scrollFunc: Function = () => {}) {
		if (!isAuth.value) return;
		const content = newMessage.value.trim();
		if (!content) return;

		// Add user message
		history.value.push({ content, sender: "user" });
		newMessage.value = "";
		loadingMessage.value = true;
		if (!selectedChannelId.value) {
			await createChannel();
			if (!selectedChannelId.value) {
				console.error("Failed to create channel");
				return;
			}
		}
		scrollFunc();

		const response = await fetchWithAuth(
			`${API_URL}/channels/${selectedChannelId.value}/chats`,
			{
				method: "POST",
				body: JSON.stringify({
					content,
					use_ai: true,
				}),
			},
		);
		if (response?.ok) {
			const data = await response.json();
			history.value.push(data);
		} else showError("Failed to send message");
		loadingMessage.value = false;
		scrollFunc();
	}

	return {
		selectedChannelId,
		channelIds,
		channels,
		history,
		loadingChannel,
		loadingMessage,
		getAllChannels,
		createChannel,
		getHistory,
		sendMessage,
		selectedLanguage,
		newMessage,
	};
});
