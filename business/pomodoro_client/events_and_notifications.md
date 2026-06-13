# Events & Notifications

---

## Event System (`stores/events.ts`)

### Mục đích

Log các sự kiện quan trọng trong app để debug, analytics, hoặc trigger phụ thuộc. **Không gửi lên server** — chỉ in-memory.

### `useEvents` store

```typescript
events: ref<Event[]>([])
maxEventsToKeep: ref<number>(200)   // tự động xóa cũ nếu vượt quá
lastEvent: computed(...)            // event gần nhất
recordEvent(eventType, data?)       // thêm event mới
```

Khi thêm event mới: `events.splice(0, events.length - maxEventsToKeep)` — giữ 200 event gần nhất.

### Event Types (`EventType` enum)

| Event | Khi nào |
|-------|---------|
| `FOCUS_GAIN` | Tab được focus lại |
| `FOCUS_LOST` | Tab bị ẩn/rời focus |
| `TIMER_START` | Timer bắt đầu chạy |
| `TIMER_PAUSE` | Timer tạm dừng |
| `TIMER_STOP` | Timer dừng hẳn |
| `TIMER_FINISH` | Section hoàn thành (hết giờ) |
| `SCHEDULE_ADVANCE_MANUAL` | User tự bấm skip section |
| `SCHEDULE_ADVANCE_AUTO` | Auto-advance sang section tiếp |
| `APP_STARTED` | App khởi động |
| `APP_ERROR` | Lỗi xảy ra |
| `NOTIFICATIONS_ENABLED` | User cấp quyền notification |
| `OTHER` | Fallback |

### Event Object

```typescript
class Event {
  _timestamp: Date
  _event: EventType
  _data?: unknown   // payload tùy chọn
}
```

### Sử dụng trong ticker

```typescript
// Khi timer bắt đầu:
recordEvent(EventType.TIMER_START)

// Khi hết giờ:
recordEvent(EventType.TIMER_FINISH)

// Khi pause/stop:
recordEvent(stop ? EventType.TIMER_STOP : EventType.TIMER_PAUSE)
```

---

## Notification System (`stores/notifications.ts`)

### `NotificationPermission` enum

```
Default      → chưa hỏi user
Granted      → user đồng ý
Denied       → user từ chối
NotSupported → browser không hỗ trợ (ví dụ: Firefox private mode)
```

### `updateEnabled(manualValue?)`

Nếu truyền `manualValue` → set trực tiếp.

Nếu không → đọc từ `window.Notification.permission`:
```
"default"  → NotificationPermission.Default
"granted"  → NotificationPermission.Granted
"denied"   → NotificationPermission.Denied
(không có Notification API) → NotSupported
```

### Khi nào gửi notification

Khi `TIMER_FINISH` event được fire + `settings.permissions.notifications = true` + permission granted → gửi browser notification `new Notification(...)`.

---

## Error Store (`stores/common.ts`)

Global error display, không liên quan đến events nhưng thường dùng song song:

```typescript
showError(message, showTime = 10000):
  content = message
  visible = true
  setTimeout(close, showTime)

close():
  visible = false
  content = ""
```

`showTime = 0` → error không tự đóng.
