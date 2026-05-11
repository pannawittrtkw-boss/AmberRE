// Best-effort parser that takes raw OCR text from a Thai national ID card
// or a passport image and pulls out structured fields. Tesseract.js OCR
// quality on the Thai script is mediocre, so the form should let the user
// review and correct before saving.

export interface OcrParsedFields {
  name?: string;
  // English-only rendering of the holder's name. For Thai IDs this is the
  // bilingual Latin transliteration printed under the Thai name (e.g.
  // "Miss Panida Srijampa"). For passports it equals `name` since
  // passports only carry the Latin form.
  nameEn?: string;
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
  // Passport numbers are typically 1-2 letters + 6-8 digits.
  //
  // Strategy 1: explicit "Passport No" label followed by the value.
  const labelPatterns = [
    /Passport\s*No\.?\s*[:\-]?\s*([A-Z][A-Z0-9]{6,9})/i,
    /Passport\s*Number\s*[:\-]?\s*([A-Z][A-Z0-9]{6,9})/i,
    /Passport\s*[:\-]\s*([A-Z][A-Z0-9]{6,9})/i,
  ];
  for (const pat of labelPatterns) {
    const m = text.match(pat);
    if (m) return cleanPassport(m[1]);
  }

  // Strategy 2: MRZ line 2 specifically. The passport number lives in the
  // first 9 chars of the line that starts with 1-2 uppercase letters
  // followed by digits or `<` padding (e.g. "A061511442ZAF..." or
  // "MK141129<8MMR..."). MRZ line 1 starts with the document type + the
  // holder's surname (more letters), so requiring digits early in the
  // run prevents picking up the wrong line.
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const ln of lines) {
    if (ln.length < 10) continue;
    const m = ln.match(/^([A-Z]{1,2})([\d<][A-Z0-9<]{6,})/);
    if (!m) continue;
    const first9 = (m[1] + m[2]).slice(0, 9);
    const passportNum = first9.replace(/</g, "");
    if (/^[A-Z]{1,2}\d{5,}$/.test(passportNum)) {
      return passportNum;
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

// Heuristic: a multi-word passport name line is uppercase Latin letters
// with at least one space. Used as a generic fallback when we have no
// label context (e.g. Myanmar passport with "Name SU LEI NANDAR").
//
// IMPORTANT: case sensitive — accepting mixed case lets noise like
// "Passport No No" pass through.
const looksLikePassportName = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed.length < 5) return false;
  if (!/\s/.test(trimmed)) return false; // require multi-word
  if (/[0-9<>]/.test(trimmed)) return false;
  return /^[A-Z][A-Z\s'\-.]+[A-Z]$/.test(trimmed);
};

// Looser variant for single-token names (e.g. "PIENAAR" surname only).
// Still requires UPPERCASE so we don't accept random text fragments.
const looksLikeUppercaseToken = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed.length < 2) return false;
  if (/[0-9<>]/.test(trimmed)) return false;
  return /^[A-Z][A-Z\s'\-.]*[A-Z]$/.test(trimmed);
};

// Skip-list when scanning for a name value: passport labels in English
// or French (SA passports are bilingual EN/FR), country/sex codes,
// MRZ rows, and 3-letter country codes.
const isPassportNameSkippable = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (isPassportLabel(trimmed)) return true;
  // French equivalents and dual labels like "Surname / Nom"
  if (/^(?:Nom|Prénoms?|Pr[ée]noms?|Nationalit[ée]|Date\s*de)/i.test(trimmed))
    return true;
  if (/^(?:Surname|Last\s*name|Given\s*names?|Name)\s*[\/\\]/i.test(trimmed))
    return true;
  if (/^[A-Z]{2,4}$/.test(trimmed)) return true; // country / type / sex
  if (/^[A-Z0-9<]+$/.test(trimmed) && trimmed.includes("<")) return true; // MRZ
  if (/^[—\-_]+$/.test(trimmed)) return true;
  if (/^\d+$/.test(trimmed)) return true;
  return false;
};

function findValueAfterLabel(
  lines: string[],
  startIdx: number,
  maxAhead: number = 6
): string | undefined {
  for (let j = startIdx + 1; j < Math.min(lines.length, startIdx + maxAhead); j++) {
    const candidate = lines[j].trim();
    if (isPassportNameSkippable(candidate)) continue;
    if (looksLikeUppercaseToken(candidate)) return candidate;
  }
  return undefined;
}

