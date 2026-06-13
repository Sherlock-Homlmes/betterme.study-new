<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ChevronUpIcon } from 'vue-tabler-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { usePomodoroRoomsStore } from '@/stores/pomodoroRooms';

const { getAvailableDevices, switchDevice } = usePomodoroRoomsStore();

const cameras = ref<MediaDeviceInfo[]>([]);
const microphones = ref<MediaDeviceInfo[]>([]);
const speakers = ref<MediaDeviceInfo[]>([]);

const selectedCamera = ref('');
const selectedMic = ref('');
const selectedSpeaker = ref('');

onMounted(async () => {
  cameras.value = await getAvailableDevices('videoinput');
  microphones.value = await getAvailableDevices('audioinput');
  speakers.value = await getAvailableDevices('audiooutput');
});

const handleSelectCamera = async (deviceId: string) => {
  await switchDevice('videoinput', deviceId);
  selectedCamera.value = deviceId;
};

const handleSelectMic = async (deviceId: string) => {
  await switchDevice('audioinput', deviceId);
  selectedMic.value = deviceId;
};

const handleSelectSpeaker = async (deviceId: string) => {
  await switchDevice('audiooutput', deviceId);
  selectedSpeaker.value = deviceId;
};
</script>

<template lang="pug">
DropdownMenu
  DropdownMenuTrigger(as-child)
    button(
      class="p-1.5 rounded-full hover:bg-white/10 transition-colors"
      :title="'Device settings'"
    )
      ChevronUpIcon(:size="14" class="text-white")

  DropdownMenuContent(align="center" side="top" class="w-64")
    // Camera devices
    DropdownMenuLabel(v-if="cameras.length" class="text-xs text-gray-500") Camera
    DropdownMenuItem(
      v-for="device in cameras"
      :key="device.deviceId"
      @click="handleSelectCamera(device.deviceId)"
      class="text-xs"
      :class="selectedCamera === device.deviceId ? 'font-semibold' : ''"
    )
      span(class="truncate") {{ device.label || 'Camera ' + device.deviceId.slice(0, 8) }}

    DropdownMenuSeparator(v-if="cameras.length && microphones.length")

    // Microphone devices
    DropdownMenuLabel(v-if="microphones.length" class="text-xs text-gray-500") Microphone
    DropdownMenuItem(
      v-for="device in microphones"
      :key="device.deviceId"
      @click="handleSelectMic(device.deviceId)"
      class="text-xs"
      :class="selectedMic === device.deviceId ? 'font-semibold' : ''"
    )
      span(class="truncate") {{ device.label || 'Mic ' + device.deviceId.slice(0, 8) }}

    DropdownMenuSeparator(v-if="microphones.length && speakers.length")

    // Speaker devices
    DropdownMenuLabel(v-if="speakers.length" class="text-xs text-gray-500") Speaker
    DropdownMenuItem(
      v-for="device in speakers"
      :key="device.deviceId"
      @click="handleSelectSpeaker(device.deviceId)"
      class="text-xs"
      :class="selectedSpeaker === device.deviceId ? 'font-semibold' : ''"
    )
      span(class="truncate") {{ device.label || 'Speaker ' + device.deviceId.slice(0, 8) }}
</template>
