# Task Management (Quản lý công việc)

## Store: `useTaskStore` (`stores/tasks.ts`)

---

## Data Model

```typescript
interface Task {
  id: number
  title: string
  description: string | null
  priority: number
  status: TaskStatus      // "TO-DO" | "DOING" | "DONE" | "EXPIRED"
  index: number           // thứ tự hiển thị
  section?: string        // luôn = "work" (reserved cho tương lai)
}
```

---

## State

| Field | Persist | Mô tả |
|-------|---------|-------|
| `tasks` | localStorage `"tasks"` | Danh sách task |
| `enableTodoListTask` | localStorage `"enableTodoListTask"` | Bật/tắt panel todo |

---

## Actions

### `getTaskList()`
```
GET /v2/tasks
→ ok: tasks = response (map thêm section = "work")
→ fail: showError + throw
```

### `postTask(title)`

**Nếu chưa đăng nhập:**
```typescript
tasks.push({
  id: Date.now(),   // fake ID
  title,
  status: "DOING",
  index: tasks.length + 1,
  section: "work",
})
```

**Nếu đã đăng nhập:**
```
POST /v2/tasks  body: { title, index: max(existing indexes) + 1 }
→ ok: getTaskList() để refresh
→ fail: showError + throw
```

### `patchTask(taskId, change)`
```
PATCH /v2/tasks/{id}  body: change
→ fail: showError + throw
```
Chỉ chạy khi `isAuth` và `change` không rỗng.

### `deleteTask(taskId)`

**Nếu chưa đăng nhập:** Xóa trực tiếp khỏi `tasks` local.

**Nếu đã đăng nhập:**
```
DELETE /v2/tasks/{id}
→ ok: filter task ra khỏi tasks array
→ fail: showError + throw
```

### `moveTask(task, newIndex)`

Reorder local array (swap `index` field + splice):
```typescript
swapProp(tasks[oldIndex], tasks[newIndex], "index")
tasks.splice(newIndex, 0, tasks.splice(oldIndex, 1)[0])
```
Không gọi API để persist thứ tự — chỉ local ordering.

---

## UI Components

### `panelTask/index.vue`

- Hiển thị danh sách tasks
- Lọc theo `enableTodoListTask`
- Giới hạn `maxActiveTasks` (mặc định 3) task hiển thị cùng lúc

### `panelTask/addTask.vue`

- Input thêm task mới, gọi `postTask(title)`

### `panelTask/todoItem.vue`

- Hiển thị 1 task
- Checkbox để toggle status DOING ↔ DONE
- Nút xóa gọi `deleteTask(id)`
- Drag handle để `moveTask()`

---

## Task Status Flow

```
TO-DO → DOING → DONE
                 ↓ (nếu removeCompletedTasks = true)
               [xóa tự động]
EXPIRED: reserved cho task quá deadline (chưa implement UI)
```
