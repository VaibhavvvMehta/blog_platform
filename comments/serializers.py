from rest_framework import serializers
from .models import Comment

class ReplySerializer(serializers.ModelSerializer):

        author = serializers.StringRelatedField()

        class Meta:
            model = Comment
            fields = [
                "id",
                "body",
                "author",
                "created_at"
            ]

class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    replies = ReplySerializer(many=True, read_only=True)
    class Meta:
        model=Comment
        fields = [
            "id",
            "body",
            "post",
            "author",
            "parent",
            "replies",
            "created_at"
        ]
        read_only_fields = ["author", "created_at"]
    
    def validate_parent(self,value):
        if value and value.parent is not None:
            raise serializers.ValidationError("Only a single reply is allowed") 
        return value 
    
    def validate(self, attrs):
         parent=attrs.get("parent")
         post=attrs.get("post")

         if parent and parent.post!=post:
              raise serializers.ValidationError(
                "Reply must belong to the same post."
            )

         return attrs

    
