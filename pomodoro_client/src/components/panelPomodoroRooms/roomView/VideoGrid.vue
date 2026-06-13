<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue';
import {
  VideoIcon,
  MicrophoneIcon,
  MicrophoneOffIcon,
  VideoOffIcon,
  DeviceDesktopIcon,
  DeviceDesktopOffIcon,
  LogoutIcon,
  VolumeIcon,
  VolumeOffIcon,
  MaximizeIcon,
} from 'vue-tabler-icons';
import { useI18n } from 'vue-i18n';
import { usePomodoroRoomsStore } from '@/stores/pomodoroRooms';
import DeviceSelector from './DeviceSelector.vue';

const { t } = useI18n();
const store = usePomodoroRoomsStore();

const {
  localVideoRef,
  localScreenShareRef,
  localParticipant,
  isCameraEnabled,
  isMicEnabled,
  isScreenShareEnabled,
  isSpeakerEnabled,
  participants,
  totalParticipants,
  activeSpeakerIdentities,
  remoteVideoRefs,
  getLocalParticipantAvatar,
  getParticipantAvatar,
  toggleMicrophone,
  toggleCamera,
  toggleSpeaker,
  toggleScreenShare,
} = store;

const emit = defineEmits<{
  showLeaveDialog: [];
}>();

// ── Pinned tile ───────────────────────────────────────────────────────────────
// 'local' | 'local-ss' | 'remote-{id}' | 'ss-{id}'
const pinnedId = ref<string | null>(null);

const togglePin = async (id: string) => {
  pinnedId.value = pinnedId.value === id ? null : id;
  await nextTick();
  reattachVideos();
};

// After DOM switch (grid ↔ spotlight), re-insert imperatively managed video els
const reattachVideos = () => {
  participants.value.forEach(p => {
    const cam = remoteVideoRefs.value.get(p.identity);
    const camBox = document.getElementById(`remote-${p.identity}`);
    if (cam && camBox && !camBox.contains(cam)) {
      camBox.innerHTML = '';
      camBox.appendChild(cam);
    }
    const ss = remoteVideoRefs.value.get(`screen-share-${p.identity}`);
    const ssBox = document.getElementById(`screenshare-${p.identity}`);
    if (ss && ssBox && !ssBox.contains(ss)) {
      ssBox.innerHTML = '';
      ssBox.appendChild(ss);
    }
  });
};

// When participants leave while pinned, unpin them
watch(participants, (list) => {
  if (!pinnedId.value) return;
  const id = pinnedId.value;
  if (id.startsWith('remote-') || id.startsWith('ss-')) {
    const identity = id.startsWith('remote-') ? id.slice(7) : id.slice(3);
    if (!list.find(p => p.identity === identity)) pinnedId.value = null;
  }
});

// ── Local video watchers ──────────────────────────────────────────────────────
watch(localVideoRef, (el) => {
  if (el && localParticipant.value && isCameraEnabled.value) {
    const pub = localParticipant.value.getTrackPublication('camera');
    if (pub?.videoTrack) pub.videoTrack.attach(el);
  }
});

watch(localScreenShareRef, (el) => {
  if (el && localParticipant.value && isScreenShareEnabled.value) {
    const pub = localParticipant.value.getTrackPublication('screen_share');
    if (pub?.videoTrack) pub.videoTrack.attach(el);
  }
});

// ── Avatar fallback ───────────────────────────────────────────────────────────
const handleAvatarError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = 'none';
};

// ── Computed tile counts (for grid columns) ───────────────────────────────────
const screenShareCount = computed(() =>
  participants.value.filter(p => p.isScreenShareEnabled).length + (isScreenShareEnabled.value ? 1 : 0)
);
const tileCount = computed(() => totalParticipants.value + screenShareCount.value);
const gridCols = computed(() =>
  tileCount.value <= 1 ? 'grid-cols-1' : tileCount.value <= 4 ? 'grid-cols-2' : 'grid-cols-3'
);

