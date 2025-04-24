from django.urls import path
from .views import TranscribeView, TranslateView, TTSView, PingView

urlpatterns = [
    path('v1/transcribe/', TranscribeView.as_view(), name='transcribe'),
    path('v1/translate/', TranslateView.as_view(), name='translate'),
    path('v1/tts/', TTSView.as_view(), name='tts'),
    path('v1/ping/', PingView.as_view(), name='ping'),
]