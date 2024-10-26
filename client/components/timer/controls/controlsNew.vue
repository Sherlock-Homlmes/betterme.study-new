<script setup lang="ts">
import { PlayerPlayIcon, PlayerPauseIcon, PlayerStopIcon, PlayerTrackNextIcon } from 'vue-tabler-icons'
import { ButtonImportance, ButtonTheme } from '~~/components/base/types/button'
import CButton from '~~/components/base/uiButton.vue'
import { TimerState, useSchedule, ScheduleItemType } from '~~/stores/schedule'
import {usePomodoroStore} from '~~/stores/pomodoros'
import {useAuthStore} from '~~/stores/auth'
import { computed } from 'vue'

const {getCurrentUserSetting} = useAuthStore()
const {startPomodoro, pomodoroSectionAction, deletePomodoro} = usePomodoroStore()
const scheduleStore = useSchedule()

const reset = async () => {
  if (
    scheduleStore.timerState !== TimerState.COMPLETED
    && scheduleStore.getSchedule[0].timeElapsed > scheduleStore.getSchedule[0].length
  ) {
    if(scheduleStore.isWorking) await deletePomodoro()
    scheduleStore.timerState = TimerState.COMPLETED
  } else {
    if(scheduleStore.isWorking) await deletePomodoro()
    scheduleStore.timerState = TimerState.STOPPED
  }
}

const playPause = async () => {
  if(scheduleStore.isWorking){
    if(scheduleStore.timerState === TimerState.STOPPED){
      try{
        await startPomodoro()
      }
      catch(e){
        await deletePomodoro()
        await startPomodoro()
      }
    }
    else if(scheduleStore.timerState === TimerState.RUNNING){
      await pomodoroSectionAction("PAUSED")
    }
    else if(scheduleStore.timerState === TimerState.PAUSED){
      await pomodoroSectionAction("STARTED")
    }
    else if(scheduleStore.timerState === TimerState.COMPLETED){
      await pomodoroSectionAction("COMPLETED")
      await advance()
      return
    }
  }

  scheduleStore.timerState = scheduleStore.timerState === TimerState.RUNNING ? TimerState.PAUSED : TimerState.RUNNING
}

const advance = async () => {
  if(scheduleStore.isWorking && scheduleStore.timerState !== TimerState.COMPLETED) await deletePomodoro()
  scheduleStore.timerState = TimerState.STOPPED
  scheduleStore.advance()
}
</script>

<template>
  <div class="flex items-center justify-center gap-5 md:gap-8">
    <CButton
      circle
      inner-class="p-5"
      :theme="ButtonTheme.Secondary"
      :importance="ButtonImportance.Filled"
      class="h-16 transition"
      :class="{ 'scale-0 opacity-0 pointer-events-none' : !scheduleStore.isRunning }"
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
      <PlayerPlayIcon v-if="scheduleStore.timerState !== TimerState.RUNNING" :size="28" />
      <PlayerPauseIcon v-else :size="28" />
    </CButton>

    <CButton
      v-if='scheduleStore.timerState !== TimerState.COMPLETED'
      :aria-label="$t('controls.advance')"
      circle
      inner-class="p-5"
      :theme="ButtonTheme.Secondary"
      :importance="ButtonImportance.Filled"
      class="h-16 transition"
      :class="{ 'scale-0 opacity-0 pointer-events-none' : scheduleStore.timerState === TimerState.RUNNING }"
      @click="advance()"
    >
      <PlayerTrackNextIcon :size="24" />
    </CButton>
  </div>
</template>
