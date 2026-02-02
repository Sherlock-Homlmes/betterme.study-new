<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Room, RoomEvent, RemoteParticipant, RemoteTrack, RemoteTrackPublication, Track, LocalTrackPublication } from 'livekit-client'
import { useOpenPanels } from '@/stores/openpanels'
import { XIcon, MicrophoneIcon, MicrophoneOffIcon, VideoIcon, VideoOffIcon, PhoneIcon } from 'vue-tabler-icons'
import { runtimeConfig } from '@/config/runtimeConfig'
import { useDevicesList } from '@vueuse/core'

const openPanels = useOpenPanels()

const room = ref<Room | null>(null)
const isConnected = ref(false)
const isConnecting = ref(false)
const isMicEnabled = ref(false)
const isCameraEnabled = ref(false)
const participants = ref<Map<string, RemoteParticipant>>(new Map())
const localVideoTrack = ref<MediaStreamTrack | null>(null)
const localAudioTrack = ref<MediaStreamTrack | null>(null)
const localVideoElement = ref<HTMLVideoElement | null>(null)
const roomName = ref('study-room')
const participantName = ref(`User-${Math.floor(Math.random() * 1000)}`)

const LIVEKIT_URL = runtimeConfig.public.LIVEKIT_URL
const LIVEKIT_KEY = 'devkey'
const LIVEKIT_SECRET = 'secretsecret'

const remoteParticipants = computed(() => Array.from(participants.value.values()))

// Use vueuse for device permissions
const {
	videoInputs: cameras,
	audioInputs: microphones,
} = useDevicesList({
	requestPermissions: true,
})

const mediaStream = ref<MediaStream | null>(null)

// Get individual tracks from the stream
function getAudioTrack() {
	if (!mediaStream.value) return null
	const tracks = mediaStream.value.getAudioTracks()
	return tracks.length > 0 ? tracks[0] : null
}

function getVideoTrack() {
	if (!mediaStream.value) return null
	const tracks = mediaStream.value.getVideoTracks()
	return tracks.length > 0 ? tracks[0] : null
}

async function startMedia() {
	try {
		const constraints: MediaStreamConstraints = {
			audio: microphones.value && microphones.value.length > 0
				? { deviceId: microphones.value[0].deviceId }
				: true,
			video: cameras.value && cameras.value.length > 0
				? { deviceId: cameras.value[0].deviceId }
				: true,
		}
		const stream = await navigator.mediaDevices.getUserMedia(constraints)
		mediaStream.value = stream
	} catch (error) {
		console.error('Failed to get media stream:', error)
		throw error
	}
}

function stopMedia() {
	if (mediaStream.value) {
		mediaStream.value.getTracks().forEach(track => track.stop())
		mediaStream.value = null
	}
	localVideoTrack.value = null
	localAudioTrack.value = null
}

async function connectToRoom() {
	if (isConnecting.value || isConnected.value) return

	isConnecting.value = true

	try {
		const token = await generateToken(participantName.value, roomName.value)

		room.value = new Room()

		room.value.on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
		room.value.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
		room.value.on(RoomEvent.ParticipantConnected, handleParticipantConnected)
		room.value.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
		room.value.on(RoomEvent.Disconnected, handleDisconnected)

		await room.value.connect(LIVEKIT_URL, token)

		room.value.remoteParticipants.forEach((participant) => {
			participants.value.set(participant.sid, participant)
		})

		isConnected.value = true
		isConnecting.value = false
	} catch (error) {
		console.error('Failed to connect to room:', error)
		isConnecting.value = false
	}
}

async function disconnectFromRoom() {
	if (room.value) {
		await room.value.disconnect()
		room.value = null
	}
	isConnected.value = false
	participants.value.clear()
	localVideoTrack.value = null
	localAudioTrack.value = null
	stopMedia()
}

async function toggleMicrophone() {
	if (!room.value) return

	try {
		if (isMicEnabled.value) {
			// Disable microphone
			if (localAudioTrack.value) {
				localAudioTrack.value.enabled = false
			}
			isMicEnabled.value = false
		} else {
			// Enable microphone
			if (!mediaStream.value) {
				await startMedia()
			}
			const audioTrack = getAudioTrack()
			if (audioTrack) {
				audioTrack.enabled = true
				localAudioTrack.value = audioTrack
				// Publish track to LiveKit
				await room.value.localParticipant.publishTrack(audioTrack)
			}
			isMicEnabled.value = true
		}
	} catch (error) {
		console.error('Failed to toggle microphone:', error)
	}
}

async function toggleCamera() {
	if (!room.value) return

	try {
		if (isCameraEnabled.value) {
			// Disable camera
			if (localVideoTrack.value) {
				localVideoTrack.value.enabled = false
			}
			isCameraEnabled.value = false
		} else {
			// Enable camera
			if (!mediaStream.value) {
				await startMedia()
			}
			const videoTrack = getVideoTrack()
			if (videoTrack) {
				videoTrack.enabled = true
				localVideoTrack.value = videoTrack
				// Publish track to LiveKit
				await room.value.localParticipant.publishTrack(videoTrack)
				// Attach to video element
				if (localVideoElement.value && mediaStream.value) {
					localVideoElement.value.srcObject = mediaStream.value
				}
			}
			isCameraEnabled.value = true
		}
	} catch (error) {
		console.error('Failed to toggle camera:', error)
	}
}

function handleTrackSubscribed(
	track: RemoteTrack,
	publication: RemoteTrackPublication,
	participant: RemoteParticipant
) {
	if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
		const element = track.attach()
		element.id = `track-${participant.sid}-${track.sid}`
		element.autoplay = true
		element.playsInline = true
		element.className = 'w-full h-full object-cover rounded-lg'
	}
}

