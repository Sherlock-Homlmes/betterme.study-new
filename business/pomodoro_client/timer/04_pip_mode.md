# PIP Mode (Picture-in-Picture)

## Tổng quan

App hỗ trợ **hai loại PIP** khác nhau:

| Loại | Platform | File |
|------|----------|------|
| Desktop PIP | Tauri (desktop app) | `composables/usePIPWindow.ts` |
| Web PIP | Browser Document PIP API | `components/timer/WebPIPMode.vue` |

---

## 1. Desktop PIP (`usePIPWindow.ts`)

Sử dụng Tauri's native window management để mở cửa sổ con always-on-top.

### API

```typescript
openPIP()   → invoke('toggle_pip_window', { show: true })
closePIP()  → invoke('toggle_pip_window', { show: false })
togglePIP() → openPIP() hoặc closePIP() tùy isPIPOpen
checkPIPStatus() → invoke<boolean>('is_pip_window_open')
```

Tất cả gọi qua Tauri IPC (`@tauri-apps/api/core`). Command `toggle_pip_window` và `is_pip_window_open` được implement ở phía Rust (`src-tauri`).

### `isPIPOpen` state

`ref<boolean>` track trạng thái cửa sổ PIP.

---

## 2. Timer Sync với PIP (`composables/useTimerSync.ts`)

Khi platform là `desktop`, tự động emit sự kiện Tauri mỗi khi timer thay đổi:

```typescript
watch([timerString, currentScheduleColour], ([newTimer, newColour]) => {
  emit('timer-update', {
    timerString: newTimer,
    colour: newColour,
  })
})
```

Cửa sổ PIP lắng nghe event `timer-update` để cập nhật display realtime mà không cần share store (khác process/window).

---

## 3. PIP View Page (`pages/DesktopPIPView.vue`)

Route riêng cho cửa sổ PIP desktop. Hiển thị timer đơn giản không có UI phức tạp, optimized cho kích thước nhỏ.

---

## 4. Web PIP (`components/timer/WebPIPMode.vue`)

Dùng [Document Picture-in-Picture API](https://developer.chrome.com/docs/web-platform/document-picture-in-picture/) của browser (Chrome 116+):

```javascript
window.documentPictureInPicture.requestWindow()
```

Render timer vào floating window nhỏ của browser. Không cần Tauri, chạy trên web browser thông thường.

---

## Settings

```typescript
// userSettings
visuals: {
  show_pip_mode: false  // default tắt
}
```

- Default là `false` — user phải tự bật trong Settings.
- Setting bị ẩn hoàn toàn trên mobile (`isMobile`), không thể bật được.
- `WebPIPMode` cũng có guard `!isMobile` ở `pages/index.vue` để đảm bảo không render dù setting bị set `true` từ nguồn khác.
