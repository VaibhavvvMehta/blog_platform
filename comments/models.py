from django.db import models
from django.conf import settings
# Create your models here.

class Comment(models.Model):
    body=models.TextField(null=False)


    post=models.ForeignKey(
        "posts.Post",
        on_delete=models.CASCADE,
        related_name="comments"
    ) 

    author=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments"
    ) 
    
    ## As if parent=null then it is a comment
    # parent=comment.id then it is reply 
    parent=models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="replies"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.author}"
    


