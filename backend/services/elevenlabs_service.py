import os
import requests

class ElevenLabsService:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("ELEVENLABS_API_KEY")
        self.base_url = "https://api.elevenlabs.io/v1/text-to-speech"

    def synthesize(self, text, voice_id):
        url = f"{self.base_url}/{voice_id}"
        response = requests.post(
            url,
            headers={
                "xi-api-key": self.api_key,
                "Content-Type": "application/json"
            },
            json={
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.75,
                    "similarity_boost": 0.85
                }
            }
        )
        if response.status_code == 200:
            return response.content  # MP3 bytes
        else:
            raise Exception(f"ElevenLabs error: {response.text}")

elevenlabs_service = ElevenLabsService() 