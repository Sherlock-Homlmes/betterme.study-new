# default
from typing import Annotated
import datetime
from typing import Optional, Union, Any

# libraries
from pydantic import BaseModel, HttpUrl, AfterValidator
from bson import ObjectId
from pydantic_core import core_schema


class OtherPostInfo(BaseModel):
    # TODO: remove str type when lib support get date in projection
    deadline: Optional[Union[datetime.date, str, None]] = None


class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema(
                [
                    core_schema.is_instance_schema(ObjectId),
                    core_schema.chain_schema(
                        [
                            core_schema.str_schema(),
                            core_schema.no_info_plain_validator_function(cls.validate),
                        ]
                    ),
                ]
            ),
            serialization=core_schema.plain_serializer_function_ser_schema(lambda x: str(x)),
        )

    @classmethod
    def validate(cls, value) -> ObjectId:
        if not ObjectId.is_valid(value):
            raise ValueError("Invalid ObjectId")

        return ObjectId(value)


HttpUrlString = Annotated[HttpUrl, AfterValidator(lambda v: str(v))]
