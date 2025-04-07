# default
from enum import Enum
import base64

# libraries
from beanie import Document, Insert, Replace, Update, SaveChanges, before_event
from cryptography.fernet import Fernet

# local
from base.settings import settings


class KeyTypeEnum(str, Enum):
    FACEBOOK_ACCESS_TOKEN = "FACEBOOK_ACCESS_TOKEN"


class SecretKeys(Document):
    key_name: KeyTypeEnum
    value: str

    class Settings:
        validate_on_save = True
        # use_cache = True
        # cache_expiration_time = datetime.timedelta(seconds=60)

    @before_event(Insert, Replace, Update, SaveChanges)
    def encode_value_on_save(self):
        sample_string_bytes = self.value.encode("ascii")
        base64_bytes = base64.b64encode(sample_string_bytes)
        self.value = (Fernet(settings.ENCRYPT_KEY.encode("ascii")).encrypt(base64_bytes)).decode(
            "ascii"
        )

    def get_value(self):
        base64_bytes = self.value.encode("ascii")
        encrypt_value = Fernet(settings.ENCRYPT_KEY.encode("ascii")).decrypt(base64_bytes)
        sample_string_bytes = base64.b64decode(encrypt_value)
        value = sample_string_bytes.decode("ascii")
        return value
