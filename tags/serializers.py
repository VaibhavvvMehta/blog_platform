from django.utils.text import slugify
from rest_framework import serializers
from .models import Tag

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model=Tag
        fields=["id","name","slug","created_at"]
        read_only_fields=["slug","created_at"]

    def create(self, validated_data):
        validated_data["slug"] = slugify(validated_data["name"])
        return super().create(validated_data)
        
