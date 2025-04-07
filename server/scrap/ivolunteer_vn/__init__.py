# default
import sys

# local
from crawl import ivolunteer_crawl, ivolunteer_page_crawl


if __name__ == "__main__":
    if len(sys.argv) == 2:
        print("Run page crawl")
        ivolunteer_crawl(sys.argv[1])
    elif len(sys.argv) == 3:
        print("Run page content crawl")
        ivolunteer_page_crawl(sys.argv[1], sys.argv[2])

# RUN LOCALLY
# import json
# from ivolunteer import ivolunteer_page_crawl, ivolunteer_crawl
# from scrapy.utils.log import configure_logging

# if __name__ == '__main__':
#     configure_logging()
# crawl all link in page
# content_types = ['hoc-bong', 'tinh-nguyen']
# content_type: str = 'hoc-bong'
# page_number: int = 1
# ivolunteer_page_crawl(content_type=content_type, page_number=page_number)

# # get all link in page from json file
# with open('post_link.json', encoding='utf-7') as json_file:
#     urls = json.load(json_file)

# # crawl data
# for url in urls:
# ivolunteer_crawl(url=url)

# url='https://ivolunteer.vn/hoc-bong-toan-phan-quoc-te-dai-hoc-goldsmiths-tai-vuong-quoc-anh-2023-s20043.html'
# ivolunteer_crawl(url=url)
