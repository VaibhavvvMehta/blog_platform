from rest_framework .permissions import SAFE_METHODS,BasePermission

class IsAuthorOrReadOnly(BasePermission):

    def has_object_permission(self, request, view, obj):
        # Anyone can use get method 
        if request.method in SAFE_METHODS:
            return True
        
        #Only author is able to write
        return obj.author==request.user
    