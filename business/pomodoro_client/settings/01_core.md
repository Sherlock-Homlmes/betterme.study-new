# Settings (Cài đặt)

## Nguồn dữ liệu

Có **hai store settings** song song:

| Store | File | Phạm vi |
|-------|------|---------|
| `useSettings` (Pinia) | `stores/settings.ts` | Local-first, không sync API |
| `useAuthStore.userSettings` | `stores/auth.ts` | Sync với API khi đăng nhập, persist localStorage |

`userSettings` trong `auth.ts` là nguồn chính cho pomodoro settings (thời gian, interval). `useSettings` dùng cho các cài đặt UI/behavior (theme, adaptive ticking, audio, v.v.).

---

## Cấu trúc Settings (`stores/settings.ts`)

### Visuals
```typescript
visuals: {
  theme: {
    work:       [255, 107, 107],  // màu RGB
    shortpause: [244, 162, 97],
    longpause:  [46, 196, 182],
  },
  darkMode: boolean,
}
```

### Schedule
```typescript
schedule: {
  lengths: {
    work:       25 * 60 * 1000,  // ms
    shortpause:  5 * 60 * 1000,
    longpause:  15 * 60 * 1000,
  },
  longPauseInterval: 3,           // mỗi 3 lần pause thì long pause
  autoStartNextTimer: {
    wait:      8 * 1000,          // chờ 8 giây trước khi tự start
    autostart: true,
  },
  numScheduleEntries: 3,          // số entries hiển thị trên schedule bar
  visibility: {
    enabled: true,
    showSectionType: true,
  },
}
```

### Timer Display
```typescript
currentTimer: TimerType  // "traditional" | "approximate" | "percentage"
sectionEndAction: SectionEndAction  // "stop" | "skip" | "continue"
```

### Adaptive Ticking
```typescript
adaptiveTicking: {
  enabled: boolean,
  baseTickRate: 1000,         // 1 giây
  registeredHidden: boolean | null,  // tab có đang bị ẩn không
}
```

### Audio
```typescript
audio: {
  volume: 0.9,
  repeatTimes: 2,
  soundSet: "musical",
}
permissions: {
  notifications: false | null,
  audio: true,
}
```

### Tasks
```typescript
tasks: {
  enabled: false,
  maxActiveTasks: 3,
  removeCompletedTasks: true,
}
```

---

## userSettings (`stores/auth.ts`)

Đây là settings được **sync với server** khi user đăng nhập:

```typescript
{
  language: "en",
  visuals: {
    pomodoro_study:   [255, 107, 107],
    pomodoro_rest:    [244, 162, 97],
    pomodoro_long_rest: [46, 196, 182],
    timer_show: "traditional",
    dark_mode: false,
    show_progress_bar: true,
    show_pip_mode: true,
    enable_audio: true,
    enable_music_when_visit_site: true,
    enable_adaptive_ticking: true,
    auto_start_next_time: true,
    custom_audios: [],
    custom_backgrounds: [],
    background: null,
  },
  pomodoro_settings: {
    pomodoro_study_time:    25 * 60,  // giây
    pomodoro_rest_time:      5 * 60,
    pomodoro_long_rest_time: 20 * 60,
    long_rest_time_interval: 3,
  },
}
```

### Auto-sync

`watch(userSettings, ...)` trong `auth.ts` tự động gọi `PATCH /users/self/settings` mỗi khi có thay đổi, sử dụng `ChangeTracker` để chỉ gửi phần thay đổi (diff), không gửi toàn bộ.

### Validation tự động

```
pomodoro_study_time    >= 5 phút (300s)
pomodoro_rest_time     >= 5 phút
pomodoro_long_rest_time >= 5 phút
```

Nếu nhỏ hơn min → tự động set lại về min.

---

## Timer Presets (`assets/settings/timerPresets.ts`)

| Preset | Work | Short Break | Long Break | Interval |
|--------|------|-------------|------------|----------|
| `default` | 25 phút | 5 phút | 15 phút | 3 |
| `easy` | 15 phút | 5 phút | 15 phút | 3 |
| `advanced` | 40 phút | 10 phút | 30 phút | 3 |
| `workaholic` | 50 phút | 10 phút | 30 phút | 3 |

`getActiveSchedulePreset` (computed) so sánh settings hiện tại với presets để highlight preset đang active. `applyPreset(id)` áp dụng preset vào `userSettings.pomodoro_settings`.

---

## Dark Mode

Dark mode được quản lý qua `useDark()` từ VueUse, toggle class `dark` trên `<body>`. Watcher trong `auth.ts` sync `userSettings.visuals.dark_mode` → `isDarkMode` tự động.

---

## Export / Import / Reset Settings

3 button trong `panelSettings/coreSettingTab/`:
- **Export**: Serialize settings thành JSON, download file
- **Import**: Upload file JSON, parse và apply vào store
- **Reset**: Set `settings.reset = true` → trigger reset về default

---

## Locale / Ngôn ngữ

`getCurrentLocale` getter trả về `settings.lang ?? "en"`. Các ngôn ngữ hỗ trợ: `en`, `vi`, `zh`, `fr`, `es`, `pt`, `hr`, `hu`.
