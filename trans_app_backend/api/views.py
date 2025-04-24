from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from gtts import gTTS
import os
from pathlib import Path
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from transformers import MarianMTModel, MarianTokenizer
import soundfile as sf
import torch
import uuid
import logging
import pydub
from django.core.exceptions import ValidationError
from django.conf import settings

logger = logging.getLogger(__name__)

# Load PhoWhisper model
class PhoWhisper:
    def __init__(self):
        self.model_name = "models/PhoWhisper-small"
        try:
            self.processor = WhisperProcessor.from_pretrained(self.model_name)
            self.model = WhisperForConditionalGeneration.from_pretrained(self.model_name)
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model.to(self.device)
            self.model.eval()
            logger.info("PhoWhisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load PhoWhisper model: {str(e)}")
            raise

    def transcribe(self, audio_path):
        try:
            audio, sample_rate = sf.read(audio_path)
            inputs = self.processor(audio, sampling_rate=sample_rate, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            with torch.no_grad():
                generated_ids = self.model.generate(inputs["input_features"], language="vi")
            transcription = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            return transcription
        except Exception as e:
            logger.error(f"Error during transcription: {str(e)}")
            raise

# Load mô hình dịch
class TranslationModel:
    def __init__(self):
        self.model_name = "models/opus-mt-vi-en"
        try:
            self.tokenizer = MarianTokenizer.from_pretrained(self.model_name)
            self.model = MarianMTModel.from_pretrained(self.model_name)
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model.to(self.device)
            self.model.eval()
            logger.info("Translation model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Translation model: {str(e)}")
            raise

    def translate(self, text):
        try:
            inputs = self.tokenizer(text, return_tensors="pt", padding=True)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            with torch.no_grad():
                translated = self.model.generate(**inputs)
            translation = self.tokenizer.decode(translated[0], skip_special_tokens=True)
            return translation
        except Exception as e:
            logger.error(f"Error during translation: {str(e)}")
            raise

# Khởi tạo các mô hình (dùng try-except để xử lý lỗi khởi tạo)
try:
    phowhisper = PhoWhisper()
    translator = TranslationModel()
except Exception as e:
    logger.critical(f"Failed to initialize models: {str(e)}")
    raise

class TranscribeView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        """
        Transcribe audio file to text using PhoWhisper model.
        ---
        parameters:
          - name: audio
            in: formData
            type: file
            required: true
            description: Audio file in WAV format (max 10MB)
        responses:
          200:
            description: Transcription successful
            schema:
              type: object
              properties:
                transcription:
                  type: string
                  description: Transcribed text
          400:
            description: Bad request (e.g., invalid file, file too large)
        """
        try:
            # Kiểm tra file âm thanh
            if 'audio' not in request.FILES:
                return Response({'error': 'No audio file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            audio_file = request.FILES['audio']
            if audio_file.size > 10 * 1024 * 1024:  # 10MB
                return Response({'error': 'File too large, maximum size is 10MB'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Kiểm tra định dạng file
            if not audio_file.name.lower().endswith('.wav'):
                return Response({'error': 'Only WAV files are supported'}, status=status.HTTP_400_BAD_REQUEST)

            # Lưu file tạm
            temp_dir = Path('media/temp_audio')
            temp_dir.mkdir(parents=True, exist_ok=True)
            temp_path = temp_dir / 'audio.wav'
            
            try:
                with open(temp_path, 'wb') as f:
                    for chunk in audio_file.chunks():
                        f.write(chunk)
                
                # Chuẩn hóa file âm thanh
                audio = pydub.AudioSegment.from_file(temp_path)
                audio = audio.set_channels(1).set_frame_rate(16000).set_sample_width(2)  # Mono, 16kHz, 16-bit
                audio.export(temp_path, format='wav')

                logger.info(f"Processing audio file: {temp_path}")
                transcription = phowhisper.transcribe(temp_path)
                logger.info(f"Transcription completed: {transcription}")
                return Response({'transcription': transcription})
            finally:
                # Đảm bảo xóa file tạm ngay cả khi có lỗi
                if temp_path.exists():
                    os.remove(temp_path)
                    logger.debug(f"Temporary file removed: {temp_path}")
        except pydub.exceptions.PydubException as e:
            logger.error(f"Error processing audio file with pydub: {str(e)}")
            return Response({'error': 'Invalid audio file format'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error in TranscribeView: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TranslateView(APIView):
    def post(self, request):
        """
        Translate text from Vietnamese to English using MarianMT model.
        ---
        parameters:
          - name: text
            in: body
            type: string
            required: true
            description: Text to translate (Vietnamese)
        responses:
          200:
            description: Translation successful
            schema:
              type: object
              properties:
                translation:
                  type: string
                  description: Translated text (English)
          400:
            description: Bad request (e.g., missing text)
        """
        try:
            text = request.data.get('text')
            if not text or not isinstance(text, str) or text.strip() == "":
                return Response({'error': 'Text is required and cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            
            logger.info(f"Translating text: {text}")
            translation = translator.translate(text)
            logger.info(f"Translation completed: {translation}")
            return Response({'translation': translation})
        except Exception as e:
            logger.error(f"Error in TranslateView: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TTSView(APIView):
    def post(self, request):
        """
        Convert text to speech using gTTS (Google Text-to-Speech).
        ---
        parameters:
          - name: text
            in: body
            type: string
            required: true
            description: Text to convert to speech (English)
        responses:
          200:
            description: TTS successful
            schema:
              type: object
              properties:
                url:
                  type: string
                  description: URL to the generated audio file (MP3)
          400:
            description: Bad request (e.g., missing text)
        """
        try:
            text = request.data.get('text')
            if not text or not isinstance(text, str) or text.strip() == "":
                return Response({'error': 'Text is required and cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            
            tts_dir = Path('media/tts')
            tts_dir.mkdir(parents=True, exist_ok=True)
            filename = f"{uuid.uuid4()}.mp3"
            file_path = tts_dir / filename
            
            try:
                tts = gTTS(text=text, lang='en')
                tts.save(file_path)
                url = f"{settings.BASE_URL}/media/tts/{filename}"  # Dùng BASE_URL
                logger.info(f"TTS file created: {url}")
                return Response({'url': url})
            except Exception as e:
                logger.error(f"Error generating TTS: {str(e)}")
                if file_path.exists():
                    os.remove(file_path)
                    logger.debug(f"Temporary TTS file removed: {file_path}")
                raise
        except Exception as e:
            logger.error(f"Error in TTSView: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PingView(APIView):
    def get(self, request):
        """
        Check if the API server is running.
        ---
        responses:
          200:
            description: Server is running
            schema:
              type: object
              properties:
                status:
                  type: string
                  description: Server status
        """
        return Response({'status': 'ok'})