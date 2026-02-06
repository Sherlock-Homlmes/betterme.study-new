import functools
import math
from collections.abc import Callable

from fastapi import APIRouter, Response
from fastapi.routing import APIRoute


class PaginationRoute(APIRoute):
    """
    Custom Route Handler that intercepts the response to inject pagination headers.

    It expects the endpoint to return a tuple: (items, total_count).
    It extracts 'total_count' to set headers and returns only 'items' to the client.
    """

    def __init__(self, path: str, endpoint: Callable, **kwargs):
        @functools.wraps(endpoint)
        async def wrapper(*args, **kw):
            # 1. Execute the actual endpoint logic
            result = await endpoint(*args, **kw)

            # 2. Check if the result is a tuple format (items, total_count)
            # This logic only applies if the developer returns a tuple.
            if isinstance(result, tuple) and len(result) == 2:
                items, total = result

                # 3. Locate the injected 'Response' object in kwargs
                response_obj = next((v for v in kw.values() if isinstance(v, Response)), None)

                # 4. Locate the Pagination object (Duck typing: checks for page/per_page attributes)
                # This makes it compatible with any Pydantic model having these fields.
                pagination_obj = next(
                    (v for v in kw.values() if hasattr(v, "page") and hasattr(v, "per_page")),
                    None,
                )

                # 5. Calculate and set pagination headers
                if response_obj and pagination_obj:
                    per_page = pagination_obj.per_page
                    page = pagination_obj.page

                    # Avoid division by zero
                    total_pages = math.ceil(total / per_page) if per_page > 0 else 0

                    # Headers must be strings
                    response_obj.headers["x-total-count"] = str(total)
                    response_obj.headers["x-total-pages"] = str(total_pages)
                    response_obj.headers["x-page"] = str(page)
                    response_obj.headers["x-per-page"] = str(per_page)

                # 6. Return only the data list to satisfy the response_model
                return items

            # If it's a standard endpoint (not returning a tuple), pass the result through.
            return result

        # Initialize the route with our custom wrapper
        super().__init__(path, endpoint=wrapper, **kwargs)


class BaseRouter(APIRouter):
    """
    Extended APIRouter with specialized methods.
    """

    def get_list(self, path: str, **kwargs):
        """
        Custom decorator for List APIs.
        """

        def decorator(endpoint: Callable) -> Callable:
            original_route_class = self.route_class
            self.route_class = PaginationRoute
            try:
                self.add_api_route(path, endpoint, methods=["GET"], **kwargs)
            finally:
                self.route_class = original_route_class

            return endpoint

        return decorator
