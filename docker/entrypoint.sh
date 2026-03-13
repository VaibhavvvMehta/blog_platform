#!/bin/sh

echo "Waiting for PostgreSQL..."

while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
  sleep 1
done

echo "PostgreSQL started"

echo "Applying database migrations..."
python manage.py migrate

echo "Ensuring Django superuser..."
python manage.py shell <<'PY'
import os
from django.contrib.auth import get_user_model

email = os.getenv("DJANGO_SUPERUSER_EMAIL")
username = os.getenv("DJANGO_SUPERUSER_USERNAME")
password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

if not all([email, username, password]):
  print("Skipping superuser creation: set DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_USERNAME and DJANGO_SUPERUSER_PASSWORD.")
else:
  User = get_user_model()
  existing_user = User.objects.filter(email=email).first() or User.objects.filter(username=username).first()
  if existing_user:
    changed = False
    if existing_user.email != email:
      existing_user.email = email
      changed = True
    if existing_user.username != username:
      existing_user.username = username
      changed = True
    if not existing_user.is_staff:
      existing_user.is_staff = True
      changed = True
    if not existing_user.is_superuser:
      existing_user.is_superuser = True
      changed = True
    existing_user.set_password(password)
    changed = True
    if changed:
      existing_user.save()
    print(f"Superuser ensured: {email}")
  else:
    User.objects.create_superuser(email=email, username=username, password=password)
    print(f"Superuser created: {email}")
PY

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Django server..."

python manage.py runserver 0.0.0.0:8000