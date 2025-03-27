<script setup lang="ts">
import {
	PlayerPlayIcon,
	PlayerPauseIcon,
	PlayerStopIcon,
	PlayerTrackNextIcon,
} from "vue-tabler-icons";
import { ButtonImportance, ButtonTheme } from "~~/components/base/types/button";
import CButton from "~~/components/base/uiButton.vue";
import { TimerState, usePomodoroStore } from "~~/stores/pomodoros";
import { useAuthStore } from "~~/stores/auth";
import { computed } from "vue";

const { getCurrentUserSetting } = useAuthStore();
const {
	startPomodoro,
	pomodoroSectionAction,
	deletePomodoro,
	isWorking,
	isRunning,
	timerState,
	getCurrentItem,
	advance: advanceStore,
} = usePomodoroStore();

const reset = async () => {
	if (
		timerState.value !== TimerState.COMPLETED &&
		getCurrentItem.value.timeElapsed > getCurrentItem.value.length
	) {
		if (isWorking.value) await deletePomodoro();
		timerState.value = TimerState.COMPLETED;
	} else {
		if (isWorking.value) await deletePomodoro();
		timerState.value = TimerState.STOPPED;
	}
};

const playPause = async () => {
	if (isWorking.value) {
		if (timerState.value === TimerState.STOPPED) {
			try {
				await startPomodoro();
			} catch (e) {
				await deletePomodoro();
				await startPomodoro();
			}
		} else if (timerState.value === TimerState.RUNNING) {
			await pomodoroSectionAction("PAUSED");
		} else if (timerState.value === TimerState.PAUSED) {
			await pomodoroSectionAction("STARTED");
		} else if (timerState.value === TimerState.COMPLETED) {
			await pomodoroSectionAction("COMPLETED");
			await advance();
			return;
		}
	} else {
		if (timerState.value === TimerState.COMPLETED) {
			await advance();
			return;
		}
	}

	timerState.value =
		timerState.value === TimerState.RUNNING
			? TimerState.PAUSED
			: TimerState.RUNNING;
};

const advance = async () => {
	if (isWorking.value && timerState.value !== TimerState.COMPLETED)
		await deletePomodoro();
	timerState.value = TimerState.STOPPED;
	advanceStore();
};
</script>

<template>
  <div class="flex items-center justify-center gap-5 md:gap-8">
    <CButton
      circle
      inner-class="p-5"
      :theme="ButtonTheme.Secondary"
      :importance="ButtonImportance.Filled"
      class="h-16 transition"
      :class="{ 'scale-0 opacity-0 pointer-events-none' : !isRunning }"
      :aria-label="$t('controls.stop')"
      @click="reset"
    >
      <PlayerStopIcon :size="24" />
    </CButton>

    <CButton
      :aria-label="$t('controls.play')"
      inner-class="p-6 px-8 transition"
      bg-class="rounded-full"
      class="h-20 w-28"
      :theme="ButtonTheme.NeutralDark"
      :importance="ButtonImportance.Filled"
      @click="playPause"
    >
      <PlayerPlayIcon v-if="timerState !== TimerState.RUNNING" :size="28" />
      <PlayerPauseIcon v-else :size="28" />
    </CButton>

    <CButton
      v-if='timerState !== TimerState.COMPLETED'
      :aria-label="$t('controls.advance')"
      circle
      inner-class="p-5"
      :theme="ButtonTheme.Secondary"
      :importance="ButtonImportance.Filled"
      class="h-16 transition"
      :class="{ 'scale-0 opacity-0 pointer-events-none' : timerState === TimerState.RUNNING }"
      @click="advance()"
    >
      <PlayerTrackNextIcon :size="24" />
    </CButton>
  </div>
</template>
