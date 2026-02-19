<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, markRaw } from 'vue';
import { Room, RoomEvent, Track, LocalParticipant, RemoteParticipant, Participant, MediaDeviceFailure } from 'livekit-client';
import { runtimeConfig } from '@/config/runtimeConfig';
import { fetchWithAuth } from '@/utils/betterFetch';
import { useAuthStore } from '@/stores/auth';
import {
  ChevronLeftIcon,
  MicrophoneIcon,
  MicrophoneOffIcon,
  VideoIcon,
  VideoOffIcon,
  PhoneOffIcon,
  UsersIcon,
  Volume2Icon,
  VolumeOffIcon,
  DeviceDesktopIcon,
  DeviceDesktopOffIcon
} from 'vue-tabler-icons';
import { useI18n } from 'vue-i18n';
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { ButtonImportance } from "@/components/base/types/button";
import ControlButton from "@/components/base/uiButton.vue";

const { t } = useI18n();
const { userInfo } = useAuthStore();

// Props
const props = defineProps<{
  room: {
    room_name: string;
    livekit_room_name: string;
    limit: number;
    num_participants: number;
  };
}>();

// Emit
const emit = defineEmits<{
  back: [];
}>();

// State
const livekitRoom = ref<Room | null>(null);
const isConnected = ref(false);
const isConnecting = ref(false);
const error = ref<string | null>(null);
const token = ref<string | null>(null);

// Media state
const isMicEnabled = ref(false);
const isCameraEnabled = ref(false);
const isSpeakerEnabled = ref(true);

// Participants
const participants = ref<RemoteParticipant[]>([]);
const localParticipant = ref<LocalParticipant | null>(null);

// Video elements
const localVideoRef = ref<HTMLVideoElement | null>(null);
const remoteVideoRefs = ref<Map<string, HTMLVideoElement>>(new Map());

// Build API URL
const buildApiUrl = (path: string) => {
  return `${runtimeConfig.public.API_URL}/v2/pomodoro-rooms${path}`;
};

// Generate token and join room
const joinRoom = async () => {
  try {
    isConnecting.value = true;
    error.value = null;

    // Get token from API
    const response = await fetchWithAuth(buildApiUrl('/join'), {
      method: 'POST',
      body: JSON.stringify({
        livekit_room_name: props.room.livekit_room_name,
      }),
    });

    if (!response || !response.ok) {
      throw new Error(`Failed to get token: ${response?.status || 'unknown'}`);
    }

    const data = await response.json();
    token.value = data.token;

    // Create LiveKit room
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: { width: 720, height: 480 },
        frameRate: 30,
      },
    });

    livekitRoom.value = room;

    // Set up event listeners
    setupRoomListeners(room);

    // Connect to room
    if (!token.value) {
      throw new Error('Token is required to connect to room');
    }
    await room.connect(runtimeConfig.public.LIVEKIT_URL, token.value);
    
    isConnected.value = true;
    localParticipant.value = markRaw(room.localParticipant);

    // Update participants list
    updateParticipantsList();

  } catch (err: any) {
    error.value = err.message || t('pomodoro_rooms.errors.join_failed');
    console.error('Error joining room:', err);
  } finally {
    isConnecting.value = false;
  }
};

