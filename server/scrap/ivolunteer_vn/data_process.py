# default
import re
from pathlib import Path
from lxml import etree, html

# library
import aiofiles
import aiohttp
from scrapy import Selector


DATA_DIR = f"{Path(__file__).resolve().parent.parent}/data"


# TODO: this func duplicate code from services
def generate_slug(s: str) -> str:
    """Generates a slug from the given text, handling various cases."""
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    s = re.sub(r"^-+|-+$", "", s)
    return s


def remove_empty_string(s: str) -> str:
    """"""
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    # s = re.sub(r"[\s_-]+", "-", s)
    s = re.sub(r"^-+|-+$", "", s)
    return s


async def save_image(url: str) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            if resp.status == 200:
                img_name = url.split("/")[-1].replace(".png", "").replace(".jpg", "")
                img_name = generate_slug(img_name)
                img_name += ".png"
                f = await aiofiles.open(f"{DATA_DIR}/media/{img_name}", mode="wb")
                await f.write(await resp.read())
                await f.close()
                return img_name


def replace_html(selector: Selector) -> str:
    content = selector.get()
    replace_tags = (
        ("em", ""),
        ("p", ""),
        ("strong", ""),
    )
    for replace_tag in replace_tags:
        content = content.replace(f"<{replace_tag[0]}>", replace_tag[1]).replace(
            f"</{replace_tag[0]}>", replace_tag[1]
        )
    for replace_tag in replace_tags:
        content = re.sub(f"<{replace_tag[0]}?(.*?)>", replace_tag[1], content, flags=re.DOTALL)

    content = content.replace("<h4>", "").replace("</h4>", "")
    content = content.replace("<li>", "").replace("</li>", "")

    return content


def process_detail_page_data_html(content: list) -> list:
    new_content = [cont.get() for cont in content]
    document_root = html.fromstring("".join(new_content))
    return etree.tostring(document_root, encoding="unicode", pretty_print=True)
