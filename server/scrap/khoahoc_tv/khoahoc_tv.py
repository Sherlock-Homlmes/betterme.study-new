import json
import io
import scrapy
import scrapy.Crawler as Crawler
from multiprocessing import Process, Queue
from twisted.internet import reactor


# page content
def khoahoc_tv_crawl(url: str):
    class KhoahocTvSpider(scrapy.Spider):
        name = "khoahoc_tv"
        allowed_domains = ["khoahoc.tv"]
        start_urls = [url]

        def parse(self, response):
            # crawl
            title = response.css("h1::text").get()
            content = response.css("div.content-detail").css("p, h2, h3, ul, div.responsive")
            author = response.css("div.author-info").css("span::text").getall()

            page_content = {
                # SEO
                "description": response.xpath("//meta[@name='description']/@content")[0].get(),
                "keywords": response.xpath("//meta[@name='keywords']/@content")[0].get(),
                "seo_img": response.xpath("//meta[@property='og:image']/@content").get(),
                # CONTENT
                "title": title,
                "content": [
                    {
                        "text": (
                            cont.css("p::text").get()
                            if cont.css("img::attr(data-src)").get() is not None
                            else cont.css("p").get()
                        ),
                        # img element
                        "content_img_src": cont.css("img::attr(data-src)").get(),
                        "content_img_alt": cont.css("img::attr(alt)").get(),
                        # link in text element
                        "link": cont.css("a").getall(),
                        "link_text": cont.css("a::text").getall(),
                        # sub title
                        "h2": cont.css("h2").get(),
                        "h3": cont.css("h3").get(),
                        # ul
                        "ul": cont.css("ul").get(),
                        # video
                        "video": cont.css("video").css("source::attr(src)").get(),
                        "youtube_video": cont.css("iframe::attr(data-src)").get(),
                    }
                    for cont in content
                ],
                "author": author,
            }
            # write to files
            file_name = self.start_urls[0].split("/")[3]

            # write origin data to js file
            with io.open(f"crawl_origin_data/{file_name}.json", "w", encoding="utf8") as json_file:
                json.dump(page_content, json_file, ensure_ascii=False, indent=4)

            page_content = process_detail_page_data(page_content)

            # write to js file
            with io.open(f"crawl_data/{file_name}.json", "w", encoding="utf8") as json_file:
                json.dump(page_content, json_file, ensure_ascii=False, indent=4)

            # write to html file
            html_file = open(f"demo_page/{file_name}.html", "w")
            html_file.write(
                "<h1>"
                + page_content["title"]
                + "</h1>"
                + '<div class="content">'
                + page_content["content"]
                + "</div>"
                + page_content["date"]
                + " "
                + page_content["author"]
            )
            html_file.close()

    run_spider(KhoahocTvSpider)


def process_detail_page_data(page_content: dict) -> dict:
    # SEO
    page_content["keywords"] = page_content["keywords"].lower()
    page_content["keywords"] = page_content["keywords"].split(",")
    page_content["slidesshow_img"] = page_content["seo_img"]
    page_content["thumbnail_img"] = page_content["seo_img"].replace("650.jpg", "200.jpg")
    del page_content["seo_img"]

    # CONTENT
    content = ""
    for cont_index, cont in enumerate(page_content["content"]):
        temp_content = None

        if len(cont["link"]) != 0 and cont["ul"] is None:
            for index, a in enumerate(cont["link"]):
                cont["text"] = cont["text"].replace(a, cont["link_text"][index])
        if cont["content_img_src"] is not None:
            temp_content = f"""
            <p>
            <img src={cont["content_img_src"]} alt={cont["content_img_alt"]}
                width="684" height="685" class="lazy"
            >
            """
            if cont["text"] is not None:
                temp_content += f"<br>{cont['text']}"
            temp_content += "</p>"

        elif cont["h2"] is not None:
            temp_content = cont["h2"]
        elif cont["h3"] is not None:
            temp_content = cont["h3"]
        elif cont["ul"] is not None:
            temp_content = cont["ul"] if cont_index + 1 != len(page_content["content"]) else ""
        elif cont["video"] is not None:
            temp_content = f"""
            <video controls="" width="560" height="280">
            <source src="{cont["video"]}" type="video/mp4">
            </video>
            """
        elif cont["youtube_video"] is not None:
            temp_content = f"""
            <iframe title="YouTube video player"
            width="560" height="315" frameborder="0" allowfullscreen class="lazy"
            src="{cont["youtube_video"]}"></iframe>
            """
        content += temp_content if temp_content is not None else cont["text"]

    page_content["content"] = content
    page_content["date"] = page_content["author"][0]
    page_content["author"] = page_content["author"][1]

    return page_content


# page with many content
def khoahoc_tv_page_crawl(page_number: int):
    class KhoahocTvPageSpider(scrapy.Spider):
        name = "khoahoc_tv"
        allowed_domains = ["khoahoc.tv"]
        start_urls = [f"https://khoahoc.tv/?p={page_number}"]

        def parse(self, response):
            data = [
                f"https://khoahoc.tv{x}"
                for x in response.css(".listview").css("a::attr(href)").getall()
            ]
            # data.extend([])

            # write to js file
            with io.open("khoahoc_tv_link.json", "w", encoding="utf8") as json_file:
                json.dump(data, json_file, ensure_ascii=False, indent=4)

    run_spider(KhoahocTvPageSpider)


def run_spider(spider):
    def f(q):
        try:
            runner = Crawler.CrawlerRunner()
            deferred = runner.crawl(spider)
            deferred.addBoth(lambda _: reactor.stop())
            reactor.run()
            q.put(None)
        except Exception as e:
            q.put(e)

    q = Queue()
    p = Process(target=f, args=(q,))
    p.start()
    result = q.get()
    p.join()

    if result is not None:
        raise result

    # process = CrawlerProcess({
    #     'USER_AGENT': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)'
    # })

    # process.crawl(KhoahocTvPageSpider)
    # process.start()
    # process.stop()
