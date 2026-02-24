<template lang="pug">
ResizablePanelGroup(
  direction="horizontal"
  class="fixed z-40 right-0 h-full md:p-4"
  :style="{ width: panelWidth }"
)
  ResizablePanel(
    :default-size="70"
    :min-size="0"
  )
  ResizableHandle
  ResizablePanel(
    :default-size="30"
    :min-size="30"
    :max-size="100"
  )
    section(class="w-full h-full")
      slot(name="extra-content")
      div(class="flex flex-col h-full overflow-hidden rounded-none shadow-lg bg-surface-light text-surface-onlight md:rounded-xl md:dark:ring-1 dark:ring-surface-ondark dark:ring-opacity-20 ring-inset dark:bg-surface-dark dark:text-surface-ondark" :style="{ 'padding-top': `${mobileSettingsStore.padding.top}px`, 'padding-bottom': `${mobileSettingsStore.padding.bottom}px` }")
        h1(class="px-4 mt-4 text-xl font-bold uppercase")
          slot(name="header-icon")
          span {{ $t(`${panelName}.heading`) }}
          ControlButton(
            :aria-label="$t('settings.buttons.close')"
            default-style
            circle
            :importance="ButtonImportance.Text"
            class="float-right -mt-2 -mr-2"
            tabindex="0"
            @click="closePanel"
          )
            CloseIcon(:aria-label="$t('settings.buttons.close')")
        hr(v-if="useDivider" class="mx-5 mt-2")
        div(class="flex-grow overflow-y-auto")
          Transition(tag="div" name="tab-transition" mode="out-in" class="relative w-full")
            div(class="grid grid-cols-1 gap-2 pt-3 px-1 h-full")
              LoginTab(v-if="requireAuth && !isAuth")
              slot(v-else name="content")
</template>

<style lang="scss" scoped>
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

<script setup lang="ts">
import { useMobileSettings } from "@/stores/platforms/mobileSettings"; // Changed to relative path
import { useAuthStore } from "@/stores/auth"; // Changed to relative path
import { useOpenPanels } from "@/stores/openpanels"; // Changed to relative path

import {
	XIcon as CloseIcon,
} from "vue-tabler-icons";

import { ButtonImportance } from "@/components/base/types/button";
import ControlButton from "@/components/base/uiButton.vue"; // Changed to relative path
import LoginTab from "@/components/common/loginTab.vue"; // Changed to relative path
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable"

const props = defineProps({
	panelName: {
		type: String,
		required: true,
	},
	requireAuth: {
		type: Boolean,
		default: false,
	},
	useDivider: {
		type: Boolean,
		default: false,
	},
});
const { isAuth } = useAuthStore();
const openPanels = useOpenPanels();
const mobileSettingsStore = useMobileSettings();
const closePanel = () => openPanels.value[props.panelName] = false
</script>
