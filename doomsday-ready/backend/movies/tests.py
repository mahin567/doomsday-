import io
import shutil
import tempfile
from pathlib import Path

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from PIL import Image
from rest_framework.test import APITestCase

from .models import Movie
from .services import rewatch_order, would_create_cycle


class GraphServiceTests(SimpleTestCase):
    GRAPH = {1: [], 2: [], 3: [1, 2], 4: [3]}

    def test_order_puts_prerequisites_first_and_skips_target(self):
        order = rewatch_order(4, self.GRAPH)
        self.assertEqual(sorted(order), [1, 2, 3])
        self.assertEqual(order[-1], 3)

    def test_shared_prerequisite_listed_once(self):
        graph = {1: [], 2: [1], 3: [1], 4: [2, 3]}
        order = rewatch_order(4, graph)
        self.assertEqual(sorted(order), [1, 2, 3])
        self.assertEqual(order[0], 1)

    def test_no_prerequisites_gives_empty_list(self):
        self.assertEqual(rewatch_order(1, self.GRAPH), [])

    def test_cycle_detection(self):
        self.assertTrue(would_create_cycle(1, [1], self.GRAPH))  # itself
        self.assertTrue(would_create_cycle(1, [4], self.GRAPH))  # through others
        self.assertFalse(would_create_cycle(4, [1, 2], self.GRAPH))

    def test_long_chain_does_not_hit_recursion_limit(self):
        n = 5000
        graph = {i: [i - 1] for i in range(1, n)}
        self.assertEqual(rewatch_order(n - 1, graph), list(range(n - 1)))


