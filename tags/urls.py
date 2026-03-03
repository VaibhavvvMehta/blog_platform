from rest_framework.routers import DefaultRouter
from .views import TagViewSet

router = DefaultRouter()
router.register("", TagViewSet, basename="tags")

urlpatterns = router.urls