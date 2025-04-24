from rest_framework import serializers
from .models import History

class TranslationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = History
        fields = ['id', 'input_text', 'translation', 'speech_url', 'created_at']