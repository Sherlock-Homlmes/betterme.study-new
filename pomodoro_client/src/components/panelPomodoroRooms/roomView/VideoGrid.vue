<script setup lang="ts">
import { watch } from 'vue';
import { RemoteParticipant, Track } from 'livekit-client';
import {
  VideoIcon,
  MicrophoneIcon,
  VideoOffIcon,
  DeviceDesktopIcon
} from 'vue-tabler-icons';
import { useI18n } from 'vue-i18n';
import { usePomodoroRoomsStore } from '@/stores/pomodoroRooms';

const { t } = useI18n();
const store = usePomodoroRoomsStore();

const {
  localVideoRef,
  localParticipant,
  isCameraEnabled,
  isMicEnabled,
  isScreenShareEnabled,
  participants,
  totalParticipants,
  getLocalParticipantAvatar,
  getParticipantAvatar
} = store;

// Watch for local video ref changes
watch(localVideoRef, (newRef) => {
  if (newRef && localParticipant.value && isCameraEnabled.value) {
    const videoTrackPublication = localParticipant.value.getTrackPublication(Track.Source.Camera);
    if (videoTrackPublication?.videoTrack) {
      videoTrackPublication.videoTrack.attach(newRef);
    }
  }
});

// Handle avatar loading error
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent) {
    parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
  }
};
</script>

<template lang="pug">
div(class="p-4 overflow-y-auto h-full")
  div(
    class="grid gap-3"
    :class="totalParticipants <= 1 ? 'grid-cols-1' : totalParticipants <= 4 ? 'grid-cols-2' : 'grid-cols-3'"
  )
    // Local participant
    div(
      v-if="localParticipant"
      class="relative bg-gray-900 rounded-lg overflow-hidden aspect-video"
      :class="isCameraEnabled || isMicEnabled ? 'ring-2 ring-primary-300' : ''"
    )
      video(
        ref="localVideoRef"
        autoplay
        playsinline
        muted
        class="w-full h-full object-cover"
        :class="{ 'hidden': !isCameraEnabled }"
      )
      // Placeholder when camera is off
      div(
        v-if="!isCameraEnabled"
        class="absolute inset-0 flex items-center justify-center bg-gray-800"
      )
        div(
          v-if="getLocalParticipantAvatar()"
          class="w-24 h-24 rounded-full bg-gray-700 overflow-hidden"
        )
          img(
            :src="getLocalParticipantAvatar()"
            :alt="$t('pomodoroRoom.you', { default: 'You' })"
            class="w-full h-full object-cover"
            @error="handleAvatarError"
          )
        div(
          v-else
          class="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center"
        )
          MicrophoneIcon(v-if="isMicEnabled" :size="48" class="text-green-400")
          VideoOffIcon(v-else :size="48" class="text-gray-400")
      
      // Local participant label
      div(class="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded text-white text-xs flex items-center gap-1")
        VideoIcon(v-if="isCameraEnabled" :size="12" class="text-green-400")
        MicrophoneIcon(v-if="isMicEnabled && !isCameraEnabled" :size="12" class="text-green-400")
        DeviceDesktopIcon(v-if="isScreenShareEnabled" :size="12" class="text-blue-400")
        span {{ $t('pomodoroRoom.you', { default: 'You' }) }}
    
    // Remote participants
    div(
      v-for="participant in participants"
      :key="participant.identity"
      class="relative bg-gray-900 rounded-lg overflow-hidden aspect-video"
      :class="{ 'ring-2 ring-green-500': participant.isSpeaking }"
    )
      // The video element will be attached by LiveKit
      div(:id="`remote-${participant.identity}`" class="w-full h-full")
      
      // Avatar placeholder when camera is off
      div(
        v-if="!participant.isCameraEnabled"
        class="absolute inset-0 flex items-center justify-center bg-gray-800"
      )
        div(
          v-if="getParticipantAvatar(participant)"
          class="w-24 h-24 rounded-full bg-gray-700 overflow-hidden"
        )
          img(
            :src="getParticipantAvatar(participant)"
            :alt="participant.name || participant.identity"
            class="w-full h-full object-cover"
            @error="handleAvatarError"
          )
        div(
          v-else
          class="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center"
        )
          MicrophoneIcon(v-if="participant.isMicrophoneEnabled" :size="48" class="text-green-400")
          VideoOffIcon(v-else :size="48" class="text-gray-400")
      
      // Speaking indicator
      div(
        v-if="participant.isSpeaking"
        class="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full animate-pulse"
      )
        | {{ $t('pomodoroRoom.speaking', { default: 'Speaking' }) }}
      
      // Participant label
      div(class="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded text-white text-xs flex items-center gap-1")
        VideoIcon(v-if="participant.isCameraEnabled" :size="12" class="text-green-400")
        MicrophoneIcon(v-if="participant.isMicrophoneEnabled && !participant.isCameraEnabled" :size="12" class="text-green-400")
        DeviceDesktopIcon(v-if="participant.isScreenShareEnabled" :size="12" class="text-blue-400")
        span {{ participant.name || participant.identity }}
</template>
