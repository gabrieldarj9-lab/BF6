/**
 * Combinações lexicográficas sem repetição.
 * Inclui cardinalidades entre minSize e maxSize.
 */
export function combinationsUpTo<T>(
  items: readonly T[],
  minSize: number,
  maxSize: number,
): T[][] {
  const result: T[][] = [];

  function choose(
    start: number,
    remaining: number,
    current: T[],
  ) {
    if (remaining === 0) {
      result.push([...current]);
      return;
    }

    for (
      let i = start;
      i <= items.length - remaining;
      i += 1
    ) {
      current.push(items[i]);
      choose(i + 1, remaining - 1, current);
      current.pop();
    }
  }

  const boundedMin = Math.max(0, minSize);
  const boundedMax = Math.min(maxSize, items.length);

  for (let size = boundedMin; size <= boundedMax; size += 1) {
    choose(0, size, []);
  }

  return result;
}
