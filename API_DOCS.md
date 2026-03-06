# BlogSpace API Documentation

Base URL: `http://localhost:8000`

All protected endpoints require a Token in the `Authorization` header:
```
Authorization: Token <your_token>
```

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Posts](#3-posts)
4. [Comments](#4-comments)
5. [Tags](#5-tags)

---

## 1. Authentication

### Obtain Token

**`POST /api/token/`**

Exchange email + password for an auth token. Use the returned token in all protected requests.

**Auth required:** No

**Request body:**
```json
{
  "username": "user@example.com",
  "password": "yourpassword"
}
```

> **Note:** The `username` field must be the user's **email address** since `email` is the `USERNAME_FIELD`.

**Response `200 OK`:**
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
}
```

**Response `400 Bad Request` (invalid credentials):**
```json
{
  "non_field_errors": ["Unable to log in with provided credentials."]
}
```

---

## 2. Users

### 2.1 Register

**`POST /api/users/register/`**

Create a new user account.

**Auth required:** No

**Request body:**
```json
{
  "email": "jane@example.com",
  "username": "jane",
  "password": "securepassword123",
  "bio": "Writer and coffee enthusiast.",
  "avatar": "<multipart file upload — optional>"
}
```

| Field      | Type   | Required | Notes                     |
|------------|--------|----------|---------------------------|
| `email`    | string | Yes      | Must be unique            |
| `username` | string | Yes      | Must be unique            |
| `password` | string | Yes      | Write-only, hashed on save |
| `bio`      | string | No       | Free text                 |
| `avatar`   | file   | No       | `multipart/form-data`     |

**Response `201 Created`:**
```json
{
  "id": 1,
  "email": "jane@example.com",
  "username": "jane",
  "bio": "Writer and coffee enthusiast.",
  "avatar": null
}
```

**Response `400 Bad Request` (duplicate email):**
```json
{
  "email": ["custom user with this email already exists."]
}
```

---

### 2.2 Get Profile

**`GET /api/users/profile/`**

Returns the authenticated user's profile.

**Auth required:** Yes

**Response `200 OK`:**
```json
{
  "id": 1,
  "email": "jane@example.com",
  "username": "jane",
  "bio": "Writer and coffee enthusiast.",
  "avatar": "/media/users/avatars/jane.jpg"
}
```

**Response `401 Unauthorized`:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### 2.3 Update Profile

**`PATCH /api/users/profile/`**

Partially update the authenticated user's profile. All fields are optional.

**Auth required:** Yes  
**Content-Type:** `multipart/form-data` (if uploading avatar), otherwise `application/json`

**Request body (example — update bio only):**
```json
{
  "bio": "Updated bio text."
}
```

**Request body (example — change username and avatar):**
```
username=newname
avatar=<file>
```

**Response `200 OK`:**
```json
{
  "id": 1,
  "email": "jane@example.com",
  "username": "newname",
  "bio": "Updated bio text.",
  "avatar": "/media/users/avatars/newpic.jpg"
}
```

**Response `400 Bad Request`:**
```json
{
  "username": ["A user with that username already exists."]
}
```

---

### 2.4 Logout

**`POST /api/users/logout/`**

Deletes the user's auth token, invalidating the session.

**Auth required:** Yes

**Request body:** None

**Response `200 OK`:**
```json
{
  "message": "Logged out successfully"
}
```

---

## 3. Posts

Router prefix: `/api/posts/post/`

**Visibility rules:**
- **Unauthenticated** users see only `status = "published"` posts.
- **Authenticated** users see all published posts **plus** their own drafts.

**Permissions:**
- Anyone can read (`GET`).
- Only authenticated users can create (`POST`).
- Only the post **author** can update or delete their own post.

---

### 3.1 List Posts

**`GET /api/posts/post/`**

Returns a list of posts (scoped by auth state — see visibility rules above).

**Auth required:** No

**Query parameters:**

| Parameter    | Type   | Description                                 | Example                        |
|--------------|--------|---------------------------------------------|--------------------------------|
| `tags__slug` | string | Filter posts by tag slug                    | `?tags__slug=django`           |
| `search`     | string | Search posts by title (case-insensitive)    | `?search=getting+started`      |

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "title": "Getting Started with Django",
    "body": "Django is a high-level Python web framework...",
    "slug": "getting-started-with-django",
    "author": "jane@example.com",
    "tags": ["django", "python"],
    "status": "published",
    "created_at": "2026-03-01T10:00:00Z"
  },
  {
    "id": 2,
    "title": "Advanced DRF Tips",
    "body": "Here are some advanced patterns...",
    "slug": "advanced-drf-tips",
    "author": "jane@example.com",
    "tags": ["django", "drf"],
    "status": "published",
    "created_at": "2026-03-02T12:30:00Z"
  }
]
```

---

### 3.2 Create Post

**`POST /api/posts/post/`**

Creates a new post. The authenticated user is automatically set as the author. The slug is auto-generated from the title.

**Auth required:** Yes

**Request body:**
```json
{
  "title": "My First Blog Post",
  "body": "This is the content of my first post.",
  "status": "draft",
  "tags": ["django", "beginner"]
}
```

| Field    | Type     | Required | Notes                                          |
|----------|----------|----------|------------------------------------------------|
| `title`  | string   | Yes      | Max 300 chars                                  |
| `body`   | string   | No       | Post content                                   |
| `status` | string   | No       | `"draft"` (default) or `"published"`          |
| `tags`   | string[] | No       | Array of existing tag **names**; tags must pre-exist |

**Response `201 Created`:**
```json
{
  "id": 3,
  "title": "My First Blog Post",
  "body": "This is the content of my first post.",
  "slug": "my-first-blog-post",
  "author": "jane@example.com",
  "tags": ["django", "beginner"],
  "status": "draft",
  "created_at": "2026-03-06T09:00:00Z"
}
```

**Response `401 Unauthorized`:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Response `400 Bad Request` (tag does not exist):**
```json
{
  "tags": ["Object with name=nonexistent does not exist."]
}
```

---

### 3.3 Retrieve Post

**`GET /api/posts/post/{id}/`**

Returns a single post by its primary key.

**Auth required:** No (published) / Yes (own draft)

**Response `200 OK`:**
```json
{
  "id": 3,
  "title": "My First Blog Post",
  "body": "This is the content of my first post.",
  "slug": "my-first-blog-post",
  "author": "jane@example.com",
  "tags": ["django", "beginner"],
  "status": "draft",
  "created_at": "2026-03-06T09:00:00Z"
}
```

**Response `404 Not Found`:**
```json
{
  "detail": "No Post matches the given query."
}
```

---

### 3.4 Update Post (Full)

**`PUT /api/posts/post/{id}/`**

Fully replace a post's data. All writable fields must be provided.

**Auth required:** Yes (must be the post author)

**Request body:**
```json
{
  "title": "My First Blog Post — Revised",
  "body": "Updated content here.",
  "status": "published",
  "tags": ["django"]
}
```

**Response `200 OK`:**
```json
{
  "id": 3,
  "title": "My First Blog Post — Revised",
  "body": "Updated content here.",
  "slug": "my-first-blog-post",
  "author": "jane@example.com",
  "tags": ["django"],
  "status": "published",
  "created_at": "2026-03-06T09:00:00Z"
}
```

**Response `403 Forbidden` (not the author):**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

### 3.5 Partial Update Post

**`PATCH /api/posts/post/{id}/`**

Update one or more fields of a post without supplying all fields.

**Auth required:** Yes (must be the post author)

**Request body (publish a draft):**
```json
{
  "status": "published"
}
```

**Response `200 OK`:**
```json
{
  "id": 3,
  "title": "My First Blog Post — Revised",
  "body": "Updated content here.",
  "slug": "my-first-blog-post",
  "author": "jane@example.com",
  "tags": ["django"],
  "status": "published",
  "created_at": "2026-03-06T09:00:00Z"
}
```

---

### 3.6 Delete Post

**`DELETE /api/posts/post/{id}/`**

Permanently deletes a post and all its associated comments.

**Auth required:** Yes (must be the post author)

**Response `204 No Content`:** *(empty body)*

**Response `403 Forbidden` (not the author):**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

## 4. Comments

Router prefix: `/api/comments/`

**Behaviour:**
- The list endpoint returns only **top-level comments** (where `parent` is `null`). Each top-level comment includes its `replies` array inline.
- A reply is created by providing the `parent` comment's ID. Nesting is limited to **one level** (replying to a reply is not allowed).
- The authenticated user is automatically set as `author` on creation.

**Permissions:**
- Anyone can read.
- Only authenticated users can create.
- Any authenticated user can update or delete any comment (no author-lock on comments by default).

---

### 4.1 List Comments

**`GET /api/comments/`**

Returns top-level comments. Filter by post to get comments for a specific post.

**Auth required:** No

**Query parameters:**

| Parameter | Type    | Description                         | Example         |
|-----------|---------|-------------------------------------|-----------------|
| `post`    | integer | Filter comments by post ID          | `?post=3`       |

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "body": "Great post! Very helpful.",
    "post": 3,
    "author": "john@example.com",
    "parent": null,
    "replies": [
      {
        "id": 2,
        "body": "Thanks, glad you liked it!",
        "author": "jane@example.com",
        "created_at": "2026-03-06T10:15:00Z"
      }
    ],
    "created_at": "2026-03-06T10:00:00Z"
  }
]
```

---

### 4.2 Create Comment

**`POST /api/comments/`**

Creates a top-level comment or a reply.

**Auth required:** Yes

**Request body (top-level comment):**
```json
{
  "body": "This was a really insightful read.",
  "post": 3,
  "parent": null
}
```

**Request body (reply to comment id=1):**
```json
{
  "body": "Totally agree with this!",
  "post": 3,
  "parent": 1
}
```

| Field    | Type    | Required | Notes                                                       |
|----------|---------|----------|-------------------------------------------------------------|
| `body`   | string  | Yes      | Comment text                                                |
| `post`   | integer | Yes      | ID of the post being commented on                          |
| `parent` | integer | No       | ID of the parent comment for replies. Cannot be a reply itself. |

**Response `201 Created` (top-level comment):**
```json
{
  "id": 5,
  "body": "This was a really insightful read.",
  "post": 3,
  "author": "john@example.com",
  "parent": null,
  "replies": [],
  "created_at": "2026-03-06T11:00:00Z"
}
```

**Response `400 Bad Request` (replying to a reply):**
```json
{
  "parent": ["Only a single reply is allowed"]
}
```

**Response `400 Bad Request` (parent comment belongs to a different post):**
```json
{
  "non_field_errors": ["Reply must belong to the same post as the parent comment."]
}
```

---

### 4.3 Retrieve Comment

**`GET /api/comments/{id}/`**

Returns a single top-level comment with its replies.

**Auth required:** No

**Response `200 OK`:**
```json
{
  "id": 1,
  "body": "Great post! Very helpful.",
  "post": 3,
  "author": "john@example.com",
  "parent": null,
  "replies": [
    {
      "id": 2,
      "body": "Thanks, glad you liked it!",
      "author": "jane@example.com",
      "created_at": "2026-03-06T10:15:00Z"
    }
  ],
  "created_at": "2026-03-06T10:00:00Z"
}
```

---

### 4.4 Update Comment (Full)

**`PUT /api/comments/{id}/`**

Fully replace a comment's body.

**Auth required:** Yes

**Request body:**
```json
{
  "body": "Updated comment text.",
  "post": 3,
  "parent": null
}
```

**Response `200 OK`:**
```json
{
  "id": 1,
  "body": "Updated comment text.",
  "post": 3,
  "author": "john@example.com",
  "parent": null,
  "replies": [],
  "created_at": "2026-03-06T10:00:00Z"
}
```

---

### 4.5 Partial Update Comment

**`PATCH /api/comments/{id}/`**

Update only the comment body.

**Auth required:** Yes

**Request body:**
```json
{
  "body": "Slightly edited comment."
}
```

**Response `200 OK`:**
```json
{
  "id": 1,
  "body": "Slightly edited comment.",
  "post": 3,
  "author": "john@example.com",
  "parent": null,
  "replies": [],
  "created_at": "2026-03-06T10:00:00Z"
}
```

---

### 4.6 Delete Comment

**`DELETE /api/comments/{id}/`**

Deletes a comment and all its replies (cascade).

**Auth required:** Yes

**Response `204 No Content`:** *(empty body)*

---

## 5. Tags

Router prefix: `/api/tags/`

**Permissions:**
- Anyone can read.
- Only authenticated users can create, update, or delete tags.

> **Important:** Tags are referenced in posts by their **`name`** field (not slug). Tags must be created before being assigned to a post.

---

### 5.1 List Tags

**`GET /api/tags/`**

Returns all tags.

**Auth required:** No

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "name": "django",
    "slug": "django",
    "created_at": "2026-02-10T08:00:00Z"
  },
  {
    "id": 2,
    "name": "python",
    "slug": "python",
    "created_at": "2026-02-10T08:01:00Z"
  }
]
```

