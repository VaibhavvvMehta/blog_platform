from rest_framework import serializers
from users.models import CustomUser

class UserRegistrationSerializers(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True)

    class Meta:
        model=CustomUser
        fields = ["id", "email", "username", "password", "bio", "avatar"]

    def create(self, validated_data):
        password=validated_data.pop("password")
        user=CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user