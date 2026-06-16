<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { UsersIcon, TrashIcon } from 'vue-tabler-icons';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import type { RoomInfo } from '@/stores/pomodoroRooms';

const props = defineProps<{
	room: RoomInfo;
	isCurrent: boolean;
	canDelete: boolean;
	deleting: boolean;
}>();

const emit = defineEmits<{
	select: [];
	delete: [room: RoomInfo, event: Event];
}>();

const { t } = useI18n();

const isRoomFull = (room: RoomInfo) => room.num_participants >= room.limit;

const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);

	if (diffMins < 1) return t('pomodoroRoom.time.just_now', { default: 'Just now' });
	if (diffMins < 60) return t('pomodoroRoom.time.mins_ago', { mins: diffMins }, { default: `${diffMins}m ago` });

	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return t('pomodoroRoom.time.hours_ago', { hours: diffHours }, { default: `${diffHours}h ago` });

	const diffDays = Math.floor(diffHours / 24);
	return t('pomodoroRoom.time.days_ago', { days: diffDays }, { default: `${diffDays}d ago` });
};

const onCardClick = () => {
	if (!isRoomFull(props.room)) emit('select');
};

const onDelete = (event: Event) => {
	event.stopPropagation();
	emit('delete', props.room, event);
};
</script>

<template lang="pug">
div(
	class="p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md"
	:class="isCurrent ? 'hover:bg-primary-container dark:hover:bg-primary-darkcontainer bg-surface-variant dark:bg-surface-darkvariant border-primary-500 dark:border-primary-500' : (isRoomFull(room) ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500')"
	@click="onCardClick"
)
	//- Room header
	div(class="flex items-start justify-between mb-2")
		div(class="flex items-center gap-2 flex-1 min-w-0")
			h3(class="font-semibold text-gray-900 dark:text-gray-100 truncate")
				| {{ room.room_name }}
		div(class="flex items-center gap-2 flex-shrink-0")
			div(
				class="px-2 py-1 text-xs rounded-full"
				:class="isRoomFull(room) ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'"
			)
				| {{ isRoomFull(room) ? $t('pomodoroRoom.full', { default: 'Full' }) : $t('pomodoroRoom.available', { default: 'Available' }) }}
			//- Delete button — only visible for room creator
			button(
				v-if="canDelete"
				@click="onDelete"
				:disabled="deleting"
				class="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
				:title="$t('pomodoroRoom.delete_room', { default: 'Delete room' })"
			)
				TrashIcon(:size="14")

	//- Room info
	div(class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400")
		//- Participants
		div(class="flex items-center gap-1")
			UsersIcon(:size="16")
			span
				| {{ room.num_participants }}/{{ room.limit }}

		//- Pomodoro settings
		ButtonGroup(v-if="room.pomodoro_settings" class="ml-auto")
			Button(variant="outline" size="sm" class="h-6 px-2 text-xs")
				| {{ Math.floor(room.pomodoro_settings.pomodoro_study_time / 60) }}m
			Button(variant="outline" size="sm" class="h-6 px-2 text-xs")
				| {{ Math.floor(room.pomodoro_settings.pomodoro_rest_time / 60) }}m

		//- Created time
		div
			| {{ formatDate(room.created_at) }}

	//- Full room message
	div(v-if="isRoomFull(room)" class="mt-2 text-xs text-red-600 dark:text-red-400")
		| {{ $t('pomodoroRoom.room_full_message', { default: 'This room is full. Please try another room.' }) }}
</template>
