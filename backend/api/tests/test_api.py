import os
import sys
import tempfile
from datetime import date, timedelta

import pytest

# Configure the app for an isolated SQLite database before it is imported.
_db_dir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_db_dir, 'test.db')}"
os.environ["SCRAPER_API_KEY"] = "test-key"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402

AUTH = {"X-API-Key": "test-key"}


class FakeClassifier:
    """Flags any text containing the word 'hate'."""

    def predict(self, text):
        return int("hate" in text.lower())


@pytest.fixture
def client():
    main.Base.metadata.drop_all(main.engine)
    main.Base.metadata.create_all(main.engine)
    main.app.dependency_overrides[main.get_classifier] = lambda: FakeClassifier()
    main.app.dependency_overrides[main.get_ocr] = lambda: None
    yield TestClient(main.app)
    main.app.dependency_overrides.clear()


def make_post(post_id, author="alice", text="hello world", hashtags=None, **extra):
    post = {
        "post_author": author,
        "post_text": text,
        "post_id": post_id,
        "source": "instagram",
        "media_type": "image",
        "extra_data_link": f"http://img/{post_id}.jpg",
        "hashtags": hashtags or [],
        "like_count": "3",
        "comment_count": "1",
        "post_link": f"code{post_id}",
    }
    post.update(extra)
    return post


def test_root(client):
    assert client.get("/").json() == {"status": "running"}


def test_scraper_requires_api_key(client):
    assert client.post("/scraper", json=[make_post("1")]).status_code == 401
    assert client.post("/scraper", json=[make_post("1")],
                       headers={"X-API-Key": "wrong"}).status_code == 401


def test_ingest_counts_and_flagged_posts(client):
    res = client.post("/scraper", headers=AUTH, json=[
        make_post("1", text="a nice day"),
        make_post("2", text="full of hate"),
        make_post("3", author="bob", text="more hate here"),
    ])
    assert res.json() == {"added": 3, "skipped_duplicates": 0, "failed": 0}

    totals = client.get("/dashboard").json()["total_posts_number"]
    assert totals == {"total_posts": 3, "flagged_posts": 2}

    posts = client.get("/posts").json()
    assert {p["id"] for p in posts} == {"2", "3"}


def test_duplicate_posts_do_not_inflate_counts(client):
    batch = [make_post("1", text="hate"), make_post("2")]
    client.post("/scraper", headers=AUTH, json=batch)
    res = client.post("/scraper", headers=AUTH, json=batch)
    assert res.json() == {"added": 0, "skipped_duplicates": 2, "failed": 0}

    users = client.get("/dashboard").json()["top_users"]
    assert users == [{
        "name": "alice", "social_platform": "instagram", "processed_posts": 2,
        "flagged_posts": 1, "is_active": True, "is_verified": False,
    }]
    assert client.get("/dashboard").json()["weekly_report"]["instagram"][-1] == 1


def test_top_users_are_ranked_before_limiting(client):
    posts = [make_post(f"quiet{i}", author=f"quiet{i}") for i in range(10)]
    posts += [make_post(f"loud{i}", author="loud", text="hate") for i in range(3)]
    client.post("/scraper", headers=AUTH, json=posts)

    users = client.get("/dashboard").json()["top_users"]
    assert len(users) == 7
    assert users[0]["name"] == "loud"
    assert users[0]["flagged_posts"] == 3


def test_weekly_report_fills_missing_days(client):
    with main.SessionLocal() as session:
        today = date.today()
        session.add(main.DailyReports(today - timedelta(days=3), 5, 2))
        session.add(main.DailyReports(today - timedelta(days=30), 9, 9))  # outside the window
        session.commit()

    report = client.get("/dashboard").json()["weekly_report"]
    assert len(report["dates"]) == 7
    assert report["dates"][-1] == today.strftime("%d-%m-%Y")
    assert report["instagram"] == [0, 0, 0, 2, 0, 0, 0]


def test_hashtags_are_case_insensitive_and_deduplicated(client):
    client.post("/scraper", headers=AUTH, json=[
        make_post("1", hashtags=["Gaza", "gaza", "news"]),
        make_post("2", hashtags=["GAZA"]),
    ])
    hashtags = {h["text"]: h["value"] for h in client.get("/all_hashtags").json()}
    assert hashtags == {"gaza": 2, "news": 1}
    assert client.get("/top_hashtags?limit=1").json() == ["gaza"]


def test_ocr_text_is_classified(client):
    main.app.dependency_overrides[main.get_ocr] = lambda: (lambda url: "hate in the image")
    client.post("/scraper", headers=AUTH, json=[make_post("1", text="innocent caption")])

    posts = client.get("/posts").json()
    assert len(posts) == 1
    assert posts[0]["ocr_text"] == "hate in the image"


def test_ocr_failure_does_not_drop_post(client):
    def broken_ocr(url):
        raise RuntimeError("download failed")

    main.app.dependency_overrides[main.get_ocr] = lambda: broken_ocr
    res = client.post("/scraper", headers=AUTH, json=[make_post("1")])
    assert res.json()["added"] == 1
