import type { ResumeOptimizationResult } from '../providers/ai/ai.interface';

interface SourceEdit {
  start: number;
  end: number;
  replacement: string;
}

// Include common technology-name punctuation so "C" cannot match "C++" and
// "Node" cannot match "Node.js". A sentence-ending period is still a boundary.
const hasWholeBoundaries = (source: string, start: number, end: number): boolean =>
  !/[\p{L}\p{N}_+#.]$/u.test(source.slice(0, start)) &&
  !/^[\p{L}\p{N}_+#]|^\.[\p{L}\p{N}_]/u.test(source.slice(end));

/** Apply unambiguous, non-overlapping suggestions against the immutable source. */
export const buildResumeDraft = (originalText: string, changes: ResumeOptimizationResult): string => {
  const source = originalText.replace(/\r\n/g, '\n').trim();
  const suggestions = [
    ...changes.experienceChanges,
    ...changes.projectChanges,
    ...changes.skillChanges,
    ...changes.bulletPointChanges,
  ];
  const edits: SourceEdit[] = [];

  for (const suggestion of suggestions) {
    const before = suggestion.original.trim().replace(/\r\n/g, '\n');
    const after = suggestion.optimized.trim().replace(/\r\n/g, '\n');
    if (!before || !after || before === after) continue;

    const matches: number[] = [];
    let cursor = 0;
    while (cursor < source.length) {
      const at = source.indexOf(before, cursor);
      if (at === -1) break;
      if (hasWholeBoundaries(source, at, at + before.length)) matches.push(at);
      if (matches.length > 1) break;
      cursor = at + 1;
    }
    if (matches.length !== 1) continue;

    const edit = { start: matches[0], end: matches[0] + before.length, replacement: after };
    // Identical recommendations in multiple report categories are one edit.
    if (!edits.some((existing) => existing.start === edit.start && existing.end === edit.end && existing.replacement === after)) {
      edits.push(edit);
    }
  }

  // Conflicting suggestions stay in the report for manual review. Do not
  // choose one silently, or let a later suggestion target newly generated text.
  const applicable = edits.filter((edit, index) => !edits.some((other, otherIndex) =>
    index !== otherIndex && edit.start < other.end && other.start < edit.end
  )).sort((a, b) => b.start - a.start);

  let draft = source;
  for (const edit of applicable) {
    draft = draft.slice(0, edit.start) + edit.replacement + draft.slice(edit.end);
  }
  return draft;
};
