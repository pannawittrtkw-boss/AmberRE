// Thai word segmentation for @react-pdf/renderer line wrapping.
//
// react-pdf's linebreak algorithm only knows to break at whitespace.
// Thai script has no inter-word spaces, so the engine cuts mid-character
// — producing things like "สูญหา / ย" (final character orphaned on the
// next line).
//
// Solution: insert U+200B (Zero-Width Space) at every CLDR-detected Thai
// word boundary. The ZWSP is invisible but is treated as a soft break
// opportunity by the linebreak algorithm, so wrapping happens between
// words. Unlike Font.registerHyphenationCallback, this approach does
// NOT inject a visible "-" at break points.

const THAI_RANGE = /[฀-๿]/;
const ZWSP = "​";

type SegmenterCtor = new (
  locale: string,
  options: { granularity: "word" | "grapheme" | "sentence" }
) => {
  segment(input: string): Iterable<{ segment: string; isWordLike?: boolean }>;
};

const SegmenterImpl: SegmenterCtor | null =
  typeof Intl !== "undefined" &&
  (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter
    ? ((Intl as unknown as { Segmenter: SegmenterCtor }).Segmenter as SegmenterCtor)
    : null;

const thaiSegmenter = SegmenterImpl
  ? new SegmenterImpl("th", { granularity: "word" })
  : null;

/**
 * Inserts a U+200B (Zero-Width Space) at every CLDR Thai word boundary.
 * The ZWSP is invisible but tells the line-break algorithm that this is
 * a valid place to wrap. Non-Thai input is returned unchanged.
 */
export function insertThaiBreaks(text: string): string {
  if (!text || !thaiSegmenter) return text;
  if (!THAI_RANGE.test(text)) return text;
  try {
    const fragments: string[] = [];
    for (const seg of thaiSegmenter.segment(text)) {
      if (seg.segment) fragments.push(seg.segment);
    }
    if (fragments.length <= 1) return text;
    return fragments.join(ZWSP);
  } catch {
    return text;
  }
}

/**
 * Splits a string at CLDR Thai word boundaries and returns the fragments.
 * Used to render each Thai word as its own <Text> run so @react-pdf/renderer
 * can break between runs without inserting any character (hyphen or
 * otherwise).
 */
export function splitThai(text: string): string[] {
  if (!text || !thaiSegmenter) return [text];
  if (!THAI_RANGE.test(text)) return [text];
  try {
    const fragments: string[] = [];
    for (const seg of thaiSegmenter.segment(text)) {
      if (seg.segment) fragments.push(seg.segment);
    }
    return fragments.length > 0 ? fragments : [text];
  } catch {
    return [text];
  }
}
