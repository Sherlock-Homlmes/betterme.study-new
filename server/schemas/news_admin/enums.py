# TODO: convert this to class enum(str, Enum) to not have to .value to access enum value
# default
from enum import Enum
from ..user.enums import *

# local


# CRAWL
class OriginCrawlPagesEnum(Enum):
    KHOAHOC_TV = "khoahoc_tv"
    IVOLUNTEER_VN = "ivolunteer_vn"


class CrawlerDataResponseTypeEnum(Enum):
    WEB = "html"
    DISCORD = "discord"
    FACEBOOK = "facebook"


class AIPromtTypeEnum(Enum):
    TITLE = "title"
    DESCRIPTION = "description"
    CONTENT = "content"
