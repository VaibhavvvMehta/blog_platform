from django.shortcuts import render
from rest_framework import generics
from rest_framework .views import APIView
from rest_framework .permissions import IsAuthenticated
from .models import CustomUser
from rest_framework.response import Response
from .serializers import UserRegistrationSerializers
# Create your views here. 
"""
API endpoints for the Posting the blog 
--Register the new USER 
--Only authenticated user can view his profile and logout his profile 
"""
class RegisterUser(generics.CreateAPIView):
    queryset=CustomUser.objects.all()
    serializer_class=UserRegistrationSerializers

class ProfileView(APIView):
    permission_class=[IsAuthenticated]
    def get(self,request):
        serializer=UserRegistrationSerializers(request.user)
        return Response(serializer.data)
    
class LogoutView(APIView):
    permission_class=[IsAuthenticated] 
    def post(self,request):
        request.user.auth_token.delete()
        return Response({"message":"Logged out successfully"})
    


