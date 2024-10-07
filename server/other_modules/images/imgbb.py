# default
import imgbbpy, wget, os
from dataclasses import dataclass
from typing import Optional

# local
from all_env import IMGBB_API_KEY

sync_client = imgbbpy.SyncClient(IMGBB_API_KEY)
async_client = imgbbpy.AsyncClient(IMGBB_API_KEY)


def save_image(url):
    image = wget.download(url)
    return image


def delete_image(image):
    os.remove(image)


@dataclass
class SyncImgbb:
    url: Optional[str] = None
    path: Optional[str] = None

    def upload(self):
        if self.url:
            image = save_image(self.url)
            link = self.upload_imgbb_image(image)
            delete_image(image)
            return link
        elif self.path:
            link = self.upload_imgbb_image(image)
            return link
        return None

    def upload_imgbb_image(image):
        img = sync_client.upload(file=image)
        return img.url


@dataclass
class AsyncImgbb:
    url: Optional[str] = None
    path: Optional[str] = None

    async def upload(self):
        if self.url:
            image = save_image(self.url)
            link = await self.upload_imgbb_image(image)
            delete_image(image)
            return link
        elif self.path:
            link = await self.upload_imgbb_image(image)
            return link
        return None

    async def upload_imgbb_image(image):
        img = await async_client.upload(file=image)
        return img.url
