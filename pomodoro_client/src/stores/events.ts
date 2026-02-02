import { ref, computed, watch } from "vue";
import { createGlobalState } from "@vueuse/core";

export const useEvents = createGlobalState(() => {
	const events = ref<Event[]>([]);
	const maxEventsToKeep = ref<number>(200);

	const lastEvent = computed(() => events.value.length > 0 ? events.value[events.value.length - 1] : null)

	const recordEvent = (eventType: EventType, eventData: unknown = undefined) => {
		events.value.push(
			new Event(eventType, { data: eventData, timestamp: new Date() }),
		);
		events.value.splice(0, events.value.length - maxEventsToKeep.value);
	}
	return {
		events,
		maxEventsToKeep,
		lastEvent,
		recordEvent,
	}
});

export enum EventType {
	FOCUS_GAIN = "focus.gain",
	FOCUS_LOST = "focus.lost",
	TIMER_START = "timer.start",
	TIMER_PAUSE = "timer.pause",
	TIMER_STOP = "timer.stop",
	TIMER_FINISH = "timer.complete",
	SCHEDULE_ADVANCE_MANUAL = "schedule.adv.manual",
	SCHEDULE_ADVANCE_AUTO = "schedule.adv.auto",
	APP_STARTED = "app.start",
	APP_ERROR = "app.error",
	NOTIFICATIONS_ENABLED = "permission.notification",
	OTHER = "other",
}

export class Event {
	_timestamp: Date;
	_event: EventType;

	/** Any additional payload for the event can be added here */
	_data?: unknown;

	constructor(
		eventType = EventType.OTHER,
		{ data = undefined, timestamp = new Date() },
	) {
		this._timestamp = timestamp;
		this._event = eventType;

		if (data !== undefined) {
			this._data = data;
		}
	}
}
