<script setup lang="ts">
import { XIcon as CloseIcon, AdjustmentsIcon as TabIconGeneral, AlarmIcon as TabIconSchedule, ArtboardIcon as TabIconVisuals, InfoCircleIcon as InfoIcon, InfoCircleIcon as TabIconAbout } from 'vue-tabler-icons'

import { ButtonImportance } from '../base/types/button'
import ButtonControl from '~~/components/base/uiButton.vue'
import ThemeSettings from './theme/themeSettings.vue'
import OptionGroup from '@/components/base/optionGroup.vue'
import TabHeader from '@/components/settings/panel/tabHeader.vue'
import ExportButton from '@/components/settings/exportButton.vue'
import ImportButton from '@/components/settings/importButton.vue'

import AboutTab from '~~/components/settings/aboutTab.vue'
import LoginTab from '~~/components/settings/loginTab.vue'

import presetTimers from '~~/assets/settings/timerPresets'
import { useSettings } from '~~/stores/settings'
import { NotificationPermission, useNotifications } from '~~/stores/notifications'
import { useMobileSettings } from '~~/stores/platforms/mobileSettings'

import ControlButton from '~~/components/base/uiButton.vue'
import SettingsItem from '~~/components/settings/settingsItem.vue'
import SettingsItemV2 from '~~/components/settings/settingsItemV2.vue'
import Divider from '~~/components/base/uiDivider.vue'
import { useEvents } from '~~/stores/events'
import { useOpenPanels } from '~~/stores/openpanels'
import { Control } from '~~/components/settings/types/settingsItem'

import { useAuthStore } from '~~/stores/auth'

const runtimeConfig = useRuntimeConfig()
const {isAuth, userSettings} = useAuthStore()!
const eventsStore = useEvents()
const openPanels = useOpenPanels()
const mobileSettingsStore = useMobileSettings()
const notificationsStore = useNotifications()
const settingsStore = useSettings()
const isWeb = computed(() => runtimeConfig.public.PLATFORM === 'web')
const isMobile = computed(() => runtimeConfig.public.PLATFORM === 'mobile')

const state = reactive({
  activeTab: 1,
  resetConfirm: false
})

notificationsStore.updateEnabled()
</script>

