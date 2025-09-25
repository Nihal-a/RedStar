from django.urls import path
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from django.conf.urls.static import static
from django.conf import settings
from graphene_file_upload.django import FileUploadGraphQLView
from graphene_django.views import GraphQLView
from graphql_jwt.decorators import jwt_cookie
urlpatterns = [
    
    path("graphql/", jwt_cookie(csrf_exempt(GraphQLView.as_view(graphiql=True)))),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