// Setup room event listeners
const setupRoomListeners = (room: Room) => {
  // Track subscribed - when a remote participant's track is available
  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
      // For screen share tracks, we'll attach them to a special container
      if (publication.source === Track.Source.ScreenShare) {
        attachScreenShareTrack(track, participant.identity);
      } else {
        attachTrack(track, participant.identity);
      }
    }
    updateParticipantsList();
  });

  // Track unsubscribed
  room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
    
    if (publication.source === Track.Source.ScreenShare) {
      detachScreenShareTrack(track, participant.identity);
    } else {
      detachTrack(track, participant.identity);
    }
    updateParticipantsList();
  });

  // Participant track unmuted
  room.on(RoomEvent.TrackUnmuted, () => {
    updateParticipantsList();
  });

  // Participant track muted
  room.on(RoomEvent.TrackMuted, () => {
    updateParticipantsList();
  });

  // Participant connected
  room.on(RoomEvent.ParticipantConnected, () => {
    updateParticipantsList();
  });

  // Participant disconnected
  room.on(RoomEvent.ParticipantDisconnected, (participant) => {
    // Remove video element
    const videoElement = remoteVideoRefs.value.get(participant.identity);
    if (videoElement) {
      videoElement.remove();
      remoteVideoRefs.value.delete(participant.identity);
    }
    
    // Remove screen share video element if it exists
    const screenShareId = `screen-share-${participant.identity}`;
    const screenShareElement = remoteVideoRefs.value.get(screenShareId);
    if (screenShareElement) {
      screenShareElement.remove();
      remoteVideoRefs.value.delete(screenShareId);
    }
    
    // Clear the container
    const container = document.getElementById(`remote-${participant.identity}`);
    if (container) {
      container.innerHTML = '';
    }
    
    updateParticipantsList();
  });

  // Active speakers changed
  room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
    // Update UI to show who is speaking
    updateActiveSpeakers(speakers);
  });

  // Disconnected
  room.on(RoomEvent.Disconnected, () => {
    isConnected.value = false;
    cleanup();
  });

  // Local track published
  room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
    // Update UI state when tracks are published
    if (publication.source === Track.Source.Camera) {
      isCameraEnabled.value = true;
      // Attach to local video element if available
      if (localVideoRef.value && publication.videoTrack) {
        publication.videoTrack.attach(localVideoRef.value);
      }
    } else if (publication.source === Track.Source.Microphone) {
      isMicEnabled.value = true;
    } else if (publication.source === Track.Source.ScreenShare) {
      isScreenShareEnabled.value = true;
    }
  });

  // Local track unpublished
  room.on(RoomEvent.LocalTrackUnpublished, (publication, participant) => {
    // Update UI state when tracks are unpublished
    if (publication.source === Track.Source.Camera) {
      isCameraEnabled.value = false;
      // Detach from local video element
      if (publication.videoTrack) {
        publication.videoTrack.detach();
      }
    } else if (publication.source === Track.Source.Microphone) {
      isMicEnabled.value = false;
    } else if (publication.source === Track.Source.ScreenShare) {
      isScreenShareEnabled.value = false;
    }
  });

  // Media devices error
  room.on(RoomEvent.MediaDevicesError, (error) => {
    console.error('Media devices error:', error);
    
    // Use MediaDeviceFailure helper to determine specific reason
    const failure = MediaDeviceFailure.getFailure(error);
    console.error('Media device failure type:', failure);
    
    // Update UI state based on the error
    if (error) {
      // Check if it's a camera or microphone error
      if (error.message && error.message.includes('camera')) {
        isCameraEnabled.value = false;
      } else if (error.message && error.message.includes('microphone')) {
        isMicEnabled.value = false;
      }
      
      // Handle specific failure types
      switch (failure) {
        case MediaDeviceFailure.PermissionDenied:
          console.error('Permission denied for media device');
          break;
        case MediaDeviceFailure.NotFound:
          console.error('Media device not found');
          break;
        case MediaDeviceFailure.DeviceInUse:
          console.error('Media device is already in use');
          break;
        default:
          console.error('Unknown media device error');
      }
    }
  });
};

// Attach track to video element
const attachTrack = (track: Track, participantIdentity: string) => {
  // Check if we already have a video element for this participant
  let videoElement = remoteVideoRefs.value.get(participantIdentity);
  
  if (!videoElement) {
    // Create new video element
    videoElement = document.createElement('video');
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.className = 'w-full h-full object-cover rounded-lg';
    videoElement.id = `remote-video-${participantIdentity}`;
    
    // Store reference
    remoteVideoRefs.value.set(participantIdentity, videoElement);
  }

  // Attach track to element
  track.attach(videoElement);
  
  // Make sure the video element is added to the DOM
  const container = document.getElementById(`remote-${participantIdentity}`);
  if (container && !container.contains(videoElement)) {
    // Clear any existing content
    container.innerHTML = '';
    // Add the video element
    container.appendChild(videoElement);
  }
};

// Detach track from video element
const detachTrack = (track: Track, participantIdentity: string) => {
  const videoElement = remoteVideoRefs.value.get(participantIdentity);
  if (videoElement) {
    track.detach(videoElement);
    // Remove the video element from the DOM
    videoElement.remove();
    // Clear the container
    const container = document.getElementById(`remote-${participantIdentity}`);
    if (container) {
      container.innerHTML = '';
    }
  }
};

