# Media Controls & Video Grid trong Pomodoro Rooms

## Camera & Microphone

### Toggle Mic
```typescript
toggleMicrophone():
  localParticipant.setMicrophoneEnabled(!isMicEnabled)
  isMicEnabled = newState
```

### Toggle Camera
```typescript
toggleCamera():
  localParticipant.setCameraEnabled(!isCameraEnabled)
  // Sau 100ms: re-attach video track vào localVideoRef nếu enable
```

Delay 100ms cần thiết vì LiveKit cần thời gian publish track trước khi attach.

### Enable cả Camera + Mic cùng lúc
```typescript
enableCameraAndMicrophone():
  setCameraEnabled(true) + setMicrophoneEnabled(true)
  // re-attach local video sau 100ms
```

---

## Speaker
```typescript
toggleSpeaker():
  isSpeakerEnabled = !isSpeakerEnabled
  iterate tất cả remoteVideoRefs → set .muted = !isSpeakerEnabled
```

Mute/unmute tất cả remote video elements cùng lúc.

---

## Screen Share
```typescript
toggleScreenShare():
  localParticipant.setScreenShareEnabled(!isScreenShareEnabled)
```

LiveKit xử lý browser screen share API. Track publish dưới source `Track.Source.ScreenShare`.
Local preview: track được attach vào `localScreenShareRef` qua event `LocalTrackPublished`.

---

## Device Management

### Liệt kê thiết bị
```typescript
getAvailableDevices('audioinput' | 'audiooutput' | 'videoinput')
  → Room.getLocalDevices(kind) → MediaDeviceInfo[]
```

### Đổi thiết bị
```typescript
switchDevice(kind, deviceId):
  room.switchActiveDevice(kind, deviceId)
```

---

## Media Error Handling

```
MediaDevicesError event:
  PermissionDenied → "Permission denied for media device"
  NotFound         → "Media device not found"
  DeviceInUse      → "Media device is already in use"
  other            → "Unknown media device error"
```

Kèm theo update state: `isCameraEnabled = false` hoặc `isMicEnabled = false` tùy lỗi.

---

## Video Grid (`roomView/VideoGrid.vue`)

### Tile types

| Tile ID | Nội dung |
|---------|---------|
| `'local'` | Camera local user |
| `'local-ss'` | Screen share local user |
| `'remote-{identity}'` | Camera remote participant |
| `'ss-{identity}'` | Screen share remote participant |

### Grid Columns (normal mode)

```typescript
tileCount = participants.length + (localParticipant ? 1 : 0) + screenShareCount
gridCols:
  ≤ 1 tile  → grid-cols-1
  ≤ 4 tiles → grid-cols-2
  > 4 tiles → grid-cols-3
```

---

## Spotlight / Pin Feature

Click vào bất kỳ tile nào để phóng to (giống Discord).

### State
```typescript
pinnedId = ref<string | null>(null)
// null = chế độ grid bình thường
// 'local' | 'local-ss' | 'remote-{id}' | 'ss-{id}' = spotlight mode
```

### togglePin(id)
```typescript
async togglePin(id):
  pinnedId = pinnedId === id ? null : id   // toggle pin
  await nextTick()                          // chờ Vue render layout mới
  reattachVideos()                          // re-insert video elements vào container mới
```

### reattachVideos()

Sau khi Vue switch giữa grid và spotlight layout, các `<video>` element được quản lý imperatively (do LiveKit) có thể bị mất container. `reattachVideos` duyệt qua tất cả participants và append lại vào đúng container:

```typescript
reattachVideos():
  participants.forEach(p => {
    cam = remoteVideoRefs.get(p.identity)
    camBox = document.getElementById(`remote-${p.identity}`)
    if cam && camBox && !camBox.contains(cam) → camBox.appendChild(cam)

    ss = remoteVideoRefs.get(`screen-share-${p.identity}`)
    ssBox = document.getElementById(`screenshare-${p.identity}`)
    if ss && ssBox && !ssBox.contains(ss) → ssBox.appendChild(ss)
  })
```

### Layout Spotlight Mode

```
┌─────────────────────────────────────────┬──────────┐
│                                         │ thumb 1  │
│         Tile được pin (flex-1)          │ thumb 2  │
│                                         │ thumb 3  │
│         Click để unpin                  │  ...     │
└─────────────────────────────────────────┴──────────┘
  Cột trái: main tile (flex-1)    Cột phải: w-[9.5rem]
```

Thumbnail strip hiển thị avatar/placeholder của các tile còn lại (không re-stream video để tránh duplicate video element).

### Auto-unpin

Khi participant leave trong khi tile của họ đang được pin → tự động `pinnedId = null`.

---

## Control Bar

Nằm ở dưới cùng của VideoGrid. Mỗi button là `<button>` thuần với Tailwind, **không dùng ButtonImportance**.

### Trạng thái visual

| State | Style |
|-------|-------|
| **ON / active** | `bg-primary text-white shadow-sm hover:brightness-110` |
| **OFF / inactive** | `bg-white border-2 border-primary text-primary dark:bg-gray-900` |

Màu icon khi OFF = màu border = màu `primary` (đồng bộ với màu khi ON). Khi tắt đi thì border + icon lấy màu background lúc bật.

### Buttons

| Button | Icon ON | Icon OFF | Ghi chú |
|--------|---------|---------|---------|
| Microphone | `MicrophoneIcon` | `MicrophoneOffIcon` | |
| Camera | `VideoIcon` | `VideoOffIcon` | |
| Speaker | `VolumeIcon` | `VolumeOffIcon` | |
| Screen Share | `DeviceDesktopIcon` | `DeviceDesktopOffIcon` | |
| Leave | `LogoutIcon` | — | Luôn `bg-primary`, emit `showLeaveDialog` |

### DeviceSelector

Component riêng nằm bên trái control bar, cho phép chọn thiết bị mic/camera/speaker mà không cần rời phòng.

---

## ParticipantList (`roomView/ParticipantList.vue`)

Sidebar danh sách participant (hiện/ẩn toggle).

- Header: tổng số participant
- Local user: badge "You" + mic/cam status icons
- Remote users: avatar, tên, speaking indicator (ring xanh), mic/cam status icons
- Avatar fallback: hiển thị chữ cái đầu của tên nếu không có ảnh
- Template dùng Pug — **không dùng TypeScript non-null assertion `!`** trong binding vì Vue template compile sang JS (dùng `|| ''` thay thế)
