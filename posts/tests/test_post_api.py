import pytest
from django.urls import reverse
from posts.models import Post
from users.models import CustomUser


@pytest.mark.django_db
def test_create_post(auth_client, tag):

    url = reverse("post-list")

    data = {
        "title": "New Post",
        "body": "Content",
        "status": "published",
        "tags": [tag.id]
    }

    response = auth_client.post(url, data, format="json")

    assert response.status_code == 201
    assert Post.objects.count() == 1

@pytest.mark.django_db
def test_anonymous_user_cannot_create_post(api_client, tag):

    url = reverse("post-list")

    data = {
        "title": "Anonymous Post",
        "body": "Content",
        "status": "published",
        "tags": [tag.id]
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code == 401


@pytest.mark.django_db
def test_get_post_list(api_client, post):

    url = reverse("post-list")

    response = api_client.get(url)

    assert response.status_code == 200
    assert response.data["count"] >= 1


@pytest.mark.django_db
def test_get_single_post(api_client, post):

    url = reverse("post-detail", args=[post.id])

    response = api_client.get(url)

    assert response.status_code == 200
    assert response.data["title"] == post.title


@pytest.mark.django_db
def test_author_can_update_post(auth_client, post):

    url = reverse("post-detail", args=[post.id])

    data = {
        "title": "Updated Title"
    }

    response = auth_client.patch(url, data, format="json")

    post.refresh_from_db()

    assert response.status_code == 200
    assert post.title == "Updated Title"


@pytest.mark.django_db
def test_non_author_cannot_update_post(api_client, post):

    url = reverse("post-detail", args=[post.id])

    data = {
        "title": "Hacked"
    }

    response = api_client.patch(url, data, format="json")

    assert response.status_code in [401, 403]


@pytest.mark.django_db
def test_author_can_delete_post(auth_client, post):

    url = reverse("post-detail", args=[post.id])

    response = auth_client.delete(url)

    assert response.status_code == 204
    assert Post.objects.count() == 0


@pytest.mark.django_db
def test_non_author_cannot_delete_post(api_client, post):

    url = reverse("post-detail", args=[post.id])

    response = api_client.delete(url)

    assert response.status_code in [401, 403]


@pytest.mark.django_db
def test_post_pagination(api_client, user):

    for i in range(15):
        Post.objects.create(
            title=f"Post {i}",
            body="Content",
            author=user,
            status="published"
        )

    url = reverse("post-list")

    response = api_client.get(url)

    assert response.status_code == 200
    assert "results" in response.data