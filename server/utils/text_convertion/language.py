vietnamese_name_convertions = {
    "ă": "a",
    "â": "a",
    "á": "a",
    "à": "a",
    "ã": "a",
    "ả": "a",
    "ạ": "a",
    "ắ": "a",
    "ằ": "a",
    "ặ": "a",
    "ẵ": "a",
    "ẳ": "a",
    "ầ": "a",
    "ấ": "a",
    "ẩ": "a",
    "ẫ": "a",
    "ậ": "a",
    "đ": "d",
    "ê": "e",
    "è": "e",
    "ẻ": "e",
    "é": "e",
    "ẽ": "e",
    "ẹ": "e",
    "ề": "e",
    "ế": "e",
    "ể": "e",
    "ễ": "e",
    "ệ": "e",
    "ô": "o",
    "ơ": "o",
    "ồ": "o",
    "ố": "o",
    "ổ": "o",
    "ỗ": "o",
    "ộ": "o",
    "ờ": "o",
    "ớ": "o",
    "ở": "o",
    "ỡ": "o",
    "ợ": "o",
    "ò": "o",
    "ó": "o",
    "õ": "o",
    "ỏ": "o",
    "ọ": "o",
    "ư": "u",
    "ừ": "u",
    "ứ": "u",
    "ử": "u",
    "ữ": "u",
    "ự": "u",
    "ù": "u",
    "ú": "u",
    "ũ": "u",
    "ụ": "u",
    "ủ": "u",
    "í": "i",
    "ì": "i",
    "ĩ": "i",
    "ỉ": "i",
    "ị": "i",
    "ỳ": "y",
    "ý": "y",
    "ỵ": "y",
    "ỷ": "y",
    "ỹ": "y",
}


def convert_text_to_standard_type(string: str) -> str:
    global vietnamese_name_convertions

    # lower name
    string = string.lower()
    # convert to non-operator string
    string = "".join(
        [
            vietnamese_name_convertions[x] if x in vietnamese_name_convertions.keys() else x
            for x in string
        ]
    )

    return string
