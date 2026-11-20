from django.core.management.base import BaseCommand

from cinemas.models import Cinema
from movies.models import Movie

# (title, year, runtime, prerequisites) - sample data from the challenge.
# Doomsday's runtime is not known yet, so 150 is a placeholder.
MOVIES = [
    ("Iron Man", 2008, 126, []),
    ("Captain America: The First Avenger", 2011, 124, []),
    ("The Avengers", 2012, 143, ["Iron Man", "Captain America: The First Avenger"]),
    ("Captain America: Civil War", 2016, 147, ["The Avengers"]),
    ("Thor: Ragnarok", 2017, 130, []),
    ("Avengers: Infinity War", 2018, 149, ["Captain America: Civil War", "Thor: Ragnarok"]),
    ("Avengers: Endgame", 2019, 181, ["Avengers: Infinity War"]),
    ("Avengers: Doomsday", 2026, 150, ["Avengers: Endgame"]),
]

# Short one-line descriptions (written for this project).
DESCRIPTIONS = {
    "Iron Man": "A billionaire inventor builds a powered suit and becomes a hero.",
    "Captain America: The First Avenger": "A determined young soldier is turned into a super-soldier during World War II.",
    "The Avengers": "Earth's heroes team up for the first time to stop an alien invasion.",
    "Captain America: Civil War": "The team splits over government oversight, and old friends end up on opposite sides.",
    "Thor: Ragnarok": "A prince must escape a distant arena planet to save his home world.",
    "Avengers: Infinity War": "The heroes fight to stop a powerful villain who is collecting the Infinity Stones.",
    "Avengers: Endgame": "The surviving heroes try a bold plan to undo the damage and set things right.",
    "Avengers: Doomsday": "The next big team-up. Rewatch the road that leads here before opening night.",
}

CINEMAS = [
    ("Starlight Cinema", [1, 3, 4]),
    ("Grand Plex", [2, 5]),
    ("Mega Screen", [6, 9, 20]),
    ("Odd Seats", [4, 6]),
]


class Command(BaseCommand):
    help = "Load the sample movies and cinemas (safe to run many times)."

    def handle(self, *args, **options):
        by_title = {}
        for title, year, runtime, _ in MOVIES:
            movie, _ = Movie.objects.get_or_create(
                title=title, defaults={"release_year": year, "runtime_minutes": runtime}
            )
            if not movie.description:
                movie.description = DESCRIPTIONS.get(title, "")
                movie.save(update_fields=["description"])
            by_title[title] = movie
        for title, _, _, prereqs in MOVIES:
            by_title[title].prerequisites.set([by_title[p] for p in prereqs])

        for name, sizes in CINEMAS:
            Cinema.objects.get_or_create(name=name, defaults={"bundle_sizes": sorted(sizes)})

        self.stdout.write(self.style.SUCCESS("Demo data ready."))
