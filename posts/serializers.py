from django.utils.text import slugify
from rest_framework import serializers
from .models import Post
from tags.models import Tag


class TagsByNameField(serializers.Field):
    """
    Accept tag names (strings) on write → get-or-create Tag objects.
    Return tag names (strings) on read so the frontend can display / re-populate them.
    """

    def to_representation(self, value):
        return list(value.values_list("name", flat=True))

    def to_internal_value(self, data):
        if not isinstance(data, list):
            raise serializers.ValidationError("Expected a list of tag names.")
        tags = []
        for item in data:
            if isinstance(item, int):
                try:
                    tags.append(Tag.objects.get(pk=item))
                except Tag.DoesNotExist:
                    raise serializers.ValidationError(f"Tag with id {item} does not exist.")
            elif isinstance(item, str) and item.strip():
                tag, _ = Tag.objects.get_or_create(
                    name=item.strip(),
                    defaults={"slug": slugify(item.strip())},
                )
                tags.append(tag)
        return tags


class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    tags = TagsByNameField(default=[])

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
        read_only_fields = ["author", "created_at", "slug"]

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        post = Post.objects.create(**validated_data)
        post.tags.set(tags)
        return post

    def update(self, instance, validated_data):
        tags = validated_data.pop("tags", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tags is not None:
            instance.tags.set(tags)
        return instance

