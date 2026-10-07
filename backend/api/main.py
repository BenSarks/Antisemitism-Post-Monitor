import os
import secrets
from datetime import date, datetime, timedelta
from typing import Optional

import uvicorn
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import (Boolean, Column, Date, DateTime, ForeignKey, Integer, String,
                        create_engine, desc, func, or_)
from sqlalchemy.orm import Session, declarative_base, relationship, sessionmaker

from my_ocr import MyOCR
from nlp import HateSpeechClassifier


def _default_database_url() -> str:
    user = os.getenv("DB_USER", "")
    password = os.getenv("DB_PASSWORD", "")
    host = os.getenv("DB_HOST", "127.0.0.1:3306")
    name = os.getenv("DB_NAME", "misinformation_antisemitism_post_identifier")
    return f"mysql+pymysql://{user}:{password}@{host}/{name}?charset=utf8mb4"


DATABASE_URL = os.getenv("DATABASE_URL") or _default_database_url()
SCRAPER_API_KEY = os.getenv("SCRAPER_API_KEY", "")
ENABLE_OCR = os.getenv("ENABLE_OCR", "false").lower() == "true"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

engine = create_engine(DATABASE_URL, echo=os.getenv("SQL_ECHO", "false").lower() == "true")
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Column lengths, kept in one place so inserts can be truncated to fit.
OCR_TEXT_MAX = 255
TITLE_TEXT_MAX = 2200
HASHTAG_MAX = 255
TABLE_ARGS = {"mysql_charset": "utf8mb4"}

app = FastAPI(title="Antisemitism Post Monitor API")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class Data(BaseModel):
    post_author: str
    post_text: str
    post_id: str
    source: str
    extra_data_link: Optional[str] = None
    media_type: Optional[str] = None
    hashtags: list[str] = []
    like_count: int = 0
    comment_count: int = 0
    post_link: str


class Info(BaseModel):
    total_posts: int
    flagged_posts: int


class User(Base):
    __tablename__ = "users"
    __table_args__ = TABLE_ARGS
    id = Column(Integer, primary_key=True, unique=True, nullable=False)
    name = Column(String(255), unique=True, nullable=False)
    social_platform = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False)
    is_verified = Column(Boolean, nullable=False)
    processed_posts = Column(Integer, nullable=False)
    # Kept under its original name for compatibility with existing databases;
    # it counts posts flagged by the classifier.
    antisemitic_posts = Column(Integer, nullable=False)
    posts = relationship("Posts", back_populates="user")

    def __init__(self, name, social_platform):
        self.name = name
        self.social_platform = social_platform
        self.is_active = True
        self.is_verified = False
        self.processed_posts = 0
        self.antisemitic_posts = 0

    def __repr__(self):
        return f"<User(user_name='{self.name}', social_platform='{self.social_platform}', is_active={self.is_active})>"


class Hashtags(Base):
    __tablename__ = "Hashtags"
    __table_args__ = TABLE_ARGS
    id = Column(Integer, primary_key=True, unique=True, nullable=False)
    text = Column(String(HASHTAG_MAX), unique=True, nullable=False)
    count = Column(Integer, nullable=False)

    def __init__(self, text):
        self.text = text
        self.count = 0

    def __repr__(self):
        return f"<Hashtags(hashtag='{self.text}', count='{self.count}')>"


class Posts(Base):
    __tablename__ = "posts"
    __table_args__ = TABLE_ARGS
    id = Column(String(255), primary_key=True, unique=True)
    code = Column(String(255), nullable=False)
    comment_count = Column(Integer, nullable=False)
    media_type = Column(String(255), nullable=False)
    media_url = Column(String(510), nullable=True)
    title_text = Column(String(TITLE_TEXT_MAX))
    like_count = Column(Integer, nullable=False)
    user_name = Column(String(255), ForeignKey('users.name'), nullable=False)
    # Classifier result for the text extracted from the image by OCR (0/1, NULL if not run).
    nlp_description = Column(Integer)
    # Classifier result for the post caption (0/1).
    nlp_content = Column(Integer)
    ocr_text = Column(String(OCR_TEXT_MAX))
    timestamp = Column(DateTime, default=datetime.now, nullable=False)

    user = relationship("User", back_populates="posts")

    def __repr__(self):
        return f"<Post(id={self.id}, user_name='{self.user_name}')>"


class DailyReports(Base):
    __tablename__ = "daily_reports"
    __table_args__ = TABLE_ARGS
    date = Column(Date, primary_key=True)
    total_posts = Column(Integer)
    antisemitic_posts = Column(Integer)

    def __init__(self, date, total_posts=0, antisemitic_posts=0):
        self.date = date
        self.total_posts = total_posts
        self.antisemitic_posts = antisemitic_posts


Base.metadata.create_all(engine)

FLAGGED = or_(Posts.nlp_content == 1, Posts.nlp_description == 1)


def get_db():
    with SessionLocal() as session:
        yield session


_classifier = None


def get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = HateSpeechClassifier()
    return _classifier


def get_ocr():
    return MyOCR.get_text if ENABLE_OCR else None


