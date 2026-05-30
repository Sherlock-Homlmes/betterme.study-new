---
title: Theo dõi thời gian học
description: Hệ thống theo dõi thời gian học, bảng xếp hạng và achievement role
---

BetterMe tự động ghi nhận thời gian học của bạn khi tham gia voice channel. Không cần thao tác gì thêm, chỉ việc vào phòng và học!

## Xem thống kê cá nhân (`/study_time`)

Dùng lệnh `/study_time` để xem biểu đồ thời gian học của bạn. Biểu đồ hỗ trợ xem theo:

- **Ngày**
- **Tuần**
- **Tháng**

Biểu đồ được tạo, hiển thị trực quan thời gian học của bạn.

## Bảng xếp hạng (`/leaderboard`)

Xem bảng xếp hạng thời gian học của toàn server:

- **Bộ lọc**: Tất cả, Tháng này, Tuần này, Hôm nay
- **Phân trang**: Nút First/Prev/Next/Last và nhập số trang trực tiếp
- Hiển thị avatar và highlight rank của bạn

## Achievement Role

Bot tự động cấp role dựa trên thời gian học của bạn
| Role | Yêu cầu |
|------|---------|
| 🥉 Iron | 1 giờ/tháng |
| 🥉 Bronze | 3 giờ/tháng |
| 🥈 Silver | 10 giờ/tháng |
| 🥇 Gold | 30 giờ/tháng |
| 💎 Diamond | 60 giờ/tháng |
| 🏆 Master | 90 giờ/tháng |
| 👑 Challenger | 120 giờ/tháng |
| Học sinh tích cực | 200 giờ học tổng |

## Quản lý Achievement Role

- `/enable_achievement_role`: Bật nhận achievement role
- `/disable_achievement_role`: Tắt nhận achievement role

## Trao thưởng hàng tháng (Monthly Leaderboard)

Tự động trao thưởng cho top thời gian học hàng tháng:

| Hạng | Phần thưởng |
|------|-------------|
| 🥇 Top 1 | 55,555 VNĐ |
| 🥈 Top 2 | 33,333 VNĐ |
| 🥉 Top 3 | 11,111 VNĐ |
| 4 - 10 | 5,555 VNĐ |

- Achievement role được tự động reset mỗi tháng
- Hệ thống leaderboard để trao giải áp dụng hệ thống *anti-cheat* riêng để chống gian lận (treo phòng không học).
