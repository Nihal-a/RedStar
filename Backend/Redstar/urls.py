from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from django.conf.urls.static import static
from django.conf import settings
from graphql_jwt.decorators import jwt_cookie
from graphene_file_upload.django import FileUploadGraphQLView

urlpatterns = [
    path("api/graphql/", jwt_cookie(csrf_exempt(FileUploadGraphQLView.as_view(graphiql=True)))),
] 
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
