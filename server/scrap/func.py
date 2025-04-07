# TODO: refactor to OOP
# default
from typing import List
import json
import os
import io
from PIL import Image
from typing import Union

# libraries
from fastapi import HTTPException

# local
from schemas.news_admin import (
    # payload
    PatchCrawlersDataPayload,
    CrawlersListDataParams,
    # response
    GetCrawlersKhoahocTvDataResponse,
    GetCrawlersIvolunteerDataResponse,
    # enums
    OriginCrawlPagesEnum,
    ResponseStatusEnum,
)


def check_if_crawl_post_success(post_name: str) -> bool:
    if os.path.exists(f"scrap/data/post/{post_name}.json"):
        return True
    return False


def check_if_crawl_page_success(params: CrawlersListDataParams) -> bool:
    if os.path.exists(
        f"scrap/data/page/{params.origin.value}-{params.content_type.value}-{params.page}.json"
    ):
        return True
    return False


# page
# TODO: add cache to this func
def scrap_page_data(params: CrawlersListDataParams) -> List[str]:
    os.system(
        f"python3 scrap/{params.origin.value}/__init__.py {params.content_type.value} {params.page}"
    )
    if check_if_crawl_page_success(params):
        with open(
            f"scrap/data/page/{params.origin.value}-{params.content_type.value}-{params.page}.json",
            encoding="utf-8",
        ) as general_json_file:
            return json.load(general_json_file)
    return []


# post
def get_scrap_post_data(
    origin: OriginCrawlPagesEnum, post_name: str
) -> Union[GetCrawlersIvolunteerDataResponse, GetCrawlersKhoahocTvDataResponse]:
    with open(f"scrap/data/post/{post_name}.json", encoding="utf-8") as general_json_file:
        general_data = json.load(general_json_file)

    if origin == OriginCrawlPagesEnum.IVOLUNTEER_VN:
        return GetCrawlersIvolunteerDataResponse(**general_data)
    elif origin == OriginCrawlPagesEnum.KHOAHOC_TV:
        return
        # return GetCrawlersKhoahocTvDataResponse(
        #     **general_data,
        #     html=data_map[origin][CrawlerDataResponseTypeEnum.HTML](**html_data),
        #     discord=data_map[origin][CrawlerDataResponseTypeEnum.DISCORD](**discord_data),
        # )


def scrap_post_data(
    origin: OriginCrawlPagesEnum, post_name: str
) -> Union[GetCrawlersIvolunteerDataResponse, GetCrawlersKhoahocTvDataResponse]:
    # crawl post data
    os.system(f"python3 scrap/{origin.value}/__init__.py {post_name}")
    # check if
    if check_if_crawl_post_success(post_name=post_name):
        if origin == OriginCrawlPagesEnum.IVOLUNTEER_VN:
            with open(f"scrap/data/post/{post_name}.json", encoding="utf-8") as general_json_file:
                general_data = json.load(general_json_file)
            image_process(image=general_data["banner"])
        return get_scrap_post_data(origin=origin, post_name=post_name)
    raise HTTPException(status_code=ResponseStatusEnum.BAD_REQUEST.value, detail="Not found post")


def srap_post_data_find_or_create(
    origin: OriginCrawlPagesEnum, post_name: str
) -> Union[GetCrawlersIvolunteerDataResponse, GetCrawlersKhoahocTvDataResponse]:
    if check_if_crawl_post_success(post_name=post_name):
        return get_scrap_post_data(origin=origin, post_name=post_name)
    return scrap_post_data(origin=origin, post_name=post_name)


def save_crawler_data(post_name: str, data: PatchCrawlersDataPayload) -> None:
    if check_if_crawl_post_success(post_name=post_name):
        # open file to get old data
        with open(f"scrap/data/post/{post_name}.json", encoding="utf-8") as general_json_file:
            general_data = json.load(general_json_file)

        # update if key match
        # TODO: refactor using pydantic serilization
        update_data = data.dict()
        for key, value in update_data.items():
            name = general_data.get(key, None) if value is not None else None
            if name is not None:
                if key == "tags":
                    general_data["tags"] = [x.value for x in update_data["tags"]]
                else:
                    general_data[key] = update_data[key]

        # write to js file
        with io.open(f"scrap/data/post/{post_name}.json", "w", encoding="utf8") as html_json_file:
            json.dump(general_data, html_json_file, ensure_ascii=False, indent=4)

    else:
        raise HTTPException(
            status_code=ResponseStatusEnum.BAD_REQUEST.value, detail="Not found post"
        )


def image_process(image: str) -> None:
    # Opens a image
    img = Image.open(f"scrap/data/media/{image}")
    if img.size == (800, 500):
        frame_img = Image.open("scrap/media/betterme_news.png")
    elif img.size != (800, 500):
        image_ratio = img.size[0] / img.size[1]
        if image_ratio < 1.55 or image_ratio > 1.75:
            raise HTTPException(
                status_code=ResponseStatusEnum.BAD_REQUEST.value,
                detail="Make sure image ratio is 8/5",
            )
        frame_img = Image.open("scrap/media/betterme_news_big.png")
        resized_image = frame_img.resize(
            img.size,
        )
        resized_image.save("scrap/media/betterme_news_abc.png", "PNG")
        frame_img = Image.open("scrap/media/betterme_news_abc.png")

    # Add foreground
    img.paste(frame_img, (0, 0), frame_img)

    # Save the image
    img.save(f"scrap/data/media/{image}")