// Attach screen share track to video element
const attachScreenShareTrack = (track: Track, participantIdentity: string) => {
  // Create a unique ID for screen share
  const screenShareId = `screen-share-${participantIdentity}`;
  
  // Check if we already have a video element for this participant's screen share
  let videoElement = remoteVideoRefs.value.get(screenShareId);
  
  if (!videoElement) {
    // Create new video element
    videoElement = document.createElement('video');
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.className = 'w-full h-full object-cover rounded-lg';
    videoElement.id = `remote-video-${screenShareId}`;
    
    // Store reference
    remoteVideoRefs.value.set(screenShareId, videoElement);
  }

  // Attach track to element
  track.attach(videoElement);
  
  // Make sure the video element is added to the DOM
  const container = document.getElementById(`remote-${participantIdentity}`);
  if (container && !container.contains(videoElement)) {
    // Clear any existing content
    container.innerHTML = '';
    // Add the video element
    container.appendChild(videoElement);
  }
};

// Detach screen share track from video element
const detachScreenShareTrack = (track: Track, participantIdentity: string) => {
  const screenShareId = `screen-share-${participantIdentity}`;
  const videoElement = remoteVideoRefs.value.get(screenShareId);
  
  if (videoElement) {
    track.detach(videoElement);
    // Remove the video element from the DOM
    videoElement.remove();
    // Clear the container
    const container = document.getElementById(`remote-${participantIdentity}`);
    if (container) {
      container.innerHTML = '';
    }
    // Remove from the map
    remoteVideoRefs.value.delete(screenShareId);
  }
};

// Update participants list
const updateParticipantsList = () => {
  if (!livekitRoom.value) return;
  
  participants.value = Array.from(livekitRoom.value.remoteParticipants.values());
};

// Update active speakers
const updateActiveSpeakers = (speakers: Participant[]) => {
  // This will be used to show visual indicators for who is speaking
  // The UI will automatically update due to reactive properties
};

// Toggle microphone
const toggleMicrophone = async () => {
  if (!livekitRoom.value || !localParticipant.value) return;

  try {
    const newState = !isMicEnabled.value;
    await localParticipant.value.setMicrophoneEnabled(newState);
    isMicEnabled.value = newState;
  } catch (err: any) {
    console.error('Error toggling microphone:', err);
    // Check for specific device errors
    if (err && err.name === 'MediaDeviceError') {
      // Handle specific device errors if needed
      console.error('Microphone device error:', err);
    }
  }
};

// Toggle camera
const toggleCamera = async () => {
  if (!livekitRoom.value || !localParticipant.value) return;

  try {
    const newState = !isCameraEnabled.value;
    await localParticipant.value.setCameraEnabled(newState);
    isCameraEnabled.value = newState;
    
    // If enabling camera, attach local video track
    if (newState && localVideoRef.value) {
      // Wait a bit for the track to be published
      setTimeout(() => {
        const videoTrackPublication = localParticipant.value?.getTrackPublication(Track.Source.Camera);
        if (videoTrackPublication?.videoTrack && localVideoRef.value) {
          videoTrackPublication.videoTrack.attach(localVideoRef.value);
        }
      }, 100);
    }
  } catch (err: any) {
    console.error('Error toggling camera:', err);
    // Check for specific device errors
    if (err && err.name === 'MediaDeviceError') {
      // Handle specific device errors if needed
      console.error('Camera device error:', err);
    }
  }
};

// Toggle speaker (mute all remote audio)
const toggleSpeaker = () => {
  isSpeakerEnabled.value = !isSpeakerEnabled.value;
  
  // Update all remote video elements volume
  remoteVideoRefs.value.forEach((videoElement) => {
    if (videoElement) {
      videoElement.muted = !isSpeakerEnabled.value;
    }
  });
};

