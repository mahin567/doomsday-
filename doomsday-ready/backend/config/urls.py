from django.conf import settings
from django.urls import include, path, re_path
from django.views.static import serve


def media(request, path):
    # Uploaded images. Fine for a small app; use a real file server for big traffic.
    return serve(request, path, document_root=settings.MEDIA_ROOT)


urlpatterns = [
    path("api/", include("movies.urls")),
    re_path(r"^media/(?P<path>.*)$", media),
]
