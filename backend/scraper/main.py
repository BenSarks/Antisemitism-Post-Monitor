import argparse
import asyncio
import os
import sys

import httpx

from lib.instagram.api import InstagramScraper

API_URL = os.getenv("API_URL", "http://127.0.0.1:8000")
SCRAPER_API_KEY = os.getenv("SCRAPER_API_KEY", "")

# The hashtags to monitor. Which hashtags are scraped decides which communities end up
# on the dashboard, so this list is a research decision; see "Limitations" in the README.
KEYWORDS = ['savepalestine', 'palestine', 'freepalestine', 'savegaza',
            'palestina', 'gaza', 'alquds', 'islam', 'savepalestina', 'muslim',
            'freedom', 'savesheikhjarrah', 'gazaunderattack', 'prayforpalestine',
            'westbank', 'ramallah', 'occupation', 'arab']


async def send_to_server(posts):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{API_URL}/scraper", json=posts,
                                     headers={"X-API-Key": SCRAPER_API_KEY}, timeout=None)
        response.raise_for_status()
        print(f"Server: {response.json()}")


async def get_top_hashtags():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_URL}/top_hashtags", timeout=None)
        response.raise_for_status()
        return response.json()


def parse_args():
    parser = argparse.ArgumentParser(description="Scrape Instagram hashtag feeds and send the posts to the API server.")
    parser.add_argument("--follow-trending", action="store_true",
                        help="also scrape the most frequent hashtags already stored in the database")
    return parser.parse_args()


if __name__ == '__main__':
    args = parse_args()

    username = os.getenv("INSTAGRAM_USERNAME")
    password = os.getenv("INSTAGRAM_PASSWORD")
    if not username or not password or not SCRAPER_API_KEY:
        sys.exit("Set INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD and SCRAPER_API_KEY environment variables.")

    keywords = list(KEYWORDS)
    if args.follow_trending:
        trending = asyncio.run(get_top_hashtags())
        print(f"Top {len(trending)} Hashtags: {trending}")
        keywords += [h for h in trending if h not in keywords]

    instagram_scraper_client = InstagramScraper.init_client(
        config={"user_name": username, "password": password})
    if instagram_scraper_client is None:
        sys.exit("Instagram login failed.")

    instagram_scraper = InstagramScraper(instagram_scraper_client)

    posts = []
    for keyword in keywords:
        posts += instagram_scraper.get_text_messages_by_keywords([keyword])

    if len(posts) > 0:
        asyncio.run(send_to_server(posts))
