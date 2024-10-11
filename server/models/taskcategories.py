from pydantic import Field, validator
from beanie import Document, Link

# local
from .users import Users


# TODO: replace user => user_id
class TaskCategories(Document):
    user: Link[Users]
    title: str = Field(max_length=200)
    description: str = Field(max_length=1000)
    color: str = Field(max_length=10)

    @validator("color")
    def status_in_list(cls, v: str):
        if not v.startswith("#"):
            raise ValueError("Invalid color code")
        return v

    def update_value(self, taskcategory):
        self.title = taskcategory.title
        self.description = taskcategory.description
        self.color = taskcategory.color
