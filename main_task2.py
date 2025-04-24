import pyaudio
import wave
from transformers import (
    WhisperForConditionalGeneration,
    WhisperProcessor,
    MarianMTModel,
    MarianTokenizer,
)
import torch
import soundfile as sf
import librosa
import time
import pyttsx3  # Thêm thư viện TTS

# Khởi tạo các mô hình toàn cục để tái sử dụng
WHISPER_MODEL_PATH = r"C:\PROJECTS\S2T_model\PhoWhisper-small"
TRANSLATION_MODEL_PATH = r"C:\PROJECTS\S2T_model\opus-mt-vi-en"

# Tải mô hình PhoWhisper một lần duy nhất
print("Đang tải mô hình PhoWhisper từ local...")
whisper_processor = WhisperProcessor.from_pretrained(WHISPER_MODEL_PATH)
whisper_model = WhisperForConditionalGeneration.from_pretrained(WHISPER_MODEL_PATH)

# Tải mô hình dịch thuật một lần duy nhất
print("Đang tải mô hình dịch thuật từ local...")
translation_tokenizer = MarianTokenizer.from_pretrained(TRANSLATION_MODEL_PATH)
translation_model = MarianMTModel.from_pretrained(TRANSLATION_MODEL_PATH)

# Chuyển mô hình sang GPU nếu có
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
whisper_model = whisper_model.to(device)
translation_model = translation_model.to(device)
whisper_model.eval()  # Chuyển sang chế độ suy luận
translation_model.eval()


# Bước 1: Ghi âm trực tiếp
def record_audio(output_filename="recording.wav", record_seconds=5):
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000  # Giảm tần số lấy mẫu xuống 16kHz (đủ cho Whisper)

    audio = pyaudio.PyAudio()
    stream = audio.open(
        format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK
    )

    print("Đang ghi âm... Nhấn Ctrl+C để dừng (hoặc chờ hết thời gian).")
    frames = []

    try:
        for i in range(0, int(RATE / CHUNK * record_seconds)):
            data = stream.read(CHUNK)
            frames.append(data)
    except KeyboardInterrupt:
        print("\nĐã dừng ghi âm.")
    except Exception as e:
        print(f"Lỗi khi ghi âm: {e}")
        return None

    stream.stop_stream()
    stream.close()
    audio.terminate()

    with wave.open(output_filename, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(audio.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b"".join(frames))

    print(f"File âm thanh đã được lưu tạm thời: {output_filename}")
    return output_filename


# Bước 2: Speech-to-Text với PhoWhisper
def speech_to_text(audio_path):
    start_time = time.time()
    print("Đang chuyển giọng nói thành văn bản...")

    # Đọc file âm thanh bằng soundfile (nhanh hơn librosa)
    audio, sample_rate = sf.read(audio_path)
    if sample_rate != 16000:
        audio = librosa.resample(audio, orig_sr=sample_rate, target_sr=16000)

    # Chuyển đổi âm thanh thành input cho mô hình
    input_features = whisper_processor(
        audio, sampling_rate=16000, return_tensors="pt"
    ).input_features
    input_features = input_features.to(device)

    # Tạo văn bản với greedy decoding (nhanh hơn beam search)
    with torch.no_grad():
        predicted_ids = whisper_model.generate(
            input_features, language="vi", num_beams=1
        )
    text_vi = whisper_processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]

    print(f"Thời gian xử lý speech-to-text: {time.time() - start_time:.2f} giây")
    return text_vi


# Bước 3: Dịch từ tiếng Việt sang tiếng Anh
def translate_vi_to_en(text_vi):
    start_time = time.time()
    print("Đang dịch từ tiếng Việt sang tiếng Anh...")

    # Tokenize và dịch
    inputs = translation_tokenizer(
        text_vi, return_tensors="pt", padding=True, truncation=True
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        translated = translation_model.generate(**inputs)
    text_en = translation_tokenizer.decode(translated[0], skip_special_tokens=True)

    print(f"Thời gian xử lý dịch thuật: {time.time() - start_time:.2f} giây")
    return text_en


# Bước 4: Text-to-Speech với pyttsx3
def text_to_speech(text_en):
    start_time = time.time()
    print("Đang đọc văn bản tiếng Anh...")

    # Khởi tạo engine TTS
    engine = pyttsx3.init()
    engine.setProperty("rate", 150)  # Tốc độ đọc (words per minute)
    engine.setProperty("volume", 0.9)  # Âm lượng (0.0 đến 1.0)

    # Đọc văn bản
    engine.say(text_en)
    engine.runAndWait()

    print(f"Thời gian xử lý text-to-speech: {time.time() - start_time:.2f} giây")


# Pipeline chính
def main():
    # Ghi âm
    audio_file = record_audio(record_seconds=10)  # Ghi âm 10 giây
    if audio_file is None:
        print("Không thể ghi âm. Kiểm tra micro và thử lại.")
        return

    # Speech-to-Text
    try:
        text_vi = speech_to_text(audio_file)
        print("\n=== Kết quả ===")
        print("Văn bản tiếng Việt:", text_vi)
    except Exception as e:
        print(f"Lỗi khi chuyển giọng nói thành văn bản: {e}")
        return

    # Dịch thuật
    try:
        text_en = translate_vi_to_en(text_vi)
        print("Văn bản tiếng Anh:", text_en)
    except Exception as e:
        print(f"Lỗi khi dịch thuật: {e}")
        return

    # Text-to-Speech
    try:
        text_to_speech(text_en)
    except Exception as e:
        print(f"Lỗi khi đọc văn bản: {e}")
        return


if __name__ == "__main__":
    main()
