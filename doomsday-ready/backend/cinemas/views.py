from django.shortcuts import get_object_or_404
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Cinema
from .serializers import CinemaSerializer
from .services import min_bundles

MAX_GROUP = 10_000


class CinemaViewSet(viewsets.ModelViewSet):
    serializer_class = CinemaSerializer
    queryset = Cinema.objects.order_by("id")
    http_method_names = ["get", "post", "delete", "head", "options"]

    @action(detail=True, methods=["get"], url_path="booking")
    def booking(self, request, pk=None):
        cinema = get_object_or_404(Cinema, pk=pk)
        group_size = self._parse_group_size(request.query_params.get("groupSize"))

        result = min_bundles(cinema.bundle_sizes, group_size)
        base = {
            "cinema": {"id": cinema.pk, "name": cinema.name, "bundle_sizes": cinema.bundle_sizes},
            "group_size": group_size,
        }
        if result is None:
            return Response(
                {
                    **base,
                    "possible": False,
                    "total_bundles": None,
                    "bundles": [],
                    "message": "Not possible: no exact combination of bundles fits this group.",
                }
            )
        return Response(
            {
                **base,
                "possible": True,
                "total_bundles": sum(count for _, count in result),
                "bundles": [{"size": size, "count": count} for size, count in result],
            }
        )

    @staticmethod
    def _parse_group_size(raw):
        try:
            value = int(raw)
        except (TypeError, ValueError):
            raise serializers.ValidationError({"groupSize": "A whole number is required."})
        if not 1 <= value <= MAX_GROUP:
            raise serializers.ValidationError(
                {"groupSize": f"Must be between 1 and {MAX_GROUP}."}
            )
        return value
