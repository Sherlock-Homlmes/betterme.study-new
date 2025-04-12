<template>
<!-- TODO: fix css for light/dark theme -->
  <!-- Main container: full height, flex column, theme background and text -->
  <div class="flex flex-col h-full overflow-hidden bg-surface-light text-surface-onlight dark:bg-surface-dark dark:text-surface-ondark">
    <!-- Language Selector: Temporarily disabled -->
    <!--
    <div class="p-2 text-right border-b bg-surface-variant-light dark:bg-surface-variant-dark border-outline-light dark:border-outline-dark">
      <select v-model="selectedLanguage" class="p-1 rounded bg-surface-light dark:bg-surface-dark border border-outline-light dark:border-outline-dark text-sm">
        <option value="en">English</option>
        <option value="vi">Vietnamese</option>
        <-- Add more languages as needed -- >
      </select>
    </div>
    -->
      <div v-if='loadingChannel && loadingChannelDebounced' class='flex-grow overflow-y-auto justify-center content-center'>
          <LoaderIcon class="animate-spin" size="30" stroke-width="1.5" />
          <p class="text-md">{{ $t('ai.just_a_sec') }}</p>
      </div>
    <!-- history Container: grow, scrollable, padding, flex column -->
    <div class="flex-grow overflow-y-auto p-3 flex flex-col gap-3" ref="messagesContainer" v-else>
      <!-- Individual Message: padding, rounded corners, max width -->
      <div v-for="(message, index) in history" :key="index"
           :class="[
             'p-2 px-3 rounded-3xl break-words',
             message.sender === 'user'
               ? 'bg-primary dark:bg-primary-dark text-white dark:text-primary-darkon max-w-[70%] self-end rounded-br-sm'
               : 'bg-gray-800 max-w-full text-white self-start rounded-bl-sm'
           ]">

        <p class="text-sm" v-html="messageContent(botNewAnswer)" v-if='botNewAnswerIdx === index'></p>
        <p class="text-sm" v-html="messageContent(message.content)" v-else></p>
      </div>
      <div v-if="loadingMessage" class="p-2 px-3 rounded-3xl max-w-[70%] break-words bg-gray-800 text-white self-start rounded-bl-sm flex items-center">
        <LoaderIcon class="mr-2 animate-spin" size="16" stroke-width="1.5" />
        <p class="text-sm">{{ $t('ai.just_a_sec') }}</p>
      </div>
    </div>

    <div class="flex items-center p-2 border-t bg-surface-light dark:bg-surface-dark border-outline-light dark:border-outline-dark">
      <!-- Input field: grow, padding, border, rounded -->
      <input
        v-model="newMessage"
        type="text"
        :placeholder="$t('ai.type_message')"
        @keyup.enter="sendMsg"
        class="flex-grow p-2 border rounded bg-surface-light dark:bg-surface-dark border-outline-light dark:border-outline-dark mr-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-light dark:focus:ring-primary-dark"
        autofocus
      />
      <button @click="sendMsg" class="p-2 px-4 rounded disabled:bg-gray-100 disabled:text-gray-300 bg-primary dark:bg-primary-dark text-white dark:text-primary-darkon dark:text-on-primary-dark hover:opacity-90 text-sm" :disabled='loadingMessage || loadingChannel || botNewAnswerIdx'>
        <!-- {{ $t('ai.buttons.send') }} -->
        <SendIcon/>

      </button>
      <button v-if='history.length >= 2' @click="deleteChannel" class="ml-1 p-2 px-4 rounded disabled:bg-gray-100 disabled:text-gray-300 bg-primary dark:bg-primary-dark text-white dark:text-primary-darkon dark:text-on-primary-dark hover:opacity-90 text-sm" :disabled='loadingMessage || loadingChannel || botNewAnswerIdx'>
        <TrashIcon/>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed, watch } from "vue";
import { LoaderIcon, TrashIcon, SendIcon, UploadIcon } from "vue-tabler-icons";
import { useAuthStore } from "../../stores/auth"; // Changed to relative path
import { useAIChatStore } from "../../stores/aichat"; // Changed to relative path
import { marked } from "marked"; // Changed to relative path
import { useOpenPanels } from "../../stores/openpanels"; // Changed to relative path
import { watchOnce, watchArray, refDebounced } from "@vueuse/core";

const { isAuth } = useAuthStore();
const openPanels = useOpenPanels();
const {
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
} = useAIChatStore();
// not show loading if the load time is low
const loadingChannelDebounced = refDebounced(loadingChannel, 1500);
const botNewAnswer = ref();
const botNewAnswerIdx = ref();

const sendMsg = async () => {
	if (botNewAnswerIdx.value) return;
	await sendMessage(scrollToBottom);
};

// Set animation to bot answer
const typeMessage = (message: string) => {
	let i = 0;
	botNewAnswer.value = "";
	const intervalId = setInterval(() => {
		if (i < message.length) {
			botNewAnswer.value += message[i];
			i++;
			scrollToBottom();
		} else {
			clearInterval(intervalId);
			botNewAnswerIdx.value = null;
		}
	}, 0.5);
};

watchArray(
	() => history.value,
	(newList, _oldList, added, _removed) => {
		if (!newList.length) {
			history.value.push({
				content: "Hello! How can I help you today?",
				sender: "bot",
			});
			return;
		}

		if (added.length != 1 || added[0].sender != "bot") return;
		botNewAnswerIdx.value = newList.length - 1;
		typeMessage(added[0].content);
	},
	{ immediate: true, deep: true },
);

// Scroll to bottom of the chat
const messagesContainer = ref<HTMLElement | null>(null);
const scrollToBottom = () => {
	nextTick(() => {
		if (messagesContainer.value) {
			messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
		}
	});
};

// MVP
// TODO: file upload

// V1
// TODO: advanced config
// V2
// TODO: voice recognition and answer
// V3
// TODO: monitor sharing and answer

// UX improve
// TODO: cancel button while bot answering
// TODO: scroll down button

// performance improve
// TODO: add pagination to chat history

// Convert markdown to html
const messageContent = (markdown: string) => {
	if (!markdown) return "";
	return marked(markdown);
};

// Handle when panel open
watchOnce(
	() => openPanels.ai,
	async () => {
		await getAllChannels();
		if (!channels.value.length) await createChannel();
		if (!selectedChannelId.value)
			selectedChannelId.value = channels.value[0].id;
		await getHistory();
		scrollToBottom();
	},
);
</script>

<!-- <style scoped> block removed as Tailwind classes are used -->
