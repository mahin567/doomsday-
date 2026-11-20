from django.conf import settings
from rest_framework import serializers

from core.exceptions import CircularDependency

from .models import Movie
from .services import load_prereq_map, would_create_cycle


class RelativeImageField(serializers.ImageField):
    """Accepts an uploaded image; shows it as a site path like /media/movies/x.png."""

    def to_representation(self, value):
        return value.url if value else None


class MovieSerializer(serializers.ModelSerializer):
    image = RelativeImageField(required=False, allow_null=True)
    # Send true (with PATCH) to delete the uploaded image.
    remove_image = serializers.BooleanField(write_only=True, required=False, default=False)
    prerequisites = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Movie.objects.all(), required=False
    )

    class Meta:
        model = Movie
        fields = [
            "id",
            "title",
            "release_year",
            "runtime_minutes",
            "description",
            "image",
            "image_url",
            "remove_image",
            "watched",
            "prerequisites",
        ]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title cannot be empty.")
        clash = Movie.objects.filter(title__iexact=value)
        if self.instance is not None:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError("A movie with this title already exists.")
        return value

    def validate_image(self, value):
        if value is not None and value.size > settings.MAX_IMAGE_BYTES:
            mb = settings.MAX_IMAGE_BYTES // (1024 * 1024)
            raise serializers.ValidationError(f"Image is too large (max {mb} MB).")
        return value

    def validate_image_url(self, value):
        # Optional: empty is fine. Otherwise an http(s) link or a site path.
        value = value.strip()
        if not value:
            return ""
        lower = value.lower()
        is_link = lower.startswith(("http://", "https://")) and len(value) > 8
        is_path = value.startswith("/") and not value.startswith("//")
        if not (is_link or is_path) or any(c.isspace() for c in value):
            raise serializers.ValidationError(
                "Use an http(s) link or a path that starts with /."
            )
        return value

    def validate(self, attrs):
        prereqs = attrs.get("prerequisites")
        # A brand new movie has no dependents, so it cannot be part of a loop.
        if prereqs is not None and self.instance is not None:
            ids = {m.pk for m in prereqs}
            if would_create_cycle(self.instance.pk, ids, load_prereq_map()):
                raise CircularDependency()
        return attrs

    def create(self, validated_data):
        prereqs = validated_data.pop("prerequisites", [])
        validated_data.pop("remove_image", None)
        movie = Movie.objects.create(**validated_data)
        movie.prerequisites.set(prereqs)
        return movie

    def update(self, instance, validated_data):
        prereqs = validated_data.pop("prerequisites", None)
        remove_image = validated_data.pop("remove_image", False)
        if remove_image or "image" in validated_data:
            instance.delete_image_file()  # drop the old file when replaced or removed
            if remove_image:
                validated_data["image"] = None
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if prereqs is not None:
            instance.prerequisites.set(prereqs)
        return instance
