<script setup lang="ts">
import {
	MicrophoneIcon,
	MicrophoneOffIcon,
	VideoIcon,
	VideoOffIcon,
	DeviceDesktopIcon,
	DeviceDesktopOffIcon,
	VolumeIcon,
	VolumeOffIcon,
	LogoutIcon,
} from 'vue-tabler-icons';
import { useI18n } from 'vue-i18n';
import { usePomodoroRoomsStore } from '@/stores/pomodoroRooms';
import DeviceSelector from './DeviceSelector.vue';

const { t } = useI18n();
const {
	isCameraEnabled,
	isMicEnabled,
	isScreenShareEnabled,
	isSpeakerEnabled,
	toggleMicrophone,
	toggleCamera,
	toggleSpeaker,
	toggleScreenShare,
} = usePomodoroRoomsStore();

const emit = defineEmits<{ showLeaveDialog: [] }>();

const onBtn = 'bg-primary text-white shadow-sm hover:brightness-110';
const offBtn = 'bg-white border-2 border-primary text-primary dark:bg-gray-900';
const btnBase =
	'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
</script>

<template lang="pug">
div(class="relative flex items-center justify-center gap-3 p-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700")
	div(class="absolute left-4")
		DeviceSelector

	//- Microphone
	button(
		type="button"
		:aria-label="isMicEnabled ? t('pomodoroRoom.mute_mic') : t('pomodoroRoom.unmute_mic')"
		:class="[btnBase, isMicEnabled ? onBtn : offBtn]"
		@click="toggleMicrophone"
	)
		MicrophoneIcon(v-if="isMicEnabled" :size="22")
		MicrophoneOffIcon(v-else :size="22")

	//- Camera
	button(
		type="button"
		:aria-label="isCameraEnabled ? t('pomodoroRoom.turn_off_camera') : t('pomodoroRoom.turn_on_camera')"
		:class="[btnBase, isCameraEnabled ? onBtn : offBtn]"
		@click="toggleCamera"
	)
		VideoIcon(v-if="isCameraEnabled" :size="22")
		VideoOffIcon(v-else :size="22")

	//- Speaker
	button(
		type="button"
		:aria-label="isSpeakerEnabled ? t('pomodoroRoom.mute_speaker') : t('pomodoroRoom.unmute_speaker')"
		:class="[btnBase, isSpeakerEnabled ? onBtn : offBtn]"
		@click="toggleSpeaker"
	)
		VolumeIcon(v-if="isSpeakerEnabled" :size="22")
		VolumeOffIcon(v-else :size="22")

	//- Screen share
	button(
		type="button"
		:aria-label="isScreenShareEnabled ? t('pomodoroRoom.stop_screen_share') : t('pomodoroRoom.start_screen_share')"
		:class="[btnBase, isScreenShareEnabled ? onBtn : offBtn]"
		@click="toggleScreenShare"
	)
		DeviceDesktopIcon(v-if="isScreenShareEnabled" :size="22")
		DeviceDesktopOffIcon(v-else :size="22")

	//- Leave
	button(
		type="button"
		:aria-label="t('pomodoroRoom.leave_room')"
		:class="[btnBase, onBtn]"
		@click="emit('showLeaveDialog')"
	)
		LogoutIcon(:size="22")
</template>
