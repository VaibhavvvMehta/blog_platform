import pytest
from django.urls import reverse
from comments.models import Comment


@pytest.mark.django_db
def test_create_comment(auth_client, post):

    url = reverse("comments-list")

    data = {
        "post": post.id,
        "body": "Nice post!"
    }

    response = auth_client.post(url, data, format="json")

    assert response.status_code == 201
    assert Comment.objects.count() == 1


@pytest.mark.django_db
def test_anonymous_user_cannot_create_comment(api_client, post):

    url = reverse("comments-list")

    data = {
        "post": post.id,
        "body": "Anonymous comment"
    }

    response = api_client.post(url, data, format="json")

    assert response.status_code in [401, 403]


@pytest.mark.django_db
def test_get_comments_list(api_client, post, user):

    Comment.objects.create(
        post=post,
        author=user,
        body="First comment"
    )

    url = reverse("comments-list")

    response = api_client.get(url)

    assert response.status_code == 200
    assert response.data["count"] >= 1


@pytest.mark.django_db
def test_create_reply(auth_client, post, user):

    parent = Comment.objects.create(
        post=post,
        author=user,
        body="Parent comment"
    )

    url = reverse("comments-list")

    data = {
        "post": post.id,
        "body": "Reply comment",
        "parent": parent.id
    }

    response = auth_client.post(url, data, format="json")

    assert response.status_code == 201
    assert Comment.objects.count() == 2


@pytest.mark.django_db
def test_reply_depth_limit(auth_client, post, user):

    parent = Comment.objects.create(
        post=post,
        author=user,
        body="Parent comment"
    )

    reply = Comment.objects.create(
        post=post,
        author=user,
        body="Reply",
        parent=parent
    )

    url = reverse("comments-list")

    data = {
        "post": post.id,
        "body": "Nested reply",
        "parent": reply.id
    }

    response = auth_client.post(url, data, format="json")

    assert response.status_code == 400


@pytest.mark.django_db
def test_delete_comment(auth_client, post, user):

    comment = Comment.objects.create(
        post=post,
        author=user,
        body="Delete me"
    )

    url = reverse("comments-detail", args=[comment.id])

    response = auth_client.delete(url)

    assert response.status_code == 204