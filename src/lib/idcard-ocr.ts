// Best-effort parser that takes raw OCR text from a Thai national ID card
// or a passport image and pulls out structured fields. Tesseract.js OCR
// quality on the Thai script is mediocre, so the form should let the user
// review and correct before saving.

export interface OcrParsedFields {
  name?: string;
  idNumber?: string;
  address?: string;
  nationality?: string;
  documentType?: "thai_id" | "passport" | "unknown";
}

const stripDiacriticsAndSpaces = (s: string) =>
  s.replace(/[\s​]/g, "").toLowerCase();

function findThaiIdNumber(text: string): string | undefined {
  // Thai national ID is 13 digits, often printed as "X XXXX XXXXX XX X".
  // Tesseract may read O/Q/D as 0, l/I as 1, S as 5 — normalise digits-only
  // pockets before matching.
  const normalised = text
    .replace(/[OQD]/g, "0")
    .replace(/[Il]/g, "1")
    .replace(/[S]/g, "5");

  const cleaned = normalised.replace(/[ \-]/g, "");
  const exact = cleaned.match(/(?:^|[^\d])(\d{13})(?:[^\d]|$)/);
  if (exact) return exact[1];

  // Try the spaced format on the normalised text (both standard and Thai
  // 13-digit groupings).
  const spaced = normalised.match(/\b(\d)\s*(\d{4})\s*(\d{5})\s*(\d{2})\s*(\d)\b/);
  if (spaced) return spaced.slice(1).join("");

  return undefined;
}

function findPassportNumber(text: string): string | undefined {
  // Passport numbers are typically 1-2 letters + 6-8 digits, usually after
  // "Passport No" or in the MRZ at the bottom of the document. Tesseract
  // often confuses I↔1 and O↔0 in passport-number text, so we try multiple
  // matching strategies and pick the first that looks plausible.
  //
  // Strategy 1: explicit "Passport No[. :] XX9999999" label
  const labelPatterns = [
    /Passport\s*No\.?\s*[:\-]?\s*([A-Z][A-Z0-9]{6,9})/i,
    /Passport\s*Number\s*[:\-]?\s*([A-Z][A-Z0-9]{6,9})/i,
    /Passport\s*[:\-]\s*([A-Z][A-Z0-9]{6,9})/i,
  ];
  for (const pat of labelPatterns) {
    const m = text.match(pat);
    if (m) return cleanPassport(m[1]);
  }

  // Strategy 2: scan the MRZ at the bottom — line that starts with the
  // passport number followed by `<` padding. Length 9 is the canonical MRZ
  // first chunk but Tesseract sometimes drops the trailing check digit.
  const mrzLines = text.split("\n").filter((l) => /[A-Z0-9<]{8,}/.test(l));
  for (const ln of mrzLines) {
    const m = ln.match(/([A-Z][A-Z0-9]{5,9})</);
    if (m) {
      const cleaned = cleanPassport(m[1]);
      if (cleaned) return cleaned;
    }
  }

  // Strategy 3: any standalone uppercase letters + digits sequence
  const generic = text.match(/\b([A-Z]{1,2}\d{6,9})\b/);
  if (generic) return generic[1];

  return undefined;
}

function cleanPassport(raw: string): string {
  // Tesseract often reads "I" instead of "1" in the digit portion. Keep the
  // first letter(s) untouched, but normalise the trailing characters: I→1,
  // O→0, S→5 within what should be digits.
  if (!raw) return raw;
  const m = raw.match(/^([A-Z]{1,2})(.+)$/);
  if (!m) return raw;
  const letters = m[1];
  const tail = m[2]
    .replace(/[Il]/g, "1")
    .replace(/O/g, "0")
    .replace(/S/g, "5");
  return letters + tail;
}

function findThaiName(lines: string[]): string | undefined {
  // Look for the line containing "ชื่อตัวและชื่อสกุล" or just "ชื่อ"
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/ชื่อ.*สกุล/.test(ln) || /^ชื่อ/.test(ln) || /Name/i.test(ln)) {
      // The Thai name is often on the same line after the label
      const sameLine = ln
        .replace(/^.*?(?:สกุล|Name)\s*[:\-]?\s*/i, "")
        .trim();
      if (sameLine && /[฀-๿]/.test(sameLine) && sameLine.length > 2) {
        return sameLine;
      }
      // Or on the next line
      if (i + 1 < lines.length && /[฀-๿]/.test(lines[i + 1])) {
        return lines[i + 1].trim();
      }
    }
  }
  // Fallback: first line with mostly Thai characters that has "นาย/นาง/น.ส."
  for (const ln of lines) {
    if (/^(?:นาย|นาง|น\.?ส\.?|เด็กชาย|เด็กหญิง)\s+/u.test(ln)) {
      return ln.trim();
    }
  }
  return undefined;
}

