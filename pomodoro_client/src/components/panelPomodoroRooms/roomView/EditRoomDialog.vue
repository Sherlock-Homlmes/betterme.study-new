<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { api } from '@/utils/betterFetch';
import { runtimeConfig } from '@/config/runtimeConfig';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import PomodoroSettingsFields, { type PomodoroSettings } from './PomodoroSettingsFields.vue';
import type { RoomInfo } from '@/stores/pomodoroRooms';

const props = defineProps<{ room: RoomInfo }>();
const { t } = useI18n();

const open = defineModel<boolean>({ default: false });

const buildApiUrl = (path: string) =>
	`${runtimeConfig.public.API_URL}/v2/pomodoro-rooms${path}`;

const updatingRoom = ref(false);
const error = ref<string | null>(null);

const editRoomForm = ref<{ room_name: string; pomodoro_settings: PomodoroSettings }>({
	room_name: '',
	pomodoro_settings: {
		pomodoro_study_time: 25,
		pomodoro_rest_time: 5,
		pomodoro_long_rest_time: 20,
		long_rest_time_interval: 3,
	},
});

// Populate the form whenever the dialog opens.
watch(open, (isOpen) => {
	if (!isOpen) return;
	editRoomForm.value = {
		room_name: props.room.room_name,
		pomodoro_settings: {
			pomodoro_study_time: Math.floor((props.room.pomodoro_settings?.pomodoro_study_time || 25 * 60) / 60),
			pomodoro_rest_time: Math.floor((props.room.pomodoro_settings?.pomodoro_rest_time || 5 * 60) / 60),
			pomodoro_long_rest_time: Math.floor((props.room.pomodoro_settings?.pomodoro_long_rest_time || 20 * 60) / 60),
			long_rest_time_interval: props.room.pomodoro_settings?.long_rest_time_interval || 3,
		},
	};
	error.value = null;
});

const updateRoom = async () => {
	if (!editRoomForm.value.room_name.trim()) {
		error.value = t('pomodoroRoom.errors.room_name_required', { default: 'Room name is required' });
		return;
	}

	try {
		updatingRoom.value = true;
		error.value = null;

		const response = await api.patch(buildApiUrl(`/${props.room.livekit_room_name}`), {
			room_name: editRoomForm.value.room_name.trim(),
			pomodoro_settings: {
				pomodoro_study_time: editRoomForm.value.pomodoro_settings.pomodoro_study_time * 60,
				pomodoro_rest_time: editRoomForm.value.pomodoro_settings.pomodoro_rest_time * 60,
				pomodoro_long_rest_time: editRoomForm.value.pomodoro_settings.pomodoro_long_rest_time * 60,
				long_rest_time_interval: editRoomForm.value.pomodoro_settings.long_rest_time_interval,
			},
		});

		if (!response || !response.ok) {
			throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
		}

		open.value = false;
	} catch (err: any) {
		error.value = err.message || t('pomodoroRoom.errors.update_failed', { default: 'Failed to update room' });
		console.error('Error updating room:', err);
	} finally {
		updatingRoom.value = false;
	}
};
</script>

<template lang="pug">
Dialog(v-model:open="open")
	form
		DialogContent(class="sm:max-w-[425px]")
			DialogHeader
				DialogTitle {{ $t('pomodoroRoom.editDialog.title', { default: 'Edit Room' }) }}
			div(class="grid gap-4")
				div(v-if="error" class="text-red-500 dark:text-red-400 text-sm") {{ error }}
				//- Room name
				div(class="grid gap-3")
					Label(for="edit-room-name")
						| {{ $t('pomodoroRoom.createDialog.room_name_label', { default: 'Room name' }) }}
						span(class="text-red-500") *
					Input(
						id="edit-room-name" name="room name"
						v-model="editRoomForm.room_name"
						:placeholder="$t('pomodoroRoom.createDialog.room_name_placeholder', { default: 'Enter room name' })"
						@keyup.enter="updateRoom"
					)

				PomodoroSettingsFields(:settings="editRoomForm.pomodoro_settings")
			DialogFooter
				DialogClose(as-child)
					Button(variant="outline" :disabled="updatingRoom") {{ $t('pomodoroRoom.createDialog.cancel', { default: 'Cancel' }) }}
				Button(
					type="submit"
					:disabled="updatingRoom || !editRoomForm.room_name.trim()"
					@click="updateRoom"
				)
					Spinner(v-if="updatingRoom")
					| {{ updatingRoom ? $t('pomodoroRoom.editDialog.updating', { default: 'Updating...' }) : $t('pomodoroRoom.editDialog.update', { default: 'Update' }) }}
</template>
