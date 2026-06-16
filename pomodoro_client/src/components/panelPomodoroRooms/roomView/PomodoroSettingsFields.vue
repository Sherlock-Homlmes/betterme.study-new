<script setup lang="ts">
import { Label } from '@/components/ui/label';
import {
	NumberField,
	NumberFieldContent,
	NumberFieldDecrement,
	NumberFieldIncrement,
	NumberFieldInput,
} from '@/components/ui/number-field';

export interface PomodoroSettings {
	pomodoro_study_time: number;
	pomodoro_rest_time: number;
	pomodoro_long_rest_time: number;
	long_rest_time_interval: number;
}

// Reactive object passed by reference — nested mutations flow back to the parent form.
defineProps<{ settings: PomodoroSettings }>();
</script>

<template lang="pug">
div(class="border-t border-gray-200 dark:border-gray-700 pt-4")
	h4(class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3")
		| {{ $t('pomodoroRoom.createDialog.pomodoro_settings_label', { default: 'Pomodoro Settings' }) }}

	//- Study time
	NumberField(id="study_time" class="mb-2" v-model.number="settings.pomodoro_study_time" :min="5" :max="180")
		Label(for="study_time")
			| {{ $t('pomodoroRoom.createDialog.study_time_label', { default: 'Study time' }) }}
			span(class="text-gray-500") &nbsp({{ $t('pomodoroRoom.minutes', { default: 'minutes' }) }})
		NumberFieldContent
			NumberFieldDecrement
			NumberFieldInput
			NumberFieldIncrement

	//- Rest time
	NumberField(id="rest_time" class="mb-2" v-model.number="settings.pomodoro_rest_time" :min="1" :max="180")
		Label(for="rest_time")
			| {{ $t('pomodoroRoom.createDialog.rest_time_label', { default: 'Rest time' }) }}
			span(class="text-gray-500") &nbsp({{ $t('pomodoroRoom.minutes', { default: 'minutes' }) }})
		NumberFieldContent
			NumberFieldDecrement
			NumberFieldInput
			NumberFieldIncrement

	//- Long rest time
	NumberField(id="long_rest_time" class="mb-2" v-model.number="settings.pomodoro_long_rest_time" :min="1" :max="180")
		Label(for="long_rest_time")
			| {{ $t('pomodoroRoom.createDialog.long_rest_time_label', { default: 'Long rest time' }) }}
			span(class="text-gray-500") &nbsp({{ $t('pomodoroRoom.minutes', { default: 'minutes' }) }})
		NumberFieldContent
			NumberFieldDecrement
			NumberFieldInput
			NumberFieldIncrement

	//- Long rest interval
	NumberField(id="long_rest_interval" v-model.number="settings.long_rest_time_interval" :min="2" :max="10")
		Label(for="long_rest_interval")
			| {{ $t('pomodoroRoom.createDialog.long_rest_interval_label', { default: 'Long rest interval' }) }}
			span(class="text-gray-500") &nbsp(2-10)
		NumberFieldContent
			NumberFieldDecrement
			NumberFieldInput
			NumberFieldIncrement
</template>
