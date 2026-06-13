<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  VideoIcon, VideoOffIcon, MicrophoneIcon, MicrophoneOffIcon,
  ChevronLeftIcon, UsersIcon
} from 'vue-tabler-icons';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import ControlButton from '@/components/base/uiButton.vue';
import { ButtonImportance } from '@/components/base/types/button';
import { type RoomInfo } from '@/stores/pomodoroRooms';

const { t } = useI18n();

const props = defineProps<{
  room: RoomInfo;
}>();

const emit = defineEmits<{
  join: [camEnabled: boolean, micEnabled: boolean];
  back: [];
}>();

const localStream = ref<MediaStream | null>(null);
const previewVideoRef = ref<HTMLVideoElement | null>(null);
const camEnabled = ref(false);
const micEnabled = ref(false);
const camError = ref(false);
const micError = ref(false);

const startPreviewCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    localStream.value = stream;
    camEnabled.value = true;
    camError.value = false;
    if (previewVideoRef.value) {
      previewVideoRef.value.srcObject = stream;
    }
  } catch {
    camError.value = true;
    camEnabled.value = false;
  }
};

const stopPreviewCamera = () => {
  if (localStream.value) {
    localStream.value.getVideoTracks().forEach(t => t.stop());
    localStream.value = null;
  }
  camEnabled.value = false;
  if (previewVideoRef.value) previewVideoRef.value.srcObject = null;
};

const toggleCam = async () => {
  if (camEnabled.value) {
    stopPreviewCamera();
  } else {
    await startPreviewCamera();
  }
};

const toggleMic = async () => {
  if (micEnabled.value) {
    micEnabled.value = false;
    micError.value = false;
  } else {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      micEnabled.value = true;
      micError.value = false;
    } catch {
      micError.value = true;
      micEnabled.value = false;
    }
  }
};

const handleJoin = () => {
  stopPreviewCamera();
  emit('join', camEnabled.value, micEnabled.value);
};

onMounted(async () => {
  await startPreviewCamera();
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    micEnabled.value = true;
  } catch {
    micError.value = true;
  }
});

onUnmounted(() => {
  stopPreviewCamera();
});
</script>

<template lang="pug">
div(class="flex flex-col h-full items-center justify-center px-4 py-6 gap-6")
  // Room info
  div(class="text-center")
    h2(class="text-lg font-semibold text-gray-900 dark:text-gray-100")
      | {{ room.room_name }}
    div(class="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1")
      UsersIcon(:size="14")
      span {{ room.num_participants }}/{{ room.limit }}
      span(v-if="room.pomodoro_settings" class="ml-2")
        | · {{ Math.floor(room.pomodoro_settings.pomodoro_study_time / 60) }}m / {{ Math.floor(room.pomodoro_settings.pomodoro_rest_time / 60) }}m

  // Camera preview
  div(class="w-full max-w-sm aspect-video bg-gray-900 rounded-xl overflow-hidden relative")
    video(
      v-show="camEnabled"
      ref="previewVideoRef"
      autoplay
      playsinline
      muted
      class="w-full h-full object-cover scale-x-[-1]"
    )
    div(
      v-if="!camEnabled"
      class="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 gap-2"
    )
      VideoOffIcon(:size="40" class="text-gray-400")
      span(v-if="camError" class="text-xs text-red-400") {{ t('pomodoroRoom.lobby.cam_error', { default: 'Camera not available' }) }}
      span(v-else class="text-xs text-gray-400") {{ t('pomodoroRoom.lobby.cam_off', { default: 'Camera is off' }) }}

    // Controls overlay on preview
    div(class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-3")
      ControlButton(
        :aria-label="camEnabled ? 'Turn off camera' : 'Turn on camera'"
        default-style circle
        :importance="camEnabled ? ButtonImportance.Primary : ButtonImportance.Secondary"
        @click="toggleCam"
      )
        VideoIcon(v-if="camEnabled" :size="20")
        VideoOffIcon(v-else :size="20")

      ControlButton(
        :aria-label="micEnabled ? 'Mute mic' : 'Unmute mic'"
        default-style circle
        :importance="micEnabled ? ButtonImportance.Primary : ButtonImportance.Secondary"
        @click="toggleMic"
      )
        MicrophoneIcon(v-if="micEnabled" :size="20")
        MicrophoneOffIcon(v-else :size="20")

  // Status indicators
  div(class="flex gap-4 text-sm text-gray-600 dark:text-gray-400")
    div(class="flex items-center gap-1.5")
      div(class="w-2 h-2 rounded-full" :class="camEnabled ? 'bg-green-500' : 'bg-gray-400'")
      span {{ camEnabled ? t('pomodoroRoom.lobby.cam_on', { default: 'Camera on' }) : t('pomodoroRoom.lobby.cam_off', { default: 'Camera off' }) }}
    div(class="flex items-center gap-1.5")
      div(class="w-2 h-2 rounded-full" :class="micEnabled ? 'bg-green-500' : 'bg-gray-400'")
      span {{ micEnabled ? t('pomodoroRoom.lobby.mic_on', { default: 'Mic on' }) : t('pomodoroRoom.lobby.mic_off', { default: 'Mic off' }) }}

  // Actions
  div(class="flex gap-3 w-full max-w-sm")
    ControlButton(
      :aria-label="'Back'"
      default-style circle
      :importance="ButtonImportance.Text"
      @click="emit('back')"
    )
      ChevronLeftIcon(:size="20")
    Button(class="flex-1" @click="handleJoin")
      | {{ t('pomodoroRoom.lobby.join_now', { default: 'Join now' }) }}
</template>
