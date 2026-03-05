from django.shortcuts import render
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Comment
from .serializers import CommentSerializer
from django_filters.rest_framework import DjangoFilterBackend
# Create your views here.

class CommentViewSet(ModelViewSet):
    queryset=Comment.objects.all()
    serializer_class=CommentSerializer
    permission_classes=[IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["post"]

    def get_queryset(self):
        '''
        Getting top level comment and removing N+1 Query problem by using prefetch_related. 
        '''
        queryset=Comment.objects.filter(parent=None).prefetch_related("replies")
        post_id = self.request.query_params.get("post") 

        if post_id:
            queryset=queryset.filter(post_id=post_id) 

        
        return queryset

    def perform_create(self,serializer):
        serializer.save(author=self.request.user)