---

### 5.2 Create Tag

**`POST /api/tags/`**

Creates a new tag. The `slug` must be provided manually.

**Auth required:** Yes

**Request body:**
```json
{
  "name": "beginner",
  "slug": "beginner"
}
```

| Field  | Type   | Required | Notes                            |
|--------|--------|----------|----------------------------------|
| `name` | string | Yes      | Max 150 chars; must be unique    |
| `slug` | string | Yes      | URL-safe; must be unique         |

**Response `201 Created`:**
```json
{
  "id": 3,
  "name": "beginner",
  "slug": "beginner",
  "created_at": "2026-03-06T09:30:00Z"
}
```

**Response `400 Bad Request` (duplicate):**
```json
{
  "name": ["tag with this name already exists."]
}
```

---

### 5.3 Retrieve Tag

**`GET /api/tags/{id}/`**

Returns a single tag by its primary key.

**Auth required:** No

**Response `200 OK`:**
```json
{
  "id": 1,
  "name": "django",
  "slug": "django",
  "created_at": "2026-02-10T08:00:00Z"
}
```

---

### 5.4 Update Tag (Full)

**`PUT /api/tags/{id}/`**

Fully replace a tag's data.

**Auth required:** Yes

**Request body:**
```json
{
  "name": "django-rest",
  "slug": "django-rest"
}
```

