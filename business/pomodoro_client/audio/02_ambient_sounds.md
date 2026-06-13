# Ambient Sounds (Âm thanh nền)

## Các kênh ambient

3 kênh độc lập, volume riêng, persist localStorage:

```typescript
ambientSoundVolumes = {
  Rain:      useStorage("sound-volume-Rain", 0),       // tiếng mưa
  Fireplace: useStorage("sound-volume-Fireplace", 0),  // lửa bếp
  Cafe:      useStorage("sound-volume-Cafe", 0),       // quán cà phê
}
```

Volume range: 0 (tắt) → 1 (max). Mỗi kênh có slider riêng trong `AmbientSounds.vue`.

## `hasAnyVolume` (computed)

```typescript
computed(() =>
  Object.values(ambientSoundVolumes).some(v => v.value > 0)
  || youtubeVolume.value > 0
)
```

Dùng để hiện/ẩn audio icon indicator trên app bar.

## Audio files

Nằm trong `public/audio/`:
- `/audio/ambient/rain.mp3`
- `/audio/ambient/fireplace.mp3`
- `/audio/ambient/cafe.mp3`

Loop vô hạn khi volume > 0.
