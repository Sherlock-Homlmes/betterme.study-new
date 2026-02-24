import { ref, computed, markRaw, nextTick } from 'vue';
import { createGlobalState } from '@vueuse/core';
import { Room, RoomEvent, Track, LocalParticipant, RemoteParticipant, Participant, MediaDeviceFailure } from 'livekit-client';
import { runtimeConfig } from '@/config/runtimeConfig';
import { api } from '@/utils/betterFetch';
import { useAuthStore } from './auth';

// Chat message types
export type MessageType = 'text' | 'file' | 'gif' | 'reaction';

export interface ChatMessage {
  id: string;
  type: MessageType;
  sender: string;
  senderName: string;
  content: string;
  timestamp: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  gifUrl?: string;
  reaction?: string;
}

export interface RoomInfo {
  room_name: string;
  livekit_room_name: string;
  limit: number;
  num_participants: number;
}

export const usePomodoroRoomsStore = createGlobalState(() => {
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
  const isScreenShareEnabled = ref(false);

  // Participants
  const participants = ref<RemoteParticipant[]>([]);
  const localParticipant = ref<LocalParticipant | null>(null);

  // Video elements
  const localVideoRef = ref<HTMLVideoElement | null>(null);
  const remoteVideoRefs = ref<Map<string, HTMLVideoElement>>(new Map());

  // Chat state
  const chatMessages = ref<ChatMessage[]>([]);
  const newMessage = ref('');
  const messagesContainer = ref<HTMLDivElement | null>(null);
  const showChat = ref(true);
  const showEmojiPicker = ref(false);
  const showGifPicker = ref(false);
  const showReactionPicker = ref(false);
  const fileInputRef = ref<HTMLInputElement | null>(null);
  const uploadingFile = ref(false);

  // Reaction state
  const flyingReactions = ref<Array<{ id: string; emoji: string; x: number; y: number }>>([]);

  // Common reactions
  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

  // Common GIFs
  const commonGifs = [
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif',
    'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif',
    'https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif',
    'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
    'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
  ];

  // Current room info
  const currentRoom = ref<RoomInfo | null>(null);

  // Build API URL
  const buildApiUrl = (path: string) => {
    return `${runtimeConfig.public.API_URL}/v2/pomodoro-rooms${path}`;
  };

  // Setup room event listeners
  const setupRoomListeners = (room: Room) => {
    // Data received - handle chat messages and reactions
    room.on(RoomEvent.DataReceived, (payload, participant) => {
      handleDataReceived(payload, participant);
    });

    // Track subscribed - when a remote participant's track is available
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
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
      const videoElement = remoteVideoRefs.value.get(participant.identity);
      if (videoElement) {
        videoElement.remove();
        remoteVideoRefs.value.delete(participant.identity);
      }
      
      const screenShareId = `screen-share-${participant.identity}`;
      const screenShareElement = remoteVideoRefs.value.get(screenShareId);
      if (screenShareElement) {
        screenShareElement.remove();
        remoteVideoRefs.value.delete(screenShareId);
      }
      
      const container = document.getElementById(`remote-${participant.identity}`);
      if (container) {
        container.innerHTML = '';
      }
      
      updateParticipantsList();
    });

    // Active speakers changed
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      updateActiveSpeakers(speakers);
    });

    // Disconnected
    room.on(RoomEvent.Disconnected, () => {
      isConnected.value = false;
      cleanup();
    });

    // Local track published
    room.on(RoomEvent.LocalTrackPublished, (publication) => {
      if (publication.source === Track.Source.Camera) {
        isCameraEnabled.value = true;
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
    room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      if (publication.source === Track.Source.Camera) {
        isCameraEnabled.value = false;
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
    room.on(RoomEvent.MediaDevicesError, (err) => {
      console.error('Media devices error:', err);
      
      const failure = MediaDeviceFailure.getFailure(err);
      console.error('Media device failure type:', failure);
      
      if (err) {
        if (err.message && err.message.includes('camera')) {
          isCameraEnabled.value = false;
        } else if (err.message && err.message.includes('microphone')) {
          isMicEnabled.value = false;
        }
        
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
    let videoElement = remoteVideoRefs.value.get(participantIdentity);
    
    if (!videoElement) {
      videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.className = 'w-full h-full object-cover rounded-lg';
      videoElement.id = `remote-video-${participantIdentity}`;
      
      remoteVideoRefs.value.set(participantIdentity, videoElement);
    }

    track.attach(videoElement);
    
    const container = document.getElementById(`remote-${participantIdentity}`);
    if (container && !container.contains(videoElement)) {
      container.innerHTML = '';
      container.appendChild(videoElement);
    }
  };

  // Detach track from video element
  const detachTrack = (track: Track, participantIdentity: string) => {
    const videoElement = remoteVideoRefs.value.get(participantIdentity);
    if (videoElement) {
      track.detach(videoElement);
      videoElement.remove();
      const container = document.getElementById(`remote-${participantIdentity}`);
      if (container) {
        container.innerHTML = '';
      }
    }
  };

  // Attach screen share track to video element
  const attachScreenShareTrack = (track: Track, participantIdentity: string) => {
    const screenShareId = `screen-share-${participantIdentity}`;
    
    let videoElement = remoteVideoRefs.value.get(screenShareId);
    
    if (!videoElement) {
      videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.className = 'w-full h-full object-cover rounded-lg';
      videoElement.id = `remote-video-${screenShareId}`;
      
      remoteVideoRefs.value.set(screenShareId, videoElement);
    }

    track.attach(videoElement);
    
    const container = document.getElementById(`remote-${participantIdentity}`);
    if (container && !container.contains(videoElement)) {
      container.innerHTML = '';
      container.appendChild(videoElement);
    }
  };

  // Detach screen share track from video element
  const detachScreenShareTrack = (track: Track, participantIdentity: string) => {
    const screenShareId = `screen-share-${participantIdentity}`;
    const videoElement = remoteVideoRefs.value.get(screenShareId);
    
    if (videoElement) {
      track.detach(videoElement);
      videoElement.remove();
      const container = document.getElementById(`remote-${participantIdentity}`);
      if (container) {
        container.innerHTML = '';
      }
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
    // The UI will automatically update due to reactive properties
  };

  // Handle incoming data from LiveKit
  const handleDataReceived = (payload: Uint8Array, participant?: RemoteParticipant | LocalParticipant) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(payload));
      
      if (data.type === 'chat' && participant) {
        addChatMessage({
          id: Date.now().toString() + Math.random(),
          type: data.messageType || 'text',
          sender: participant.identity,
          senderName: participant.name || participant.identity,
          content: data.content,
          timestamp: Date.now(),
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          gifUrl: data.gifUrl,
        });
      } else if (data.type === 'reaction') {
        showFlyingReaction(data.emoji);
      }
    } catch (err) {
      console.error('Error handling data:', err);
    }
  };

  // Add chat message to the list
  const addChatMessage = (message: ChatMessage) => {
    chatMessages.value.push(message);
    nextTick(() => {
      scrollToBottom();
    });
  };

  // Scroll chat to bottom
  const scrollToBottom = () => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  };

  // Publish data via LiveKit
  const publishData = async (data: any) => {
    if (!livekitRoom.value) return;
    
    const message = JSON.stringify(data);
    await livekitRoom.value.localParticipant.publishData(
      new TextEncoder().encode(message),
      { reliable: true }
    );
  };

  // Show flying reaction animation
  const showFlyingReaction = (emoji: string) => {
    const id = Date.now().toString() + Math.random();
    const x = Math.random() * 80 + 10;
    const y = 100;
    
    flyingReactions.value.push({ id, emoji, x, y });
    
    setTimeout(() => {
      const index = flyingReactions.value.findIndex(r => r.id === id);
      if (index !== -1) {
        flyingReactions.value.splice(index, 1);
      }
    }, 3000);
  };

  // Generate token and join room
  const joinRoom = async (room: RoomInfo) => {
    try {
      isConnecting.value = true;
      error.value = null;
      currentRoom.value = room;

      const response = await api.post(buildApiUrl('/join'), {
        livekit_room_name: room.livekit_room_name,
      });

      if (!response || !response.ok) {
        throw new Error(`Failed to get token: ${response?.status || 'unknown'}`);
      }

      const data = await response.json();
      token.value = data.token;

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 720, height: 480 },
          frameRate: 30,
        },
      });

      livekitRoom.value = newRoom;
      setupRoomListeners(newRoom);

      if (!token.value) {
        throw new Error('Token is required to connect to room');
      }
      
      await newRoom.connect(runtimeConfig.public.LIVEKIT_URL, token.value);
      
      isConnected.value = true;
      localParticipant.value = markRaw(newRoom.localParticipant);

      updateParticipantsList();

    } catch (err: any) {
      error.value = err.message || 'Failed to join room';
      console.error('Error joining room:', err);
    } finally {
      isConnecting.value = false;
    }
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
      if (err && err.name === 'MediaDeviceError') {
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
      
      if (newState && localVideoRef.value) {
        setTimeout(() => {
          const videoTrackPublication = localParticipant.value?.getTrackPublication(Track.Source.Camera);
          if (videoTrackPublication?.videoTrack && localVideoRef.value) {
            videoTrackPublication.videoTrack.attach(localVideoRef.value);
          }
        }, 100);
      }
    } catch (err: any) {
      console.error('Error toggling camera:', err);
      if (err && err.name === 'MediaDeviceError') {
        console.error('Camera device error:', err);
      }
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    isSpeakerEnabled.value = !isSpeakerEnabled.value;
    
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
      await localParticipant.value.setCameraEnabled(true);
      await localParticipant.value.setMicrophoneEnabled(true);
      
      isCameraEnabled.value = true;
      isMicEnabled.value = true;
      
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
      if (err && err.name === 'MediaDeviceError') {
        console.error('Media device error:', err);
      }
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!livekitRoom.value || !localParticipant.value) return;

    try {
      const newState = !isScreenShareEnabled.value;
      await localParticipant.value.setScreenShareEnabled(newState);
      isScreenShareEnabled.value = newState;
    } catch (err: any) {
      console.error('Error toggling screen share:', err);
      if (err && err.name === 'MediaDeviceError') {
        console.error('Screen share device error:', err);
      }
    }
  };

  // Get available devices
  const getAvailableDevices = async (kind: 'audioinput' | 'audiooutput' | 'videoinput') => {
    try {
      return await Room.getLocalDevices(kind);
    } catch (err) {
      console.error(`Error getting ${kind} devices:`, err);
      return [];
    }
  };

  // Switch to a specific device
  const switchDevice = async (kind: 'audioinput' | 'audiooutput' | 'videoinput', deviceId: string) => {
    if (!livekitRoom.value) return;
    
    try {
      await livekitRoom.value.switchActiveDevice(kind, deviceId);
    } catch (err) {
      console.error(`Error switching ${kind} device:`, err);
    }
  };

  // Send text message
  const sendTextMessage = async () => {
    if (!newMessage.value.trim() || !livekitRoom.value) return;
    
    await publishData({
      type: 'chat',
      messageType: 'text',
      content: newMessage.value,
    });
    
    addChatMessage({
      id: Date.now().toString() + Math.random(),
      type: 'text',
      sender: localParticipant.value?.identity || 'you',
      senderName: 'You',
      content: newMessage.value,
      timestamp: Date.now(),
    });
    
    newMessage.value = '';
  };

  // Send file
  const sendFile = async (file: File) => {
    if (!livekitRoom.value) return;
    
    uploadingFile.value = true;
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        await publishData({
          type: 'chat',
          messageType: 'file',
          content: `Shared a file: ${file.name}`,
          fileUrl: base64,
          fileName: file.name,
          fileSize: file.size,
        });
        
        addChatMessage({
          id: Date.now().toString() + Math.random(),
          type: 'file',
          sender: localParticipant.value?.identity || 'you',
          senderName: 'You',
          content: `Shared a file: ${file.name}`,
          timestamp: Date.now(),
          fileUrl: base64,
          fileName: file.name,
          fileSize: file.size,
        });
        
        uploadingFile.value = false;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error sending file:', err);
      uploadingFile.value = false;
    }
  };

  // Send GIF
  const sendGif = async (gifUrl: string) => {
    if (!livekitRoom.value) return;
    
    await publishData({
      type: 'chat',
      messageType: 'gif',
      content: 'Shared a GIF',
      gifUrl: gifUrl,
    });
    
    addChatMessage({
      id: Date.now().toString() + Math.random(),
      type: 'gif',
      sender: localParticipant.value?.identity || 'you',
      senderName: 'You',
      content: 'Shared a GIF',
      timestamp: Date.now(),
      gifUrl: gifUrl,
    });
    
    showGifPicker.value = false;
  };

  // Send reaction
  const sendReaction = async (emoji: string) => {
    if (!livekitRoom.value) return;
    
    await publishData({
      type: 'reaction',
      emoji: emoji,
    });
    
    showFlyingReaction(emoji);
  };

  // Cleanup
  const cleanup = () => {
    if (livekitRoom.value) {
      livekitRoom.value.disconnect();
      livekitRoom.value = null;
    }
    
    const participantsToClean = [...participants.value];
    
    isConnected.value = false;
    isMicEnabled.value = false;
    isCameraEnabled.value = false;
    isScreenShareEnabled.value = false;
    localParticipant.value = null;
    participants.value = [];
    
    remoteVideoRefs.value.forEach((element) => {
      element.remove();
    });
    remoteVideoRefs.value.clear();
    
    participantsToClean.forEach((participant) => {
      const container = document.getElementById(`remote-${participant.identity}`);
      if (container) {
        container.innerHTML = '';
      }
    });
  };

  // Helper function to get participant avatar from metadata
  const getParticipantAvatar = (participant: RemoteParticipant) => {
    try {
      if (participant.metadata) {
        const metadata = JSON.parse(participant.metadata);
        return metadata.avatar_url || metadata.custom_avatar_url;
      }
    } catch (err) {
      console.error('Error parsing participant metadata:', err);
    }
    return null;
  };

  // Helper function to get local participant avatar
  const getLocalParticipantAvatar = () => {
    const { userInfo } = useAuthStore();
    if (userInfo.value) {
      return userInfo.value.avatar_url || userInfo.value.custom_avatar_url;
    }
    return null;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Computed properties
  const totalParticipants = computed(() => {
    return participants.value.length + (localParticipant.value ? 1 : 0);
  });

  return {
    // State
    livekitRoom,
    isConnected,
    isConnecting,
    error,
    token,
    isMicEnabled,
    isCameraEnabled,
    isSpeakerEnabled,
    isScreenShareEnabled,
    participants,
    localParticipant,
    localVideoRef,
    remoteVideoRefs,
    chatMessages,
    newMessage,
    messagesContainer,
    showChat,
    showEmojiPicker,
    showGifPicker,
    showReactionPicker,
    fileInputRef,
    uploadingFile,
    flyingReactions,
    commonReactions,
    commonGifs,
    currentRoom,
    
    // Computed
    totalParticipants,
    
    // Methods
    joinRoom,
    leaveRoom: cleanup,
    toggleMicrophone,
    toggleCamera,
    toggleSpeaker,
    enableCameraAndMicrophone,
    toggleScreenShare,
    getAvailableDevices,
    switchDevice,
    sendTextMessage,
    sendFile,
    sendGif,
    sendReaction,
    getParticipantAvatar,
    getLocalParticipantAvatar,
    formatFileSize,
    cleanup,
    buildApiUrl,
  };
});
