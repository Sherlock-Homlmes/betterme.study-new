# default
from dataclasses import dataclass

# local
from .base import dtbs
db = dtbs['todolist']
from users.study_tools.schemas import TodoList

@dataclass
class TodoListDB:

    @staticmethod
    def create(data: TodoList):
        db.insert_one(data.__dict__)

    @staticmethod
    def list_todo(user_id):
        data = db.find({'user_id': user_id})

        result = []
        for dat in data:
            print(dat)
            result.append(dat)

        return result

    @staticmethod
    def update(todo_id, data: TodoList):
        pass

    @staticmethod
    def delete(todo_id):
        pass