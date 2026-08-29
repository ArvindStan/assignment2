class SpeechToTextService:
    """
    Speech-to-text abstraction.

    The current implementation is a deterministic local stub.
    A production implementation can replace this with Whisper,
    OpenAI transcription, or another speech-to-text provider.
    """

    def transcribe(self, audio_file):
        """
        Convert an uploaded audio file into a transcript.

        The local implementation returns a deterministic transcript
        so the application can be tested without an external service.
        """

        if not audio_file:
            raise ValueError("audio_file is required")

        return (
            "Audio response received successfully. "
            "Speech-to-text processing is represented by the "
            "local transcription service."
        )