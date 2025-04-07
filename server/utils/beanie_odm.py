# default
from typing import List, Optional, Dict

# libraries
from pydantic import BaseModel
from beanie.odm.queries.aggregation import AggregationQuery


def get_projections_from_model(
    pydantic_model: BaseModel,
    exclude_fields: Optional[List[str]] = [],
    map_fields: Optional[Dict[str, str]] = {},
) -> dict:
    fields = pydantic_model.__fields__.keys()
    projections = {}
    for field in fields:
        if field in exclude_fields:
            continue
        if field in map_fields.keys():
            projections[field] = f"${map_fields[field]}"
            continue
        if field == "id":
            projections["id"] = "$_id"
        else:
            projections[field] = f"${field}"
    return projections


async def return_with_pagination(
    cursor,
    response,
    page: int,
    per_page: int,
):
    if isinstance(cursor, AggregationQuery):
        cursor.aggregation_pipeline.append({"$count": "count"})
        cursor.projection_model = None
        cursor.aggregation_pipeline = [
            query
            for query in cursor.aggregation_pipeline
            if not isinstance(query.get("$limit"), int)
        ]
        result = await cursor.to_list()
        total_count = (await cursor.to_list())[0]["count"] if len(result) else 0

    else:
        total_count = await cursor.count()

    response.headers["x-total-count"] = str(total_count)
    response.headers["x-current-page"] = str(page)
    response.headers["x-per-page"] = str(per_page)


def cursor_pipeline_rearrange(cursor):
    # Find the index of the $search stage
    search_index = next(
        (i for i, stage in enumerate(cursor.aggregation_pipeline) if "$search" in stage), None
    )

    if search_index is not None:
        # Move the $search stage to the beginning
        cursor.aggregation_pipeline.insert(0, cursor.aggregation_pipeline.pop(search_index))

    return cursor