function findEnglishName(lines: string[]): string | undefined {
  let surname: string | undefined;
  let givenNames: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();

    // Surname / Last name / Nom (French)
    if (
      !surname &&
      /^(?:Surname|Last\s*name|Nom)\b/i.test(ln) &&
      !/Given|Pr[ée]noms?/i.test(ln)
    ) {
      // Try same-line value first (e.g. "Surname: PIENAAR")
      const sameLine = ln
        .replace(/^(?:Surname|Last\s*name|Nom)\s*[\/\\]?\s*\w*\s*[:\-]?\s*/i, "")
        .trim();
      if (sameLine && looksLikeUppercaseToken(sameLine)) {
        surname = sameLine;
      } else {
        const v = findValueAfterLabel(lines, i);
        if (v) surname = v;
      }
    }

    // Given names / Prénoms (French) / Name
    if (
      !givenNames &&
      /^(?:Given\s*names?|Pr[ée]noms?|Name)\b/i.test(ln) &&
      !/^(?:Surname|Last\s*name|Nom)\b/i.test(ln)
    ) {
      const sameLine = ln
        .replace(/^(?:Given\s*names?|Pr[ée]noms?|Name)\s*[\/\\]?\s*\w*\s*[:\-]?\s*/i, "")
        .trim();
      if (sameLine && looksLikeUppercaseToken(sameLine)) {
        givenNames = sameLine;
      } else {
        const v = findValueAfterLabel(lines, i);
        if (v) givenNames = v;
      }
    }
  }

  if (givenNames && surname) return `${givenNames} ${surname}`;
  if (surname) return surname;
  if (givenNames) return givenNames;

  // Last-resort fallback: a multi-word uppercase line anywhere in the OCR
  // output. Helps Myanmar-style passports where Vision drops "Name" and
  // its value into separate text blocks.
  for (const ln of lines) {
    const trimmed = ln.trim();
    if (looksLikePassportName(trimmed)) return trimmed;
  }

  return undefined;
}

// Thai national ID cards print the holder's English name on the same
// face of the card under labels like "Name Miss Panida" and
// "Last name Srijampa". The text is mixed-case so it doesn't match
// `findEnglishName` (which requires uppercase passport-style tokens) —
// this helper handles the Thai-ID layout specifically.
function findThaiIdEnglishName(lines: string[]): string | undefined {
  let givenNames: string | undefined;
  let surname: string | undefined;

  // Strip a label prefix from a line and return the remaining value if it
  // contains Latin letters.
  const valueAfter = (ln: string, labelRe: RegExp): string | undefined => {
    const stripped = ln.replace(labelRe, "").trim();
    if (stripped && /[A-Za-z]/.test(stripped) && !/[฀-๿]/.test(stripped)) {
      return stripped;
    }
    return undefined;
  };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];

    if (!surname && /^Last\s*name\b/i.test(ln)) {
      surname =
        valueAfter(ln, /^Last\s*name\s*[:\-]?\s*/i) ||
        // Value may be on the next non-empty Latin line
        lines.slice(i + 1, i + 3).find((next) => /[A-Za-z]/.test(next) && !/[฀-๿]/.test(next))?.trim();
    }

    // "Name" label, but NOT "Last name" — and NOT after we already matched
    // surname on this line. Skip the label that's bilingual with Thai
    // labels like "ชื่อตัวและชื่อสกุล Name".
    if (!givenNames && /(?:^|\s)Name\b/i.test(ln) && !/^Last\s*name/i.test(ln)) {
      // Drop everything up through the "Name" anchor
      givenNames =
        valueAfter(ln, /^.*?Name\s*[:\-]?\s*/i) ||
        lines.slice(i + 1, i + 3).find((next) => /[A-Za-z]/.test(next) && !/[฀-๿]/.test(next))?.trim();
    }
  }

  if (givenNames && surname) return `${givenNames} ${surname}`;
  if (givenNames) return givenNames;
  if (surname) return surname;
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
    const passportName = findEnglishName(lines);
    return {
      documentType: "passport",
      name: passportName,
      // Passports only carry the Latin name — mirror it into nameEn so
      // callers can fill an "EN" form field without re-detecting doc type.
      nameEn: passportName,
      idNumber: findPassportNumber(text),
      nationality: findNationality(text),
    };
  }

  // Default to Thai ID card parsing — Thai IDs are bilingual, so try to
  // pull the Latin transliteration too (mixed-case "Miss Panida Srijampa"
  // form, distinct from the all-caps passport form).
  return {
    documentType: docType,
    name: findThaiName(lines) || findEnglishName(lines),
    nameEn: findThaiIdEnglishName(lines) || findEnglishName(lines),
    idNumber: findThaiIdNumber(text) || findPassportNumber(text),
    address: findThaiAddress(lines),
    nationality: findNationality(text) || (isThaiId ? "ไทย" : undefined),
  };
}