class MovieApiTests(APITestCase):
    def make(self, title, runtime=100, prereqs=(), watched=False, year=2010):
        res = self.client.post(
            "/api/movies",
            {
                "title": title,
                "release_year": year,
                "runtime_minutes": runtime,
                "watched": watched,
                "prerequisites": [m for m in prereqs],
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        return res.data["id"]

    def sample(self):
        iron = self.make("Iron Man", 126)
        first = self.make("The First Avenger", 124)
        avengers = self.make("The Avengers", 143, [iron, first])
        civil = self.make("Civil War", 147, [avengers])
        ragnarok = self.make("Ragnarok", 130)
        infinity = self.make("Infinity War", 149, [civil, ragnarok])
        endgame = self.make("Endgame", 181, [infinity])
        doomsday = self.make("Doomsday", 150, [endgame])
        return dict(iron=iron, first=first, avengers=avengers, civil=civil,
                    ragnarok=ragnarok, infinity=infinity, endgame=endgame, doomsday=doomsday)

    # ---- create / validate ----
    def test_create_defaults_watched_false(self):
        res = self.client.post(
            "/api/movies",
            {"title": "A", "release_year": 2000, "runtime_minutes": 90},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertFalse(res.data["watched"])
        self.assertEqual(res.data["prerequisites"], [])

    def test_runtime_must_be_1_to_300(self):
        for bad in (0, 301, -5):
            res = self.client.post(
                "/api/movies",
                {"title": f"M{bad}", "release_year": 2000, "runtime_minutes": bad},
                format="json",
            )
            self.assertEqual(res.status_code, 400)
            self.assertEqual(res.data["error"]["code"], "VALIDATION_ERROR")

    def test_title_must_be_unique_ignoring_case(self):
        self.make("Iron Man")
        res = self.client.post(
            "/api/movies",
            {"title": "iron man", "release_year": 2008, "runtime_minutes": 126},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_unknown_prerequisite_is_rejected(self):
        res = self.client.post(
            "/api/movies",
            {"title": "X", "release_year": 2000, "runtime_minutes": 90, "prerequisites": [999]},
            format="json",
        )
        self.assertEqual(res.status_code, 400)

    def test_list_movies(self):
        self.sample()
        res = self.client.get("/api/movies")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 8)

    def test_description_is_optional_and_limited(self):
        res = self.client.post(
            "/api/movies",
            {"title": "D", "release_year": 2000, "runtime_minutes": 90},
            format="json",
        )
        self.assertEqual(res.data["description"], "")
        res = self.client.post(
            "/api/movies",
            {"title": "E", "release_year": 2000, "runtime_minutes": 90, "description": "Short."},
            format="json",
        )
        self.assertEqual(res.data["description"], "Short.")
        res = self.client.patch(f"/api/movies/{res.data['id']}", {"description": "x" * 301}, format="json")
        self.assertEqual(res.status_code, 400)

    # ---- update ----
    def test_patch_watched_and_prerequisites(self):
        a = self.make("A")
        b = self.make("B")
        res = self.client.patch(f"/api/movies/{b}", {"watched": True, "prerequisites": [a]}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["watched"])
        self.assertEqual(res.data["prerequisites"], [a])
        res = self.client.patch(f"/api/movies/{b}", {"prerequisites": []}, format="json")
        self.assertEqual(res.data["prerequisites"], [])

    def test_patch_title_to_same_title_is_fine(self):
        a = self.make("A")
        res = self.client.patch(f"/api/movies/{a}", {"title": "A", "watched": True}, format="json")
        self.assertEqual(res.status_code, 200)

    def test_spec_example_endgame_before_iron_man_is_circular(self):
        m = self.sample()
        res = self.client.patch(
            f"/api/movies/{m['iron']}", {"prerequisites": [m["endgame"]]}, format="json"
        )
        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.data["error"]["code"], "CIRCULAR_DEPENDENCY")
        # nothing was saved
        self.assertEqual(Movie.objects.get(pk=m["iron"]).prerequisites.count(), 0)

    def test_direct_self_dependency_is_circular(self):
        a = self.make("A")
        res = self.client.patch(f"/api/movies/{a}", {"prerequisites": [a]}, format="json")
        self.assertEqual(res.status_code, 409)
        self.assertEqual(res.data["error"]["code"], "CIRCULAR_DEPENDENCY")

    def test_two_movie_loop_is_circular(self):
        a = self.make("A")
        b = self.make("B", prereqs=[a])
        res = self.client.patch(f"/api/movies/{a}", {"prerequisites": [b]}, format="json")
        self.assertEqual(res.status_code, 409)

    # ---- rewatch order ----
    def _order(self, movie_id):
        res = self.client.get(f"/api/movies/{movie_id}/rewatch-order")
        self.assertEqual(res.status_code, 200)
        return res.data

    def test_rewatch_order_for_doomsday(self):
        m = self.sample()
        data = self._order(m["doomsday"])
        ids = [x["id"] for x in data["order"]]
        self.assertEqual(len(ids), 7)
        self.assertNotIn(m["doomsday"], ids)
        self.assertEqual(len(set(ids)), 7)
        pos = {i: n for n, i in enumerate(ids)}
        for movie in Movie.objects.filter(pk__in=ids):
            for p in movie.prerequisites.all():
                self.assertLess(pos[p.pk], pos[movie.pk])

    def test_rewatch_order_for_civil_war(self):
        m = self.sample()
        ids = [x["id"] for x in self._order(m["civil"])["order"]]
        self.assertEqual(set(ids[:2]), {m["iron"], m["first"]})
        self.assertEqual(ids[2], m["avengers"])

    def test_rewatch_order_empty_for_ragnarok(self):
        m = self.sample()
        data = self._order(m["ragnarok"])
        self.assertEqual(data["order"], [])
        self.assertEqual(data["total_count"], 0)
        self.assertEqual(data["unwatched_runtime_minutes"], 0)

    def test_rewatch_summary_counts_watched_and_unwatched_runtime(self):
        m = self.sample()
        for key in ("iron", "first"):
            self.client.patch(f"/api/movies/{m[key]}", {"watched": True}, format="json")
        data = self._order(m["civil"])
        self.assertEqual(data["total_count"], 3)
        self.assertEqual(data["watched_count"], 2)
        self.assertEqual(data["unwatched_runtime_minutes"], 143)  # only The Avengers

    def test_rewatch_order_unknown_movie_is_404(self):
        res = self.client.get("/api/movies/999/rewatch-order")
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.data["error"]["code"], "NOT_FOUND")


class MovieImageTests(APITestCase):
    def post(self, **extra):
        body = {"title": "Pic", "release_year": 2000, "runtime_minutes": 90, **extra}
        return self.client.post("/api/movies", body, format="json")

    def test_image_is_optional_and_defaults_to_empty(self):
        res = self.post()
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["image_url"], "")

    def test_accepts_https_link_and_site_path(self):
        for i, url in enumerate(("https://example.com/a.png", "/marvel/iron-man.png")):
            res = self.client.post(
                "/api/movies",
                {"title": f"P{i}", "release_year": 2000, "runtime_minutes": 90, "image_url": url},
                format="json",
            )
            self.assertEqual(res.status_code, 201, res.data)
            self.assertEqual(res.data["image_url"], url)

    def test_rejects_bad_image_values(self):
        for bad in ("not a url", "javascript:alert(1)", "//evil.com/x.png", "ftp://x/y.png"):
            res = self.post(image_url=bad)
            self.assertEqual(res.status_code, 400, bad)
            self.assertEqual(res.data["error"]["code"], "VALIDATION_ERROR")

    def test_patch_can_set_and_clear_image(self):
        movie_id = self.post().data["id"]
        res = self.client.patch(
            f"/api/movies/{movie_id}", {"image_url": "https://example.com/a.png"}, format="json"
        )
        self.assertEqual(res.data["image_url"], "https://example.com/a.png")
        res = self.client.patch(f"/api/movies/{movie_id}", {"image_url": ""}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["image_url"], "")


