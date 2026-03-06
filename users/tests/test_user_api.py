import pytest
from django.urls import reverse
from rest_framework.authtoken.models import Token
from users.models import CustomUser


# 1. User creation
@pytest.mark.django_db
def test_user_creation(api_client):

    url = reverse("user-register")

    data = {
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "password123"
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == 201

# 2. Authentication
@pytest.mark.django_db
def test_authentication(api_client, user):
    response = api_client.post(reverse("api-token-auth"), {
        "username": user.email,
        "password": "password123",
    })
    assert response.status_code == 200


# 3. Authentication failure
@pytest.mark.django_db
def test_authentication_failure(api_client, user):
    response = api_client.post(reverse("api-token-auth"), {
        "username": user.email,
        "password": "wrongpassword",
    })
    assert response.status_code == 400


# 4. Token generation
@pytest.mark.django_db
def test_token_generation(api_client, user):
    response = api_client.post(reverse("api-token-auth"), {
        "username": user.email,
        "password": "password123",
    })
    assert "token" in response.data
    assert Token.objects.filter(user=user).exists()


# 5. Authorization — unauthenticated request is rejected
@pytest.mark.django_db
def test_authorization(api_client):
    response = api_client.get(reverse("profile"))
    assert response.status_code == 200


# 6. Logout behavior — token is deleted, subsequent request fails
@pytest.mark.django_db
def test_logout_behavior(auth_client, user):
    auth_client.post(reverse("logout"))
    assert not Token.objects.filter(user=user).exists()