// ── Pinned participant helper ─────────────────────────────────────────────────
const pinnedRemoteIdentity = computed(() => {
  if (pinnedId.value?.startsWith('remote-')) return pinnedId.value.slice(7);
  return null;
});
const pinnedSsIdentity = computed(() => {
  if (pinnedId.value?.startsWith('ss-')) return pinnedId.value.slice(3);
  return null;
});
const pinnedParticipant = computed(() =>
  participants.value.find(p =>
    p.identity === pinnedRemoteIdentity.value || p.identity === pinnedSsIdentity.value
  ) ?? null
);
</script>

<template lang="pug">
div(class="flex flex-col h-full")

  //- ── Video area ─────────────────────────────────────────────────────────────
  div(class="flex-grow min-h-0 overflow-hidden")

    //- ════════ SPOTLIGHT MODE ════════
    div(
      v-if="pinnedId"
      class="flex flex-row h-full gap-2 p-3"
    )
      //- Main featured tile (left, large)
      div(
        class="flex-1 min-w-0 relative rounded-xl overflow-hidden bg-gray-900 cursor-pointer"
        @click="togglePin(pinnedId)"
        :title="'Click to unpin'"
      )
        //- LOCAL CAMERA
        template(v-if="pinnedId === 'local' && localParticipant")
          video(ref="localVideoRef" autoplay playsinline muted class="w-full h-full object-cover" :class="{ hidden: !isCameraEnabled }")
          div(v-if="!isCameraEnabled" class="absolute inset-0 flex items-center justify-center bg-gray-800")
            div(v-if="getLocalParticipantAvatar()" class="w-28 h-28 rounded-full overflow-hidden")
              img(:src="getLocalParticipantAvatar()" class="w-full h-full object-cover" @error="handleAvatarError")
            div(v-else class="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center")
              VideoOffIcon(:size="56" class="text-gray-400")
          div(class="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded-lg text-white text-xs flex items-center gap-1.5")
            VideoIcon(v-if="isCameraEnabled" :size="12" class="text-green-400")
            MicrophoneIcon(v-if="isMicEnabled" :size="12" class="text-green-400")
            span {{ t('pomodoroRoom.you') }}

        //- LOCAL SCREEN SHARE
        template(v-else-if="pinnedId === 'local-ss'")
          video(ref="localScreenShareRef" autoplay playsinline muted class="w-full h-full object-contain bg-black")
          div(class="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded-lg text-white text-xs flex items-center gap-1.5")
            DeviceDesktopIcon(:size="12" class="text-blue-400")
            span {{ t('pomodoroRoom.your_screen') }}

        //- REMOTE CAMERA
        template(v-else-if="pinnedRemoteIdentity && pinnedParticipant")
          div(:id="`remote-${pinnedRemoteIdentity}`" class="w-full h-full")
          div(v-if="!pinnedParticipant.isCameraEnabled" class="absolute inset-0 flex items-center justify-center bg-gray-800 pointer-events-none")
            div(v-if="getParticipantAvatar(pinnedParticipant)" class="w-28 h-28 rounded-full overflow-hidden")
              img(:src="getParticipantAvatar(pinnedParticipant)" class="w-full h-full object-cover" @error="handleAvatarError")
            div(v-else class="w-28 h-28 rounded-full bg-gray-700 flex items-center justify-center text-white text-4xl font-semibold")
              | {{ (pinnedParticipant.name || pinnedParticipant.identity)[0]?.toUpperCase() }}
          div(class="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded-lg text-white text-xs flex items-center gap-1.5 pointer-events-none")
            VideoIcon(v-if="pinnedParticipant.isCameraEnabled" :size="12" class="text-green-400")
            MicrophoneIcon(v-if="pinnedParticipant.isMicrophoneEnabled" :size="12" class="text-green-400")
            span {{ pinnedParticipant.name || pinnedParticipant.identity }}
          div(v-if="pinnedParticipant.isSpeaking" class="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs rounded-full animate-pulse pointer-events-none")
            | {{ t('pomodoroRoom.speaking') }}

        //- REMOTE SCREEN SHARE
        template(v-else-if="pinnedSsIdentity && pinnedParticipant")
          div(:id="`screenshare-${pinnedSsIdentity}`" class="w-full h-full bg-black")
          div(class="absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded-lg text-white text-xs flex items-center gap-1.5 pointer-events-none")
            DeviceDesktopIcon(:size="12" class="text-blue-400")
            span {{ pinnedParticipant.name || pinnedParticipant.identity }}'s screen

        //- Unpin hint overlay
        div(class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20 pointer-events-none")
          div(class="px-3 py-1.5 bg-black/70 rounded-lg text-white text-sm")
            | Click to unpin

      //- Thumbnail strip (right, fixed width)
      div(class="w-[9.5rem] flex flex-col gap-2 overflow-y-auto flex-shrink-0 py-1 pr-1")

        //- local camera thumbnail
        div(
          v-if="localParticipant && pinnedId !== 'local'"
          class="relative rounded-lg overflow-hidden aspect-video bg-gray-900 cursor-pointer flex-shrink-0 ring-1 ring-white/20 hover:ring-white/60 transition-all group"
          @click="togglePin('local')"
        )
          div(class="w-full h-full flex items-center justify-center bg-gray-800")
            div(v-if="getLocalParticipantAvatar()" class="w-8 h-8 rounded-full overflow-hidden")
              img(:src="getLocalParticipantAvatar()" class="w-full h-full object-cover" @error="handleAvatarError")
            div(v-else class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium")
              | {{ localParticipant.name?.[0]?.toUpperCase() || 'Y' }}
          div(class="absolute bottom-1 left-1.5 text-white text-[10px] px-1 py-0.5 bg-black/60 rounded truncate max-w-[calc(100%-8px)]")
            | {{ t('pomodoroRoom.you') }}
          div(class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30")
            MaximizeIcon(:size="14" class="text-white")

        //- local screen share thumbnail
        div(
          v-if="isScreenShareEnabled && pinnedId !== 'local-ss'"
          class="relative rounded-lg overflow-hidden aspect-video bg-gray-800 cursor-pointer flex-shrink-0 ring-1 ring-blue-400/50 hover:ring-blue-400 transition-all group"
          @click="togglePin('local-ss')"
        )
          div(class="w-full h-full flex items-center justify-center")
            DeviceDesktopIcon(:size="22" class="text-blue-400")
          div(class="absolute bottom-1 left-1.5 text-white text-[10px] px-1 py-0.5 bg-black/60 rounded")
            | Screen
          div(class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30")
            MaximizeIcon(:size="14" class="text-white")

        //- remote camera thumbnails
        div(
          v-for="p in participants"
          :key="`thumb-${p.identity}`"
          v-show="pinnedId !== `remote-${p.identity}`"
          class="relative rounded-lg overflow-hidden aspect-video bg-gray-900 cursor-pointer flex-shrink-0 ring-1 ring-white/20 hover:ring-white/60 transition-all group"
          :class="activeSpeakerIdentities.has(p.identity) ? '!ring-green-400' : ''"
          @click="togglePin(`remote-${p.identity}`)"
        )
          div(class="w-full h-full flex items-center justify-center bg-gray-800")
            div(v-if="getParticipantAvatar(p)" class="w-8 h-8 rounded-full overflow-hidden")
              img(:src="getParticipantAvatar(p)" class="w-full h-full object-cover" @error="handleAvatarError")
            div(v-else class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium")
              | {{ (p.name || p.identity)[0]?.toUpperCase() }}
          div(v-if="activeSpeakerIdentities.has(p.identity)" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400 animate-pulse")
          div(class="absolute bottom-1 left-1.5 text-white text-[10px] px-1 py-0.5 bg-black/60 rounded truncate max-w-[calc(100%-8px)]")
            | {{ p.name || p.identity }}
          div(class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30")
            MaximizeIcon(:size="14" class="text-white")

        //- remote screen share thumbnails
        template(v-for="p in participants" :key="`ss-thumb-${p.identity}`")
          div(
            v-if="p.isScreenShareEnabled && pinnedId !== `ss-${p.identity}`"
            class="relative rounded-lg overflow-hidden aspect-video bg-gray-800 cursor-pointer flex-shrink-0 ring-1 ring-blue-400/50 hover:ring-blue-400 transition-all group"
            @click="togglePin(`ss-${p.identity}`)"
          )
            div(class="w-full h-full flex items-center justify-center")
              DeviceDesktopIcon(:size="22" class="text-blue-400")
            div(class="absolute bottom-1 left-1.5 text-white text-[10px] px-1 py-0.5 bg-black/60 rounded truncate max-w-[calc(100%-8px)]")
              | {{ p.name || p.identity }}'s screen
            div(class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30")
              MaximizeIcon(:size="14" class="text-white")

    //- ════════ NORMAL GRID MODE ════════
    div(
      v-else
      class="grid gap-3 p-3 h-full content-start overflow-y-auto"
      :class="gridCols"
    )
      //- local camera tile
      div(
        v-if="localParticipant"
        class="relative bg-gray-900 rounded-xl overflow-hidden aspect-video cursor-pointer group"
        :class="isCameraEnabled || isMicEnabled ? 'ring-2 ring-primary/50' : ''"
        @click="togglePin('local')"
      )
        video(ref="localVideoRef" autoplay playsinline muted class="w-full h-full object-cover" :class="{ hidden: !isCameraEnabled }")
        div(v-if="!isCameraEnabled" class="absolute inset-0 flex items-center justify-center bg-gray-800")
          div(v-if="getLocalParticipantAvatar()" class="w-20 h-20 rounded-full overflow-hidden")
            img(:src="getLocalParticipantAvatar()" class="w-full h-full object-cover" @error="handleAvatarError")
          div(v-else class="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center")
            VideoOffIcon(:size="40" class="text-gray-400")
        div(class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-white text-xs flex items-center gap-1")
          VideoIcon(v-if="isCameraEnabled" :size="11" class="text-green-400")
          MicrophoneIcon(v-if="isMicEnabled" :size="11" class="text-green-400")
          DeviceDesktopIcon(v-if="isScreenShareEnabled" :size="11" class="text-blue-400")
          span {{ t('pomodoroRoom.you') }}
        //- hover overlay
        div(class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25")
          MaximizeIcon(:size="28" class="text-white drop-shadow-lg")

      //- local screen share tile
      div(
        v-if="isScreenShareEnabled"
        class="relative bg-gray-900 rounded-xl overflow-hidden aspect-video cursor-pointer group ring-2 ring-blue-500/60"
        @click="togglePin('local-ss')"
      )
        video(ref="localScreenShareRef" autoplay playsinline muted class="w-full h-full object-contain bg-black")
        div(class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-white text-xs flex items-center gap-1")
          DeviceDesktopIcon(:size="11" class="text-blue-400")
          span {{ t('pomodoroRoom.your_screen') }}
        div(class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25")
          MaximizeIcon(:size="28" class="text-white drop-shadow-lg")

      //- remote camera tiles
      div(
        v-for="p in participants"
        :key="p.identity"
        class="relative bg-gray-900 rounded-xl overflow-hidden aspect-video cursor-pointer group transition-all"
        :class="activeSpeakerIdentities.has(p.identity) ? 'ring-2 ring-green-400 shadow-lg shadow-green-500/20' : ''"
        @click="togglePin(`remote-${p.identity}`)"
      )
        div(:id="`remote-${p.identity}`" class="w-full h-full")
        div(v-if="!p.isCameraEnabled" class="absolute inset-0 flex items-center justify-center bg-gray-800")
          div(v-if="getParticipantAvatar(p)" class="w-20 h-20 rounded-full overflow-hidden")
            img(:src="getParticipantAvatar(p)" class="w-full h-full object-cover" @error="handleAvatarError")
          div(v-else class="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-white text-3xl font-semibold")
            | {{ (p.name || p.identity)[0]?.toUpperCase() }}
        div(v-if="p.isSpeaking" class="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full animate-pulse")
          | {{ t('pomodoroRoom.speaking') }}
        div(class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-white text-xs flex items-center gap-1")
          VideoIcon(v-if="p.isCameraEnabled" :size="11" class="text-green-400")
          MicrophoneIcon(v-if="p.isMicrophoneEnabled && !p.isCameraEnabled" :size="11" class="text-green-400")
          DeviceDesktopIcon(v-if="p.isScreenShareEnabled" :size="11" class="text-blue-400")
          span {{ p.name || p.identity }}
        div(class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25")
          MaximizeIcon(:size="28" class="text-white drop-shadow-lg")

      //- remote screen share tiles
      template(v-for="p in participants" :key="`ss-${p.identity}`")
        div(
          v-if="p.isScreenShareEnabled"
          class="relative bg-gray-900 rounded-xl overflow-hidden aspect-video cursor-pointer group ring-2 ring-blue-500/60"
          @click="togglePin(`ss-${p.identity}`)"
        )
          div(:id="`screenshare-${p.identity}`" class="w-full h-full")
          div(class="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-lg text-white text-xs flex items-center gap-1")
            DeviceDesktopIcon(:size="11" class="text-blue-400")
            span {{ p.name || p.identity }}'s screen
          div(class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25")
            MaximizeIcon(:size="28" class="text-white drop-shadow-lg")

  //- ── Controls bar ────────────────────────────────────────────────────────────
  div(class="relative flex items-center justify-center gap-3 p-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700")
    div(class="absolute left-4")
      DeviceSelector

    //- Microphone — ON: bg-primary white icon, OFF: white bg + primary border + primary icon
    button(
      type="button"
      :aria-label="isMicEnabled ? t('pomodoroRoom.mute_mic') : t('pomodoroRoom.unmute_mic')"
      class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      :class="isMicEnabled ? 'bg-primary text-white shadow-sm hover:brightness-110' : 'bg-white border-2 border-primary text-primary dark:bg-gray-900'"
      @click="toggleMicrophone"
    )
      MicrophoneIcon(v-if="isMicEnabled" :size="22")
      MicrophoneOffIcon(v-else :size="22")

    //- Camera — ON: bg-primary white icon, OFF: white bg + primary border + primary icon
    button(
      type="button"
      :aria-label="isCameraEnabled ? t('pomodoroRoom.turn_off_camera') : t('pomodoroRoom.turn_on_camera')"
      class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      :class="isCameraEnabled ? 'bg-primary text-white shadow-sm hover:brightness-110' : 'bg-white border-2 border-primary text-primary dark:bg-gray-900'"
      @click="toggleCamera"
    )
      VideoIcon(v-if="isCameraEnabled" :size="22")
      VideoOffIcon(v-else :size="22")

    //- Speaker — ON: bg-gray-600 white icon, OFF: white bg + gray-600 border + gray-600 icon
    button(
      type="button"
      :aria-label="isSpeakerEnabled ? t('pomodoroRoom.mute_speaker') : t('pomodoroRoom.unmute_speaker')"
      class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      :class="isSpeakerEnabled ? 'bg-primary text-white shadow-sm hover:brightness-110' : 'bg-white border-2 border-primary text-primary dark:bg-gray-900'"
      @click="toggleSpeaker"
    )
      VolumeIcon(v-if="isSpeakerEnabled" :size="22")
      VolumeOffIcon(v-else :size="22")

    //- Screen share — ON: bg-blue-500 white icon, OFF: white bg + blue-500 border + blue-500 icon
    button(
      type="button"
      :aria-label="isScreenShareEnabled ? t('pomodoroRoom.stop_screen_share') : t('pomodoroRoom.start_screen_share')"
      class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      :class="isScreenShareEnabled ? 'bg-primary text-white shadow-sm hover:brightness-110' : 'bg-white border-2 border-primary text-primary dark:bg-gray-900'"
      @click="toggleScreenShare"
    )
      DeviceDesktopIcon(v-if="isScreenShareEnabled" :size="22")
      DeviceDesktopOffIcon(v-else :size="22")

    //- Leave — always red filled
    button(
      type="button"
      :aria-label="t('pomodoroRoom.leave_room')"
      class="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-white shadow-sm hover:brightness-110 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      @click="emit('showLeaveDialog')"
    )
      LogoutIcon(:size="22")
</template>
