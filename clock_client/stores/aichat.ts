import { createGlobalState } from "@vueuse/core";
import { ref } from "vue";
import { useAuthStore } from "~/stores/auth";

export const useAIChatStore = createGlobalState(() => {
	const API_URL = useRuntimeConfig().public.API_URL;
	const { showError } = useErrorStore();
	const { isAuth } = useAuthStore();

	const selectedChannelId = useLocalStorage<string | null>(
		"selectedChannelId",
		null,
	);
	const channels = useLocalStorage("AIChatChannels", []);
	const channelIds = computed(() =>
		channels.value.map((channel) => channel.id),
	);
	const history = computed<
		{
			id?: string;
			content: string;
			sender: "bot" | "user";
		}[]
	>({
		get() {
			const channelInfo = channels.value.find(
				(channel) => channel.id === selectedChannelId.value,
			);
			return channelInfo?.history ?? [];
		},
		set(newVal) {
			const channelInfo = channels.value.find(
				(channel) => channel.id === selectedChannelId.value,
			);
			channelInfo.history = newVal;
		},
	});
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
		console.log(channels.value.length);
		if (channels.value.length >= 13) {
			showError(
				"You've reached the channel limit. Close unused channels to continue.",
			);
			return;
		}
		const emptyChannel = channels.value.find(
			(channel) => channel.history?.length <= 1,
		);
		if (emptyChannel) {
			selectedChannelId.value = emptyChannel.id;
			return;
		}

		const response = await fetchWithAuth(`${API_URL}/channels/`, {
			method: "POST",
		});
		if (response?.ok) {
			const channel = await response.json();
			selectedChannelId.value = channel.id;
			channels.value = [{ ...channel, history: [] }].concat(channels.value);
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

	async function sendMessage() {
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
		scrollToBottom();

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
		scrollToBottom();
	}

	async function deleteChannel() {
		if (!isAuth.value) return;
		if (history.value.length <= 1) return;
		const response = await fetchWithAuth(
			`${API_URL}/channels/${selectedChannelId.value}`,
			{ method: "DELETE" },
		);
		if (response?.ok) {
			if (channels.value.length <= 1) await createChannel();
			else {
				selectedChannelId.value = channels.value[0].id;
			}
			channels.value = channels.value.filter(
				(channel) => channel.id === selectedChannelId.value,
			);
		} else showError("Failed to delete channel");
		loadingMessage.value = false;
	}

	// Scroll to bottom of the chat
	const messagesContainer = ref<HTMLElement | null>(null);
	const scrollToBottom = () => {
		nextTick(() => {
			if (messagesContainer.value) {
				messagesContainer.value.scrollTop =
					messagesContainer.value.scrollHeight;
			}
		});
	};

	watch(selectedChannelId, async (newSelectedChannelId) => {
		const channelInfo = channels.value.find(
			(channel) => channel.id === newSelectedChannelId,
		);
		if (channelInfo) history.value = channelInfo.history;
		else await getHistory();
		scrollToBottom();
	});

	return {
		selectedChannelId,
		channelIds,
		channels,
		history,
		loadingChannel,
		loadingMessage,
		getAllChannels,
		createChannel,
		deleteChannel,
		getHistory,
		sendMessage,
		newMessage,
		messagesContainer,
		scrollToBottom,
	};
});
