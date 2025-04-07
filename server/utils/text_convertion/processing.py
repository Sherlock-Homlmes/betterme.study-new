# libs
from pyheck import kebab, snake

# local
from .language import convert_text_to_standard_type


def gen_slug(s: str) -> str:
    """Generates a slug from the given text, handling various cases."""
    s = convert_text_to_standard_type(s)
    return kebab(s)


def gen_camel_case(s: str) -> str:
    s = convert_text_to_standard_type(s)
    return snake(s)
