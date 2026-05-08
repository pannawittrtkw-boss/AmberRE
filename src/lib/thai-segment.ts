// Thai word segmentation for @react-pdf/renderer line wrapping.
//
// react-pdf uses a Knuth-Plass linebreak algorithm that breaks at
// whitespace. Thai script has no inter-word spaces, so the engine ends
// up cutting at arbitrary character boundaries — producing things like
// "สูญหา / ย" (the final character orphaned on the next line).
//
// Modern Node.js / browsers ship Intl.Segmenter with proper Thai word
// boundary detection (CLDR data). We use it via
// Font.registerHyphenationCallback, which lets us hand react-pdf an array
// of word fragments. The engine treats each fragment as a separate word,
// so it now wraps at Thai word boundaries instead of mid-character.

const THAI_RANGE = /[฀-๿]/;

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
 * Returns an array of word-fragment strings suitable for
 * Font.registerHyphenationCallback. Non-Thai input is returned as-is so
 * English / numeric words keep their natural hyphenation behaviour.
 */
export function segmentForHyphenation(word: string): string[] {
  if (!word || !thaiSegmenter) return [word];
  if (!THAI_RANGE.test(word)) return [word];
  try {
    const fragments: string[] = [];
    for (const seg of thaiSegmenter.segment(word)) {
      if (seg.segment) fragments.push(seg.segment);
    }
    return fragments.length > 0 ? fragments : [word];
  } catch {
    return [word];
  }
}
