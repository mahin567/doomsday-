from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Movie(models.Model):
    title = models.CharField(max_length=200, unique=True)
    release_year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1888), MaxValueValidator(2100)]
    )
    runtime_minutes = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(300)]
    )
    description = models.CharField(max_length=300, blank=True, default="")
    # Optional cover picture, uploaded from the user's computer.
    image = models.ImageField(upload_to="movies/", blank=True, null=True)
    # Optional cover picture as a link: http(s) or a path like /marvel/iron-man.png.
    image_url = models.CharField(max_length=500, blank=True, default="")
    watched = models.BooleanField(default=False)
    # A movie points to the movies you should watch BEFORE it.
    prerequisites = models.ManyToManyField(
        "self", symmetrical=False, related_name="dependents", blank=True
    )

    class Meta:
        ordering = ["id"]

    def delete_image_file(self):
        """Remove the uploaded file from disk (the database value is left alone)."""
        if self.image:
            self.image.delete(save=False)

    def __str__(self):
        return self.title
