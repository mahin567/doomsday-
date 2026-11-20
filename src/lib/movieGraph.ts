export interface MovieLike {
  id: number;
  watched: boolean;
  prerequisites: number[];
}

/** Every movie needed before `id` (prerequisites of prerequisites too), without `id` itself. */
export function requiredIds(id: number, byId: Map<number, MovieLike>): number[] {
  const seen = new Set<number>([id]);
  const out: number[] = [];
  const stack = [...(byId.get(id)?.prerequisites ?? [])];
  while (stack.length) {
    const next = stack.pop() as number;
    if (seen.has(next)) continue;
    seen.add(next);
    out.push(next);
    stack.push(...(byId.get(next)?.prerequisites ?? []));
  }
  return out;
}