// Enable both camera and microphone at once
const enableCameraAndMicrophone = async () => {
  if (!livekitRoom.value || !localParticipant.value) return;

  try {
    // Use the convenience method from LiveKit to enable both at once
    await localParticipant.value.setCameraEnabled(true);
    await localParticipant.value.setMicrophoneEnabled(true);
    
    isCameraEnabled.value = true;
    isMicEnabled.value = true;
    
    // Attach local video track if available
    if (localVideoRef.value) {
      setTimeout(() => {
        const videoTrackPublication = localParticipant.value?.getTrackPublication(Track.Source.Camera);
        if (videoTrackPublication?.videoTrack && localVideoRef.value) {
          videoTrackPublication.videoTrack.attach(localVideoRef.value);
        }
      }, 100);
    }
  } catch (err: any) {
    console.error('Error enabling camera and microphone:', err);
    
    // Handle specific device errors
    if (err && err.name === 'MediaDeviceError') {
      console.error('Media device error:', err);
    }
  }
};

// Screen sharing state
const isScreenShareEnabled = ref(false);

// Toggle screen sharing
const toggleScreenShare = async () => {
  if (!livekitRoom.value || !localParticipant.value) return;

  try {
    const newState = !isScreenShareEnabled.value;
    await localParticipant.value.setScreenShareEnabled(newState);
    isScreenShareEnabled.value = newState;
  } catch (err: any) {
    console.error('Error toggling screen share:', err);
    
    // Handle specific device errors
    if (err && err.name === 'MediaDeviceError') {
      console.error('Screen share device error:', err);
    }
  }
};

// Get available devices
const getAvailableDevices = async (kind: 'audioinput' | 'audiooutput' | 'videoinput') => {
  try {
    return await Room.getLocalDevices(kind);
  } catch (error) {
    console.error(`Error getting ${kind} devices:`, error);
    return [];
  }
};

// Switch to a specific device
const switchDevice = async (kind: 'audioinput' | 'audiooutput' | 'videoinput', deviceId: string) => {
  if (!livekitRoom.value) return;
  
  try {
    await livekitRoom.value.switchActiveDevice(kind, deviceId);
  } catch (error) {
    console.error(`Error switching ${kind} device:`, error);
  }
};

// Leave room
const leaveRoom = () => {
  cleanup();
  emit('back');
};

// Cleanup
const cleanup = () => {
  if (livekitRoom.value) {
    livekitRoom.value.disconnect();
    livekitRoom.value = null;
  }
  
  // Store participants before clearing the array
  const participantsToClean = [...participants.value];
  
  isConnected.value = false;
  isMicEnabled.value = false;
  isCameraEnabled.value = false;
  isScreenShareEnabled.value = false;
  localParticipant.value = null;
  participants.value = [];
  
  // Clean up all video elements (including screen share)
  remoteVideoRefs.value.forEach((element) => {
    element.remove();
  });
  remoteVideoRefs.value.clear();
  
  // Clean up remote video containers
  participantsToClean.forEach((participant) => {
    const container = document.getElementById(`remote-${participant.identity}`);
    if (container) {
      container.innerHTML = '';
    }
  });
};

// Watch for local video ref changes
watch(localVideoRef, (newRef) => {
  if (newRef && localParticipant.value && isCameraEnabled.value) {
    const videoTrackPublication = localParticipant.value.getTrackPublication(Track.Source.Camera);
    if (videoTrackPublication?.videoTrack) {
      videoTrackPublication.videoTrack.attach(newRef);
    }
  }
});

// Helper function to get participant avatar from metadata
const getParticipantAvatar = (participant: RemoteParticipant) => {
  try {
    if (participant.metadata) {
      const metadata = JSON.parse(participant.metadata);
      return metadata.avatar_url || metadata.custom_avatar_url;
    }
  } catch (error) {
    console.error('Error parsing participant metadata:', error);
  }
  return null;
};

// Helper function to get local participant avatar
const getLocalParticipantAvatar = () => {
  // Get avatar from user info in auth store
  if (userInfo.value) {
    return userInfo.value.avatar_url || userInfo.value.custom_avatar_url;
  }
  return null;
};

// Handle avatar loading error
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  // Replace with default avatar or remove the image
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent) {
    parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
  }
};

// Computed properties
const totalParticipants = computed(() => {
  return participants.value.length + (localParticipant.value ? 1 : 0);
});

const connectionStatusText = computed(() => {
  return isConnected.value
    ? t('pomodoro_rooms.connected', { default: 'Connected' })
    : t('pomodoro_rooms.connecting', { default: 'Connecting...' });
});

