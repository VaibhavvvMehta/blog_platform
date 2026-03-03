from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Tag
from .serializers import TagSerializer
# Create your views here.

class TagViewSet(ModelViewSet):
    '''
    Handling CRUD for Tags
    '''
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
