import pytest
from django.urls import reverse
from tags.models import Tag


@pytest.mark.django_db
def test_create_tag(auth_client):

    url = reverse("tags-list")

    data = {
        "name": "django"
    }

    response = auth_client.post(url, data, format="json")

    assert response.status_code == 201
    assert Tag.objects.count() == 1


@pytest.mark.django_db
def test_anonymous_user_cannot_create_tag(api_client):

    url = reverse("tags-list")

    data = {
        "name": "python"
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code in [401, 403]


@pytest.mark.django_db
def test_get_tags_list(api_client, tag):

    url = reverse("tags-list")

    response = api_client.get(url)

    assert response.status_code == 200
    assert response.data["count"] >= 1


@pytest.mark.django_db
def test_get_single_tag(api_client, tag):

    url = reverse("tags-detail", args=[tag.id])

    response = api_client.get(url)

    assert response.status_code == 200
    assert response.data["name"] == tag.name


@pytest.mark.django_db
def test_delete_tag(auth_client, tag):

    url = reverse("tags-detail", args=[tag.id])

    response = auth_client.delete(url)

    assert response.status_code == 204
    assert Tag.objects.count() == 0