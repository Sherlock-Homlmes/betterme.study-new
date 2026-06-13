# Pomodoro Rooms (Phòng học nhóm)

## Store: `usePomodoroRoomsStore` (`stores/pomodoroRooms.ts`)

Real-time video/audio rooms dùng **LiveKit** (WebRTC). Lazy load: `import('livekit-client')` chỉ khi cần.

---

## Data Models

```typescript
interface RoomInfo {
  room_name: string
  livekit_room_name: string
  limit: number
  num_participants: number
  pomodoro_settings?: PomodoroSettings
  created_by?: string
  created_at?: string
}

interface ChatMessage {
  id: string
  type: 'text' | 'file' | 'gif' | 'reaction'
  sender: string        // identity của participant
  senderName: string
  content: string
  timestamp: number
  fileUrl?: string      // base64 string cho file
  fileName?: string
  fileSize?: number
  gifUrl?: string
  reaction?: string
}
```

---

## State

### Connection State
| Field | Mô tả |
|-------|-------|
| `livekitRoom` | LiveKit Room instance (`null` khi chưa kết nối) |
| `isConnected` | Đã kết nối room |
| `isConnecting` | Đang trong quá trình kết nối |
| `error` | Lỗi gần nhất |
| `token` | LiveKit access token |

### Media State
| Field | Default | Mô tả |
|-------|---------|-------|
| `isMicEnabled` | false | Microphone bật/tắt |
| `isCameraEnabled` | false | Camera bật/tắt |
| `isSpeakerEnabled` | true | Speaker bật/tắt |
| `isScreenShareEnabled` | false | Chia sẻ màn hình của local user |
| `localScreenShareRef` | null | HTMLVideoElement để attach local screen share track |

### Participants
| Field | Mô tả |
|-------|-------|
| `participants` | Danh sách `RemoteParticipant[]` |
| `localParticipant` | `LocalParticipant` của user hiện tại |
| `localVideoRef` | HTMLVideoElement cho camera local |
| `localScreenShareRef` | HTMLVideoElement cho screen share local |
| `remoteVideoRefs` | `Map<string, HTMLVideoElement>` — key là identity (camera) hoặc `screen-share-{identity}` (screen share) |
| `activeSpeakerIdentities` | `Set<string>` — các identity đang nói |

### Chat State
| Field | Mô tả |
|-------|-------|
| `chatMessages` | Lịch sử tin nhắn |
| `newMessage` | Nội dung đang soạn |
| `showChat` | Hiện/ẩn panel chat |
| `unreadMessageCount` | Số tin chưa đọc (reset khi mở chat) |
| `flyingReactions` | Animated reactions bay trên màn hình |

---

## Luồng Join Room

```
joinRoom(roomInfo):
  1. isConnecting = true
  2. POST /v2/pomodoro-rooms/join  body: { livekit_room_name }
     → nhận token LiveKit
  3. new Room({ adaptiveStream: true, dynacast: true, ... })
  4. setupRoomListeners(room)   ← đăng ký tất cả events
  5. room.connect(LIVEKIT_URL, token)
  6. isConnected = true
  7. Nếu room.metadata có pomodoro_settings → apply vào userSettings
```

### Room Metadata Sync

Khi join room, nếu room có `pomodoro_settings` trong metadata → tự động override `userSettings.value.pomodoro_settings` của user. Đồng bộ timer setting giữa các thành viên trong phòng.

---

## Room Events (`setupRoomListeners`)

| Event | Xử lý |
|-------|-------|
| `TrackSubscribed` | `attachTrack()` hoặc `attachScreenShareTrack()` tùy `publication.source` |
| `TrackUnsubscribed` | `detachTrack()` / `detachScreenShareTrack()` |
| `TrackMuted / TrackUnmuted` | `updateParticipantsList()` |
| `ParticipantConnected` | `updateParticipantsList()` + toast notification |
| `ParticipantDisconnected` | Xóa video elements, cleanup refs, toast notification |
| `ActiveSpeakersChanged` | Cập nhật `activeSpeakerIdentities` |
| `DataReceived` | `handleDataReceived()` → chat hoặc reaction |
| `Disconnected` | `isConnected = false`, `cleanup()` |
| `LocalTrackPublished` | Cập nhật state + attach track vào local element |
| `LocalTrackUnpublished` | Cập nhật state + detach track |
| `MediaDevicesError` | `showError()` với message phù hợp |

### LocalTrackPublished chi tiết

```typescript
if source === Camera:
  isCameraEnabled = true
  attach track → localVideoRef

if source === Microphone:
  isMicEnabled = true

if source === ScreenShare:
  isScreenShareEnabled = true
  attach track → localScreenShareRef   // preview màn hình local
```

---

## Video Track Management

### `attachTrack(track, participantIdentity)` — async

1. Tạo `<video>` element nếu chưa có (autoplay, playsInline, `id="remote-video-{identity}"`)
2. `track.attach(videoElement)`
3. `await nextTick()` — chờ Vue render container `#remote-{identity}`
4. Append vào container DOM `#remote-{identity}`
5. Lưu vào `remoteVideoRefs` map với key = `identity`

### `attachScreenShareTrack(track, participantIdentity)` — async

Tương tự nhưng:
- Key trong map: `screen-share-{identity}`
- Container DOM: `#screenshare-{identity}` (tách biệt với camera)
- `await nextTick()` trước khi lookup container để tránh race condition khi join vào phòng đang có sẵn screen share

> **Lý do nextTick**: `TrackSubscribed` có thể fire trước khi Vue render xong tile của participant (đặc biệt khi join room mà người khác đang share màn hình). `nextTick` đảm bảo container tồn tại trước khi append.

---

## DOM Container Convention

| Loại | Container ID | remoteVideoRefs key |
|------|-------------|-------------------|
| Camera remote | `#remote-{identity}` | `identity` |
| Screen share remote | `#screenshare-{identity}` | `screen-share-{identity}` |
| Camera local | `ref="localVideoRef"` | — |
| Screen share local | `ref="localScreenShareRef"` | — |

---

## Leave Room / Cleanup

```typescript
cleanup():
  livekitRoom.disconnect()
  livekitRoom = null
  Reset state: isConnected, isMic, isCam, isScreenShare = false
  localParticipant = null
  participants = []
  Xóa tất cả video elements
  Clear remoteVideoRefs map
```

---

## Participant Metadata

```typescript
getParticipantAvatar(participant):
  JSON.parse(participant.metadata)?.avatar_url || custom_avatar_url

getLocalParticipantAvatar():
  userInfo.value?.avatar_url || userInfo.value?.custom_avatar_url
```

---

## API Endpoints

```
POST /v2/pomodoro-rooms/join   body: { livekit_room_name }
                               → { token: string }
```
