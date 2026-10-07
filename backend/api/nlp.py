import os
import re

import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "data", "hate_speech_sgd.joblib")

# Must stay identical to preproc() in nlp/trainer.ipynb, or the features seen at
# inference time will not match the ones the model was trained on.
_CLEAN_RE = re.compile(r"(@[\w]+)|([^0-9A-Za-z \t])|(\w+:\/\/\S+)|^rt|http.+?")
_HASHTAG_RE = re.compile(r"#\w+\s?")


class HateSpeechClassifier:
    def __init__(self, model_path: str = MODEL_PATH):
        self.loaded_model = joblib.load(model_path)
        print("Model loaded")

    def preproc(self, text: str) -> str:
        text = text.lower()
        # Hashtags are removed before the generic cleanup so that the hashtags used to
        # find a post (e.g. #palestine) don't by themselves decide the prediction.
        text = _HASHTAG_RE.sub("", text)
        return _CLEAN_RE.sub("", text)

    def predict(self, text: str) -> int:
        text = self.preproc(text)
        return int(self.loaded_model.predict([text])[0])
