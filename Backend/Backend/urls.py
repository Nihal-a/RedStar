

from django.contrib import admin
from django.urls import path,include
from django.views.decorators.csrf import csrf_exempt
from graphene_file_upload.django import FileUploadGraphQLView
from django.conf import settings
from django.conf.urls.static import static
from graphql_jwt.decorators import jwt_cookie

urlpatterns = [ 
    path('admin/', admin.site.urls),
     path("", include("Redstar.urls")), 
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