**Response `200 OK`:**
```json
{
  "id": 1,
  "name": "django-rest",
  "slug": "django-rest",
  "created_at": "2026-02-10T08:00:00Z"
}
```

---

### 5.5 Partial Update Tag

**`PATCH /api/tags/{id}/`**

Update only select fields of a tag.

**Auth required:** Yes

**Request body:**
```json
{
  "name": "drf"
}
```

**Response `200 OK`:**
```json
{
  "id": 1,
  "name": "drf",
  "slug": "django-rest",
  "created_at": "2026-02-10T08:00:00Z"
}
```

---

### 5.6 Delete Tag

**`DELETE /api/tags/{id}/`**

Deletes a tag. Posts referencing this tag will have the tag association removed (M2M, no cascade).

**Auth required:** Yes

**Response `204 No Content`:** *(empty body)*

---

## Error Reference

| Status | Meaning                                                               |
|--------|-----------------------------------------------------------------------|
| `200`  | OK — request succeeded                                               |
| `201`  | Created — resource created successfully                               |
| `204`  | No Content — resource deleted                                         |
| `400`  | Bad Request — validation failed; check `errors` in response body     |
| `401`  | Unauthorized — token missing or invalid                              |
| `403`  | Forbidden — authenticated but not allowed (e.g. not the post author) |
| `404`  | Not Found — resource does not exist or is inaccessible               |

---

## Quick-Start Example

```bash
# 1. Register
curl -X POST http://localhost:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","username":"jane","password":"pass1234"}'

# 2. Obtain token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"jane@example.com","password":"pass1234"}'

# 3. Create a tag
curl -X POST http://localhost:8000/api/tags/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b" \
  -H "Content-Type: application/json" \
  -d '{"name":"django","slug":"django"}'

# 4. Create a post
curl -X POST http://localhost:8000/api/posts/post/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello World","body":"My first post.","status":"published","tags":["django"]}'

# 5. List all published posts
curl http://localhost:8000/api/posts/post/

# 6. Comment on a post
curl -X POST http://localhost:8000/api/comments/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b" \
  -H "Content-Type: application/json" \
  -d '{"body":"Great post!","post":1,"parent":null}'

# 7. Logout
curl -X POST http://localhost:8000/api/users/logout/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```