def png_file(name="pic.png", size=(4, 4)):
    buf = io.BytesIO()
    Image.new("RGB", size, "red").save(buf, "PNG")
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/png")


class MovieUploadTests(APITestCase):
    def setUp(self):
        self.media = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.media, ignore_errors=True)
        override = override_settings(MEDIA_ROOT=Path(self.media))
        override.enable()
        self.addCleanup(override.disable)

    def create(self, **extra):
        body = {"title": "Pic", "release_year": 2000, "runtime_minutes": 90, **extra}
        return self.client.post("/api/movies", body, format="json")

    def upload(self, movie_id, **fields):
        return self.client.patch(f"/api/movies/{movie_id}", fields, format="multipart")

    def files(self):
        return list(Path(self.media).rglob("*.png"))

    def test_new_movie_has_no_image(self):
        self.assertIsNone(self.create().data["image"])

    def test_upload_png_returns_media_path_and_saves_file(self):
        movie_id = self.create().data["id"]
        res = self.upload(movie_id, image=png_file())
        self.assertEqual(res.status_code, 200, res.data)
        self.assertTrue(res.data["image"].startswith("/media/movies/"))
        self.assertEqual(len(self.files()), 1)
        served = self.client.get(res.data["image"])
        self.assertEqual(served.status_code, 200)

    def test_create_with_multipart_upload(self):
        res = self.client.post(
            "/api/movies",
            {"title": "M", "release_year": 2001, "runtime_minutes": 80, "image": png_file()},
            format="multipart",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(res.data["image"].startswith("/media/movies/"))

    def test_rejects_non_image_file(self):
        movie_id = self.create().data["id"]
        fake = SimpleUploadedFile("x.png", b"not an image", content_type="image/png")
        res = self.upload(movie_id, image=fake)
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data["error"]["code"], "VALIDATION_ERROR")
        self.assertEqual(self.files(), [])

    @override_settings(MAX_IMAGE_BYTES=100)
    def test_rejects_image_over_size_limit(self):
        movie_id = self.create().data["id"]
        res = self.upload(movie_id, image=png_file(size=(200, 200)))
        self.assertEqual(res.status_code, 400)
        self.assertIn("too large", str(res.data))

    def test_replacing_image_deletes_old_file(self):
        movie_id = self.create().data["id"]
        self.upload(movie_id, image=png_file("a.png"))
        self.upload(movie_id, image=png_file("b.png"))
        self.assertEqual(len(self.files()), 1)

    def test_remove_image_deletes_file(self):
        movie_id = self.create().data["id"]
        self.upload(movie_id, image=png_file())
        res = self.upload(movie_id, remove_image="true")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data["image"])
        self.assertEqual(self.files(), [])

    def test_deleting_movie_deletes_file(self):
        movie_id = self.create().data["id"]
        self.upload(movie_id, image=png_file())
        self.assertEqual(self.client.delete(f"/api/movies/{movie_id}").status_code, 204)
        self.assertEqual(self.files(), [])

    def test_json_patch_does_not_touch_uploaded_image(self):
        movie_id = self.create().data["id"]
        self.upload(movie_id, image=png_file())
        res = self.client.patch(f"/api/movies/{movie_id}", {"watched": True}, format="json")
        self.assertTrue(res.data["image"].startswith("/media/movies/"))
