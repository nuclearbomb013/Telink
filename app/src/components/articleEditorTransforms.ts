export type InsertAction =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bold'
  | 'italic'
  | 'inline-code'
  | 'code-block'
  | 'link'
  | 'quote'
  | 'ul'
  | 'ol'
  | 'table';

interface EditorSelection {
  start: number;
  end: number;
}

export interface EditorTransformResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

function replaceRange(
  value: string,
  start: number,
  end: number,
  replacement: string,
  selectionOffset = replacement.length,
  selectionLength = 0,
): EditorTransformResult {
  const selectionStart = start + selectionOffset;
  return {
    value: `${value.slice(0, start)}${replacement}${value.slice(end)}`,
    selectionStart,
    selectionEnd: selectionStart + selectionLength,
  };
}

function getLineRange(value: string, selection: EditorSelection): EditorSelection {
  const lineStart = value.lastIndexOf('\n', Math.max(0, selection.start - 1)) + 1;
  const effectiveEnd = selection.end > selection.start && value[selection.end - 1] === '\n'
    ? selection.end - 1
    : selection.end;
  const nextBreak = value.indexOf('\n', Math.max(effectiveEnd, lineStart));
  return {
    start: lineStart,
    end: nextBreak === -1 ? value.length : nextBreak,
  };
}

function transformSelectedLines(
  value: string,
  selection: EditorSelection,
  transform: (line: string, index: number) => string,
  placeholder: string,
): EditorTransformResult {
  const range = getLineRange(value, selection);
  const source = value.slice(range.start, range.end);
  const base = source.length > 0 ? source : placeholder;
  const lines = base.split('\n');
  const replacement = lines.map((line, index) => transform(line, index)).join('\n');
  const firstContentOffset = Math.max(0, replacement.search(/\S/));
  const placeholderLength = source.length > 0 ? 0 : placeholder.length;

  return replaceRange(
    value,
    range.start,
    range.end,
    replacement,
    source.length > 0 ? 0 : firstContentOffset,
    placeholderLength,
  );
}

function applyHeading(value: string, selection: EditorSelection, level: 1 | 2 | 3): EditorTransformResult {
  const prefix = `${'#'.repeat(level)} `;
  return transformSelectedLines(
    value,
    selection,
    (line) => {
      const body = line.replace(/^\s{0,3}#{1,6}\s*/, '').trimStart();
      return body ? `${prefix}${body}` : `${prefix}Heading`;
    },
    'Heading',
  );
}

function applyQuote(value: string, selection: EditorSelection): EditorTransformResult {
  return transformSelectedLines(
    value,
    selection,
    (line) => `> ${line.replace(/^\s{0,3}>\s?/, '') || 'quote'}`,
    'quote',
  );
}

function applyUnorderedList(value: string, selection: EditorSelection): EditorTransformResult {
  return transformSelectedLines(
    value,
    selection,
    (line) => `- ${line.replace(/^\s{0,3}(?:[-*+]\s+|\d+\.\s+)/, '') || 'list item'}`,
    'list item',
  );
}

function applyOrderedList(value: string, selection: EditorSelection): EditorTransformResult {
  return transformSelectedLines(
    value,
    selection,
    (line, index) => `${index + 1}. ${line.replace(/^\s{0,3}(?:[-*+]\s+|\d+\.\s+)/, '') || 'list item'}`,
    'list item',
  );
}

function toggleWrap(
  value: string,
  selection: EditorSelection,
  marker: string,
  placeholder: string,
): EditorTransformResult {
  const selected = value.slice(selection.start, selection.end);

  if (!selected) {
    return replaceRange(value, selection.start, selection.end, `${marker}${placeholder}${marker}`, marker.length, placeholder.length);
  }

  if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= marker.length * 2) {
    const unwrapped = selected.slice(marker.length, selected.length - marker.length);
    return replaceRange(value, selection.start, selection.end, unwrapped, 0, unwrapped.length);
  }

  return replaceRange(value, selection.start, selection.end, `${marker}${selected}${marker}`, marker.length, selected.length);
}

function applyCodeBlock(value: string, selection: EditorSelection): EditorTransformResult {
  const selected = value.slice(selection.start, selection.end);
  const code = selected || 'const value = true;';
  const fence = '```';
  const prefix = `${fence}ts\n`;
  const replacement = `${prefix}${code}\n${fence}`;
  return replaceRange(value, selection.start, selection.end, `\n${replacement}\n`, prefix.length + 1, code.length);
}

function applyLink(value: string, selection: EditorSelection): EditorTransformResult {
  const selected = value.slice(selection.start, selection.end) || 'link text';
  const replacement = `[${selected}](https://example.com)`;
  return replaceRange(value, selection.start, selection.end, replacement, 1, selected.length);
}

function applyTable(value: string, selection: EditorSelection): EditorTransformResult {
  const table = [
    '',
    '| Column A | Column B |',
    '| --- | --- |',
    '| Value | Value |',
    '',
  ].join('\n');
  return replaceRange(value, selection.start, selection.end, table, 3, 8);
}

export function applyEditorAction(
  value: string,
  selection: EditorSelection,
  action: InsertAction,
): EditorTransformResult {
  if (action === 'h1') return applyHeading(value, selection, 1);
  if (action === 'h2') return applyHeading(value, selection, 2);
  if (action === 'h3') return applyHeading(value, selection, 3);
  if (action === 'bold') return toggleWrap(value, selection, '**', 'bold text');
  if (action === 'italic') return toggleWrap(value, selection, '*', 'italic text');
  if (action === 'inline-code') return toggleWrap(value, selection, '`', 'code');
  if (action === 'code-block') return applyCodeBlock(value, selection);
  if (action === 'link') return applyLink(value, selection);
  if (action === 'quote') return applyQuote(value, selection);
  if (action === 'ul') return applyUnorderedList(value, selection);
  if (action === 'ol') return applyOrderedList(value, selection);
  return applyTable(value, selection);
}

export { replaceRange };
