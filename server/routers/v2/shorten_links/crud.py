import hashlib
import time
from typing import List

from models import ShortenLinks as DBShortenLink
from base.custom.crud import BaseCRUD

from .schemas import LinkPayload, ShortenLinkResponse


class ShortenLinkCRUD(BaseCRUD[DBShortenLink]):
    def __init__(self):
        super().__init__(DBShortenLink)

    @staticmethod
    def _generate_link_name(redirect_link: str, redirect_name: str | None = None) -> str:
        if redirect_name:
            return redirect_name
        raw = f"{redirect_link}{time.time()}"
        return hashlib.md5(raw.encode()).hexdigest()[:8]

    async def create_many(self, links: List[LinkPayload]) -> List[ShortenLinkResponse]:
        results = []
        for link in links:
            link_name = self._generate_link_name(str(link.redirect_link), link.redirect_name)
            db_obj = DBShortenLink(
                link_name=link_name,
                redirect_link=str(link.redirect_link),
            )
            await db_obj.insert()
            results.append(db_obj)
        return results

    async def get_by_link_name(self, link_name: str) -> DBShortenLink | None:
        return await DBShortenLink.find_one(DBShortenLink.link_name == link_name)

    async def increment_access_count(self, link_name: str):
        link = await self.get_by_link_name(link_name)
        if link:
            await link.set({DBShortenLink.access_count: link.access_count + 1})
