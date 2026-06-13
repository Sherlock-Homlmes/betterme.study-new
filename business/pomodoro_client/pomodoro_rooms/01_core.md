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
| `isScreenShareEnabled` | false | Chia sẻ màn hình |

### Participants
| Field | Mô tả |
|-------|-------|
| `participants` | Danh sách `RemoteParticipant[]` |
| `localParticipant` | `LocalParticipant` của user hiện tại |
| `localVideoRef` | HTMLVideoElement cho camera local |
| `remoteVideoRefs` | Map<identity, HTMLVideoElement> |

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

Khi join room, nếu room có `pomodoro_settings` trong metadata → tự động override `userSettings.value.pomodoro_settings` của user. Điều này đồng bộ timer setting giữa các thành viên trong phòng.

---

## Room Events (`setupRoomListeners`)

| Event | Xử lý |
|-------|-------|
| `TrackSubscribed` | `attachTrack()` hoặc `attachScreenShareTrack()` |
| `TrackUnsubscribed` | `detachTrack()` / `detachScreenShareTrack()` |
| `ParticipantConnected` | `updateParticipantsList()` |
| `ParticipantDisconnected` | Xóa video elements, cleanup refs |
| `DataReceived` | `handleDataReceived()` → chat hoặc reaction |
| `Disconnected` | `isConnected = false`, `cleanup()` |
| `LocalTrackPublished` | Cập nhật `isCameraEnabled`, `isMicEnabled`, v.v. |
| `MediaDevicesError` | `showError()` với message phù hợp |

---

## Video Track Management

### `attachTrack(track, participantIdentity)`

1. Tạo `<video>` element nếu chưa có (auto-play, playsInline)
2. `track.attach(videoElement)`
3. Append vào container DOM `#remote-{identity}`
4. Lưu vào `remoteVideoRefs` map

### `attachScreenShareTrack(track, participantIdentity)`

Tương tự nhưng dùng key `screen-share-{identity}` trong map.

---

## Chat (Data Channel)

Tất cả chat messages được gửi qua **LiveKit Data Channel** (reliable, không qua server riêng):

### Gửi tin nhắn

```typescript
publishData({ type: 'chat', messageType: 'text', content: '...' })
// encode → Uint8Array → room.localParticipant.publishData(data, { reliable: true })
```

### Nhận tin nhắn

```typescript
handleDataReceived(payload, participant):
  data = JSON.parse(TextDecoder.decode(payload))
  if data.type === 'chat' → addChatMessage(...)
  if data.type === 'reaction' → showFlyingReaction(emoji)
```

### Loại tin nhắn

| Type | Mô tả |
|------|-------|
| `text` | Tin nhắn văn bản thường |
| `file` | File (encode base64, gửi qua data channel) |
| `gif` | URL gif từ preset |
| `reaction` | Emoji reaction (hiệu ứng bay) |

### Preset Reactions & GIFs

```typescript
commonReactions = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏']
commonGifs = [6 URL từ giphy.com]
```

---

## Flying Reactions

Khi gửi hoặc nhận reaction:
```typescript
flyingReactions.push({ id, emoji, x: random(10-90)%, y: 100 })
setTimeout(() => splice reaction, 3000)
```
CSS animation di chuyển từ bottom (y=100) lên trên.

---

## Media Controls

| Action | API |
|--------|-----|
| Toggle mic | `localParticipant.setMicrophoneEnabled(bool)` |
| Toggle camera | `localParticipant.setCameraEnabled(bool)` |
| Toggle speaker | Set `.muted` trên tất cả remote video elements |
| Screen share | `localParticipant.setScreenShareEnabled(bool)` |
| Get devices | `Room.getLocalDevices(kind)` |
| Switch device | `room.switchActiveDevice(kind, deviceId)` |

---

## Leave Room / Cleanup

```typescript
cleanup():
  livekitRoom.disconnect()
  livekitRoom = null
  Reset tất cả state: isConnected, isMic, isCam, ...
  Xóa tất cả video elements
  Clear remoteVideoRefs map
```

---

## Participant Metadata

```typescript
getParticipantAvatar(participant):
  JSON.parse(participant.metadata)?.avatar_url

getLocalParticipantAvatar():
  userInfo.value?.avatar_url || userInfo.value?.custom_avatar_url
```

---

## API Endpoints

```
POST /v2/pomodoro-rooms/join   body: { livekit_room_name }
                               → { token: string }
```

Danh sách rooms được fetch riêng (component `listRoomView.vue` gọi `buildApiUrl('/rooms')` hay tương tự).
