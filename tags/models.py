from django.db import models

# Create your models here.

class Tag(models.Model):
    name=models.CharField(max_length=150,unique=True)
    slug=models.SlugField(unique=True)
    created_at=models.DateTimeField(auto_now_add=True)

    def __str__ (self):
        return self.name