def require_api_key(x_api_key: str = Header(default="")):
    if not SCRAPER_API_KEY:
        raise HTTPException(status_code=503, detail="SCRAPER_API_KEY is not configured on the server")
    if not secrets.compare_digest(x_api_key, SCRAPER_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid API key")


def get_or_create(session: Session, model, **filters):
    instance = session.query(model).filter_by(**filters).first()
    if instance is None:
        instance = model(**filters)
        session.add(instance)
    return instance


def record_user(session: Session, username: str, social_platform: str, flagged: bool):
    user = session.query(User).filter(User.name == username).first()
    if user is None:
        user = User(name=username, social_platform=social_platform)
        session.add(user)
    user.processed_posts += 1
    if flagged:
        user.antisemitic_posts += 1


def record_hashtags(session: Session, hashtags: list[str]):
    # Lowercased and de-duplicated: MySQL's default collation treats "Gaza" and "gaza"
    # as the same unique value, and a repeated hashtag would insert the same row twice.
    for text in {h.lower()[:HASHTAG_MAX] for h in hashtags if h}:
        hashtag = get_or_create(session, Hashtags, text=text)
        hashtag.count += 1


def record_daily_report(session: Session, day: date, flagged: bool):
    report = get_or_create(session, DailyReports, date=day)
    report.total_posts = (report.total_posts or 0) + 1
    if flagged:
        report.antisemitic_posts = (report.antisemitic_posts or 0) + 1


def classify(text: Optional[str], classifier) -> Optional[int]:
    if not text:
        return None
    try:
        return classifier.predict(text)
    except Exception as e:
        print(f"Error: classification failed: {e}")
        return None


@app.post("/scraper", dependencies=[Depends(require_api_key)])
def add_post(data: list[Data], session: Session = Depends(get_db),
             classifier=Depends(get_classifier), ocr=Depends(get_ocr)):
    added, skipped, failed = 0, 0, 0

    for post in data:
        # Re-running the scraper returns posts we already stored; counting them again
        # would inflate every statistic on the dashboard.
        if session.get(Posts, post.post_id) is not None:
            skipped += 1
            continue

        ocr_text = None
        if ocr is not None and post.media_type == "image" and post.extra_data_link:
            try:
                ocr_text = ocr(post.extra_data_link)[:OCR_TEXT_MAX] or None
            except Exception as e:
                print(f"Error: OCR failed for post {post.post_id}: {e}")

        caption_result = classify(post.post_text, classifier)
        ocr_result = classify(ocr_text, classifier)
        flagged = bool(caption_result) or bool(ocr_result)

        try:
            record_user(session, post.post_author, post.source, flagged)
            new_post = Posts(
                id=post.post_id,
                comment_count=post.comment_count,
                media_type=post.media_type or "unknown",
                media_url=post.extra_data_link,
                title_text=post.post_text[:TITLE_TEXT_MAX],
                like_count=post.like_count,
                code=post.post_link,
                user_name=post.post_author,
                nlp_description=ocr_result,
                nlp_content=caption_result or 0,
                ocr_text=ocr_text,
                timestamp=datetime.now(),
            )
            session.add(new_post)
            record_daily_report(session, new_post.timestamp.date(), flagged)
            record_hashtags(session, post.hashtags)
            session.commit()
            added += 1
        except Exception as e:
            session.rollback()
            failed += 1
            print(f"Error: could not store post {post.post_id}: {e}")

    return {"added": added, "skipped_duplicates": skipped, "failed": failed}


def get_top_users(session: Session, limit: int = 7):
    users = session.query(User).order_by(
        desc(User.antisemitic_posts), desc(User.processed_posts)).limit(limit).all()
    return [
        {
            "name": u.name,
            "social_platform": u.social_platform,
            "processed_posts": u.processed_posts,
            "flagged_posts": u.antisemitic_posts,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
        }
        for u in users
    ]


def get_total_posts_numbers(session: Session) -> Info:
    total_posts = session.query(func.count(Posts.id)).scalar() or 0
    flagged_posts = session.query(func.count(Posts.id)).filter(FLAGGED).scalar() or 0
    return Info(total_posts=total_posts, flagged_posts=flagged_posts)


def get_weekly_report(session: Session, today: Optional[date] = None, days: int = 7):
    today = today or date.today()
    first_day = today - timedelta(days=days - 1)
    reports = session.query(DailyReports).filter(DailyReports.date >= first_day,
                                                 DailyReports.date <= today).all()
    flagged_by_day = {r.date: r.antisemitic_posts or 0 for r in reports}

    dates, instagram = [], []
    for offset in range(days):
        day = first_day + timedelta(days=offset)
        dates.append(day.strftime("%d-%m-%Y"))
        instagram.append(flagged_by_day.get(day, 0))

    return {"dates": dates, "instagram": instagram}


@app.get("/all_hashtags")
def get_all_hashtags(limit: int = 150, session: Session = Depends(get_db)):
    hashtags = session.query(Hashtags).order_by(desc(Hashtags.count)).limit(limit).all()
    return [{"text": h.text, "value": h.count} for h in hashtags]


@app.get("/posts")
def get_posts(limit: int = 50, session: Session = Depends(get_db)):
    posts = session.query(Posts).filter(FLAGGED).order_by(
        desc(Posts.timestamp)).limit(limit).all()
    return [
        {
            "id": p.id,
            "code": p.code,
            "title_text": p.title_text,
            "ocr_text": p.ocr_text,
            "like_count": p.like_count,
            "comment_count": p.comment_count,
            "user_name": p.user_name,
            "timestamp": p.timestamp,
        }
        for p in posts
    ]


@app.get("/top_hashtags")
def get_top_hashtags(limit: int = 5, session: Session = Depends(get_db)):
    hashtags = session.query(Hashtags).order_by(desc(Hashtags.count)).limit(limit).all()
    return [h.text for h in hashtags]


@app.get("/dashboard")
def dashboard(session: Session = Depends(get_db)):
    return {
        "weekly_report": get_weekly_report(session),
        "total_posts_number": get_total_posts_numbers(session),
        "top_users": get_top_users(session),
    }


@app.get("/")
def root():
    return {"status": "running"}


if __name__ == "__main__":
    uvicorn.run("main:app", host=os.getenv("API_HOST", "127.0.0.1"), port=8000, reload=True)
