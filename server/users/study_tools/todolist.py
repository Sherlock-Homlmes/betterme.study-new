# fastapi
from fastapi import HTTPException, Depends

# default
from bson.objectid import ObjectId

# local
from . import router
from authentication import auth_handler

from .schemas import Task
from models import Users, TodoList, TaskCategories

from other_modules.time_modules import vn_now


@router.get(
    "/todolist",
    description="get list of task",
    dependencies=[Depends(auth_handler.auth_wrapper)],
)
async def get_list_of_task(user: Users = Depends(auth_handler.auth_wrapper)):
    todolist = await TodoList.find(TodoList.user.id == ObjectId(user["id"])).to_list()
    for task in todolist:
        del task.user
    return todolist


@router.get(
    "/todolist/{task_id}",
    description="get a task",
    dependencies=[Depends(auth_handler.auth_wrapper)],
)
async def get_a_task(task_id: str, user: Users = Depends(auth_handler.auth_wrapper)):
    task = await TodoList.find_one(
        TodoList.id == ObjectId(task_id),
        TodoList.user.id == ObjectId(user["id"]),
    )
    if task:
        del task.user
        return task
    raise HTTPException(status_code=404, detail="Task not exist")


@router.post(
    "/todolist",
    description="create a task",
    dependencies=[Depends(auth_handler.auth_wrapper)],
    status_code=201,
)
async def create_a_task(task: Task, user: Users = Depends(auth_handler.auth_wrapper)):
    task = TodoList(user=user["id"], **task.__dict__)
    await task.insert()
    del task.user
    return task


@router.patch(
    "/todolist/{task_id}",
    description="update a todo",
    dependencies=[Depends(auth_handler.auth_wrapper)],
    status_code=204,
)
async def update_a_task(
    task_id: str, task: Task, user: Users = Depends(auth_handler.auth_wrapper)
):
    old_task = await TodoList.find_one(
        TodoList.id == ObjectId(task_id),
        TodoList.user.id == ObjectId(user["id"]),
    )
    if old_task:
        old_task.updated_at = vn_now()
        old_task.update_value(task)
        old_task.task_categories = [
            await TaskCategories.find_one(
                TaskCategories.id == ObjectId(task_category),
                TaskCategories.user.id == ObjectId(user["id"]),
            )
            for task_category in task.task_categories
        ]
        await old_task.save()

        return
    raise HTTPException(status_code=404, detail="Task not exist")


@router.delete(
    "/todolist/{task_id}",
    description="delete a task",
    dependencies=[Depends(auth_handler.auth_wrapper)],
    status_code=204,
)
async def delete_a_task(task_id: str, user: Users = Depends(auth_handler.auth_wrapper)):
    old_task = await TodoList.find_one(
        TodoList.id == ObjectId(task_id),
        TodoList.user.id == ObjectId(user["id"]),
    )
    if old_task:
        await old_task.delete()
        return
    raise HTTPException(status_code=404, detail="Task not exist")