// Passport / ID-card labels that may appear stacked together in the OCR
// text before any actual value. We must skip past these when searching
// for the holder's name (or any other field) so we don't treat a label
// as the value.
const PASSPORT_LABEL_PATTERNS = [
  /^Type$/i,
  /^Country\s*code$/i,
  /^Passport\s*No\.?$/i,
  /^Passport\s*Number$/i,
  /^Nationality$/i,
  /^Date\s*of\s*birth$/i,
  /^Sex$/i,
  /^Place\s*of\s*birth$/i,
  /^Date\s*of\s*issue$/i,
  /^Authority$/i,
  /^Date\s*of\s*expiry$/i,
  /^Holder.?s\s*signature$/i,
  /^Surname$/i,
  /^Last\s*name$/i,
  /^Given\s*names?$/i,
  /^Name$/i,
];

const isPassportLabel = (line: string): boolean => {
  const trimmed = line.trim();
  return PASSPORT_LABEL_PATTERNS.some((re) => re.test(trimmed));
};

// Heuristic: a passport name line is uppercase Latin letters with at
// least one space (i.e. multi-word). Single-token uppercase strings like
// "MMR" or "PJ" are nearly always country codes, sex codes, or passport
// types — never names — so we reject them.
const looksLikePassportName = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed.length < 5) return false;
  if (!/\s/.test(trimmed)) return false; // require multi-word
  if (!/[A-Z]/.test(trimmed)) return false;
  // Reject anything with digits (likely passport number, date) or `<` (MRZ)
  if (/[0-9<>]/.test(trimmed)) return false;
  // Allow A-Z, spaces, hyphens, apostrophes
  return /^[A-Z][A-Z\s'\-.]+[A-Z]$/i.test(trimmed);
};

function findEnglishName(lines: string[]): string | undefined {
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    // Surname/Last Name then Name on subsequent lines (passport format)
    if (/^(?:Surname|Last\s*name)/i.test(ln)) {
      const surname = ln.replace(/^(?:Surname|Last\s*name)\s*[:\-]?\s*/i, "").trim();
      const next = lines[i + 1] || "";
      if (/^(?:Given\s*names?|Name)/i.test(next)) {
        const given = next.replace(/^(?:Given\s*names?|Name)\s*[:\-]?\s*/i, "").trim();
        if (given && surname) return `${given} ${surname}`;
      }
      if (surname && !isPassportLabel(surname)) return surname;
    }
    if (/^Name\s*[:\-]?/i.test(ln)) {
      // Same-line value first
      const v = ln.replace(/^Name\s*[:\-]?\s*/i, "").trim();
      if (v && !isPassportLabel(v) && looksLikePassportName(v)) return v;
      // Otherwise scan forward — Vision often returns labels in a block
      // before the values, so we keep skipping past:
      //   * other passport labels (Country code, Passport No, ...),
      //   * short uppercase tokens that are country/type/sex codes (1-4 chars),
      //   * digit-only / MRZ-only lines,
      // until we find a multi-word uppercase name.
      for (let j = i + 1; j < Math.min(lines.length, i + 12); j++) {
        const candidate = lines[j].trim();
        if (!candidate) continue;
        if (isPassportLabel(candidate)) continue;
        if (/^[—\-_]+$/.test(candidate)) continue;
        if (/^\d+$/.test(candidate)) continue;
        if (/^[A-Z]{2,4}$/.test(candidate)) continue; // country / type code
        if (/^[A-Z0-9<]+$/.test(candidate)) continue; // MRZ row
        if (looksLikePassportName(candidate)) return candidate;
      }
    }
  }

  // Fallback: scan for an obvious uppercase passport-style name with at
  // least 2 words. Helps when OCR doesn't surface the "Name" label at all.
  for (const ln of lines) {
    const trimmed = ln.trim();
    if (looksLikePassportName(trimmed) && /\s/.test(trimmed)) {
      return trimmed;
    }
  }

  return undefined;
}

