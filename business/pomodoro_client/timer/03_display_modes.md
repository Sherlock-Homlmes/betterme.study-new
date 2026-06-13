# Timer Display Modes (Kiểu hiển thị đồng hồ)

## Tổng quan

3 kiểu hiển thị, chọn qua `settings.currentTimer` (`TimerType`):

| Enum | Value | Hiển thị |
|------|-------|---------|
| `Traditional` | `"traditional"` | `MM:SS` đếm ngược chuẩn |
| `Approximate` | `"approximate"` | "khoảng X phút" |
| `Percentage` | `"percentage"` | `X%` tiến độ |

---

## Components (`components/timer/display/`)

### `_timerSwitch.vue`

Router component, chọn sub-component dựa trên `settings.currentTimer`.

### `timerTraditional.vue`

Hiển thị `timerString` dạng `MM:SS`. `timerString` được tính bởi `usePomodoroStore` từ `timeRemaining`.

### `timerApproximate.vue`

Làm tròn `timeRemaining` lên đơn vị phút gần nhất, hiển thị dạng "about X minutes".

### `timerPercentage.vue`

```typescript
percentage = (timeElapsed / timeOriginal) * 100
```

Hiển thị dạng số phần trăm hoặc progress ring.

---

## `timerProgress.vue`

Progress bar dọc theo top của màn hình. Controlled bởi `settings.performance.showProgressBar`. Màu thay đổi theo `currentScheduleColour`.

---

## `timerComplete.vue`

Hiển thị khi `timerState === COMPLETED` (dấu tích ✓ hoặc animation complete). Ẩn đi khi user nhấn start section tiếp theo.

---

## Adaptive Ticking theo Display Mode

Mỗi display mode có tick rate khác nhau khi tab ẩn/hiện (xem `02_adaptive_ticking.md`):

- **Traditional**: tick mỗi 1s (visible) / 60s (hidden) — cần chính xác từng giây
- **Approximate**: tick mỗi 30s (visible) / 5 phút (hidden) — chỉ cần đến phút
- **Percentage**: tick mỗi 2s (visible) / 20s (hidden) — middle ground
