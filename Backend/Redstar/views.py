# from django.http import JsonResponse
# from graphql_jwt.utils import jwt_encode, jwt_decode
# from graphql_jwt.exceptions import JSONWebTokenError

# def refresh_access_token(request):
#     refresh = request.COOKIES.get("refresh_token")
#     if not refresh:
#         return JsonResponse({"error": "No refresh token"}, status=401)

#     try:
#         # Decode the refresh token first (optional check)
#         payload = jwt_decode(refresh)

#         # Generate new access token
#         new_token = jwt_encode(payload)
#         return JsonResponse({"access_token": new_token})
#     except JSONWebTokenError:
#         return JsonResponse({"error": "Invalid refresh token"}, status=401)
