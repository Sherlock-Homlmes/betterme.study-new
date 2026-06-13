# Authentication & User (Xác thực người dùng)

## Store: `useAuthStore` (`stores/auth.ts`)

---

## State

| Field | Type | Mô tả |
|-------|------|-------|
| `userInfo` | `ref<any>` | Thông tin user từ API (`null` = chưa đăng nhập) |
| `userSettings` | `useStorage(...)` | Settings của user, persist localStorage key `"userSettings"` |
| `loading` | `ref<boolean>` | Đang fetch user info |
| `isOnboarded` | `useStorage<boolean>` | User đã qua onboarding chưa, persist localStorage |
| `isDarkMode` | `useDark()` | Dark mode state, toggle class `dark` trên `<body>` |

---

## Computed

| Getter | Giá trị |
|--------|---------|
| `isAuth` | `!!userInfo.value` — true nếu đã đăng nhập |
| `getActiveSchedulePreset` | Tên preset đang active hoặc `null` |

---

## Actions

### `getCurrentUser()`

```
GET /auth/self
→ ok: userInfo = response
→ fail: userInfo = null (không throw, không hiện lỗi — silent)
```

Được gọi khi app khởi động để kiểm tra session.

### `getCurrentUserSetting()`

```
GET /users/self/settings
→ ok: userSettings = response
→ fail: showError()
```

Chỉ gọi khi `isAuth = true`.

### `updateCurrentUserSetting(data)`

```
PATCH /users/self/settings  body: { chỉ các field thay đổi }
```

Được gọi tự động bởi watcher, không gọi thủ công.

---

## Auto-sync Settings

```typescript
watch(userSettings, (newValue) => {
  const change = changeTracker.getChange(newValue)  // diff
  if (isEmpty(change)) return
  updateCurrentUserSetting(change)
  changeTracker.track(newValue)
}, { deep: true })
```

`ChangeTracker` (`utils/changeTracker.js`) lưu snapshot cũ và tính diff để chỉ gửi phần thay đổi.

---

## Token Management (`utils/betterFetch.ts`)

### `TokenManager`

```
getToken():    đọc cookie "Authorization" trước, fallback localStorage
setToken():    lưu vào localStorage + cookie (30 ngày, SameSite=Lax)
removeToken(): xóa khỏi cả hai nơi
```

Cookie dùng `COOKIE_DOMAIN` từ `runtimeConfig` để chia sẻ token giữa subdomain (ví dụ: `betterme.study` và `app.betterme.study`).

### `Api` class

Wrapper quanh `fetch`, tự động đính kèm `Authorization: Bearer <token>` vào mọi request.

```typescript
api.get(url)
api.post(url, data)
api.patch(url, data)
api.delete(url)
api.multipart(url, options)  // cho file upload
```

Khi network error → `showError("Network error: Check your internet connection.")`.

---

## Guest Mode (chưa đăng nhập)

Hầu hết các store kiểm tra `isAuth.value` trước khi gọi API. Nếu chưa đăng nhập:
- Timer hoạt động bình thường (local)
- Tasks lưu vào localStorage (`useLocalStorage`)
- Settings lưu vào localStorage
- Thống kê, AI chat, Rooms không hoạt động
