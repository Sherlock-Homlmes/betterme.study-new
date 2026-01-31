import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';

export function usePIPWindow() {
  const isPIPOpen = ref(false);

  const openPIP = async () => {
    try {
      await invoke('toggle_pip_window', { show: true });
      isPIPOpen.value = true;
    } catch (error) {
      console.error('Failed to open PIP window:', error);
      throw error;
    }
  };

  const closePIP = async () => {
    try {
      await invoke('toggle_pip_window', { show: false });
      isPIPOpen.value = false;
    } catch (error) {
      console.error('Failed to close PIP window:', error);
      throw error;
    }
  };

  const togglePIP = async () => {
    if (isPIPOpen.value) {
      await closePIP();
    } else {
      await openPIP();
    }
  };

  const checkPIPStatus = async () => {
    try {
      const isOpen = await invoke<boolean>('is_pip_window_open');
      isPIPOpen.value = isOpen;
      return isOpen;
    } catch (error) {
      console.error('Failed to check PIP window status:', error);
      return false;
    }
  };

  return {
    isPIPOpen,
    openPIP,
    closePIP,
    togglePIP,
    checkPIPStatus,
  };
}
