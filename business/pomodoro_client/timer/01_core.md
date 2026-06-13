# Timer Core (Bộ đếm giờ chính)

## Tổng quan

Logic bộ đếm giờ được chia thành hai lớp:
- **`usePomodoroStore`** (`stores/pomodoros.ts`): Quản lý trạng thái schedule và giao tiếp API.
- **`useTicker`** (`components/ticker.ts`): Engine đếm giờ thực sự, xử lý tick từng giây.

---

## Trạng thái Timer (`TimerState`)

```
STOPPED   → Timer đang dừng, không chạy
RUNNING   → Timer đang đếm
PAUSED    → Timer tạm dừng (giữ nguyên thời gian đã trôi qua)
COMPLETED → Timer vừa hoàn thành 1 section
```

---

## Schedule (Lịch Pomodoro)

### Cấu trúc `ScheduleEntry`

```typescript
{
  id: number;          // ID tuần tự
  timeElapsed: number; // Số giây đã trôi qua (tính bằng giây thực)
  length?: number;     // Độ dài section (ms), undefined = lấy từ settings
  type?: Section;      // "work" | "shortpause" | "longpause", undefined = tự tính
}
```

### Cách sinh schedule

`scheduleTypes` (computed) sinh ra mảng loại section theo chu kỳ:

```
Chu kỳ = 2 × long_rest_time_interval (mặc định: 3 → chu kỳ = 6 entries)
Pattern: [work, shortpause, work, shortpause, work, longpause]
```

- Vị trí chẵn (0, 2, 4...) → `work`
- Vị trí lẻ → `shortpause`
- Vị trí cuối mỗi chu kỳ → `longpause`

### `getSchedule` (computed)

Luôn trả về đúng `numScheduleEntries` (mặc định 3) entries hiển thị tới người dùng. Với mỗi entry:
1. Gán `type` nếu chưa có (dựa trên `scheduleTypes[id % cycle_length]`)
2. Gán `length` nếu chưa có (lấy từ `userSettings.pomodoro_settings`)
3. Tính thêm `timeRemaining = length - timeElapsed`

### `advance()`

Xóa entry đầu (đã hoàn thành) và thêm entry mới vào cuối. Timer tự reset khi `scheduleId` thay đổi.

### `lockInfo()`

Khóa `length` và `type` cho entry hiện tại để getter không ghi đè trong khi timer đang chạy.

---

## Tick Engine (`useTicker`)

### Chu kỳ tick

```
scheduleNextTick() → timerTick() → setTimeout(scheduleNextTick, nextTickMs)
```

- `nextTickMs` = `settingsStore.getAdaptiveTickRate` (xem tính năng Adaptive Ticking)
- Nếu `timeRemaining < nextTickMs` → dùng `timeRemaining` để tránh overshoot

### `timerTick()`

Mỗi lần tick:
1. Tính `elapsedDelta = (now - lastUpdate) / 1000` (giây thực, không cứng 1s)
2. Cộng `elapsedDelta` vào `timeElapsed`
3. Nếu `timeElapsed >= timeOriginal` (timer vừa hoàn thành):
   - Record event `TIMER_FINISH`
   - Xử lý theo `sectionEndAction`:
     - `Stop` → `timerState = COMPLETED`
     - `Skip` → gọi `advance()` (tự động sang section tiếp theo)
     - `KeepTicking` → tiếp tục đếm quá thời gian

### Watchers trong ticker

| Watcher | Hành động |
|---------|-----------|
| `timerState → RUNNING` | Gọi `startTimer()` |
| `timerState → STOPPED` | Gọi `pauseOrStopTimer(true)` → reset timer |
| `timerState → PAUSED` | Gọi `pauseOrStopTimer(false)` → giữ nguyên |
| `scheduleId thay đổi` | Reset timer về 0 |
| `adaptiveTickRate thay đổi` | Reschedule tick mới |

---

## Hành động kết thúc section (`SectionEndAction`)

| Giá trị | Hành vi |
|---------|---------|
| `stop` | Dừng lại, hiển thị dấu tích hoàn thành, chờ user nhấn tiếp |
| `skip` | Tự động advance sang section tiếp theo |
| `continue` | Tiếp tục đếm ngược qua 0 (overtime) |

---

## Luồng khởi tạo từ API

Khi user đã đăng nhập, `startPomodoro()` được gọi:
```
POST /pomodoros/  →  tạo pomodoro section mới trên server
PATCH /pomodoros/{id}  →  gửi action (start/pause/stop/complete)
DELETE /pomodoros/_last  →  xoá pomodoro section cuối
```

Nếu chưa đăng nhập → timer vẫn hoạt động hoàn toàn offline (local state).

---

## Màu sắc theo section

`currentScheduleColour` và `currentScheduleColourModern` trả về màu CSS dựa trên `type` của section hiện tại, lấy từ `settings.visuals.theme`.

```
work       → rgb(255, 107, 107)  [đỏ cam]
shortpause → rgb(244, 162, 97)   [cam]
longpause  → rgb(46, 196, 182)   [xanh lá]
```
