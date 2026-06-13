# Media Controls trong Pomodoro Rooms

## Camera & Microphone

### Toggle Mic
```typescript
localParticipant.setMicrophoneEnabled(!isMicEnabled)
isMicEnabled = newState
```

### Toggle Camera
```typescript
localParticipant.setCameraEnabled(!isCameraEnabled)
// Sau 100ms delay: re-attach video track vào localVideoRef nếu enable
```

Delay 100ms cần thiết vì LiveKit cần thời gian để publish track trước khi có thể attach.

### Enable cả Camera + Mic cùng lúc
```typescript
enableCameraAndMicrophone():
  setCameraEnabled(true)
  setMicrophoneEnabled(true)
  isCameraEnabled = true
  isMicEnabled = true
  // re-attach local video
```

---

## Speaker
```typescript
toggleSpeaker():
  isSpeakerEnabled = !isSpeakerEnabled
  // iterate tất cả remoteVideoRefs → set .muted = !isSpeakerEnabled
```

Mute/unmute tất cả remote video elements cùng lúc.

---

## Screen Share
```typescript
toggleScreenShare():
  localParticipant.setScreenShareEnabled(!isScreenShareEnabled)
```

LiveKit xử lý browser screen share API. Track được publish dưới source `Track.Source.ScreenShare`.

---

## Device Management

### Liệt kê thiết bị
```typescript
getAvailableDevices('audioinput' | 'audiooutput' | 'videoinput'):
  Room.getLocalDevices(kind)
  → MediaDeviceInfo[]
```

### Đổi thiết bị
```typescript
switchDevice(kind, deviceId):
  room.switchActiveDevice(kind, deviceId)
```

Ví dụ đổi từ built-in mic sang headset mic không cần reconnect.

---

## Video Track Attachment

### Remote tracks
```
TrackSubscribed event:
  if source = Camera/Audio → attachTrack(track, identity)
  if source = ScreenShare → attachScreenShareTrack(track, identity)
```

Mỗi participant có một `<video>` element trong DOM `#remote-{identity}`. Screen share dùng key riêng `screen-share-{identity}`.

### Local camera
```typescript
// Sau khi setCameraEnabled(true):
pub = localParticipant.getTrackPublication(Track.Source.Camera)
pub.videoTrack.attach(localVideoRef.value)
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

Hiển thị:
- `localVideoRef`: Camera của user hiện tại
- Iterate `participants` → `#remote-{identity}` container cho mỗi người
- `totalParticipants = participants.length + (localParticipant ? 1 : 0)`
