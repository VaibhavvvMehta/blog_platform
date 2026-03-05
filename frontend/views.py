from django.shortcuts import render

# Create your views here.
def home_page(request):
    return render(request , "home.html")

def about_page(request):
    return render(request, "about.html")

def login_page(request):
    return render(request, "auth/login.html")

def register_page(request):
    return render(request, "auth/register.html")

def dashboard_page(request):
    return render(request, "dashboard.html")

def post_detail_page(request, pk):
    return render(request, "post_detail.html", {"post_id": pk})

def profile_page(request):
    return render(request, "profile.html")