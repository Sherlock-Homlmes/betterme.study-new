from typing import Optional, List
import random
import io
import uuid  # For unique filenames
from pathlib import Path

from fastapi import Request  # Import Request
from PIL import Image, ImageDraw, ImageFont
from pydantic import BaseModel


class LeaderboardInfo(BaseModel):
    content: str
    img_path: str
    member_ids: List[int]


def generate_leaderboard_image(
    leaderboard_data: dict,
    start_idx: int,
    target_idx: Optional[int] = None,
) -> io.BytesIO:
    """Generates a leaderboard image and returns an in-memory byte stream."""
    is_top = start_idx == 0
    foreground_img = Image.open(
        "./assets/top_leaderboard.png" if is_top else "./assets/leaderboard.png"
    )
    final_img = Image.new("RGBA", foreground_img.size)
    d = ImageDraw.Draw(final_img)

    fonts = {
        50: ImageFont.truetype("./assets/Roboto-Bold.ttf", 50),
        70: ImageFont.truetype("./assets/Roboto-ExtraBold.ttf", 75),
        90: ImageFont.truetype("./assets/Roboto-ExtraBold.ttf", 90),
    }

    for data in leaderboard_data:
        img_pos = data["img_position"]
        img_size = data["img_size"]
        user_avatar = Image.open(data["img"])
        user_avatar = user_avatar.resize((img_size, img_size))
        final_img.paste(user_avatar, img_pos)
    final_img.paste(foreground_img, (0, 0), foreground_img)
    for idx, data in enumerate(leaderboard_data):
        # TODO: fix: missing number in top 10 leaderboard
        if target_idx - start_idx == idx and (
            not is_top or (is_top and target_idx >= 4 and target_idx - start_idx == idx)
        ):
            target_row = Image.open("./assets/target_row.png").convert("RGBA")
            img_pos = data["img_position"]
            alpha_mask = target_row.getchannel("A")
            final_img.paste(target_row, (img_pos[0] + 150, img_pos[1]), alpha_mask)
        text_pos = data["text_position"]
        text = data["text"]
        time_pos = data["time_position"]
        time_text = data["time"]
        user_name_font = fonts[data["text_font_size"]]
        user_name_color = (255, 255, 255) if not is_top or idx > 2 else (224, 174, 51)
        time_font = fonts[data["time_font_size"]]
        d.text(text_pos, text, font=user_name_font, fill=user_name_color)
        d.text(time_pos, time_text, font=time_font, fill=(255, 255, 255))
        if data.get("idx_text"):
            d.text(
                data["idx_text_position"],
                data["idx_text"],
                font=fonts[data["idx_text_font_size"]],
                fill=(255, 255, 255),
            )

    img_name = f"{uuid.uuid4()}.png"
    img_path = f"./assets/images/{img_name}"
    final_img.save(img_path)
    return img_path
