from django.db import models
from django.conf import settings
from django.utils.text import slugify
# Create your models here.
class Post(models.Model):
    """
    Representing the blog created by the user
    -post can be in draft or published status
    -only the published post are visible to the all users 
    """

    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("published", "Published"),
    )

    title = models.CharField(max_length=300)
    body = models.TextField(blank=True)
    slug = models.SlugField(unique=True,blank=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts"
    )

    tags = models.ManyToManyField(
        "tags.Tag",
        blank=True,
        related_name="posts"
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="draft"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    
    ##  Auto generating slug from title 
    def save(self, *args, **kwargs):

        if not self.slug:
            self.slug = slugify(self.title)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
