from fastapi import HTTPException, status


class NotFound(HTTPException):
    def __init__(self, **kwargs):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, **kwargs)


class BadRequest(HTTPException):
    def __init__(self, **kwargs):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, **kwargs)


class Unauthorized(HTTPException):
    def __init__(self, **kwargs):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, **kwargs)
