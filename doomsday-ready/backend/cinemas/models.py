from django.db import models


class Cinema(models.Model):
    name = models.CharField(max_length=200, unique=True)
    # Seat bundle sizes sold for opening night, e.g. [2, 5]. Stored sorted.
    bundle_sizes = models.JSONField()

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name
