# fastapi
from fastapi import HTTPException, Depends

# default
from bson.objectid import ObjectId

# local
from . import router
from authentication import auth_handler

from .schemas import TaskCategory
from models import Users, TaskCategories


@router.get(
    "/task-categories",
    description="get list of task category",
    dependencies=[Depends(auth_handler.auth_wrapper)],
)
async def get_list_of_task_category(user: Users = Depends(auth_handler.auth_wrapper)):
    task_categories = await TaskCategories.find(
        TaskCategories.user.id == ObjectId(user["id"])
    ).to_list()
    for task_category in task_categories:
        del task_category.user
    return TaskCategories


@router.get(
    "/task-categories/{task_id}",
    description="get a task category",
    dependencies=[Depends(auth_handler.auth_wrapper)],
)
async def get_a_task_category(
    task_category_id: str, user: Users = Depends(auth_handler.auth_wrapper)
):
    task_category = await TaskCategories.find_one(
        TaskCategories.id == ObjectId(task_category_id),
        TaskCategories.user.id == ObjectId(user["id"]),
    )
    if task_category:
        del task_category.user
        return task_category
    raise HTTPException(status_code=404, detail="Task Category not exist")


@router.post(
    "/task-categories",
    description="create a task category",
    dependencies=[Depends(auth_handler.auth_wrapper)],
    status_code=201,
)
async def create_a_task_category(
    task_category: TaskCategory, user: Users = Depends(auth_handler.auth_wrapper)
):
    task_category = TaskCategories(user=user["id"], **task_category.__dict__)
    await task_category.insert()
    del task_category.user
    return task_category


@router.patch(
    "/task-categories/{task_id}",
    description="update a task category",
    dependencies=[Depends(auth_handler.auth_wrapper)],
    status_code=204,
)
async def update_a_task_category(
    task_category_id: str,
    task_category: TaskCategory,
    user: Users = Depends(auth_handler.auth_wrapper),
):
    old_task_category = await TaskCategories.find_one(
        TaskCategories.id == ObjectId(task_category_id),
        TaskCategories.user.id == ObjectId(user["id"]),
    )
    if old_task_category:
        old_task_category.update_value(task_category)
        await old_task_category.save()
        return
    raise HTTPException(status_code=404, detail="Task Category not exist")


@router.delete(
    "/task-categories/{task_id}",
    description="delete a task category",
    dependencies=[Depends(auth_handler.auth_wrapper)],
    status_code=204,
)
async def delete_a_task_category(
    task_category_id: str, user: Users = Depends(auth_handler.auth_wrapper)
):
    old_task_category = await TaskCategories.find_one(
        TaskCategories.id == ObjectId(task_category_id),
        TaskCategories.user.id == ObjectId(user["id"]),
    )
    if old_task_category:
        await old_task_category.delete()
        return
    raise HTTPException(status_code=404, detail="Task Category not exist")
