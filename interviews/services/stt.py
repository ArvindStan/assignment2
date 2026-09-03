import os
import tempfile
from functools import lru_cache

from django.conf import settings
from faster_whisper import WhisperModel


class SpeechToTextService:
    """
    Local speech-to-text service using faster-whisper.

    Audio is processed locally. No external speech-to-text API is used.
    """

    def __init__(self):
        self.model_size = getattr(
            settings,
            "STT_MODEL",
            "base",
        )

        self.device = getattr(
            settings,
            "STT_DEVICE",
            "cpu",
        )

        self.compute_type = getattr(
            settings,
            "STT_COMPUTE_TYPE",
            "int8",
        )

        self.language = getattr(
            settings,
            "STT_LANGUAGE",
            None,
        )

    @staticmethod
    @lru_cache(maxsize=1)
    def _load_model(model_size, device, compute_type):
        """
        Load the Whisper model once and reuse it.
        """

        return WhisperModel(
            model_size,
            device=device,
            compute_type=compute_type,
        )

    def transcribe(self, audio_file):
        """
        Convert an uploaded audio file into an actual transcript.
        """

        if not audio_file:
            raise ValueError("audio_file is required")

        model = self._load_model(
            self.model_size,
            self.device,
            self.compute_type,
        )

        temporary_path = None

        try:
            suffix = self._get_file_suffix(audio_file)

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=suffix,
            ) as temporary_file:

                for chunk in audio_file.chunks():
                    temporary_file.write(chunk)

                temporary_path = temporary_file.name

            segments, _info = model.transcribe(
                temporary_path,
                language=self.language,
                vad_filter=True,
            )

            transcript = " ".join(
                segment.text.strip()
                for segment in segments
                if segment.text.strip()
            ).strip()

            if not transcript:
                raise ValueError(
                    "No speech could be detected in the uploaded audio."
                )

            return transcript

        finally:
            if temporary_path and os.path.exists(temporary_path):
                os.remove(temporary_path)

    @staticmethod
    def _get_file_suffix(audio_file):
        """
        Preserve the uploaded audio extension when possible.

        Browser recordings are commonly uploaded as WebM/Opus.
        """

        name = getattr(audio_file, "name", "") or ""

        _, extension = os.path.splitext(name)

        if extension:
            return extension

        content_type = getattr(
            audio_file,
            "content_type",
            "",
        ) or ""

        content_type_map = {
            "audio/webm": ".webm",
            "audio/ogg": ".ogg",
            "audio/wav": ".wav",
            "audio/x-wav": ".wav",
            "audio/mpeg": ".mp3",
            "audio/mp4": ".m4a",
            "audio/x-m4a": ".m4a",
        }

        return content_type_map.get(
            content_type,
            ".webm",
        )