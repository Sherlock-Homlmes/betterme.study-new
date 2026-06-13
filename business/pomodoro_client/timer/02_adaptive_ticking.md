# Adaptive Ticking (Đếm giờ thích nghi)

## Mục đích

Tiết kiệm CPU/battery khi tab bị ẩn hoặc người dùng không nhìn vào màn hình, bằng cách giảm tần suất tick (cập nhật timer).

---

## Cách hoạt động

### Phát hiện tab ẩn

`registerNewHidden()` trong `useSettings` được gọi khi `document.hidden` thay đổi:

```typescript
settings.registerNewHidden(document.hidden)
// → cập nhật adaptiveTicking.registeredHidden
// → record event FOCUS_LOST hoặc FOCUS_GAIN
```

### Tính tick rate (`getAdaptiveTickRate` getter)

```typescript
// Nếu adaptive ticking disabled hoặc chưa biết trạng thái:
return baseTickRate  // mặc định: 1000ms

// Nếu enabled:
tickRate = baseTickRate × multiplier[currentTimer][visible/hidden]
```

---

## Bảng hệ số nhân (`adaptiveTickingMultipliers.ts`)

| Timer Type | Visible | Hidden |
|------------|---------|--------|
| `traditional` | 1× (1s) | 60× (60s) |
| `approximate` | 30× (30s) | 300× (5 phút) |
| `percentage` | 2× (2s) | 20× (20s) |

**Giải thích:**
- **Traditional** (hiển thị `MM:SS`): Khi visible cần tick mỗi giây để clock đúng. Khi hidden có thể tick mỗi 60 giây vì user không nhìn.
- **Approximate** ("khoảng X phút"): Không cần chính xác từng giây, tick thưa hơn nhiều.
- **Percentage** ("%"): Cần cập nhật thường hơn approximate nhưng ít hơn traditional.

---

## Tích hợp trong Ticker

```typescript
watch(() => settingsStore.getAdaptiveTickRate, (newValue, oldValue) => {
  if (timerState.value === TimerState.RUNNING && newValue !== oldValue) {
    scheduleNextTick({});  // reschedule ngay với tick rate mới
  }
});
```

Khi user chuyển tab → tick rate tăng lên → setTimeout dài hơn → ít wake-up hơn.

---

## Cơ chế thời gian chính xác

Timer **không** dựa vào số lần tick để tính thời gian. Thay vào đó:

```typescript
elapsedDelta = (Date.now() - lastUpdate) / 1000
timeElapsed += elapsedDelta
lastUpdate = Date.now()
```

Dù tick thưa đến đâu, thời gian vẫn chính xác vì đo wall-clock thực tế giữa hai lần tick.
