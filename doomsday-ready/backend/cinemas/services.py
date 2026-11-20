"""Booking quote for Feature 2. Plain Python, no solver libraries."""


def min_bundles(bundle_sizes, group_size):
    """Fewest bundles whose seats add up to exactly `group_size`.

    Classic coin-change dynamic programming:
        best[n] = fewest bundles that make exactly n seats (None = impossible)
        best[n] = 1 + min(best[n - size]) over every bundle size

    Returns a list of (size, count), biggest size first, or None if no exact
    combination exists. Time O(group_size * number_of_sizes).
    On a tie, bigger bundles are preferred (sizes are tried biggest first and
    only a strictly better count replaces the current one).
    """
    sizes = sorted(set(bundle_sizes), reverse=True)
    best = [None] * (group_size + 1)
    last_used = [0] * (group_size + 1)
    best[0] = 0

    for seats in range(1, group_size + 1):
        for size in sizes:
            if size > seats or best[seats - size] is None:
                continue
            candidate = best[seats - size] + 1
            if best[seats] is None or candidate < best[seats]:
                best[seats] = candidate
                last_used[seats] = size

    if best[group_size] is None:
        return None

    counts = {}
    seats = group_size
    while seats > 0:
        size = last_used[seats]
        counts[size] = counts.get(size, 0) + 1
        seats -= size
    return sorted(counts.items(), reverse=True)
