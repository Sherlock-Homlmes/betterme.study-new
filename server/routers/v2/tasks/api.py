# default
from typing import List

# libraries
from fastapi import Response, Depends

# local
from models import Users, Tasks
from base.custom.crud import BaseCRUD
from base.custom.router import BaseRouter
from routers.authentication import auth_handler
from .schemas import GetTaskListQuery, CreateTask, PatchTaskPayload, GetTaskResponse

router = BaseRouter(
    prefix="/tasks",
    tags=["Study tools - Tasks - V2"],
    responses={404: {"description": "Not found"}},
)
task_crud = BaseCRUD(Tasks)


@router.get_list("/", description="Get list of task")
async def get_list_of_task(
    response: Response,
    query: GetTaskListQuery = Depends(),
    current_user: Users = Depends(auth_handler.auth_wrapper),
) -> List[GetTaskResponse]:
    query = query.get_db_query()
    return await task_crud.get_list(match_user_id=current_user["id"], **query)


@router.get("/{task_id}", description="Get a task")
async def get_a_task(
    task_id: str, current_user: Users = Depends(auth_handler.auth_wrapper)
) -> GetTaskResponse:
    return await task_crud.get_one(
        match_id=task_id, match_user_id=current_user["id"], raise_if_missing=True
    )


@router.post("/", description="Create a task", status_code=201)
async def create_a_task(
    payload: CreateTask, current_user: Users = Depends(auth_handler.auth_wrapper)
) -> GetTaskResponse:
    data = payload.model_dump()
    data["user_id"] = current_user["id"]
    return await task_crud.create(data)


@router.patch("/{task_id}", description="update a todo", status_code=204)
async def update_a_task(
    task_id: str,
    payload: PatchTaskPayload,
    current_user: Users = Depends(auth_handler.auth_wrapper),
):
    return await task_crud.update(data=payload, match_id=task_id, match_user_id=current_user["id"])


@router.delete("/{task_id}", description="Delete a task", status_code=204)
async def delete_a_task(task_id: str, current_user: Users = Depends(auth_handler.auth_wrapper)):
    return await task_crud.delete(match_id=task_id, match_user_id=current_user["id"])
