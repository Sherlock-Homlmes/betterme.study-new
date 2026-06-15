import { ref, computed, markRaw, nextTick, watch } from 'vue';
import { createGlobalState } from '@vueuse/core';
import type { Room, RemoteParticipant, LocalParticipant, Participant, Track as TrackType } from 'livekit-client';
import { runtimeConfig } from '@/config/runtimeConfig';
import { api } from '@/utils/betterFetch';
import { useAuthStore } from './auth';
import { useErrorStore } from "./common";

// Lazy load livekit
let _livekit: typeof import('livekit-client') | null = null;
const getLivekit = async () => {
  if (!_livekit) _livekit = await import('livekit-client');
  return _livekit;
};

const MAX_CHAT_MESSAGES = 200;

const getErrMsg = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

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

export interface PomodoroSettings {
  pomodoro_study_time: number;
  pomodoro_rest_time: number;
  pomodoro_long_rest_time: number;
  long_rest_time_interval: number;
}

export interface RoomInfo {
  room_name: string;
  livekit_room_name: string;
  limit: number;
  num_participants: number;
  pomodoro_settings?: PomodoroSettings;
  created_by?: string;
  created_at?: string;
}

export const usePomodoroRoomsStore = createGlobalState(() => {
  const { showError } = useErrorStore();
  const { userSettings } = useAuthStore();

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
  const localScreenShareRef = ref<HTMLVideoElement | null>(null);

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
  const showChat = ref(false);
  const showEmojiPicker = ref(false);
  const showGifPicker = ref(false);
  const showReactionPicker = ref(false);
  const fileInputRef = ref<HTMLInputElement | null>(null);
  const uploadingFile = ref(false);
  const unreadMessageCount = ref(0);
  const lastReadMessageIndex = ref(-1);

  // Reaction state
  const flyingReactions = ref<Array<{ id: string; emoji: string; x: number; y: number }>>([]);

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];
  const commonGifs = [
    'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif',
    'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif',
    'https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif',
    'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
    'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
  ];

  const currentRoom = ref<RoomInfo | null>(null);
  const timerSyncedSettings = ref<{ study: number; rest: number } | null>(null);
  const roomNotifications = ref<Array<{ id: string; message: string; type: 'join' | 'leave' }>>([]);

  const buildApiUrl = (path: string) => `${runtimeConfig.public.API_URL}/v2/pomodoro-rooms${path}`;

  // Attach track to video element
  const attachTrack = async (track: TrackType, participantIdentity: string) => {
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
    await nextTick();
    const container = document.getElementById(`remote-${participantIdentity}`);
    if (container && !container.contains(videoElement)) {
      container.innerHTML = '';
      container.appendChild(videoElement);
    }
  };

  const detachTrack = (track: TrackType, participantIdentity: string) => {
    const videoElement = remoteVideoRefs.value.get(participantIdentity);
    if (videoElement) {
      track.detach(videoElement);
      videoElement.remove();
      const container = document.getElementById(`remote-${participantIdentity}`);
      if (container) container.innerHTML = '';
    }
  };

  const attachScreenShareTrack = async (track: TrackType, participantIdentity: string) => {
    const screenShareId = `screen-share-${participantIdentity}`;
    let videoElement = remoteVideoRefs.value.get(screenShareId);
    if (!videoElement) {
      videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.className = 'w-full h-full object-cover rounded-lg';
      videoElement.id = `screenshare-video-${participantIdentity}`;
      remoteVideoRefs.value.set(screenShareId, videoElement);
    }
    track.attach(videoElement);
    await nextTick();
    const container = document.getElementById(`screenshare-${participantIdentity}`);
    if (container && !container.contains(videoElement)) {
      container.innerHTML = '';
      container.appendChild(videoElement);
    }
  };

  const detachScreenShareTrack = (track: TrackType, participantIdentity: string) => {
    const screenShareId = `screen-share-${participantIdentity}`;
    const videoElement = remoteVideoRefs.value.get(screenShareId);
    if (videoElement) {
      track.detach(videoElement);
      videoElement.remove();
      const container = document.getElementById(`screenshare-${participantIdentity}`);
      if (container) container.innerHTML = '';
      remoteVideoRefs.value.delete(screenShareId);
    }
  };

  const updateParticipantsList = () => {
    if (!livekitRoom.value) return;
    participants.value = Array.from(livekitRoom.value.remoteParticipants.values());
  };

  const activeSpeakerIdentities = ref<Set<string>>(new Set());

  const updateActiveSpeakers = (speakers: Participant[]) => {
    activeSpeakerIdentities.value = new Set(speakers.map(s => s.identity));
  };

  const scrollToBottom = () => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  };

  const addChatMessage = (message: ChatMessage) => {
    chatMessages.value.push(message);
    // Cap messages to prevent unbounded memory growth
    if (chatMessages.value.length > MAX_CHAT_MESSAGES) {
      chatMessages.value.splice(0, chatMessages.value.length - MAX_CHAT_MESSAGES);
    }
    if (!showChat.value && message.sender !== localParticipant.value?.identity) {
      unreadMessageCount.value++;
    }
    nextTick(() => scrollToBottom());
  };

  const showFlyingReaction = (emoji: string) => {
    const id = Date.now().toString() + Math.random();
    const x = Math.random() * 80 + 10;
    flyingReactions.value.push({ id, emoji, x, y: 100 });
    setTimeout(() => {
      const index = flyingReactions.value.findIndex(r => r.id === id);
      if (index !== -1) flyingReactions.value.splice(index, 1);
    }, 3000);
  };

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
    } catch {
      // Silently ignore malformed data packets
    }
  };

  const setupRoomListeners = async (room: Room) => {
    const { RoomEvent, Track, MediaDeviceFailure } = await getLivekit();

    room.on(RoomEvent.DataReceived, (payload, participant) => {
      handleDataReceived(payload, participant);
    });

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

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (publication.source === Track.Source.ScreenShare) {
        detachScreenShareTrack(track, participant.identity);
      } else {
        detachTrack(track, participant.identity);
      }
      updateParticipantsList();
    });

    room.on(RoomEvent.TrackUnmuted, () => updateParticipantsList());
    room.on(RoomEvent.TrackMuted, () => updateParticipantsList());
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      updateParticipantsList();
      const id = Date.now().toString();
      roomNotifications.value.push({ id, message: `${participant.name || participant.identity} joined`, type: 'join' });
      setTimeout(() => {
        const idx = roomNotifications.value.findIndex(n => n.id === id);
        if (idx !== -1) roomNotifications.value.splice(idx, 1);
      }, 4000);
    });

    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      const id = Date.now().toString();
      roomNotifications.value.push({ id, message: `${participant.name || participant.identity} left`, type: 'leave' });
      setTimeout(() => {
        const idx = roomNotifications.value.findIndex(n => n.id === id);
        if (idx !== -1) roomNotifications.value.splice(idx, 1);
      }, 4000);
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
      if (container) container.innerHTML = '';
      updateParticipantsList();
    });

    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => updateActiveSpeakers(speakers));

    room.on(RoomEvent.Disconnected, () => {
      isConnected.value = false;
      cleanup();
    });

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
        if (localScreenShareRef.value && publication.videoTrack) {
          publication.videoTrack.attach(localScreenShareRef.value);
        }
      }
    });

    room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      if (publication.source === Track.Source.Camera) {
        isCameraEnabled.value = false;
        if (publication.videoTrack) publication.videoTrack.detach();
      } else if (publication.source === Track.Source.Microphone) {
        isMicEnabled.value = false;
      } else if (publication.source === Track.Source.ScreenShare) {
        isScreenShareEnabled.value = false;
        if (publication.videoTrack) publication.videoTrack.detach();
      }
    });

    room.on(RoomEvent.MediaDevicesError, (err) => {
      const failure = MediaDeviceFailure.getFailure(err);
      if (err) {
        if (err.message?.includes('camera')) isCameraEnabled.value = false;
        else if (err.message?.includes('microphone')) isMicEnabled.value = false;
        switch (failure) {
          case MediaDeviceFailure.PermissionDenied:
            showError('Permission denied for media device'); break;
          case MediaDeviceFailure.NotFound:
            showError('Media device not found'); break;
          case MediaDeviceFailure.DeviceInUse:
            showError('Media device is already in use'); break;
          default:
            showError('Unknown media device error');
        }
      }
    });
  };

  const publishData = async (data: Record<string, unknown>) => {
    if (!livekitRoom.value) return;
    const message = JSON.stringify(data);
    await livekitRoom.value.localParticipant.publishData(
      new TextEncoder().encode(message),
      { reliable: true }
    );
  };

  const joinRoom = async (room: RoomInfo) => {
    // Prevent double-connect race condition
    if (isConnecting.value || isConnected.value) return;
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

      const { Room } = await getLivekit();

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 720, height: 480 },
          frameRate: 30,
        },
      });

      livekitRoom.value = newRoom;
      await setupRoomListeners(newRoom);

      if (!token.value) throw new Error('Token is required to connect to room');

      await newRoom.connect(runtimeConfig.public.LIVEKIT_URL, token.value);

      isConnected.value = true;
      localParticipant.value = markRaw(newRoom.localParticipant);
      updateParticipantsList();

      const roomMetadata = getRoomMetadata();
      if (roomMetadata?.pomodoro_settings) {
        userSettings.value.pomodoro_settings = {
          ...userSettings.value.pomodoro_settings,
          ...roomMetadata.pomodoro_settings,
        };
        timerSyncedSettings.value = {
          study: Math.floor(roomMetadata.pomodoro_settings.pomodoro_study_time / 60),
          rest: Math.floor(roomMetadata.pomodoro_settings.pomodoro_rest_time / 60),
        };
      }
    } catch (err: unknown) {
      const msg = getErrMsg(err);
      error.value = msg;
      showError(`Failed to join room: ${msg}`);
    } finally {
      isConnecting.value = false;
    }
  };

  const toggleMicrophone = async () => {
    if (!livekitRoom.value || !localParticipant.value) return;
    try {
      const newState = !isMicEnabled.value;
      await localParticipant.value.setMicrophoneEnabled(newState);
      isMicEnabled.value = newState;
    } catch (err: unknown) {
      showError(`Microphone error: ${getErrMsg(err)}`);
    }
  };

  const toggleCamera = async () => {
    if (!livekitRoom.value || !localParticipant.value) return;
    try {
      const newState = !isCameraEnabled.value;
      await localParticipant.value.setCameraEnabled(newState);
      isCameraEnabled.value = newState;
      if (newState && localVideoRef.value) {
        setTimeout(async () => {
          const { Track } = await getLivekit();
          const pub = localParticipant.value?.getTrackPublication(Track.Source.Camera);
          if (pub?.videoTrack && localVideoRef.value) {
            pub.videoTrack.attach(localVideoRef.value);
          }
        }, 100);
      }
    } catch (err: unknown) {
      showError(`Camera error: ${getErrMsg(err)}`);
    }
  };

  const toggleSpeaker = () => {
    isSpeakerEnabled.value = !isSpeakerEnabled.value;
    for (const videoElement of remoteVideoRefs.value.values()) {
      if (videoElement) videoElement.muted = !isSpeakerEnabled.value;
    }
  };

  const enableCameraAndMicrophone = async () => {
    if (!livekitRoom.value || !localParticipant.value) return;
    try {
      await localParticipant.value.setCameraEnabled(true);
      await localParticipant.value.setMicrophoneEnabled(true);
      isCameraEnabled.value = true;
      isMicEnabled.value = true;
      if (localVideoRef.value) {
        setTimeout(async () => {
          const { Track } = await getLivekit();
          const pub = localParticipant.value?.getTrackPublication(Track.Source.Camera);
          if (pub?.videoTrack && localVideoRef.value) {
            pub.videoTrack.attach(localVideoRef.value);
          }
        }, 100);
      }
    } catch (err: unknown) {
      showError(`Failed to enable camera and microphone: ${getErrMsg(err)}`);
    }
  };

  const toggleScreenShare = async () => {
    if (!livekitRoom.value || !localParticipant.value) return;
    try {
      const newState = !isScreenShareEnabled.value;
      await localParticipant.value.setScreenShareEnabled(newState);
      isScreenShareEnabled.value = newState;
    } catch (err: unknown) {
      showError(`Screen share error: ${getErrMsg(err)}`);
    }
  };

  const getAvailableDevices = async (kind: 'audioinput' | 'audiooutput' | 'videoinput') => {
    try {
      const { Room } = await getLivekit();
      return await Room.getLocalDevices(kind);
    } catch {
      return [];
    }
  };

  const switchDevice = async (kind: 'audioinput' | 'audiooutput' | 'videoinput', deviceId: string) => {
    if (!livekitRoom.value) return;
    try {
      await livekitRoom.value.switchActiveDevice(kind, deviceId);
    } catch (err: unknown) {
      showError(`Failed to switch ${kind} device: ${getErrMsg(err)}`);
    }
  };

  const sendTextMessage = async () => {
    if (!newMessage.value.trim() || !livekitRoom.value) return;
    await publishData({ type: 'chat', messageType: 'text', content: newMessage.value });
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

  const sendFile = async (file: File) => {
    if (!livekitRoom.value) return;
    uploadingFile.value = true;
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        await publishData({
          type: 'chat', messageType: 'file',
          content: `Shared a file: ${file.name}`,
          fileUrl: base64, fileName: file.name, fileSize: file.size,
        });
        addChatMessage({
          id: Date.now().toString() + Math.random(),
          type: 'file',
          sender: localParticipant.value?.identity || 'you',
          senderName: 'You',
          content: `Shared a file: ${file.name}`,
          timestamp: Date.now(),
          fileUrl: base64, fileName: file.name, fileSize: file.size,
        });
        uploadingFile.value = false;
      };
      reader.readAsDataURL(file);
    } catch (err: unknown) {
      showError(`Failed to send file: ${getErrMsg(err)}`);
      uploadingFile.value = false;
    }
  };

  const sendGif = async (gifUrl: string) => {
    if (!livekitRoom.value) return;
    await publishData({ type: 'chat', messageType: 'gif', content: 'Shared a GIF', gifUrl });
    addChatMessage({
      id: Date.now().toString() + Math.random(),
      type: 'gif',
      sender: localParticipant.value?.identity || 'you',
      senderName: 'You',
      content: 'Shared a GIF',
      timestamp: Date.now(),
      gifUrl,
    });
    showGifPicker.value = false;
  };

  const sendReaction = async (emoji: string) => {
    if (!livekitRoom.value) return;
    await publishData({ type: 'reaction', emoji });
    showFlyingReaction(emoji);
  };

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
    for (const element of remoteVideoRefs.value.values()) element.remove();
    remoteVideoRefs.value.clear();
    for (const participant of participantsToClean) {
      const container = document.getElementById(`remote-${participant.identity}`);
      if (container) container.innerHTML = '';
    }
    // Clear in-memory state on leave
    chatMessages.value = [];
    roomNotifications.value = [];
    flyingReactions.value = [];
    currentRoom.value = null;
    timerSyncedSettings.value = null;
    unreadMessageCount.value = 0;
    lastReadMessageIndex.value = -1;
  };

  const getParticipantAvatar = (participant: RemoteParticipant) => {
    try {
      if (participant.metadata) {
        const metadata = JSON.parse(participant.metadata);
        return metadata.avatar_url || metadata.custom_avatar_url;
      }
    } catch {
      // Metadata may not be valid JSON
    }
    return null;
  };

  const getRoomMetadata = () => {
    try {
      if (livekitRoom.value?.metadata) return JSON.parse(livekitRoom.value.metadata);
    } catch {
      // Metadata may not be valid JSON
    }
    return null;
  };

  const getParticipantMetadata = (participant: RemoteParticipant | LocalParticipant) => {
    try {
      if (participant.metadata) return JSON.parse(participant.metadata);
    } catch {
      // Metadata may not be valid JSON
    }
    return null;
  };

  const getLocalParticipantAvatar = () => {
    const { userInfo } = useAuthStore();
    if (userInfo.value) return userInfo.value.avatar_url || userInfo.value.custom_avatar_url;
    return null;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const totalParticipants = computed(() => participants.value.length + (localParticipant.value ? 1 : 0));

  watch(showChat, (newValue) => {
    if (newValue) unreadMessageCount.value = 0;
  });

  return {
    livekitRoom, isConnected, isConnecting, error, token, timerSyncedSettings, roomNotifications, activeSpeakerIdentities,
    isMicEnabled, isCameraEnabled, isSpeakerEnabled, isScreenShareEnabled, localScreenShareRef,
    participants, localParticipant, localVideoRef, remoteVideoRefs,
    chatMessages, newMessage, messagesContainer, showChat,
    showEmojiPicker, showGifPicker, showReactionPicker,
    fileInputRef, uploadingFile, flyingReactions, commonReactions, commonGifs,
    currentRoom, unreadMessageCount, totalParticipants, lastReadMessageIndex,
    joinRoom, leaveRoom: cleanup, toggleMicrophone, toggleCamera,
    toggleSpeaker, enableCameraAndMicrophone, toggleScreenShare,
    getAvailableDevices, switchDevice, sendTextMessage, sendFile,
    sendGif, sendReaction, getParticipantAvatar, getLocalParticipantAvatar,
    formatFileSize, cleanup, buildApiUrl, getRoomMetadata, getParticipantMetadata,
  };
});
