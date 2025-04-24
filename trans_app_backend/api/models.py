from django.db import models

class TranslationHistory(models.Model):
    input_text = models.TextField(blank=True)  # Văn bản đầu vào (có thể rỗng)
    translation = models.TextField(blank=True)  # Văn bản đã dịch (có thể rỗng)
    speech_url = models.URLField(blank=True, null=True)  # URL file MP3 (có thể null)
    created_at = models.DateTimeField(auto_now_add=True)  # Thời gian tạo

    def __str__(self):
        return f"{self.input_text} -> {self.translation}"

    class Meta:
        ordering = ['-created_at']  # Sắp xếp theo thời gian tạo (mới nhất trước)
        indexes = [models.Index(fields=['created_at'])]  # Index để tối ưu truy vấn