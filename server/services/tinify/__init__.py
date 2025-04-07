# libraries
import tinify

# local
from base.settings import settings


tinify.key = settings.TINY_PNG_API_KEY


def compress_image(image_name: str):
    source = tinify.from_file(f"scrap/data/media/{image_name}")
    converted = source.convert(type=["image/webp"])
    extension = converted.result().extension
    new_file_name = f"{image_name}.{extension}"
    source.to_file(f"scrap/data/media/{new_file_name}")

    return new_file_name
