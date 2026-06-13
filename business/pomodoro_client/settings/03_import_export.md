# Import / Export / Reset Settings

## Export (`buttons/export.vue`)

Serialize toàn bộ settings store thành JSON và trigger download:

```
settings → JSON.stringify → Blob → URL.createObjectURL
→ <a download="settings.json"> → click() → revokeObjectURL
```

---

## Import (`buttons/import.vue`)

Upload file JSON và merge vào store:

```
<input type="file"> → FileReader.readAsText()
→ JSON.parse → validate
→ Object.assign(settings, parsed)
→ Pinia state updates → auto-sync server (nếu đăng nhập)
```

---

## Reset (`buttons/reset.vue`)

```typescript
settings.setReset(true)
// → settings.reset = true
// → watcher trong component detect → $reset() Pinia store
// → về default values
```

`setReset(false)` được gọi sau khi reset xong để không trigger lại.
