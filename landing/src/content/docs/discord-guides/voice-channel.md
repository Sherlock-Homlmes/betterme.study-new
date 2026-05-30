---
title: Phòng học Voice Channel
description: Hướng dẫn sử dụng hệ thống phòng học voice channel tự động
---

## Phòng học Voice Channel

BetterMe cung cấp hệ thống phòng học voice channel tự động. Bạn chỉ cần join vào kênh tạo phòng, bot sẽ tự động tạo một phòng riêng cho bạn.

### Tạo phòng

1. Vào kênh tạo phòng (thường có tên "Tạo phòng học" hoặc tương tự)
2. Bot tự động tạo phòng riêng với số thứ tự
3. Khi category đầy, bot sẽ tự tạo category mới

Phòng sẽ bị xóa tự động khi trống (trừ phòng VIP/upgrade).

### Bảng điều khiển phòng (`/room_board`)

Dùng lệnh `/room_board` để hiển thị bảng điều khiển với các nút:

| Nút | Chức năng |
|-----|-----------|
| 🔓 Mở phòng | Cho phép mọi người tham gia |
| 🔒 Khóa phòng | Chỉ người được mời mới vào được |
| 👁 Hiện phòng | Hiển thị phòng cho mọi người thấy |
| 🙈 Ẩn phòng | Ẩn phòng khỏi danh sách |
| ✉️ Mời | Mời người vào phòng |
| 🚫 Kick | Đuổi người khỏi phòng |
| ✅ Cho phép | Cho phép người cụ thể tham gia |
| ✏️ Đổi tên | Đổi tên phòng |
| 👥 Giới hạn | Đặt giới hạn số người trong phòng |
| 🎤 Tắt/Bật mic | Mute/unmute tất cả |
| 📷 Full cam | Bật/tắt yêu cầu camera |
| 🍅 Pomodoro | Bật/tắt Pomodoro Timer |
| 📊 Trạng thái | Xem trạng thái phòng |
| 🔄 Reset | Reset quyền phòng về mặc định |

### Lệnh nhanh (Prefix commands)

Gõ trực tiếp trong text channel:

| Lệnh | Chức năng |
|------|-----------|
| `.public` | Mở phòng cho mọi người |
| `.private` | Khóa phòng riêng tư |
| `.show` | Hiện phòng |
| `.hide` | Ẩn phòng |
| `.mute` | Tắt mic phòng |
| `.unmute` | Bật mic phòng |
| `.rename <tên>` | Đổi tên phòng |
| `.limit <số>` | Giới hạn số người |
| `.allow <user>` | Cho phép user tham gia |
| `.invite <user>` | Mời user vào phòng |
| `.kick <user>` | Kick user khỏi phòng |
| `.status` | Xem trạng thái phòng |
| `.reset` | Reset quyền phòng |

### Nâng cấp phòng VIP (`/room_upgrade`)

Phòng VIP (dành cho Leader/Manager):
- Không bị xóa tự động khi trống
- Có role riêng cho phòng
- Quản lý thành viên riêng

Dùng `/room_downgrade` để hạ cấp phòng VIP về mặc định.