// Lifecycle
onMounted(() => {
  joinRoom();
});

onUnmounted(() => {
  cleanup();
});
</script>

<template lang="pug">
div(class="flex flex-col h-full")
  // Header
  div(class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700")
    div(class="flex items-center gap-2")
      ControlButton(
        :aria-label="$t('pomodoro_rooms.back', { default: 'Back' })"
        default-style
        circle
        :importance="ButtonImportance.Text"
        @click="leaveRoom"
      )
        ChevronLeftIcon(:size="20")
      div
        h2(class="font-semibold text-gray-900 dark:text-gray-100")
          | {{ room.room_name }}
        p(class="text-xs text-gray-500 dark:text-gray-400")
          | {{ $t('pomodoro_rooms.participants', { count: totalParticipants }, { default: '{count} participants' }) }}
    
    // Connection status
    div(
      class="flex items-center gap-1 px-2 py-1 text-xs rounded-full"
      :class="isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'"
    )
      div(
        class="w-2 h-2 rounded-full"
        :class="isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'"
      )
      span
        | {{ connectionStatusText }}
  
  // Main content
  div(class="flex-grow flex flex-col overflow-hidden")
    // Loading state
    div(v-if="isConnecting" class="flex items-center justify-center py-12")
      Loading(size="lg" :text="$t('pomodoro_rooms.joining_room', { default: 'Joining room...' })")
    
    // Error state
    div(v-else-if="error" class="flex flex-col items-center justify-center py-12 px-4")
      p(class="text-red-500 dark:text-red-400 mb-4 text-center")
        | {{ error }}
      Button(@click="joinRoom" variant="outline")
        | {{ $t('pomodoro_rooms.retry_join', { default: 'Retry' }) }}
    
    // Room content
    div(v-else-if="isConnected" class="flex flex-col h-full")
      // Video grid
      div(class="flex-grow p-4 overflow-y-auto")
        div(
          class="grid gap-3"
          :class="totalParticipants <= 1 ? 'grid-cols-1' : totalParticipants <= 4 ? 'grid-cols-2' : 'grid-cols-3'"
        )
          // Local participant
          div(
            v-if="localParticipant"
            class="relative bg-gray-900 rounded-lg overflow-hidden aspect-video"
            :class="isCameraEnabled || isMicEnabled ? 'ring-2 ring-primary-500' : ''"
          )
            video(
              ref="localVideoRef"
              autoplay
              playsinline
              muted
              class="w-full h-full object-cover"
              :class="{ 'hidden': !isCameraEnabled }"
            )
            // Placeholder when camera is off
            div(
              v-if="!isCameraEnabled"
              class="absolute inset-0 flex items-center justify-center bg-gray-800"
            )
              div(
                v-if="getLocalParticipantAvatar()"
                class="w-24 h-24 rounded-full bg-gray-700 overflow-hidden"
              )
                img(
                  :src="getLocalParticipantAvatar()"
                  :alt="$t('pomodoro_rooms.you', { default: 'You' })"
                  class="w-full h-full object-cover"
                  @error="handleAvatarError"
                )
              div(
                v-else
                class="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center"
              )
                // Show microphone icon if mic is on but camera is off
                MicrophoneIcon(v-if="isMicEnabled" :size="48" class="text-green-400")
                // Show video off icon if both are off
                VideoOffIcon(v-else :size="48" class="text-gray-400")
            
            // Local participant label
            div(class="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded text-white text-xs flex items-center gap-1")
              VideoIcon(v-if="isCameraEnabled" :size="12" class="text-green-400")
              MicrophoneIcon(v-if="isMicEnabled && !isCameraEnabled" :size="12" class="text-green-400")
              DeviceDesktopIcon(v-if="isScreenShareEnabled" :size="12" class="text-blue-400")
              span {{ $t('pomodoro_rooms.you', { default: 'You' }) }}
          
          // Remote participants
          div(
            v-for="participant in participants"
            :key="participant.identity"
            class="relative bg-gray-900 rounded-lg overflow-hidden aspect-video"
            :class="{ 'ring-2 ring-green-500': participant.isSpeaking }"
          )
            // The video element will be attached by LiveKit
            div(:id="`remote-${participant.identity}`" class="w-full h-full")
            
            // Avatar placeholder when camera is off
            div(
              v-if="!participant.isCameraEnabled"
              class="absolute inset-0 flex items-center justify-center bg-gray-800"
            )
              div(
                v-if="getParticipantAvatar(participant)"
                class="w-24 h-24 rounded-full bg-gray-700 overflow-hidden"
              )
                img(
                  :src="getParticipantAvatar(participant)"
                  :alt="participant.name || participant.identity"
                  class="w-full h-full object-cover"
                  @error="handleAvatarError"
                )
              div(
                v-else
                class="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center"
              )
                // Show microphone icon if mic is on but camera is off
                MicrophoneIcon(v-if="participant.isMicrophoneEnabled" :size="48" class="text-green-400")
                // Show video off icon if both are off
                VideoOffIcon(v-else :size="48" class="text-gray-400")
            
            // Speaking indicator
            div(
              v-if="participant.isSpeaking"
              class="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full animate-pulse"
            )
              | {{ $t('pomodoro_rooms.speaking', { default: 'Speaking' }) }}
            
            // Participant label
            div(class="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded text-white text-xs flex items-center gap-1")
              VideoIcon(v-if="participant.isCameraEnabled" :size="12" class="text-green-400")
              MicrophoneIcon(v-if="participant.isMicrophoneEnabled && !participant.isCameraEnabled" :size="12" class="text-green-400")
              DeviceDesktopIcon(v-if="participant.isScreenShareEnabled" :size="12" class="text-blue-400")
              span {{ participant.name || participant.identity }}
      
      // Controls bar
      div(class="flex items-center justify-center gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900")
        // Microphone toggle
        ControlButton(
          :aria-label="isMicEnabled ? $t('pomodoro_rooms.mute_mic', { default: 'Mute microphone' }) : $t('pomodoro_rooms.unmute_mic', { default: 'Unmute microphone' })"
          default-style
          circle
          :importance="isMicEnabled ? ButtonImportance.Primary : ButtonImportance.Secondary"
          size="lg"
          @click="toggleMicrophone"
        )
          MicrophoneIcon(v-if="isMicEnabled" :size="24")
          MicrophoneOffIcon(v-else :size="24")
        
        // Camera toggle
        ControlButton(
          :aria-label="isCameraEnabled ? $t('pomodoro_rooms.turn_off_camera', { default: 'Turn off camera' }) : $t('pomodoro_rooms.turn_on_camera', { default: 'Turn on camera' })"
          default-style
          circle
          :importance="isCameraEnabled ? ButtonImportance.Primary : ButtonImportance.Secondary"
          size="lg"
          @click="toggleCamera"
        )
          VideoIcon(v-if="isCameraEnabled" :size="24")
          VideoOffIcon(v-else :size="24")
        
        // Speaker toggle
        ControlButton(
          :aria-label="isSpeakerEnabled ? $t('pomodoro_rooms.mute_speaker', { default: 'Mute speaker' }) : $t('pomodoro_rooms.unmute_speaker', { default: 'Unmute speaker' })"
          default-style
          circle
          :importance="isSpeakerEnabled ? ButtonImportance.Secondary : ButtonImportance.Text"
          size="lg"
          @click="toggleSpeaker"
        )
          Volume2Icon(v-if="isSpeakerEnabled" :size="24")
          VolumeOffIcon(v-else :size="24")
        
        // Screen share toggle
        //- ControlButton(
          :aria-label="isScreenShareEnabled ? $t('pomodoro_rooms.stop_screen_share', { default: 'Stop screen sharing' }) : $t('pomodoro_rooms.start_screen_share', { default: 'Start screen sharing' })"
          default-style
          circle
          :importance="isScreenShareEnabled ? ButtonImportance.Primary : ButtonImportance.Secondary"
          size="lg"
          @click="toggleScreenShare"
          )
          DeviceDesktopIcon(v-if="isScreenShareEnabled" :size="24")
          DeviceDesktopOffIcon(v-else :size="24")
        
        // Leave room button
        ControlButton(
          :aria-label="$t('pomodoro_rooms.leave_room', { default: 'Leave room' })"
          default-style
          circle
          :importance="ButtonImportance.Danger"
          size="lg"
          @click="leaveRoom"
        )
          PhoneOffIcon(:size="24")
</template>
