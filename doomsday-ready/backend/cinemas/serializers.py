from rest_framework import serializers

from .models import Cinema


class CinemaSerializer(serializers.ModelSerializer):
    bundle_sizes = serializers.ListField(
        child=serializers.IntegerField(min_value=1, max_value=500),
        min_length=1,
        max_length=10,
    )

    class Meta:
        model = Cinema
        fields = ["id", "name", "bundle_sizes"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name cannot be empty.")
        if Cinema.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("A cinema with this name already exists.")
        return value

    def validate_bundle_sizes(self, value):
        if len(set(value)) != len(value):
            raise serializers.ValidationError("Bundle sizes must all be different.")
        return sorted(value)
