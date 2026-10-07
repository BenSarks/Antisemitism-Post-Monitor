import os


class MyOCR:
    """Extracts text from post images. The EasyOCR model is loaded once, on first use."""

    _reader = None

    @classmethod
    def _get_reader(cls):
        if cls._reader is None:
            import easyocr  # imported lazily: it is heavy and only needed when OCR is enabled

            use_gpu = os.getenv("OCR_GPU", "false").lower() == "true"
            cls._reader = easyocr.Reader(["en"], gpu=use_gpu, verbose=False)
        return cls._reader

    @classmethod
    def get_text(cls, image_path_or_url: str) -> str:
        result = cls._get_reader().readtext(
            image_path_or_url, detail=0, paragraph=True, batch_size=5)
        return " ".join(result)
