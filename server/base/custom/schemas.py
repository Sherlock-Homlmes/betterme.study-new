from pydantic import BaseModel, Field


class BaseSchema(BaseModel):
    pass

    class Config:
        from_attributes = True

    def get_db_query(self):
        data = self.model_dump(exclude_none=True)
        if self.page is not None and self.per_page is not None:
            skip = (self.page - 1) * self.per_page
            limit = self.per_page
            data["skip"] = skip
            data["limit"] = limit
            data.pop("page", None)
            data.pop("per_page", None)

        return data


class Pagination(BaseSchema):
    page: int | None = Field(default=1, min=1)
    per_page: int | None = Field(default=100, min=1)
