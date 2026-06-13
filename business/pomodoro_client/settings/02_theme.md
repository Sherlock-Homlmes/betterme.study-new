# Theme & Giao diện

## Theme Color System

Mỗi section có 1 màu RGB riêng, lưu dạng `[R, G, B]`:

```typescript
theme: {
  work:       [255, 107, 107],  // đỏ cam
  shortpause: [244, 162, 97],   // cam vàng
  longpause:  [46, 196, 182],   // xanh ngọc
}
```

### Getter `getColor(section, method?)`

```typescript
// method = ColorMethod.classic (default)
→ "rgb(255, 107, 107)"

// method = ColorMethod.modern
→ "255 107 107"   (dùng cho CSS custom properties: color: rgb(var(--color)))
```

---

## `colorChanger.vue`

Component color picker để chỉnh màu từng section. Cập nhật trực tiếp vào `settings.visuals.theme[section]`.

---

## `themeSettings.vue` & `themePreview.vue`

- `themeSettings.vue`: Panel chỉnh toàn bộ theme (3 màu + dark mode)
- `themePreview.vue`: Preview nhỏ xem trước màu

---

## Prebuilt Themes (`prebuiltThemes.ts`)

Danh sách màu theme có sẵn để chọn nhanh. Apply 3 màu cùng lúc cho work/shortpause/longpause.

---

## Dark Mode

Toggle bởi `isDarkMode` (VueUse `useDark`):
- Class `dark` được thêm vào `<body>`
- Tailwind dark mode variant (`dark:`) xử lý phần còn lại
- Sync với `userSettings.visuals.dark_mode` qua watcher trong `auth.ts`

---

## CSS Transitions

- `src/assets/transitions/fade.css`: Fade in/out cho panels
- `src/assets/transitions/slidein.css`: Slide animation cho dialogs
- `src/assets/css/transitions.css`: Shared transition utilities
