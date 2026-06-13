# AI Chat

## Store: `useAIChatStore` (`stores/aichat.ts`)

---

## Data Model

```typescript
// Channel: cuộc trò chuyện riêng với AI
channel: {
  id: string
  history: Message[]
}

// Message
{
  id?: string
  content: string
  sender: "bot" | "user"
}
```

---

## State

| Field | Persist | Mô tả |
|-------|---------|-------|
| `channels` | localStorage `"AIChatChannels"` | Danh sách channels, bao gồm cả history |
| `selectedChannelId` | localStorage `"selectedChannelId"` | Channel đang chọn |
| `newMessage` | `ref` | Nội dung đang soạn |
| `loadingChannel` | `ref` | Đang fetch channel list hoặc history |
| `loadingMessage` | `ref` | Đang chờ AI reply |

---

## `history` (computed)

```typescript
get: channels.find(c => c.id === selectedChannelId)?.history ?? []
set: channelInfo.history = newVal
```

Computed writable: đọc/ghi trực tiếp vào đúng channel trong mảng.

---

## Actions

### `getAllChannels()`
```
GET /channels/
→ channels = response[]
```

### `createChannel()`

Kiểm tra trước khi tạo:
1. Nếu `channels.length >= 13` → error "channel limit reached"
2. Nếu có channel rỗng (history.length <= 1) → select channel đó thay vì tạo mới
3. Nếu không:
   ```
   POST /channels/
   → channels.unshift({ ...channel, history: [] })
   → selectedChannelId = channel.id
   ```

### `getHistory()`
```
GET /channels/{selectedChannelId}
→ history = response.history
```

### `sendMessage()`

```typescript
1. history.push({ content, sender: "user" })  // optimistic update
2. newMessage = ""
3. if !selectedChannelId → createChannel()
4. scrollToBottom()
5. POST /channels/{id}/chats  body: { content, use_ai: true }
   → history.push(botReply)
6. scrollToBottom()
```

AI reply được nhận ngay sau request (không streaming). `use_ai: true` trigger server gọi AI model.

### `deleteChannel()`

```typescript
if history.length <= 1 → return  // không xóa channel rỗng
DELETE /channels/{selectedChannelId}
if channels.length <= 1 → createChannel()  // tạo channel mới nếu là cái cuối
else → selectedChannelId = channels[0].id
channels = channels.filter(id === selectedChannelId)  // chỉ giữ channel đang chọn ???
```

### `changeChannel(channelId)`

Switch sang channel khác. Guard: không switch khi đang loading.

---

## Watcher: Auto-load History

```typescript
watch(selectedChannelId, async (newId) => {
  const channelInfo = channels.find(c => c.id === newId)
  if channelInfo: history = channelInfo.history  // dùng cached
  else: await getHistory()                        // fetch từ server
  scrollToBottom()
})
```

---

## UI: `panelAIChat/`

### `index.vue`

- Tabs navigation giữa channels (hiện `channelIds`)
- Nút tạo channel mới
- Nút xóa channel hiện tại

### `chatBox.vue`

- Danh sách messages (phân biệt `sender: "user"` vs `"bot"`)
- Input + Send button
- Loading spinner khi `loadingMessage = true`
- `messagesContainer` ref để scroll

---

## Giới hạn

- Tối đa **13 channels** mỗi user
- Không tạo mới nếu còn channel rỗng (tái sử dụng)
