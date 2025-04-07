# default
import datetime
from typing import Optional, Union

# libraries
from pydantic import BaseModel


class OtherPostInfo(BaseModel):
    # TODO: remove str type when lib support get date in projection
    deadline: Optional[Union[datetime.date, str, None]] = None
