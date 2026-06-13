# Audio System (Hệ thống âm thanh)

## Tổng quan

Có hai store audio riêng biệt:
- **`useLocalAudioDBStore`**: Quản lý file âm thanh thông báo (notification sound) qua IndexedDB.
- **`useAudioStore`**: Quản lý tracks nhạc, ambient sounds, YouTube player.

---

## 1. Notification Sound (`useLocalAudioDBStore`)

### Cơ chế IndexedDB

Âm thanh thông báo được lưu vào IndexedDB thay vì fetch từ mạng mỗi lần, giúp hoạt động offline:

```
initDB() → open "musicDB" v1, objectStore "audio"
loadAndSetAudio():
  1. initDB()
  2. getAudioFromDB(db, id=1) → tìm audio đã lưu
  3. Nếu không có: fetch "/audio/musical/sample.mp3" → ArrayBuffer
  4. storeAudioInDB(db, audioData, id=1, "sample")
  5. Tạo Blob URL từ ArrayBuffer
  6. blobUrl.value = URL.createObjectURL(blob)
  7. audioDataLoaded.value = true
```

### State

| Field | Mô tả |
|-------|-------|
| `blobUrl` | URL object để play audio (revoke khi load lại) |
| `audioDataLoaded` | Flag âm thanh đã sẵn sàng |

---

## 2. Music & Ambient Sounds (`useAudioStore`)

### Tracks (nhạc nền từ server)

```
GET /audios         → getAudioTracksInfo() → tracks
POST /audios        → createAudioTrack()
DELETE /audios      → deleteAudioTrack()
```

`tracks` được persist vào localStorage `"audioTracks"`.

Navigation giữa tracks: `getCurrentTrack()`, `getNextTrack()`, `getPreviousTrack()` — chưa implement logic.

### Ambient Sounds

3 kênh ambient sound độc lập, mỗi kênh có volume riêng persist localStorage:

```typescript
ambientSoundVolumes: {
  Rain:      useStorage("sound-volume-Rain", 0),
  Fireplace: useStorage("sound-volume-Fireplace", 0),
  Cafe:      useStorage("sound-volume-Cafe", 0),
}
```

Volume = 0 → tắt. Volume > 0 → phát tương ứng.

### YouTube Player

```typescript
youtubeVolume: useStorage("youtube-volume", 0)
youtubeLink:   useStorage("youtube-link", "https://youtu.be/JCKBaJDRMw4")
```

- Link YouTube mặc định là lo-fi playlist
- Volume persist localStorage
- `hasAnyVolume` (computed) = true nếu bất kỳ ambient sound hoặc youtube có volume > 0

### `audioTabActive`

Flag `ref<boolean>` để biết user có đang mở tab audio không (dùng để pause/resume tự động).

---

## UI Components (`panelSettings/audioTab/`)

### `index.vue`

Tab audio trong settings panel, tổng hợp:
- Volume slider chung
- Toggle bật/tắt audio

### `AmbientSounds.vue`

Hiển thị 3 slider volume cho Rain, Fireplace, Cafe.

### `YouTubePlayer.vue`

- Input URL YouTube
- Embedded YouTube iframe player
- Volume control

---

## Settings liên quan

```typescript
// useSettings
audio: {
  volume: 0.9,        // âm lượng notification sound (0-1)
  repeatTimes: 2,     // số lần phát lại notification sound
  soundSet: "musical" // sound set đang dùng
}
permissions: {
  audio: true         // user đã cho phép audio
}

// userSettings (auth)
visuals: {
  enable_audio: true,
  enable_music_when_visit_site: true,
  custom_audios: [],
}
```
