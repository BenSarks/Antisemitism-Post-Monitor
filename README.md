# Antisemitism Post Monitor 

A prototype pipeline that collects public Instagram posts from hashtag feeds, runs a text classifier over each post, and shows the results on a dashboard: totals, a weekly trend of flagged posts, a word cloud of hashtags, the users with the most flagged posts, and a list of flagged posts with links back to Instagram.

The long-term goal is to help detect antisemitic content. **The classifier currently included is a general hate-speech / offensive-language model, not an antisemitism-specific one.** Read [Limitations](#limitations) before drawing conclusions from the dashboard.

> **Note:** Because of its size, the trained model (`hate_speech_sgd.joblib`) isn't included in this repository. Train it yourself before running the API server; see [step 2 of Setup](#2-classifier-model).

![Dashboard overview](/demos/dashboard-overview.png)

![Flagged posts](/demos/dashboard-posts.png)

*Screenshots of the dashboard with sample data from April 2024. Usernames and post text are blurred.*

## Architecture

```
Instagram hashtag feeds
        │  backend/scraper        (instagram_private_api)
        ▼
POST /scraper  ──►  backend/api  (FastAPI + SQLAlchemy)
                      ├─ classify caption           (nlp.py, scikit-learn)
                      ├─ optional: OCR image text   (my_ocr.py, EasyOCR) → classify
                      └─ store in MySQL
        ▲
        │  GET /dashboard, /posts, /all_hashtags
frontend/dashboard  (React + MUI)
```

- **Scraper** (`backend/scraper`). Reads recent posts for a fixed list of hashtags and sends them to the API in one batch. Built on an abstract `ScraperAbs` base class so other platforms can be added.
- **API server** (`backend/api`). Classifies each post, skips posts it already stored, and keeps per-user, per-day and per-hashtag counts.
- **Classifier** (`nlp/trainer.ipynb`). A TF-IDF bag of words feeding a linear SVM (`SGDClassifier`), trained on an English hate-speech tweet corpus.
- **Dashboard** (`frontend/dashboard`). Refreshes every 10 seconds.

## Setup

Requirements: Python 3.12, Node 18+, and a MySQL server.

### 1. Database

```sql
CREATE DATABASE misinformation_antisemitism_post_identifier CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The API server creates the tables on startup.

### 2. Classifier model

The trained model isn't in the repository because of its size, so you have to train it once:

1. Get a labelled hate-speech tweet dataset and save it as `nlp/data/output_filtered.csv`, with the columns `tweet` (text) and `hate_speech_count` (0/1). See [The classifier](#the-classifier).
2. Install the training dependencies and run the notebook:

   ```bash
   cd nlp
   pip install -r requirements.txt
   jupyter notebook trainer.ipynb    # run all cells
   ```

3. The notebook saves the model to `backend/api/data/hate_speech_sgd.joblib`, which is where the API server looks for it.

Without this file the API server still starts, but `POST /scraper` fails the first time it tries to classify a post.

### 3. API server

```bash
cd backend/api
pip install -r requirements.txt

export DB_USER=...            # PowerShell: $env:DB_USER="..."
export DB_PASSWORD=...
export SCRAPER_API_KEY=...    # any long random string; the scraper must send the same value
python main.py                # http://127.0.0.1:8000, API docs at /docs
```

Optional settings:

| Variable | Default | Meaning |
|---|---|---|
| `DB_HOST` | `127.0.0.1:3306` | MySQL host and port |
| `DB_NAME` | `misinformation_antisemitism_post_identifier` | Database name |
| `DATABASE_URL` | – | Full SQLAlchemy URL; overrides the `DB_*` variables |
| `ENABLE_OCR` | `false` | Run OCR on post images (needs `pip install easyocr`) |
| `OCR_GPU` | `false` | Run EasyOCR on the GPU |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated origins allowed to call the API |
| `API_HOST` | `127.0.0.1` | Interface to listen on |

### 4. Scraper

```bash
cd backend/scraper
pip install -r requirements.txt

export INSTAGRAM_USERNAME=...
export INSTAGRAM_PASSWORD=...
export SCRAPER_API_KEY=...    # same value as the API server
python main.py                       # scrape the hashtags in KEYWORDS
python main.py --follow-trending     # also scrape the most frequent hashtags already in the database
```

The scraper stores the Instagram login session in `lib/instagram/<username>_settings.json`. That file is a credential, and `.gitignore` excludes it.

### 5. Dashboard

```bash
cd frontend/dashboard
npm install
npm start                     # http://localhost:3000
```

To point the dashboard at another server, set `REACT_APP_API_URL` (see `.env.example`).

### Tests

```bash
cd backend/api
pytest
```

The API tests use a temporary SQLite database and a stub classifier, so they don't need MySQL or Instagram.

## The classifier

- **Data.** `nlp/data/output_filtered.csv` has columns `tweet` and `hate_speech_count` (0/1), with about 719k rows. It's a general hate-speech and offensive-language tweet corpus and isn't redistributed in this repository.
- **Model.** `CountVectorizer` → `TfidfTransformer` → `SGDClassifier` (hinge loss).
- **Training.** Run `nlp/trainer.ipynb`. It writes `backend/api/data/hate_speech_sgd.joblib`. The trained model isn't included in the repository because of its size. The model file is a pickle, so it must be loaded with the scikit-learn version pinned in `requirements.txt`.
- **Evaluation.** The notebook splits the data before balancing the classes and resamples only the training split. It reports precision, recall, F1 and a confusion matrix on the untouched test set. An earlier version upsampled before splitting, so copies of the same tweets landed in both splits. It reported F1 = 81.9, which overstates real performance and shouldn't be quoted.

## Limitations

These limitations matter for interpreting anything the dashboard shows.

1. **The model doesn't detect antisemitism specifically.** It was trained on general hate-speech labels. It can't tell antisemitism apart from other insults or profanity, and it has never been evaluated on labelled antisemitic content. "Flagged" means "the hate-speech model fired", nothing more.
2. **There are false positives on political and religious speech.** The model flags benign posts. For example, *"I love my mom"*, *"hello world"* and *"prayers and love for palestine … we want the genocide to stop"* are all flagged. Every flagged post needs human review, and the counts on the dashboard aren't measurements of antisemitism.
3. **The hashtag selection biases the sample.** The default `KEYWORDS` are mostly Palestinian, Arab and Muslim hashtags. Run through an over-sensitive classifier, that sample will mostly surface posts from those communities, and the user rankings reflect the sampling, not the prevalence of antisemitism. A fair study needs a broader, documented sampling strategy and a comparison sample.
4. **The model is English only.** Preprocessing removes every character outside `A-Z`, `a-z` and `0-9`, so posts in Hebrew, Arabic and other scripts aren't analyzed. The original text is still stored and shown.
5. **The model is static.** It doesn't learn from new data. Retraining is a manual run of the notebook.
6. **Only Instagram is supported.** The scraper uses `instagram_private_api`, which is unmaintained, relies on Instagram's private API (against Instagram's terms of service), and may stop working at any time.
7. **OCR is off by default.** EasyOCR is slow without a GPU. When enabled, it reads only single images, not videos or albums.

## Future work

- Train and evaluate on an antisemitism-specific labelled dataset, ideally one that uses a published definition such as IHRA, and report per-class metrics.
- Replace the bag-of-words model with a multilingual transformer to cover Hebrew and Arabic.
- Document a sampling strategy and add a comparison set of hashtags.
- Add a human-review workflow for flagged posts and use the reviews as new training labels.
- Add more platforms through `ScraperAbs`.

## Libraries Used

- [FastAPI](https://github.com/tiangolo/fastapi)
- [SQLAlchemy](https://github.com/sqlalchemy/sqlalchemy)
- [Instagram Private API](https://github.com/ping/instagram_private_api)
- [easyocr](https://github.com/JaidedAI/EasyOCR)
- [scikit-learn](https://github.com/scikit-learn/scikit-learn)
- [MUI](https://github.com/mui/material-ui)
- [react-wordcloud](https://github.com/chrisrzhou/react-wordcloud)

## Authors

- [@Seadox](https://www.github.com/seadox)
- [@BenSarks](https://github.com/BenSarks)
