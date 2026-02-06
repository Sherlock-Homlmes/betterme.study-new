from typing import Any

from beanie.odm.fields import PydanticObjectId
from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic_core import CoreSchema, core_schema


class IDStr(str):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> CoreSchema:
        return core_schema.no_info_after_validator_function(
            cls.validate,
            schema=core_schema.union_schema(
                [
                    core_schema.is_instance_schema(PydanticObjectId),
                    core_schema.str_schema(),
                ]
            ),
            serialization=core_schema.plain_serializer_function_ser_schema(
                cls.serialize,
                info_arg=False,
                return_schema=core_schema.str_schema(),
                when_used="json",
            ),
        )

    @classmethod
    def __get_pydantic_json_schema__(
        cls, core_schema: CoreSchema, handler: GetJsonSchemaHandler
    ) -> dict[str, Any]:
        """Show in Swagger/OpenAPI"""
        json_schema = handler(core_schema)
        json_schema.update(
            type="string",
            format="encoded-id",
            description="Encoded ID",
        )
        return json_schema

    @classmethod
    def validate(cls, value: Any) -> str:
        """
        JSON/Code -> str (ObjectId string)
        """
        # try to convert to string
        return str(value)

    @classmethod
    def serialize(cls, value: Any) -> str:
        """
        ObjectId -> String
        """
        if isinstance(value, PydanticObjectId):
            return str(value)
        return str(value)
