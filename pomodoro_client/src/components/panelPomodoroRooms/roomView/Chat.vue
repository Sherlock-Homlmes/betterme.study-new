<script setup lang="ts">
import { PaperclipIcon, GifIcon, MoodSmileIcon, SendIcon } from 'vue-tabler-icons';
import { usePomodoroRoomsStore, type ChatMessage } from '@/stores/pomodoroRooms';

const store = usePomodoroRoomsStore();

const {
  chatMessages,
  newMessage,
  messagesContainer,
  showGifPicker,
  showReactionPicker,
  fileInputRef,
  uploadingFile,
  localParticipant,
  commonGifs,
  commonReactions,
  sendTextMessage,
  sendFile,
  sendGif,
  sendReaction,
  formatFileSize
} = store;

// Handle file input change
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    sendFile(file);
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};
</script>

<template lang="pug">
div(class="flex flex-col border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-full")
  // Messages container
  div(
    ref="messagesContainer"
    class="flex-grow overflow-y-auto p-3 space-y-2"
  )
    div(
      v-for="message in chatMessages"
      :key="message.id"
      class="flex flex-col"
      :class="message.sender === localParticipant?.identity ? 'items-end' : 'items-start'"
    )
      // Sender name
      span(class="text-xs text-gray-500 dark:text-gray-400 mb-1")
        | {{ message.senderName }}
      
      // Message content
      div(
        class="max-w-[70%] px-3 py-2 rounded-2xl break-words"
        :class="message.sender === localParticipant?.identity ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'"
      )
        // Text message
        p(v-if="message.type === 'text'" class="text-sm")
          | {{ message.content }}
        
        // File message
        div(v-if="message.type === 'file'" class="flex flex-col gap-1")
          p(class="text-sm") {{ message.content }}
          a(
            v-if="message.fileUrl"
            :href="message.fileUrl"
            :download="message.fileName"
            class="text-xs underline flex items-center gap-1"
          )
            PaperclipIcon(:size="14")
            span {{ message.fileName }}
            span(v-if="message.fileSize" class="opacity-70") ({{ formatFileSize(message.fileSize) }})
        
        // GIF message
        div(v-if="message.type === 'gif'" class="flex flex-col gap-1")
          p(class="text-sm") {{ message.content }}
          img(
            v-if="message.gifUrl"
            :src="message.gifUrl"
            class="max-w-full h-auto rounded-lg"
            alt="GIF"
          )

  // Chat input
  div(class="flex items-center gap-2 p-2 border-t border-gray-200 dark:border-gray-700")
    // File upload
    div(class="relative")
      input(
        ref="fileInputRef"
        type="file"
        class="hidden"
        @change="handleFileChange"
      )
      button(
        @click="fileInputRef?.click()"
        :disabled="uploadingFile"
        class="py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
        :title="'Upload file'"
      )
        PaperclipIcon(:size="20")
    
    // GIF button
    div(class="relative")
      button(
        @click="showGifPicker = !showGifPicker"
        class="py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        :title="'Send GIF'"
      )
        GifIcon(:size="24")
      
      // GIF picker popup
      div(
        v-if="showGifPicker"
        class="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-2"
        style="width: 200px;"
      )
        img(
          v-for="(gif, index) in commonGifs"
          :key="index"
          :src="gif"
          class="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80"
          @click="sendGif(gif)"
          alt="GIF"
        )
    
    // Reaction button
    div(class="relative")
      button(
        @click="showReactionPicker = !showReactionPicker"
        class="py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        :title="'Send reaction'"
      )
        MoodSmileIcon(:size="20")
      
      // Reaction picker popup
      div(
        v-if="showReactionPicker"
        class="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-wrap gap-1"
        style="width: 200px;"
      )
        button(
          v-for="reaction in commonReactions"
          :key="reaction"
          @click="sendReaction(reaction); showReactionPicker = false"
          class="px-2 py-1 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-transform hover:scale-125"
          :title="'Send ' + reaction"
        )
          | {{ reaction }}
    
    // Message input
    input(
      v-model="newMessage"
      type="text"
      placeholder="Type a message..."
      @keyup.enter="sendTextMessage"
      class="flex-grow min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    )
    
    // Send button
    button(
      @click="sendTextMessage"
      :disabled="!newMessage.trim()"
      class="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      :title="'Send message'"
    )
      SendIcon(:size="20")
</template>
