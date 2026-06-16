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
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	NumberField,
	NumberFieldContent,
	NumberFieldDecrement,
	NumberFieldIncrement,
	NumberFieldInput,
} from '@/components/ui/number-field';
import { Spinner } from '@/components/ui/spinner';
import PomodoroSettingsFields, { type PomodoroSettings } from './PomodoroSettingsFields.vue';
import type { RoomInfo } from '@/stores/pomodoroRooms';

const { t } = useI18n();

const open = defineModel<boolean>({ default: false });
const emit = defineEmits<{ created: [room: RoomInfo] }>();

const buildApiUrl = (path: string) =>
	`${runtimeConfig.public.API_URL}/v2/pomodoro-rooms${path}`;

const creatingRoom = ref(false);
const error = ref<string | null>(null);

const defaultSettings = (): PomodoroSettings => ({
	pomodoro_study_time: 25,
	pomodoro_rest_time: 5,
	pomodoro_long_rest_time: 20,
	long_rest_time_interval: 3,
});

const createRoomForm = ref<{
	room_name: string;
	limit: number;
	pomodoro_settings: PomodoroSettings;
}>({
	room_name: '',
	limit: 5,
	pomodoro_settings: defaultSettings(),
});

const resetForm = () => {
	createRoomForm.value = {
		room_name: '',
		limit: 5,
		pomodoro_settings: defaultSettings(),
	};
	error.value = null;
};

// Reset the form whenever the dialog is opened so stale values don't linger.
watch(open, (isOpen) => {
	if (isOpen) resetForm();
});

const createRoom = async () => {
	if (!createRoomForm.value.room_name.trim()) {
		error.value = t('pomodoroRoom.errors.room_name_required', { default: 'Room name is required' });
		return;
	}

	try {
		creatingRoom.value = true;
		error.value = null;

		const response = await api.post(buildApiUrl('/'), {
			room_name: createRoomForm.value.room_name.trim(),
			limit: createRoomForm.value.limit,
			pomodoro_settings: {
				pomodoro_study_time: createRoomForm.value.pomodoro_settings.pomodoro_study_time * 60,
				pomodoro_rest_time: createRoomForm.value.pomodoro_settings.pomodoro_rest_time * 60,
				pomodoro_long_rest_time: createRoomForm.value.pomodoro_settings.pomodoro_long_rest_time * 60,
				long_rest_time_interval: createRoomForm.value.pomodoro_settings.long_rest_time_interval,
			},
		});

		if (!response || !response.ok) {
			throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
		}

		const createdRoom = await response.json();
		resetForm();
		open.value = false;
		emit('created', createdRoom);
	} catch (err: any) {
		error.value = err.message || t('pomodoroRoom.errors.create_failed', { default: 'Failed to create room' });
		console.error('Error creating room:', err);
	} finally {
		creatingRoom.value = false;
	}
};
</script>

<template lang="pug">
Dialog(v-model:open="open")
	form
		DialogTrigger(as-child)
			Button(variant="default") {{ $t('pomodoroRoom.create_room', { default: 'Create room' }) }}
		DialogContent(class="sm:max-w-[425px]")
			DialogHeader
				DialogTitle {{ $t('pomodoroRoom.createDialog.title') }}
			div(class="grid gap-4")
				div(v-if="error" class="text-red-500 dark:text-red-400 text-sm") {{ error }}
				//- Room name
				div(class="grid gap-3")
					Label(for="name-1")
						| {{ $t('pomodoroRoom.createDialog.room_name_label') }}
						span(class="text-red-500") *
					Input(
						id="name-1" name="room name"
						v-model="createRoomForm.room_name"
						:placeholder="$t('pomodoroRoom.createDialog.room_name_placeholder')"
						@keyup.enter="createRoom"
					)
				//- Limit
				NumberField(id="limit" v-model="createRoomForm.limit" :default-value="5" :min="1" :max="10")
					Label(for="limit")
						| {{ $t('pomodoroRoom.createDialog.limit_label') }}
						span(class="text-gray-500") &nbsp(1-10)
					NumberFieldContent
						NumberFieldDecrement
						NumberFieldInput
						NumberFieldIncrement

				//- Pomodoro settings
				PomodoroSettingsFields(:settings="createRoomForm.pomodoro_settings")
			DialogFooter
				DialogClose(as-child)
					Button(variant="outline" :disabled="creatingRoom") {{ $t('pomodoroRoom.createDialog.cancel') }}
				Button(
					type="submit"
					:disabled="creatingRoom || !createRoomForm.room_name.trim()"
					@click="createRoom"
				)
					Spinner(v-if="creatingRoom")
					| {{ creatingRoom ? $t('pomodoroRoom.createDialog.creating') : $t('pomodoroRoom.createDialog.create') }}
</template>
