from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.filters import SearchFilter
from .models import Post
from .permissions import IsAuthorOrReadOnly
from .serializers import PostSerializer
from django.db.models import Q
# Create your views here.

class PostViewSet(ModelViewSet):
    '''
    Post CRUD
    --Anyone can read anyone posts
    --only authenticated user can edit or delete their posts
    ''' 
    queryset=Post.objects.all()
    serializer_class=PostSerializer
    
    
    ##This is for using slug in url . 
    #lookup_field="slug"
    
    permission_classes=[IsAuthenticatedOrReadOnly,IsAuthorOrReadOnly] 

    filter_backends=[DjangoFilterBackend,SearchFilter]
    filterset_fields = ["tags__slug"]
    search_fields = ["title"]

    def perform_create(self, serializer): 
        '''
        Defines the login user as the author automatically 
        '''
        serializer.save(author=self.request.user)

    def get_queryset(self):

        queryset = Post.objects.select_related(
            "author"
        ).prefetch_related(
            "tags"
        )

        user = self.request.user
        ##all can see the published posts
        if not user.is_authenticated:
            return queryset.filter(status="published")

        return queryset.filter(
            Q(status="published") | Q(author=user)
        )



