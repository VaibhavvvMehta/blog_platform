from django.urls import path,include
from .views import RegisterUser,ProfileView,LogoutView

urlpatterns = [
    path("register/",RegisterUser.as_view(),name="user-register"),
    path("profile/",ProfileView.as_view(),name="profile"),
    path("logout/",LogoutView.as_view(),name="logout")
]