from django.shortcuts import render
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import CustomUser
from rest_framework.response import Response
from .serializers import UserRegistrationSerializers
from rest_framework.authtoken.models import Token
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
    permission_classes=[IsAuthenticated]
    def get(self,request):
        serializer=UserRegistrationSerializers(request.user)
        return Response(serializer.data)

    def patch(self,request):
        serializer=UserRegistrationSerializers(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class LogoutView(APIView):
    permission_classes=[IsAuthenticated] 
    def post(self,request):
        Token.objects.filter(user=request.user).delete()
        return Response({"message":"Logged out successfully"})
    