<template>
  <section class="fixed z-40 w-full h-full p-0 md:p-4 md:max-w-screen-sm">
    <div class="flex flex-col h-full overflow-hidden rounded-none shadow-lg bg-surface-light text-surface-onlight md:rounded-xl md:dark:ring-1 dark:ring-surface-ondark dark:ring-opacity-20 ring-inset dark:bg-surface-dark dark:text-surface-ondark" :style="{ 'padding-top': `${mobileSettingsStore.padding.top}px`, 'padding-bottom': `${mobileSettingsStore.padding.bottom}px` }">
      <h1 class="px-4 mt-4 mb-2 text-xl font-bold uppercase">
        <span>{{ $t('settings.heading') }}</span>
        <ControlButton
          :aria-label="$t('settings.buttons.close')"
          default-style
          circle
          :importance="ButtonImportance.Text"
          class="float-right -mt-2 -mr-2"
          tabindex="0"
          @click="openPanels.settings = false"
        >
          <CloseIcon :aria-label="$t('settings.buttons.close')" />
        </ControlButton>
      </h1>
      <div class="flex-grow overflow-y-auto">
        <Transition tag="div" name="tab-transition" mode="out-in" class="relative w-full">
          <!-- Core settings -->
          <div v-if="state.activeTab === 1" :key="1" class="settings-tab">
            <template v-if="isWeb && !isAuth">
              <SettingsItem :type="Control.Empty" path="manage" />
              <div class="grid grid-flow-col grid-cols-12 gap-1 mt-1">
                <ButtonControl default-style :importance="ButtonImportance.Filled" @click='state.activeTab = 5' class="col-start-1 col-end-7">
                  <span v-text="$t('login')" />
                </ButtonControl>
                <span class="flex justify-center items-center">{{$t('or')}}</span>
                <div class="grid grid-flow-col grid-cols-2 gap-2 col-start-8 col-end-13">
                  <ExportButton />
                  <ImportButton />
                </div>
              </div>
            </template>

            <Divider />

            <OptionGroup
              :choices="$languages"
              :value="settingsStore.lang"
              :override-text="{ title: $languages, description: {} }"
              @input="(newLang) => { settingsStore.lang = newLang }"
            />
            <Divider />
            <SettingsItem :type="Control.Check" path="adaptiveTicking.enabled" />
            <!-- <SettingsItem v-if="isWeb" :type="Control.Check" path="timerControls.enableKeyboardShortcuts" /> -->
            <!-- <SettingsItem :type="Control.Option" path="sectionEndAction" :choices="{continue: 'continue', stop: 'stop', skip: 'skip'}" /> -->

            <template v-if="isWeb">
              <Divider />
              <SettingsItem :type="Control.Check" path="permissions.audio" />
              <SettingsItem
                :type="Control.Check"
                path="permissions.notifications"
                :disabled="notificationsStore.enabled === NotificationPermission.Denied"
                @input="(newValue) => {
                  if (newValue === true) {
                    eventsStore.recordEvent('permission.notification')
                  }
                }"
              />
            </template>

            <template v-if="isMobile">
              <Divider />
              <SettingsItem :type="Control.Check" path="mobile.notifications.sectionOver" />
              <SettingsItem :type="Control.Check" path="mobile.notifications.persistent" />
            </template>

          </div>

          <!-- Schedule -->
          <div v-else-if="state.activeTab === 2" :key="2" class="settings-tab">
            <SettingsItemV2 :type="Control.Number" path="pomodoro_settings.long_rest_time_interval" :min="1" :max="10" />
            <Divider />

            <SettingsItem
              :type="Control.Empty"
              path="schedule.lengths"
            >
              <OptionGroup
                translation-key="timerpreset"
                :choices="presetTimers"
                :value="settingsStore.getActiveSchedulePreset"
                @input="(newPreset) => settingsStore.applyPreset(newPreset)"
              />
            </SettingsItem>
            <SettingsItemV2 :type="Control.Time" path="pomodoro_settings.pomodoro_study_time" :min="5" />
            <SettingsItemV2 :type="Control.Time" path="pomodoro_settings.pomodoro_rest_time" :min="1" />
            <SettingsItemV2 :type="Control.Time" path="pomodoro_settings.pomodoro_long_rest_time" :min="1" />
            <div class="flex flex-row items-center px-3 py-4 space-x-2 rounded-lg ring-inset ring ring-primary bg-primary/20 dark:bg-gray-700 dark:text-gray-100">
              <InfoIcon />
              <span v-text="$t('settings.scheduleMinTime')" />
            </div>
          </div>

          <!-- Display -->
          <div v-else-if="state.activeTab === 3" :key="3" class="settings-tab">
            <SettingsItem :type="Control.Empty" path="visuals.theme" />
            <ThemeSettings />
            <SettingsItemV2 :type="Control.Check" path="visuals.dark_mode" />
            <Divider />
            <!-- <SettingsItem :type="Control.Option" path="currentTimer" :choices="{traditional: 'traditional', approximate: 'approximate', percentage: 'percentage'}" /> -->
            <SettingsItemV2 :type="Control.Option" path="visuals.timer_show" :choices="{traditional: 'traditional', approximate: 'approximate', percentage: 'percentage'}" />
            <SettingsItemV2 :type="Control.Check" path="visuals.show_progress_bar" />
            <!-- TODO Audio volume control -->
          </div>

          <!-- About page -->
          <div v-else-if="state.activeTab === 4" :key="4" class="settings-tab">
            <AboutTab />
          </div>

          <!-- Login page -->
          <div v-else-if="state.activeTab === 5" :key="5" class="settings-tab h-full">
            <LoginTab />
          </div>
        </Transition>
      </div>

      <!-- Tab bar -->
      <div class="flex flex-row flex-none h-20 p-4">
        <!-- TODO: refactor -->
        <TabHeader :active="state.activeTab === 1" :text="$t('settings.tabs.main')" @click="state.activeTab = 1">
          <template #icon>
            <TabIconGeneral role="presentation" />
          </template>
        </TabHeader>
        <TabHeader :active="state.activeTab === 2" :text="$t('settings.tabs.timer')" @click="state.activeTab = 2">
          <template #icon>
            <TabIconSchedule role="presentation" />
          </template>
        </TabHeader>
        <TabHeader :active="state.activeTab === 3" :text="$t('settings.tabs.display')" @click="state.activeTab = 3">
          <template #icon>
            <TabIconVisuals role="presentation" />
          </template>
        </TabHeader>
        <TabHeader :active="state.activeTab === 4" :text="$t('settings.tabs.about')" @click="state.activeTab = 4">
          <template #icon>
            <TabIconAbout role="presentation" />
          </template>
        </TabHeader>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
div.settings-tab {
  @apply grid grid-cols-1 gap-2 py-3 px-4;
}

// ===== TAB TRANSITIONS =====
.tab-transition-enter-active,
.tab-transition-leave-active {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
  // transition: opacity 0.5s ease-out;
  position: relative;
}

.tab-transition-enter-from {
  transform: translateY(10px);
  opacity: 0;
}

.tab-transition-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
