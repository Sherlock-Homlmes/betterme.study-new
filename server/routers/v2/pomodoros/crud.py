from models import Pomodoros as DBPomodoro, PomodoroStatusEnum
from base.custom.crud import BaseCRUD
from base.custom.http_status import BadRequest


class PomodoroCRUD(BaseCRUD[DBPomodoro]):
    def __init__(selfn):
        super().__init__(DBPomodoro)

    async def create(self, user_id: str) -> DBPomodoro:
        last_pomodoro = await self.get_one(match_user_id=user_id)
        if not last_pomodoro or last_pomodoro.check_available_to_create():
            return await super().create({"user_id": user_id})
        raise BadRequest(detail="Invalid pomodoro section")

    async def delete_last_section(self, user_id: str) -> DBPomodoro:
        last_pomodoro = await self.get_one(match_user_id=user_id)
        if last_pomodoro.status == PomodoroStatusEnum.COMPLETED:
            raise BadRequest(detail="Can not delete completed pomodoro section")
        await last_pomodoro.delete()
