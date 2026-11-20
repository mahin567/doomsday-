from rest_framework.routers import DefaultRouter

from cinemas.views import CinemaViewSet

from .views import MovieViewSet

router = DefaultRouter(trailing_slash=False)
router.register("movies", MovieViewSet, basename="movie")
router.register("cinemas", CinemaViewSet, basename="cinema")

urlpatterns = router.urls
