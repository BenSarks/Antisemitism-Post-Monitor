from abc import ABC, abstractmethod
from random import randint
from time import sleep
from typing import Optional


class ScraperAbs(ABC):
    def __init__(self, client, max_messages: int, max_req_delay: int, min_req_delay: int, req_retries: int, source: str):
        self._client = client
        self._max_messages = max_messages
        self._max_req_delay = max_req_delay
        self._min_req_delay = min_req_delay
        self._req_retries = req_retries
        self._source = source

    @classmethod
    @abstractmethod
    def init_client(cls, config: Optional[dict] = None):
        pass

    @abstractmethod
    def get_text_messages_by_keywords(self, keywords: Optional[list] = None) -> list:
        pass

    @classmethod
    def text_input_field_valid(cls, val) -> bool:
        if val is None:
            return False
        return len(val) > 0 if hasattr(val, "__len__") else True

    @classmethod
    def text_input_obj(cls, author: str, post_text: str, post_id: str, source: str, extra_data_link: str = None, media_type: str = None, **kwargs):
        result = {
            "post_author": author if cls.text_input_field_valid(author) else "unknown",
            "post_text": post_text if cls.text_input_field_valid(post_text) else "unknown",
            "post_id": post_id if cls.text_input_field_valid(post_id) else "unknown",
            "source": source if cls.text_input_field_valid(source) else "unknown"
        }

        if extra_data_link is not None:
            result["extra_data_link"] = extra_data_link if cls.text_input_field_valid(
                extra_data_link) else "unknown"

        if media_type is not None:
            result["media_type"] = media_type if cls.text_input_field_valid(
                media_type) else "unknown"

        for key, value in kwargs.items():
            if cls.text_input_field_valid(value):
                result[key] = value

        return result

    def delay_after_request(self) -> None:
        sleep(randint(self._min_req_delay, self._max_req_delay))
