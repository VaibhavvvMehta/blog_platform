# BlogSpace

A full-stack blog platform built with **Django** and **Django REST Framework**. It ships both a REST API and a server-rendered frontend that lets users register, write posts, tag content, and leave threaded comments.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Local Setup](#local-setup)
  - [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Running Tests](#running-tests)
- [API Overview](#api-overview)
- [Data Models](#data-models)
- [Permissions](#permissions)
- [Frontend](#frontend)

---

## Features

- **User accounts** – register, log in, view/update profile, log out
- **Blog posts** – create, read, update, delete; draft/published workflow; auto-generated slugs
- **Tags** – categorize posts with many-to-many tags
- **Comments & replies** – threaded comments (parent/child) on any published post
- **Token authentication** – DRF token auth for all protected endpoints
- **Filtering & search** – filter posts by tag slug; search posts by title
- **Pagination** – all list endpoints are paginated (10 items per page)
- **Media uploads** – user avatars stored under `media/`
- **Admin panel** – full Django admin for all models
- **Docker** – reproducible local stack (Django + Postgres + Redis)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | Django 5.2 |
| REST API | Django REST Framework 3.16 |
| Authentication | DRF Token Authentication |
| Filtering | django-filter |
| Database | SQLite (default) |
| Media processing | Pillow |
| Testing | pytest + pytest-django + pytest-cov |
| Containerisation | Docker / Docker Compose |

---

## Project Structure

```
blog_platform/
├── config/                 # Project settings, root URLconf, WSGI/ASGI
├── users/                  # Custom user model, register/profile/logout API
├── posts/                  # Post model, CRUD API, custom permissions
├── comments/               # Comment model, threaded replies API
├── tags/                   # Tag model, tags API
├── frontend/               # Django-template views (home, dashboard, post detail…)
│   └── templates/          # HTML templates
├── static/                 # JS files (auth, dashboard, post, profile)
├── media/                  # Uploaded user avatars (runtime, git-ignored)
├── API_DOCS.md             # Full REST API reference
├── Dockerfile
├── docker-compose.yaml
├── requirements.txt
├── conftest.py
└── pytest.ini
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- pip
- (Optional) Docker & Docker Compose

### Local Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd blog_platform

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Apply database migrations
python manage.py migrate

# 5. (Optional) Create a superuser for the admin panel
python manage.py createsuperuser
```

### Docker Setup

```bash
# 1) Create .env (copy/paste this whole block)
cat > .env <<'EOF'
POSTGRES_DB=mydb
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_HOST=db
POSTGRES_PORT=5432
REDIS_URL=redis://redis:6379/1
DEBUG=True
SECRET_KEY=supersecretkey
DJANGO_SUPERUSER_EMAIL=admin@example.com
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=admin123
EOF

# 2) Build and start all services
docker compose up --build -d

# 3) Follow startup logs (migrations + superuser bootstrap)
docker compose logs -f web
```

After startup:

- App: `http://localhost:8000`
- Admin: `http://localhost:8000/admin/`
- Superuser login: values from `DJANGO_SUPERUSER_EMAIL` and `DJANGO_SUPERUSER_PASSWORD`

---

## Environment Variables

The project reads a few values from the environment. For local development you can set them in a `.env` file or export them in your shell.

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `mydb` | Postgres database name |
| `POSTGRES_USER` | `admin` | Postgres username |
| `POSTGRES_PASSWORD` | `admin123` | Postgres password |
| `POSTGRES_HOST` | `db` | Postgres host (Docker service name) |
| `POSTGRES_PORT` | `5432` | Postgres port |
| `REDIS_URL` | `redis://redis:6379/1` | Redis connection URL |
| `SECRET_KEY` | (insecure dev key) | Django secret key – **change in production** |
| `DEBUG` | `True` | Set to `False` in production |
| `DJANGO_SUPERUSER_EMAIL` | `admin@example.com` | Auto-created Django admin email at container startup |
| `DJANGO_SUPERUSER_USERNAME` | `admin` | Auto-created Django admin username |
| `DJANGO_SUPERUSER_PASSWORD` | `admin123` | Auto-created Django admin password |

> **Important:** Never commit a production `SECRET_KEY` to version control.

---

## Running the App

```bash
python manage.py runserver
```

- API root: `http://localhost:8000/api/`
- Django admin: `http://localhost:8000/admin/`
- Frontend home: `http://localhost:8000/`

---

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov

# Run tests for a specific app
pytest users/tests/
pytest posts/tests/
pytest comments/tests/
pytest tags/tests/
```

Test files are located in `<app>/tests/` for each Django app.

---

## API Overview

Full documentation is in [API_DOCS.md](API_DOCS.md). A quick reference is below.

### Authentication

All protected endpoints require a token in the `Authorization` header:

```
Authorization: Token <your_token>
```

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/token/` | No | Obtain auth token (email + password) |
| `POST` | `/api/users/register/` | No | Register a new user |
| `GET` | `/api/users/profile/` | Yes | View your profile |
| `PATCH` | `/api/users/profile/` | Yes | Update your profile |
| `POST` | `/api/users/logout/` | Yes | Invalidate token / log out |
| `GET` | `/api/posts/` | No | List all published posts (+ own drafts if authenticated) |
| `POST` | `/api/posts/` | Yes | Create a new post |
| `GET` | `/api/posts/{id}/` | No | Retrieve a single post |
| `PUT/PATCH` | `/api/posts/{id}/` | Yes (author) | Update a post |
| `DELETE` | `/api/posts/{id}/` | Yes (author) | Delete a post |
| `GET` | `/api/comments/` | No | List all comments |
| `POST` | `/api/comments/` | Yes | Create a comment or reply |
| `GET` | `/api/comments/{id}/` | No | Retrieve a comment |
| `PUT/PATCH` | `/api/comments/{id}/` | Yes (author) | Update a comment |
| `DELETE` | `/api/comments/{id}/` | Yes (author) | Delete a comment |
| `GET` | `/api/tags/` | No | List all tags |
| `POST` | `/api/tags/` | Yes | Create a tag |
| `GET` | `/api/tags/{id}/` | No | Retrieve a tag |

### Filtering & Search

```
# Filter posts by tag slug
GET /api/posts/?tags__slug=python

# Search posts by title keyword
GET /api/posts/?search=django

# Pagination
GET /api/posts/?page=2
```

---

## Data Models

### CustomUser

| Field | Type | Notes |
|-------|------|-------|
| `username` | CharField | Unique |
| `email` | EmailField | Unique; used as `USERNAME_FIELD` |
| `bio` | TextField | Optional |
| `avatar` | ImageField | Uploaded to `media/users/avatars/` |

### Post

| Field | Type | Notes |
|-------|------|-------|
| `title` | CharField | Max 300 chars |
| `body` | TextField | Post content |
| `slug` | SlugField | Auto-generated from title; unique |
| `author` | FK → CustomUser | Set automatically on create |
| `tags` | M2M → Tag | Optional |
| `status` | CharField | `draft` (default) or `published` |
| `created_at` | DateTimeField | Auto-set |

### Comment

| Field | Type | Notes |
|-------|------|-------|
| `body` | TextField | Comment text |
| `post` | FK → Post | The post being commented on |
| `author` | FK → CustomUser | Set automatically on create |
| `parent` | FK → Comment (self) | `null` = top-level comment; set = reply |
| `created_at` | DateTimeField | Auto-set |

### Tag

| Field | Type | Notes |
|-------|------|-------|
| `name` | CharField | Unique; max 150 chars |
| `slug` | SlugField | Unique |
| `created_at` | DateTimeField | Auto-set |

---

## Permissions

| Action | Rule |
|--------|------|
| Read published posts / comments / tags | Anyone (no auth required) |
| Create posts / comments / tags | Authenticated users only |
| Edit or delete a post | Authenticated **and** must be the post author |
| Edit or delete a comment | Authenticated **and** must be the comment author |
| View/update profile, logout | Authenticated users only |

Unauthenticated users can see all **published** posts. Authenticated users additionally see their own **draft** posts.

---

## Frontend

The `frontend` app provides a traditional server-rendered UI using Django templates:

| URL | Template | Description |
|-----|----------|-------------|
| `/` | `home.html` | Public landing page |
| `/dashboard/` | `dashboard.html` | Authenticated user's post dashboard |
| `/post/<id>/` | `post_detail.html` | Full post with comments |
| `/profile/` | `profile.html` | User profile page |
| `/about/` | `about.html` | About page |
| `/register/` | `register.html` | Registration form |
| `/login/` | `auth/login.html` | Login form |

JavaScript for interactive behaviour lives in `static/js/` (`auth.js`, `dashboard.js`, `post.js`, `profile.js`).
