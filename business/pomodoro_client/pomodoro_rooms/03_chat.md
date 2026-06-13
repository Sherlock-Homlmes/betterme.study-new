# Chat trong Pomodoro Rooms

## Cơ chế truyền tin

Chat **không dùng server riêng**. Tất cả đi qua **LiveKit Data Channel** (WebRTC reliable data channel):

```
Gửi: publishData(payload) → room.localParticipant.publishData(Uint8Array, { reliable: true })
Nhận: RoomEvent.DataReceived → handleDataReceived(payload, participant)
```

---

## Gửi tin nhắn văn bản

```typescript
sendTextMessage():
  if !newMessage.trim() → return
  publishData({ type: 'chat', messageType: 'text', content: newMessage })
  addChatMessage({ sender: localParticipant.identity, senderName: 'You', ... })
  newMessage = ''
```

Tin nhắn của mình được thêm local ngay lập tức, không chờ round-trip.

---

## Gửi file

```typescript
sendFile(file):
  FileReader.readAsDataURL(file)  // encode base64
  publishData({
    type: 'chat', messageType: 'file',
    content: 'Shared a file: {name}',
    fileUrl: base64, fileName: name, fileSize: bytes
  })
```

File được encode base64 và gửi qua data channel. Không upload lên server riêng. Giới hạn bởi LiveKit data channel size.

---

## Gửi GIF

```typescript
sendGif(gifUrl):
  publishData({ type: 'chat', messageType: 'gif', content: 'Shared a GIF', gifUrl })
  showGifPicker = false
```

Preset GIFs từ Giphy. Chỉ gửi URL, không embed dữ liệu.

---

## Unread Count

```typescript
addChatMessage(message):
  chatMessages.push(message)
  if !showChat && message.sender !== localParticipant.identity:
    unreadMessageCount++

watch(showChat, (newValue) => {
  if newValue: unreadMessageCount = 0  // reset khi mở chat
})
```

---

## Scroll tự động

```typescript
scrollToBottom():
  messagesContainer.scrollTop = messagesContainer.scrollHeight
```

Được gọi mỗi khi thêm message mới (`nextTick(scrollToBottom)`).

---

## Format file size

```typescript
formatFileSize(bytes):
  < 1KB  → "{n} B"
  < 1MB  → "{n} KB"
  else   → "{n} MB"
```

---

## Chat UI (`roomView/Chat.vue`)

- Danh sách messages với scroll
- Input box + Enter để gửi
- Nút file upload (trigger `fileInputRef.click()`)
- Emoji picker (`showEmojiPicker`)
- GIF picker với preset GIFs (`showGifPicker`)
- Reaction picker (`showReactionPicker`)
- Badge unread count trên icon chat
