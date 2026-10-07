import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlp import MODEL_PATH, HateSpeechClassifier  # noqa: E402


pytestmark = pytest.mark.skipif(
    not os.path.isfile(MODEL_PATH), reason="trained model not found; run nlp/trainer.ipynb first")


@pytest.fixture(scope="module")
def nlp():
    return HateSpeechClassifier()


def test_preproc_removes_mentions_hashtags_urls_and_symbols(nlp):
    text = "RT @someone Check this https://t.co/abc #FreeTalk now!!"
    assert nlp.preproc(text).split() == ["check", "this", "now"]


def test_preproc_drops_non_ascii(nlp):
    assert nlp.preproc("שלום hello").strip() == "hello"


def test_model_loads_and_predicts_binary(nlp):
    assert nlp.predict("have a lovely day") in (0, 1)
    assert isinstance(nlp.predict(""), int)
