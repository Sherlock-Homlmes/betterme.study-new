# default
import asyncio
import json
import io
from pathlib import Path

# library
import scrapy
from scrapy.crawler import CrawlerProcess

# local
from data_process import (
    save_image,
    process_detail_page_data_html,
    replace_html,
    remove_empty_string,
)

DATA_DIR = f"{Path(__file__).resolve().parent.parent}/data"
ALLOWED_DOMAINS = ["ivolunteer.vn"]
PAGE_URL = "https://ivolunteer.vn/"


# page content
def ivolunteer_crawl(url: str):
    class IvolunteerTvSpider(scrapy.Spider):
        name = "ivolunteer post"
        allowed_domains = ALLOWED_DOMAINS
        start_urls = [PAGE_URL + url]

        def parse(self, response):
            # crawl
            title = response.css("h1::text").get().replace("  ", "").replace("\n", "")
            deadline = response.css(".mvp-post-cat::text").get().replace("Deadline: ", "")
            deadline = deadline.split("/")[::-1]
            if len(deadline) == 3 and len(deadline[1]) == 1:
                deadline[1] = "0" + deadline[1]
            deadline = "-".join(deadline)
            if deadline in ["ASAP", "All year round", ""] or remove_empty_string(deadline) == "":
                deadline = None
            banner = response.css("#mvp-content-main").css("img::attr(data-src)").get()
            og_img = response.xpath("//meta[@property='og:image']/@content")[0].extract()
            banner = banner if banner else og_img
            if banner is not None:
                banner = asyncio.run(save_image(banner))
                if banner is not None:
                    banner = banner.split("/")[-1]
                else:
                    raise ValueError("No banner image")
            else:
                raise ValueError("No banner image")
            content = response.css("#mvp-content-main").css("h4, p, ul")
            content.pop(0)
            # remove last 3 <p> from content
            content.pop()
            content.pop()
            content.pop()
            keywords = response.xpath("//meta[@name='keywords']/@content")[0].get().split(",")
            keywords = [
                keyword[1:] if keyword[0] == " " else keyword
                for keyword in keywords
                if "ivolunteer" not in keyword.lower()
            ]

            general_data = {
                "title": title,
                "description": replace_html(response.css("#mvp-content-main").css("p")[0]),
                "deadline": deadline,
                "banner": banner,
                "content": process_detail_page_data_html(content),
                "tags": [],
                # SEO
                "keywords": keywords,
            }

            # write to file
            file_name = self.start_urls[0].split("/")[3]

            # write to js file
            with io.open(
                f"{DATA_DIR}/post/{file_name}.json", "w", encoding="utf8"
            ) as html_json_file:
                json.dump(general_data, html_json_file, ensure_ascii=False, indent=4)

    process = CrawlerProcess({"USER_AGENT": "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)"})
    process.crawl(IvolunteerTvSpider)
    process.start()


# page with many content
def ivolunteer_page_crawl(content_type: str, page_number: int):
    class IvolunteerPageSpider(scrapy.Spider):
        name = "ivolunteer"
        allowed_domains = ALLOWED_DOMAINS
        start_urls = [f"{PAGE_URL}/{content_type}/page/{page_number}"]

        def parse(self, response):
            data = response.css(".mvp-feat1-main").css("a::attr(href)").getall()
            data.extend(response.css(".mvp-widget-feat1-wrap").css("a::attr(href)").getall())
            # remove ivolunteer post
            data = [x.replace("https://ivolunteer.vn/", "") for x in data]
            data = [x for x in data if "ivolunteer" not in x and "ngo-recruitment" not in x]

            # write to js file
            with io.open(
                f"{DATA_DIR}/page/ivolunteer_vn-{content_type}-{page_number}.json",
                "w",
                encoding="utf8",
            ) as json_file:
                json.dump(data, json_file, ensure_ascii=False, indent=4)

    process = CrawlerProcess({"USER_AGENT": "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)"})
    process.crawl(IvolunteerPageSpider)
    process.start()
