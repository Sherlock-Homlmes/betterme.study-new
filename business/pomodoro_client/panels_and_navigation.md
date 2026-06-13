# Panels & Navigation (Điều hướng và Panel)

---

## Open Panels State (`stores/openpanels.ts`)

Global state quản lý panel nào đang mở:

```typescript
useOpenPanels() → ref({
  music:        false,  // Panel âm thanh/nhạc
  ai:           false,  // Panel AI Chat
  settings:     false,  // Panel cài đặt
  todo:         false,  // Panel danh sách task
  statistic:    false,  // Panel thống kê
  pomodoroRoom: false,  // Panel phòng học nhóm
})
```

Chỉ một panel được mở tại một thời điểm (component `panel.vue` handle logic này).

---

## App Bar (`components/appBar.vue`)

Thanh điều hướng chính. Chứa các icon buttons để toggle panel tương ứng trong `openPanels`.

---

## `panel.vue`

Container cho tất cả panels. Render panel tương ứng với `openPanels` value đang true. Có animation slide-in khi mở/đóng.

---

## Cấu trúc Panels

| Panel | Component | Store |
|-------|-----------|-------|
| Settings | `panelSettings/index.vue` | `useSettings`, `useAuthStore` |
| AI Chat | `panelAIChat/index.vue` | `useAIChatStore` |
| Task | `panelTask/index.vue` | `useTaskStore` |
| Statistics | `panelSettings/statisticTab.vue` | `useStatistics` |
| Audio | `panelSettings/audioTab/index.vue` | `useAudioStore` |
| Pomodoro Rooms | `panelPomodoroRooms/index.vue` | `usePomodoroRoomsStore` |

---

## Settings Panel Tabs (`panelSettings/index.vue`)

Settings panel chia thành nhiều tab:

| Tab | Component | Nội dung |
|-----|-----------|---------|
| Core | `coreSettingTab/index.vue` | Theme, timer type, presets, export/import/reset |
| Clock | `clockTab.vue` | Thời gian work/break/longbreak, interval |
| Audio | `audioTab/index.vue` | Ambient, YouTube, notification sound |
| Statistics | `statisticTab.vue` | Chart thống kê |
| Login | `loginTab.vue` | Đăng nhập/đăng xuất |
| User | `userSettingTab.vue` | Thông tin tài khoản |
| About | `aboutTab.vue` | Phiên bản, credits |

---

## Keyboard Shortcuts

`assets/mixins/keyboardListener.js`: Mixin lắng nghe `keydown` event để trigger timer controls khi `settings.timerControls.enableKeyboardShortcuts = true`.

Phím tắt thường: Space (start/pause), R (reset), S (skip).

---

## Mobile Padding (`stores/platforms/mobileSettings.ts`)

Trên mobile (iOS/Android qua Tauri):

```typescript
useMobileSettings → state: { padding: { top: 0, bottom: 0 } }
```

Safe area insets được inject vào đây để tránh notch/home indicator. CSS dùng `var(--safe-area-top)` binding với padding store.

---

## Platform Detection (`platforms/`)

```typescript
// platforms.ts: interface Platform với các method
// web.ts: implementation cho browser
// mobile.ts: implementation cho Tauri mobile app (iOS/Android)
```

`runtimeConfig.public.PLATFORM` = `"web"` | `"desktop"` | `"mobile"`.

---

## Router (`router/index.ts`)

| Route | Component | Mô tả |
|-------|-----------|-------|
| `/` | `pages/index.vue` | Main app |
| `/pip` | `pages/DesktopPIPView.vue` | Desktop PIP window |

Dùng Vue Router. Layout `layouts/timer.vue` wrap timer display.

---

## Onboarding Tutorial (`stores/tutorials.ts`)

`isOnboarded` (persist localStorage) track user đã qua tutorial chưa.

Components:
- `tutorialOnboarding.vue`: Container
- `onboarding/page0_welcome.vue` → `page1_timer.vue` → `page2_theme.vue` → `page3_extras.vue`

Nếu `isOnboarded = false` khi app load → hiển thị onboarding overlay.
