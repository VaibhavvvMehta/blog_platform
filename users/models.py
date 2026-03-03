from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class CustomUser(AbstractUser):
    email=models.EmailField(unique=True)
    bio=models.TextField(blank=True)
    avatar=models.ImageField(upload_to='users/avatars/',blank=True,null=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email
    