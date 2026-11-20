from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Movie
from .serializers import MovieSerializer
from .services import load_prereq_map
from .services import rewatch_order as compute_rewatch_order


class MovieViewSet(viewsets.ModelViewSet):
    serializer_class = MovieSerializer
    queryset = Movie.objects.prefetch_related("prerequisites").order_by("id")
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def perform_destroy(self, instance):
        instance.delete_image_file()
        instance.delete()

    @action(detail=True, methods=["get"], url_path="rewatch-order")
    def rewatch_order(self, request, pk=None):
        target = get_object_or_404(Movie, pk=pk)
        ids = compute_rewatch_order(target.pk, load_prereq_map())
        by_id = Movie.objects.in_bulk(ids)
        movies = [by_id[i] for i in ids]

        return Response(
            {
                "target": {"id": target.pk, "title": target.title},
                "order": [
                    {
                        "id": m.pk,
                        "title": m.title,
                        "release_year": m.release_year,
                        "runtime_minutes": m.runtime_minutes,
                        "watched": m.watched,
                    }
                    for m in movies
                ],
                "total_count": len(movies),
                "watched_count": sum(1 for m in movies if m.watched),
                "unwatched_runtime_minutes": sum(
                    m.runtime_minutes for m in movies if not m.watched
                ),
            }
        )