function findThaiAddress(lines: string[]): string | undefined {
  // "ที่อยู่" label can be alone on a line; the address spans 1-3 lines
  // until something like "วันออกบัตร" / "Date of Issue" / "วันที่ออกบัตร".
  // Tesseract may garble "ที่อยู่" into "ทอย", "ที่ยู่", or split it across
  // lines. Try a few looser anchors before giving up.
  const anchors = [/ที่อยู่/, /ที่อยู/, /ทอยู/, /ทีอยู/];
  let startIdx = -1;
  for (const re of anchors) {
    startIdx = lines.findIndex((ln) => re.test(ln));
    if (startIdx !== -1) break;
  }

  // Strategy 2: if no label match, use heuristic — look for a line that
  // contains a Thai administrative keyword (ตำบล, ต., อำเภอ, อ., จังหวัด, จ.).
  if (startIdx === -1) {
    startIdx = lines.findIndex((ln) =>
      /(?:ตำบล|ต\.|อำเภอ|อ\.|จังหวัด|จ\.|แขวง|เขต|หมู่ที่|ม\.\s*\d)/.test(ln)
    );
    if (startIdx === -1) return undefined;
    // For heuristic match, include the matched line too
    const collected: string[] = [lines[startIdx].trim()];
    for (let i = startIdx + 1; i < Math.min(lines.length, startIdx + 3); i++) {
      const ln = lines[i].trim();
      if (!ln) continue;
      if (/(?:วันออก|Date of Issue|วันบัตรหมดอายุ|Date of Expiry|เจ้าพนักงาน)/i.test(ln)) break;
      if (/[฀-๿]/.test(ln)) collected.push(ln);
      else break;
    }
    return collected.join(" ").trim() || undefined;
  }

  const collected: string[] = [];
  const sameLine = lines[startIdx]
    .replace(/^.*?(?:ที่อยู่|ที่อยู|ทอยู|ทีอยู)\s*[:\-]?\s*/, "")
    .trim();
  if (sameLine) collected.push(sameLine);
  for (let i = startIdx + 1; i < Math.min(lines.length, startIdx + 4); i++) {
    const ln = lines[i].trim();
    if (!ln) continue;
    if (/(?:วันออก|Date of Issue|วันบัตรหมดอายุ|Date of Expiry|เจ้าพนักงาน)/i.test(ln)) break;
    if (/[฀-๿]/.test(ln)) collected.push(ln);
  }
  return collected.join(" ").trim() || undefined;
}

function findNationality(text: string): string | undefined {
  const m = text.match(/Nationality\s*[:\-]?\s*([A-Z][A-Za-z]+)/);
  if (m) return m[1];
  if (/MYANMAR/i.test(text)) return "Myanmar";
  if (/THAI/i.test(text) || /สัญชาติไทย/.test(text)) return "Thai";
  return undefined;
}

export function parseIdCardOcr(rawText: string): OcrParsedFields {
  const text = rawText.replace(/\r/g, "");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Document type detection
  const norm = stripDiacriticsAndSpaces(text);
  const isPassport =
    /passport/i.test(text) ||
    /^[A-Z]{1,2}\d{6,9}$/m.test(text) ||
    norm.includes("passportno");
  const isThaiId =
    /บัตรประจำตัวประชาชน/.test(text) ||
    /Thai National ID Card/i.test(text) ||
    /เลขประจำตัวประชาชน/.test(text) ||
    /Identification\s*Number/i.test(text);

  const docType: OcrParsedFields["documentType"] = isThaiId
    ? "thai_id"
    : isPassport
    ? "passport"
    : "unknown";

  if (docType === "passport") {
    return {
      documentType: "passport",
      name: findEnglishName(lines),
      idNumber: findPassportNumber(text),
      nationality: findNationality(text),
    };
  }

  // Default to Thai ID card parsing
  return {
    documentType: docType,
    name: findThaiName(lines) || findEnglishName(lines),
    idNumber: findThaiIdNumber(text) || findPassportNumber(text),
    address: findThaiAddress(lines),
    nationality: findNationality(text) || (isThaiId ? "ไทย" : undefined),
  };
}