function handleTrackUnsubscribed(
	track: RemoteTrack,
	publication: RemoteTrackPublication,
	participant: RemoteParticipant
) {
	track.detach().forEach((element) => {
		element.remove()
	})
}

function handleParticipantConnected(participant: RemoteParticipant) {
	participants.value.set(participant.sid, participant)
}

function handleParticipantDisconnected(participant: RemoteParticipant) {
	participants.value.delete(participant.sid)
}

function handleDisconnected() {
	isConnected.value = false
	participants.value.clear()
	stopMedia()
}

async function generateToken(participantName: string, roomName: string): Promise<string> {
	const response = await fetch(`${runtimeConfig.public.API_URL}/livekit/token`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			apiKey: LIVEKIT_KEY,
			apiSecret: LIVEKIT_SECRET,
			participantName,
			roomName,
		}),
	})

	if (!response.ok) {
		throw new Error('Failed to generate token')
	}

	const data = await response.json()
	return data.token
}

function closePanel() {
	if (isConnected.value) {
		disconnectFromRoom()
	}
	openPanels.voiceChannel = false
}

onMounted(() => {
	connectToRoom()
})

onUnmounted(() => {
	disconnectFromRoom()
})
</script>

<template lang="pug">
div(class="fixed right-0 top-0 h-full w-full md:w-96 bg-surface dark:bg-surface-dark shadow-xl z-50 flex flex-col")
	div(class="flex items-center justify-between p-4 border-b border-surface-variant dark:border-surface-ondark")
		h2(class="text-lg font-semibold text-surface-onlight dark:text-surface-ondark") Voice Channel
		button(
			@click="closePanel"
			class="p-2 rounded-full hover:bg-surface-variant dark:hover:bg-surface-ondark transition"
		)
			XIcon(:size="20" class="text-surface-onlight dark:text-surface-ondark")

	div(class="flex-1 overflow-y-auto p-4")
		div(v-if="isConnecting" class="flex items-center justify-center h-full")
			p(class="text-surface-onlight dark:text-surface-ondark") Connecting...

		div(v-else-if="!isConnected" class="flex flex-col items-center justify-center h-full gap-4")
			p(class="text-surface-onlight dark:text-surface-ondark") Disconnected
			button(
				@click="connectToRoom"
				class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
			) Connect

		div(v-else class="flex flex-col gap-4")
			div(class="flex flex-col gap-2")
				label(class="text-sm font-medium text-surface-onlight dark:text-surface-ondark") Room
				input(
					v-model="roomName"
					type="text"
					:disabled="isConnected"
					class="px-3 py-2 rounded-lg bg-surface-variant dark:bg-surface-ondark text-surface-onlight dark:text-surface-ondark border border-surface-variant dark:border-surface-ondark focus:outline-none focus:ring-2 focus:ring-primary"
					placeholder="Enter room name"
				)

			div(class="flex flex-col gap-2")
				label(class="text-sm font-medium text-surface-onlight dark:text-surface-ondark") Your Name
				input(
					v-model="participantName"
					type="text"
					:disabled="isConnected"
					class="px-3 py-2 rounded-lg bg-surface-variant dark:bg-surface-ondark text-surface-onlight dark:text-surface-ondark border border-surface-variant dark:border-surface-ondark focus:outline-none focus:ring-2 focus:ring-primary"
					placeholder="Enter your name"
				)

			div(class="flex flex-col gap-2 mt-4")
				h3(class="text-sm font-medium text-surface-onlight dark:text-surface-ondark") Participants ({{ remoteParticipants.length + 1 }})
				div(class="grid grid-cols-2 gap-2")
					div(class="relative aspect-video bg-surface-variant dark:bg-surface-ondark rounded-lg overflow-hidden")
						video(
							ref="localVideoElement"
							autoplay
							muted
							playsinline
							class="w-full h-full object-cover"
						)
						div(class="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded text-white text-xs")
							| You ({{ isMicEnabled ? '🎤' : '🔇' }}{{ isCameraEnabled ? '📹' : '📷' }})

					div(
						v-for="participant in remoteParticipants"
						:key="participant.sid"
						class="relative aspect-video bg-surface-variant dark:bg-surface-ondark rounded-lg overflow-hidden"
					)
						div(
							:id="`participant-${participant.sid}`"
							class="w-full h-full"
						)
						div(class="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 rounded text-white text-xs")
							| {{ participant.name || participant.identity }}

	div(class="flex items-center justify-center gap-4 p-4 border-t border-surface-variant dark:border-surface-ondark")
		button(
			@click="toggleMicrophone"
			:class="['p-3 rounded-full transition', isMicEnabled ? 'bg-surface-variant dark:bg-surface-ondark' : 'bg-red-500']"
		)
			MicrophoneIcon(v-if="isMicEnabled" :size="24" class="text-surface-onlight dark:text-surface-ondark")
			MicrophoneOffIcon(v-else :size="24" class="text-white")

		button(
			@click="toggleCamera"
			:class="['p-3 rounded-full transition', isCameraEnabled ? 'bg-surface-variant dark:bg-surface-ondark' : 'bg-red-500']"
		)
			VideoIcon(v-if="isCameraEnabled" :size="24" class="text-surface-onlight dark:text-surface-ondark")
			VideoOffIcon(v-else :size="24" class="text-white")

		button(
			v-if="isConnected"
			@click="disconnectFromRoom"
			class="p-3 rounded-full bg-red-500 hover:bg-red-600 transition"
		)
			PhoneIcon(:size="24" class="text-white")
</template>
