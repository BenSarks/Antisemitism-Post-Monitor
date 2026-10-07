import json
import os
import re
import traceback
from typing import Optional

from instagram_private_api import Client
from instagram_private_api.errors import ClientError
from ..instagram.settings import Settings

from ..scraper_abs import ScraperAbs

MEDIA_TYPES = {1: "image", 2: "video", 8: "album"}


class InstagramScraper(ScraperAbs):
    __PATH = os.path.dirname(os.path.abspath(__file__))

    def __init__(self, client, max_messages: int = 100, max_req_delay: int = 3, min_req_delay: int = 1, req_retries: int = 2, source: str = "instagram"):
        super().__init__(client, max_messages, max_req_delay,
                         min_req_delay, req_retries, source)

    @classmethod
    def init_client(cls, config: Optional[dict] = None):
        config = config or {}
        username = config.get("user_name")
        password = config.get("password")
        user_settings = config.get(
            "filename", os.path.join(cls.__PATH, f"{username}_settings.json"))

        try:
            if not os.path.isfile(user_settings):
                # settings file does not exist
                print('Unable to find file: {0!s}'.format(user_settings))

                # login new
                api = Client(
                    username, password,
                    on_login=lambda x: Settings.onlogin_callback(x, user_settings))
            else:
                with open(user_settings) as file_data:
                    cached_settings = json.load(
                        file_data, object_hook=Settings.from_json)
                print('instagram_scraper -- init_client() -- Reusing settings: {0!s}'.format(user_settings))

                # reuse auth settings
                api = Client(
                    username, password,
                    settings=cached_settings)

            return api
        except ClientError:
            print("%s_scraper -- init_client() -- try different credentials" %
                  "instagram")
            return None

    def client_logout(self):
        self._client.logout()

    def _parse_media(self, post_data: dict):
        caption = post_data.get('caption')
        if not caption:
            return None

        post_text = caption['text']
        media_type = MEDIA_TYPES.get(post_data['media_type'], str(post_data['media_type']))

        media_url = None
        if media_type == "video":
            media_url = post_data['video_versions'][0]['url']
        elif media_type == "image":
            media_url = post_data['image_versions2']['candidates'][0]['url']

        return self.text_input_obj(
            caption['user']['username'],
            post_text,
            str(post_data['pk']),
            self._source,
            media_url,
            media_type,
            hashtags=re.findall(r'(?<=#)\w+', post_text),
            post_link=post_data['code'],
            like_count=post_data.get('like_count', 0),
            comment_count=post_data.get('comment_count', 0),
        )

    def get_text_messages_by_keywords(self, keywords: Optional[list] = None) -> list:
        result = []

        for hash_tag in keywords or []:
            # One failing hashtag (rate limit, banned tag, unexpected payload) must not
            # stop the remaining ones from being scraped.
            try:
                response = self._client.tag_section(hash_tag, tab="recent")
                found = 0

                for section in response["sections"]:
                    if section["feed_type"] == "channel":
                        items = section['layout_content']['fill_items']
                    elif section["feed_type"] == 'media':
                        items = section['layout_content']['medias']
                    else:
                        print("%s -- get_text_messages_by_keywords() -- skipping unsupported feed_type %s" %
                              (self._source, str(section["feed_type"])))
                        continue

                    for item in items:
                        if len(result) >= self._max_messages:
                            break
                        post = self._parse_media(item['media'])
                        if post is not None:
                            result.append(post)
                            found += 1

                print("%s_scraper -- get_text_messages_by_keywords() -- found %s posts for hash_tag \"%s\"" %
                      (self._source, found, hash_tag))

            except Exception as e:
                print("%s_scraper -- get_text_messages_by_keywords() -- failed for hash_tag \"%s\" -- %s" %
                      (self._source, hash_tag, str(e)))
                traceback.print_exc()

            finally:
                self.delay_after_request()

        print("%s_scraper -- get_text_messages_by_keywords() found %s posts, in total" %
              (self._source, str(len(result))))
        return result
