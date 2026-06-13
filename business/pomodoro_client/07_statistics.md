# Statistics (Thống kê)

## Store: `useStatistics` (`stores/statistic.ts`)

---

## Data Models

```typescript
interface StudyTime {
  total_study_time: number  // phút học
  date_range: string        // nhãn ngày (DD/MM hoặc DD/MM/YYYY)
}

interface StatisticsResponse {
  total_study_time: number   // tổng thời gian (phút)
  study_day_count: number    // số ngày có học
  study_time_per_day: number // trung bình phút/ngày
  longest_streak: number     // streak dài nhất (ngày)
  pomodoro_count: number     // số pomodoro đã hoàn thành
  data: StudyTime[]
}

interface StatisticData {
  name: string   // nhãn hiển thị trên chart
  total: number  // tổng thời gian (phút)
  date: string   // ISO date string để tính toán
}
```

---

## State

| Field | Mô tả |
|-------|-------|
| `loading` | Đang fetch |
| `error` | Thông báo lỗi |
| `statisticsData` | Mảng data cho chart |
| `summary` | Tóm tắt các chỉ số |

### `summary` object

```typescript
{
  totalTime: number          // tổng phút học
  averageSessionTime: number // phút trung bình/ngày học
  studyDays: number          // số ngày có học
  averageDailyTime: number   // phút trung bình/ngày (kể cả ngày không học)
  currentStreak: number      // streak dài nhất (ngày)
  streakRange: string        // "DD/MM/YYYY - DD/MM/YYYY"
  pomodoroCount: number      // số pomodoro
}
```

---

## `fetchStatistics(dateRange?)`

```
GET /v2/statistics[?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD]
→ ok: parse response → cập nhật statisticsData + summary
→ fail (404/500/network): generateMockData(dateRange) — fallback mock
```

Nếu chưa đăng nhập → set `error = "User not authenticated"`, return.

---

## Xử lý dữ liệu

### `fillMissingDates(data, dateRange)`

Điền các ngày không có dữ liệu (total = 0) vào mảng, đảm bảo chart liên tục không bỏ ngày:

```
Tạo map từ date → StatisticData
Iterate từ startDate đến endDate:
  - Nếu có data → dùng data thực
  - Nếu không → thêm entry với total = 0
```

### `groupDataByPeriod(data, maxItems = 10)`

Gom nhóm nếu dữ liệu quá nhiều điểm (> 10):

```
daysPerGroup = ceil(totalDays / maxItems)
Mỗi nhóm: cộng dồn total, lấy nhãn từ ngày đầu → ngày cuối
```

Nếu span nhiều năm → hiển thị full date `DD/MM/YYYY`. Nếu cùng năm → `DD/MM`.

### `calculateStreak(data)`

Duyệt data theo thứ tự thời gian, tìm chuỗi liên tiếp các ngày có `total > 0`:
```
currentStreak++  khi total > 0
currentStreak = 0 khi total = 0
Lưu maxStreak + startDate + endDate
```

Trả về `{ streak: maxStreak, streakRange: "DD/MM - DD/MM" }`.

### `generateMockData(dateRange?)`

Fallback khi API không có. Sinh random data:
- 70% ngày có data, 30% ngày bỏ trống
- Thời gian học: random 50-350 phút/ngày
- Không có dateRange → sinh 7 ngày gần nhất

---

## `formattedData` (computed)

Tạo format đặc biệt cho chart component:
```typescript
statisticsData.value.map(item => ({
  name: item.name,
  'Thời gian': item.total,   // key tiếng Việt cho legend
}))
```

---

## UI: `panelSettings/statisticTab.vue`

- **DateRangePicker**: Chọn khoảng thời gian
- **BarChart**: Hiển thị `formattedData`
- **Summary cards**: Hiển thị 5 chỉ số từ `summary`
- Mỗi khi dateRange thay đổi → `fetchStatistics(dateRange)` → `fillMissingDates()` → `groupDataByPeriod()` → render chart
