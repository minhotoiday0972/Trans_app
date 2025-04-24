from django.urls import path, include
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Hàm trả về phản hồi đơn giản cho trang chủ
def home(request):
    return HttpResponse("Welcome to Trans App!")

# Hàm trả về phản hồi cho trang about
def about(request):
    return HttpResponse("About Trans App")

# Cấu hình Swagger UI
schema_view = get_schema_view(
    openapi.Info(
        title="TransApp API",
        default_version='v1',
        description="API for TransApp (transcribe and TTS)",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@transapp.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('', home, name='home'),  # Trang chủ
    path('about/', about, name='about'),  # Trang about
    path('admin/', admin.site.urls),  # Trang admin
    path('api/', include('api.urls')),  # Các đường dẫn API
    # Thêm các endpoint cho Swagger UI và Redoc
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)