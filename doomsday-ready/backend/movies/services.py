"""Graph logic for Feature 1. Plain Python, no graph libraries.

The graph is a dict: movie_id -> iterable of prerequisite ids.
"""
from collections import defaultdict


def would_create_cycle(movie_id, new_prereq_ids, prereq_map):
    """True if giving `movie_id` these prerequisites would create a loop.

    A loop exists when `movie_id` can be reached by walking down the
    prerequisites of any of its new prerequisites (or it lists itself).
    """
    new_prereq_ids = set(new_prereq_ids)
    if movie_id in new_prereq_ids:
        return True

    seen = set()
    stack = list(new_prereq_ids)
    while stack:
        node = stack.pop()
        if node == movie_id:
            return True
        if node in seen:
            continue
        seen.add(node)
        stack.extend(prereq_map.get(node, ()))
    return False


def rewatch_order(target_id, prereq_map):
    """Every movie needed before `target_id`, each once, prerequisites first.

    Iterative depth-first search, post-order: a movie is added only after all
    of its own prerequisites were added. The target is left out.
    Neighbours are visited in id order so the result is stable.
    """
    order = []
    visited = {target_id}
    stack = [(target_id, iter(sorted(prereq_map.get(target_id, ()))))]

    while stack:
        node, children = stack[-1]
        for child in children:
            if child not in visited:
                visited.add(child)
                stack.append((child, iter(sorted(prereq_map.get(child, ())))))
                break
        else:  # all children done
            stack.pop()
            if node != target_id:
                order.append(node)
    return order


def load_prereq_map():
    """Read the whole prerequisite graph from the database in one query."""
    from .models import Movie

    through = Movie.prerequisites.through
    graph = defaultdict(list)
    for movie_id, prereq_id in through.objects.values_list("from_movie_id", "to_movie_id"):
        graph[movie_id].append(prereq_id)
    return graph
