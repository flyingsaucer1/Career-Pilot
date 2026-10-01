import type { ChangeItem } from '../types/optimizer.types';

const hasWholeBoundaries = (source: string, start: number, end: number): boolean =>
  !/[\p{L}\p{N}_+#.]$/u.test(source.slice(0, start)) &&
  !/^[\p{L}\p{N}_+#]|^\.[\p{L}\p{N}_]/u.test(source.slice(end));

/** Only apply an AI suggestion when its source occurs exactly once in the current draft. */
export const applyOneSuggestion = (source: string, change: ChangeItem): string | null => {
  const normalized = source.replace(/\r\n/g, '\n');
  const before = change.original.trim().replace(/\r\n/g, '\n');
  const after = change.optimized.trim().replace(/\r\n/g, '\n');
  if (!before || !after || before === after) return null;
  const matches: number[] = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    const at = normalized.indexOf(before, cursor);
    if (at === -1) break;
    if (hasWholeBoundaries(normalized, at, at + before.length)) matches.push(at);
    if (matches.length > 1) break;
    cursor = at + 1;
  }
  if (matches.length !== 1) return null;
  return normalized.slice(0, matches[0]) + after + normalized.slice(matches[0] + before.length);
};
