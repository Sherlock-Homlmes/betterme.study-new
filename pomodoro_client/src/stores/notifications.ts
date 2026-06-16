import { reactive } from "vue";
import { createGlobalState } from "@vueuse/core";

export enum NotificationPermission {
	Default,
	Granted,
	Denied,
	NotSupported,
}

export const useNotifications = createGlobalState(() => {
	const state = reactive<{ enabled: NotificationPermission }>({
		enabled: NotificationPermission.Default,
	});

	const updateEnabled = (manualValue?: NotificationPermission) => {
		if (manualValue !== undefined) {
			state.enabled = manualValue;
			return;
		}

		if (typeof window !== "undefined" && window.Notification) {
			const permissions = window.Notification.permission;
			switch (permissions) {
				case "default":
					state.enabled = NotificationPermission.Default;
					break;
				case "granted":
					state.enabled = NotificationPermission.Granted;
					break;
				default:
					state.enabled = NotificationPermission.Denied;
			}
		} else {
			state.enabled = NotificationPermission.NotSupported;
		}
	};

	return { ...state, updateEnabled } as {
		enabled: NotificationPermission;
		updateEnabled: (manualValue?: NotificationPermission) => void;
	};
});
