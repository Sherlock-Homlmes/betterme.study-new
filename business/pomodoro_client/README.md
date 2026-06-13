# Pomodoro Client — Business Logic

Vue 3 + TypeScript + Pinia + VueUse. Có thể chạy dưới dạng Web App hoặc Desktop App (Tauri).

---

## Cấu trúc tài liệu

```
pomodoro_client/
│
├── timer/                        ← Tính năng đếm giờ (tính năng cốt lõi)
│   ├── 01_core.md                  Schedule, TimerState, pomodoro store, API
│   ├── 02_adaptive_ticking.md      Giảm CPU khi tab ẩn
│   ├── 03_display_modes.md         Traditional / Approximate / Percentage
│   └── 04_pip_mode.md              Picture-in-Picture (Desktop & Web)
│
├── settings/                     ← Cài đặt người dùng
│   ├── 01_core.md                  Tất cả fields, timer presets, auto-sync API
│   ├── 02_theme.md                 Màu sắc section, dark mode, prebuilt themes
│   └── 03_import_export.md         Export / Import / Reset
│
├── audio/                        ← Hệ thống âm thanh
│   ├── 01_core.md                  Notification sound (IndexedDB), tracks API
│   ├── 02_ambient_sounds.md        Rain / Fireplace / Cafe
│   └── 03_youtube_player.md        YouTube embed player
│
├── pomodoro_rooms/               ← Phòng học nhóm realtime (LiveKit/WebRTC)
│   ├── 01_core.md                  Join/leave room, room metadata, LiveKit events
│   ├── 02_media_controls.md        Camera, mic, speaker, screen share
│   └── 03_chat.md                  Data channel chat, file/gif/reaction
│
├── 04_auth.md                    ← Xác thực, token management, guest mode
├── 05_tasks.md                   ← Danh sách công việc (CRUD, offline support)
├── 07_statistics.md              ← Thống kê học tập, streak, chart
├── ai_chat.md                    ← AI chat assistant, channel management
├── events_and_notifications.md   ← Event logging, browser notifications, error store
└── panels_and_navigation.md      ← Panels, tabs, router, onboarding, keyboard shortcuts
```

---

## Kiến trúc tổng thể

```
App (Vue 3)
│
├── Stores (Pinia / createGlobalState)
│   ├── usePomodoroStore    → Schedule & API
│   ├── useSettings         → Local settings (Pinia)
│   ├── useAuthStore        → User info & server-synced settings
│   ├── useTaskStore        → Tasks (offline-first)
│   ├── useAudioStore       → Music, ambient, YouTube
│   ├── useStatistics       → Study stats
│   ├── usePomodoroRoomsStore → LiveKit rooms
│   ├── useAIChatStore      → AI chat channels
│   ├── useEvents           → In-memory event log
│   ├── useNotifications    → Browser notification permission
│   ├── useErrorStore       → Global error display
│   └── useOpenPanels       → Trạng thái mở/đóng panels
│
├── Composables
│   ├── useTicker()         → Tick engine (setTimeout-based)
│   ├── useTimerSync()      → Emit Tauri events → PIP window
│   └── usePIPWindow()      → Tauri PIP window commands
│
└── Components
    ├── timer/              → Timer display + controls
    ├── panelTask/          → Todo list
    ├── panelSettings/      → Settings tabs
    ├── panelAIChat/        → AI chat
    ├── panelPomodoroRooms/ → Video rooms
    └── tutorial/           → Onboarding flow
```

---

## Nguyên tắc quan trọng

1. **Offline-first**: Timer, tasks, settings đều hoạt động không cần đăng nhập.
2. **Wall-clock timing**: Tick rate không ảnh hưởng độ chính xác thời gian — luôn đo `Date.now()` delta.
3. **Settings auto-sync**: Chỉ gửi diff lên server (ChangeTracker), không gửi toàn bộ.
4. **Lazy load LiveKit**: `import('livekit-client')` chỉ khi user vào phòng học — không load khi không cần.
5. **Token storage**: Cookie + localStorage, dùng shared cookie domain cho multi-subdomain.
