from django.shortcuts import render

# Create your views here.
def home_page(request):
    return render(request , "home.html")

def login_page(request):
    return render(request, "auth/login.html")

def register_page(request):
    return render(request, "auth/register.html")

def dashboard_page(request):
    return render(request, "dashboard.html")