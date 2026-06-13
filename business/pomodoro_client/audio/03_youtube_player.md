# YouTube Player

## State

```typescript
youtubeVolume: useStorage("youtube-volume", 0)
youtubeLink:   useStorage("youtube-link", "https://youtu.be/JCKBaJDRMw4")
```

Cả hai persist localStorage. Default link là lo-fi study playlist.

## Component `YouTubePlayer.vue`

- Input URL để đổi playlist/video
- Embed YouTube iframe với `&autoplay=1&mute=0`
- Volume slider map 0→100% → iframe postMessage để set volume
- Nếu `youtubeVolume = 0` → ẩn/mute player

## `audioTabActive`

`ref<boolean>` trong `useAudioStore`. Khi user mở tab audio trong settings, `audioTabActive = true`. Dùng để quyết định có play music tự động khi vào site không (`enable_music_when_visit_site` setting).
