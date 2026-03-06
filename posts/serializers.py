from rest_framework import serializers
from .models import Post
from tags.models import Tag

class PostSerializer(serializers.ModelSerializer):
    author=serializers.StringRelatedField(read_only=True)
    tags = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all()
    )
    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "body",
            "slug",
            "author",
            "tags",
            "status",
            "created_at",
        ]
        read_only_fields = ["author", "created_at","slug"]
   
