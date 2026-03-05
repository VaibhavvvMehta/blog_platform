from django.urls import path, include
from .import views

urlpatterns = [
    path("",views.home_page,name="home"),
    path("about/",views.about_page,name="about"),
    path("login/",views.login_page,name="login"),
    path("register/",views.register_page,name="register"),
    path("dashboard/",views.dashboard_page,name="dashboard"),
    path("posts/<int:pk>/",views.post_detail_page,name="post_detail"),
    path("profile/",views.profile_page,name="profile"),
]
