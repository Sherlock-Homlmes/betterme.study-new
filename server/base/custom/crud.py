from typing import Any, TypeVar, Generic
from bson import ObjectId

from pydantic import BaseModel
from beanie import Document

from .http_status import NotFound


ModelType = TypeVar("ModelType", bound=Document)


class BaseCRUD(Generic[ModelType]):
    def __init__(self, model: type[ModelType]):
        self.model = model

    def _to_dict(self, data: BaseModel | dict[str, Any], exclude_unset=False) -> dict[str, Any]:
        """
        Standardlize data to dict
        """
        if isinstance(data, BaseModel):
            return data.model_dump(mode="json", exclude_unset=exclude_unset)
        return data

    def _convert_to_objectid(self, value):
        """
        Convert string ID to ObjectId if needed
        """
        if isinstance(value, str):
            try:
                return ObjectId(value)
            except:
                return value
        elif isinstance(value, (list, tuple)):
            return [self._convert_to_objectid(v) for v in value]
        return value

    def _get_filter_conditions(self, **kwargs):
        """
        Get match attributes
        Args:
            match_<attr>: Any (Attributes that will convert to filter the result)
        Returns:
            List of filter conditions
        Example 1:
            Args:
                match_email: 'abc@gmail.com' #match condition
                match_roles: ['user', 'admin'] #match IN condition
            -> Return:
                [Tasks.email == 'abc@gmail.com', Tasks.roles in ['user', 'admin']]
        """
        filters = []
        for key, value in kwargs.items():
            if key.startswith("match_"):
                field_name = key[6:]
                if not hasattr(self.model, field_name):
                    raise ValueError(f"Warning: Field '{field_name}' not found in model.")
                field = getattr(self.model, field_name)

                # Convert to ObjectId if field is 'id'
                if field_name == "id":
                    value = self._convert_to_objectid(value)

                # match in list
                if isinstance(value, (list, tuple)):
                    filters.append(field.in_(value))
                # match exact value
                else:
                    filters.append(field == value)
        return filters

    def _raise_not_found(self, **kwargs):
        """
        Raise not found error message
        """
        criteria = [f"{k.replace('match_', '')}={repr(v)}" for k, v in kwargs.items()]
        details = ", ".join(criteria)
        raise NotFound(detail=f"{self.model.__name__} with {details} not found")

    async def get_one(self, **kwargs) -> ModelType | None:
        """
        Get a record by with match attributes
        Args:
            match_<attr>: Any (Attributes that will convert to filter the result)
            raise_if_missing: bool (Raise missing or return None)
        Returns:
            Beanie Document object

        Example 1:
            Args:
                match_email: 'abc@gmail.com' #match condition
                match_roles: ['user', 'admin'] #match IN condition
            -> Build query:
                Tasks.find_one(Tasks.email == 'abc@gmail.com', Tasks.roles in ['user', 'admin'])
            -> Return:
                Tasks(id='uuid', name='abc', email='abc@gmail.com')

        Example 2:
            Args:
                match_email: 'not-exist@gmail.com' #match condition
                raise_if_missing: True
            -> Build query:
                Tasks.find_one(Tasks.email == 'not-exist@gmail.com')
            -> Return:
                Raise error
        """
        filters = self._get_filter_conditions(**kwargs)

        if not filters:
            raise ValueError("At least one match_ parameter is required")

        query = self.model.find_one(*filters)
        obj = await query

        raise_if_missing = kwargs.pop("raise_if_missing", False)
        if raise_if_missing and obj is None:
            raise self._raise_not_found(**kwargs)
        return obj

    async def get_list(
        self, skip: int = 0, limit: int = 100, **kwargs
    ) -> tuple[list[ModelType], int]:
        """
        Get list with filter and pagination
        Args:
            skip: int
            limit: int
            match_<attr>: Attributes that will convert to filter the result
        Returns:
            Tuple of (list of objects, total count)
        Example:
            Args:
                match_email: 'abc@gmail.com' #match condition
                match_roles: ['user', 'admin'] #match IN condition
            -> Build query:
                Tasks.find(Tasks.email == 'abc@gmail.com', Tasks.roles in ['user', 'admin'])
            -> Return:
                ([Tasks(...), ...], total)
        """
        filters = self._get_filter_conditions(**kwargs)

        # get all
        query = self.model.find(*filters)
        query = query.sort(-self.model.id)  # Sort by _id descending to get newest first
        query = query.skip(skip).limit(limit)
        obj_list = await query.to_list()

        # count
        count_query = self.model.find(*filters)
        total = await count_query.count()

        return obj_list, total

    async def create(self, data: dict[str, Any] | BaseModel, **kwargs) -> ModelType:
        """Create new record"""
        data = self._to_dict(data)

        db_obj = self.model(**data)
        await db_obj.insert()

        return db_obj

    async def update(self, data: dict[str, Any] | BaseModel, **kwargs) -> ModelType | None:
        """
        Update a record by filters (match_ attributes)
        Args:
            data: Data to update
            match_<attr>: Any (Attributes that will convert to filter the record)
            check_exist: bool (default: True) - If True, check if record exists before updating
        """
        data = self._to_dict(data, exclude_unset=True)
        check_exist = kwargs.pop("check_exist", True)

        if check_exist:
            # Check if record exists using filters
            obj = await self.get_one(raise_if_missing=True, **kwargs)
            # Update the object
            await obj.set(data)
            return obj
        else:
            # Direct update without checking existence
            filters = self._get_filter_conditions(**kwargs)
            if not filters:
                raise ValueError("At least one match_ parameter is required")
            obj = await self.model.find_one(*filters)
            if obj:
                await obj.set(data)
                return obj
            return None

    async def delete(self, **kwargs) -> bool:
        """
        Delete a record by filters (match_ attributes)
        Args:
            match_<attr>: Any (Attributes that will convert to filter the record)
            check_exist: bool (default: True) - If True, check if record exists before deleting
        """
        check_exist = kwargs.pop("check_exist", True)

        if check_exist:
            # Check if record exists using filters
            obj = await self.get_one(raise_if_missing=True, **kwargs)
            await obj.delete()
        else:
            # Direct delete without checking existence
            filters = self._get_filter_conditions(**kwargs)
            if not filters:
                raise ValueError("At least one match_ parameter is required")
            obj = await self.model.find_one(*filters)
            if obj:
                await obj.delete()

        return True
