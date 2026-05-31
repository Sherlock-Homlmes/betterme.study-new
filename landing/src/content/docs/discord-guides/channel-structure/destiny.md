---
title: Guild Events
description: Các sự kiện tự động khi member join/leave/update
---

## Guild Events

BetterMe tự động xử lý nhiều sự kiện trong server.

### Thành viên mới tham gia

- Tự động lưu thông tin user vào database
- Gửi tin nhắn chào mừng (tự xóa sau 10 phút)

### Thành viên rời server

- Cập nhật trạng thái rời server trong database

### Cập nhật thành viên

- Tự động cập nhật tên, avatar, nickname
- Khi user **boost server**, bot sẽ gửi lời cảm ơn cá nhân hóa (sử dụng AI viết dựa trên thông tin đã lưu về user)

### Cập nhật Voice Channel

#### Voice Tracking
- Log user vào/ra/chuyển kênh voice vào kênh tracking riêng

#### Hữu duyên Room
- Random ghép user vào phòng đang có người học
- Cooldown **5 phút/phòng**
- User có thể block tính năng hữu duyên cho phòng riêng của mình
