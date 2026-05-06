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
  // Thai national ID is 13 digits, often printed as "X XXXX XXXXX XX X"
  // Tesseract sometimes inserts spaces or O/0 confusion
  const cleaned = text.replace(/[ \-]/g, "");
  const match = cleaned.match(/(?:^|[^\d])(\d{13})(?:[^\d]|$)/);
  if (match) return match[1];
  // Try the spaced format on the raw text
  const spaced = text.match(/\b(\d)\s*(\d{4})\s*(\d{5})\s*(\d{2})\s*(\d)\b/);
  if (spaced) return spaced.slice(1).join("");
  return undefined;
}

function findPassportNumber(text: string): string | undefined {
  // Passport numbers are typically 1-2 letters + 6-8 digits, usually after
  // "Passport No" or in the MRZ at the bottom of the document.
  const labelMatch = text.match(/Passport\s*No\.?\s*[:\-]?\s*([A-Z]{1,2}\d{6,9})/i);
  if (labelMatch) return labelMatch[1].toUpperCase();
  // MRZ: line 2 starts with passport number followed by < pad
  const mrz = text.match(/^([A-Z0-9<]{9})/m);
  if (mrz) {
    const cleaned = mrz[1].replace(/</g, "");
    if (/^[A-Z]{1,2}\d{6,9}$/.test(cleaned)) return cleaned;
  }
  // Fallback: any standalone uppercase letters + digits sequence
  const generic = text.match(/\b([A-Z]{1,2}\d{6,9})\b/);
  if (generic) return generic[1];
  return undefined;
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
      if (surname) return surname;
    }
    if (/^Name\s*[:\-]?/i.test(ln)) {
      const v = ln.replace(/^Name\s*[:\-]?\s*/i, "").trim();
      if (v) return v;
      // value on next line
      if (lines[i + 1]) return lines[i + 1].trim();
    }
  }
  return undefined;
}

function findThaiAddress(lines: string[]): string | undefined {
  // "ที่อยู่" label can be alone on a line; the address spans 1-3 lines
  // until something like "วันออกบัตร" / "Date of Issue" / "วันที่ออกบัตร".
  const startIdx = lines.findIndex((ln) => /ที่อยู่/.test(ln));
  if (startIdx === -1) return undefined;
  const collected: string[] = [];
  // Capture text after the label on the same line
  const sameLine = lines[startIdx]
    .replace(/^.*?ที่อยู่\s*[:\-]?\s*/, "")
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
