import os
from pathlib import Path
from dotenv import load_dotenv
import socket
import requests
import time
from urllib.parse import urlparse
import firebase_admin
from firebase_admin import credentials, db

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Khởi tạo Firebase với xử lý lỗi
firebase_initialized = False
try:
    cred_path = BASE_DIR / 'transapp-firebase-adminsdk.json'
    if not cred_path.exists():
        raise FileNotFoundError(f"Firebase credentials file not found at {cred_path}")
    
    with open(cred_path, 'r') as f:
        if not f.read().strip():
            raise ValueError(f"Firebase credentials file is empty at {cred_path}")
    
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://transapp-f4ceb-default-rtdb.firebaseio.com/'
    })
    firebase_initialized = True
    print("Firebase initialized successfully")
except Exception as e:
    print(f"Failed to initialize Firebase: {str(e)}")
    # Tiếp tục chạy backend, nhưng không lưu URL vào Firebase

# Function to get local IP
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # Connect to Google DNS to get IP
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

# Function to get ngrok public URL with retry mechanism
def get_ngrok_url(max_retries=5, delay=2):
    for attempt in range(max_retries):
        try:
            response = requests.get("http://localhost:4040/api/tunnels")
            response.raise_for_status()  # Kiểm tra lỗi HTTP
            tunnels = response.json().get("tunnels", [])
            for tunnel in tunnels:
                if tunnel.get("proto") == "https":
                    public_url = tunnel.get("public_url")
                    return public_url  # Trả về full URL (bao gồm https://)
        except (requests.RequestException, ValueError) as e:
            print(f"Không thể lấy ngrok URL (lần thử {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(delay)  # Chờ trước khi thử lại
    return None

# Get local IP and ngrok URL
LOCAL_IP = get_local_ip()
NGROK_URL = get_ngrok_url()

# Dùng NGROK_URL từ hàm get_ngrok_url()
BASE_URL = NGROK_URL if NGROK_URL else f"http://{LOCAL_IP}:8000"

# Lưu BASE_URL vào Firebase nếu Firebase được khởi tạo
if BASE_URL and firebase_initialized:
    try:
        ref = db.reference('api_url')
        ref.set(BASE_URL)
        print(f"Stored BASE_URL in Firebase: {BASE_URL}")
    except Exception as e:
        print(f"Failed to store BASE_URL in Firebase: {str(e)}")
else:
    print("Skipping Firebase storage: Firebase not initialized or BASE_URL not available")

# Quick-start development settings
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'your-secret-key-here')
DEBUG = os.getenv('DJANGO_DEBUG', 'False') == 'True'

# Set ALLOWED_HOSTS dynamically
default_hosts = ['127.0.0.1', 'localhost', '0.0.0.0', LOCAL_IP]
NGROK_HOST = urlparse(BASE_URL).netloc if BASE_URL.startswith('https') else None
if NGROK_HOST:
    default_hosts.append(NGROK_HOST)
    print(f"Đã thêm ngrok host vào ALLOWED_HOSTS: {NGROK_HOST}")
else:
    print("Không tìm thấy ngrok host, sử dụng default ALLOWED_HOSTS")
ALLOWED_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS', ','.join(default_hosts)).split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
    'drf_yasg',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS Configuration for Development
CORS_ALLOW_ALL_ORIGINS = True
if not CORS_ALLOW_ALL_ORIGINS:
    default_origins = [
        'http://localhost:19006',
        f'exp://{LOCAL_IP}:19000',
        'http://localhost:8000',
    ]
    if NGROK_HOST:
        default_origins.append(f"https://{NGROK_HOST}")
    CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', ','.join(default_origins)).split(',')
else:
    CORS_ALLOWED_ORIGINS = []

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Security Settings (Development)
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False') == 'True'
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = "trans_app.wsgi.application"

# Database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

ROOT_URLCONF = 'trans_app.urls'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # Cho phép trong development
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '1000/day',  # Tăng giới hạn cho development
        'user': '5000/day'
    }
}