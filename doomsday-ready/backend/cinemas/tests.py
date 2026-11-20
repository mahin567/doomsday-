from django.test import SimpleTestCase
from rest_framework.test import APITestCase

from .services import min_bundles


class MinBundlesTests(SimpleTestCase):
    def test_spec_examples(self):
        self.assertEqual(min_bundles([1, 3, 4], 6), [(3, 2)])
        self.assertEqual(min_bundles([2, 5], 11), [(5, 1), (2, 3)])
        self.assertEqual(min_bundles([6, 9, 20], 44), [(20, 1), (9, 2), (6, 1)])
        self.assertIsNone(min_bundles([4, 6], 7))

    def test_greedy_would_fail_here(self):
        # greedy picks 4+1+1 (3 bundles); the best is 3+3 (2 bundles)
        self.assertEqual(min_bundles([1, 3, 4], 6), [(3, 2)])

    def test_exact_single_bundle(self):
        self.assertEqual(min_bundles([5, 10], 10), [(10, 1)])

    def test_large_group_is_fast_and_exact(self):
        result = min_bundles([7, 13, 500], 10_000)
        self.assertEqual(sum(s * c for s, c in result), 10_000)

    def test_bundle_of_one_always_works(self):
        self.assertEqual(min_bundles([1], 5), [(1, 5)])


class CinemaApiTests(APITestCase):
    def make(self, name, sizes):
        res = self.client.post("/api/cinemas", {"name": name, "bundle_sizes": sizes}, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        return res.data["id"]

    def quote(self, cinema_id, size):
        return self.client.get(f"/api/cinemas/{cinema_id}/booking?groupSize={size}")

    def test_create_and_list(self):
        self.make("Grand Plex", [5, 2])
        res = self.client.get("/api/cinemas")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data[0]["bundle_sizes"], [2, 5])

    def test_validation(self):
        bad_payloads = [
            {"name": "A", "bundle_sizes": []},
            {"name": "A", "bundle_sizes": [0]},
            {"name": "A", "bundle_sizes": [501]},
            {"name": "A", "bundle_sizes": [2, 2]},
            {"name": "A", "bundle_sizes": list(range(1, 12))},
            {"name": "", "bundle_sizes": [2]},
        ]
        for payload in bad_payloads:
            res = self.client.post("/api/cinemas", payload, format="json")
            self.assertEqual(res.status_code, 400, payload)

    def test_name_must_be_unique(self):
        self.make("Grand Plex", [2])
        res = self.client.post("/api/cinemas", {"name": "grand plex", "bundle_sizes": [3]}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_booking_quote(self):
        cid = self.make("Mega", [6, 9, 20])
        res = self.quote(cid, 44)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["possible"])
        self.assertEqual(res.data["total_bundles"], 4)
        self.assertEqual(
            res.data["bundles"],
            [{"size": 20, "count": 1}, {"size": 9, "count": 2}, {"size": 6, "count": 1}],
        )

    def test_booking_not_possible(self):
        cid = self.make("Odd", [4, 6])
        res = self.quote(cid, 7)
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data["possible"])
        self.assertEqual(res.data["bundles"], [])

    def test_group_size_limits(self):
        cid = self.make("Any", [1])
        for bad in ("0", "10001", "abc", "-3", ""):
            self.assertEqual(self.quote(cid, bad).status_code, 400, bad)
        self.assertEqual(self.client.get(f"/api/cinemas/{cid}/booking").status_code, 400)
        self.assertEqual(self.quote(cid, 10000).status_code, 200)

    def test_booking_unknown_cinema(self):
        self.assertEqual(self.quote(999, 5).status_code, 404)
