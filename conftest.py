import pytest
from rest_framework.test import APIClient 
from users.models import CustomUser
from posts.models import Post
from tags.models import Tag 

'''
Created for all the test to get 
-api client
-authourised user 
-post,tags are created 
To avoid repeating formation of these in tests . 
'''
@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user(db):
    return CustomUser.objects.create_user(
        email="test@example.com",
        username="testuser",
        password="password123"
    )

@pytest.fixture
def auth_client(api_client,user):
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def tag(db):
    return Tag.objects.create(name="test")

@pytest.fixture
def post(user, tag):
    post = Post.objects.create(
        title="Test Post",
        body="Content",
        author=user,
        status="published"
    )
    post.tags.add(tag)
    return post
