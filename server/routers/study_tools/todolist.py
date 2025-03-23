# default
from typing import List
from bson.objectid import ObjectId

# libraries
from fastapi import APIRouter, HTTPException, Depends

# local
from routers.authentication import auth_handler

from .schemas import Task, PatchTaskPayload, GetTaskResponse
from models import Users, TodoList

from other_modules.time_modules import vn_now

router = APIRouter(
    tags=["Study tools-Todolist"],
    responses={404: {"description": "Not found"}},
)


@router.get(
    "/todolist",
    description="get list of task",
)
async def get_list_of_task(
    user: Users = Depends(auth_handler.auth_wrapper),
) -> List[GetTaskResponse]:
    return await TodoList.find(
        TodoList.user_id == user["id"],
        sort=("index", 1),
    ).to_list()


@router.get(
    "/todolist/{task_id}",
    description="get a task",
)
async def get_a_task(
    task_id: str, user: Users = Depends(auth_handler.auth_wrapper)
) -> GetTaskResponse:
    if task := await TodoList.find_one(
        TodoList.id == ObjectId(task_id),
        TodoList.user_id == user["id"],
    ):
        return task
    raise HTTPException(status_code=404, detail="Task not exist")


@router.post(
    "/todolist",
    description="create a task",
    status_code=201,
)
async def create_a_task(task: Task, user: Users = Depends(auth_handler.auth_wrapper)):
    task = TodoList(**task.__dict__, user_id=user["id"])
    await task.insert()
    return task


@router.patch(
    "/todolist/{task_id}",
    description="update a todo",
    status_code=204,
)
async def update_a_task(
    task_id: str, payload: PatchTaskPayload, user: Users = Depends(auth_handler.auth_wrapper)
):
    update_fields = payload.model_dump(mode="json", exclude_unset=True)
    if not update_fields:
        return

    if task := await TodoList.find_one(
        TodoList.id == ObjectId(task_id),
        TodoList.user_id == user["id"],
    ):
        # TODO: validate task categories
        await task.set({**update_fields, "updated_at": vn_now()})
        return

    raise HTTPException(status_code=404, detail="Task not exist")


@router.delete(
    "/todolist/{task_id}",
    description="delete a task",
    status_code=204,
)
async def delete_a_task(task_id: str, user: Users = Depends(auth_handler.auth_wrapper)):
    if task := await TodoList.find_one(
        TodoList.id == ObjectId(task_id),
        TodoList.user_id == user["id"],
    ):
        await task.delete()
        return
    raise HTTPException(status_code=404, detail="Task not exist")
