# mypy: disable-error-code="index"
# default
from typing import List, Optional

# local
from models import FacebookPostInfo
from utils.text_convertion import gen_camel_case


def is_facebook_service_ready() -> bool:
    from .conf import fb_client

    return bool(fb_client)


def post_to_fb(
    origin: str,
    content: str,
    comment: str,
    hashtags: Optional[List[str]] = [],
    image_name: Optional[str] = None,
) -> FacebookPostInfo:
    from .conf import fb_client

    # add hashtag(s)
    content += "\n"
    for hashtag in hashtags:
        content += "#" + gen_camel_case(hashtag) + " "

    # create facebook post
    if image_name:
        post = fb_client.put_photo(image=open(image_name, "rb"), message=content)
    else:
        post = fb_client.put_object("me", "feed", message=content)

    # like post
    fb_client.put_like(object_id=post["id"])

    # add comment
    comment = fb_client.put_comment(object_id=post["id"], message=comment)

    return FacebookPostInfo(
        post_id=post["id"],
        comment_id=comment["id"],
    )


# TODO
def edit_fb_post():
    pass


# TODO
def edit_fb_comment():
    pass


# TODO
def delete_fb_post():
    pass
