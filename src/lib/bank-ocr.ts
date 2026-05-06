// Best-effort parser for Thai bank book / account-info screenshots.
// Tesseract.js OCR quality on Thai script is uneven, so the form should
// let the user review the auto-filled fields before saving.

export interface BankOcrFields {
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNumber?: string;
}

// Each entry maps a canonical THAI_BANKS option (the same string the form
// uses) to substrings that may appear in OCR output. The first matching
// alias wins, so put more specific entries first when banks share words.
const BANK_ALIASES: { canonical: string; aliases: string[] }[] = [
  {
    canonical: "ธนาคารกสิกรไทย (Kasikornbank — KBANK)",
    aliases: ["กสิกรไทย", "KASIKORNBANK", "KBANK", "K BANK"],
  },
  {
    canonical: "ธนาคารกรุงเทพ (Bangkok Bank — BBL)",
    aliases: ["กรุงเทพ", "BANGKOK BANK", "BBL"],
  },
  {
    canonical: "ธนาคารไทยพาณิชย์ (Siam Commercial Bank — SCB)",
    aliases: ["ไทยพาณิชย์", "SIAM COMMERCIAL", "SCB"],
  },
  {
    canonical: "ธนาคารกรุงไทย (Krungthai Bank — KTB)",
    aliases: ["กรุงไทย", "KRUNGTHAI", "KTB"],
  },
  {
    canonical: "ธนาคารกรุงศรีอยุธยา (Krungsri — BAY)",
    aliases: ["กรุงศรี", "อยุธยา", "KRUNGSRI", "BAY"],
  },
  {
    canonical: "ธนาคารทหารไทยธนชาต (TMBThanachart — TTB)",
    aliases: ["ทหารไทยธนชาต", "ทีทีบี", "TMBTHANACHART", "TTB"],
  },
  {
    canonical: "ธนาคารยูโอบี (UOB)",
    aliases: ["ยูโอบี", "UOB"],
  },
  {
    canonical: "ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)",
    aliases: ["แลนด์ แอนด์", "LH BANK", "LH"],
  },
  {
    canonical: "ธนาคารซีไอเอ็มบี ไทย (CIMB Thai)",
    aliases: ["ซีไอเอ็มบี", "CIMB"],
  },
  {
    canonical: "ธนาคารเกียรตินาคินภัทร (KKP)",
    aliases: ["เกียรตินาคิน", "KIATNAKIN", "KKP"],
  },
  {
    canonical: "ธนาคารทิสโก้ (Tisco Bank)",
    aliases: ["ทิสโก้", "TISCO"],
  },
  {
    canonical: "ธนาคารไอซีบีซี ไทย (ICBC Thai)",
    aliases: ["ไอซีบีซี", "ICBC"],
  },
  {
    canonical: "ธนาคารสแตนดาร์ดชาร์เตอร์ด ไทย (Standard Chartered)",
    aliases: ["สแตนดาร์ด", "STANDARD CHARTERED"],
  },
  {
    canonical: "ธนาคารเอชเอสบีซี ไทย (HSBC Thailand)",
    aliases: ["เอชเอสบีซี", "HSBC"],
  },
  {
    canonical: "ธนาคารออมสิน (Government Savings Bank — GSB)",
    aliases: ["ออมสิน", "GOVERNMENT SAVINGS", "GSB"],
  },
  {
    canonical: "ธนาคารอาคารสงเคราะห์ (GHB)",
    aliases: ["อาคารสงเคราะห์", "GHB"],
  },
  {
    canonical: "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BAAC)",
    aliases: ["เพื่อการเกษตร", "BAAC"],
  },
  {
    canonical: "ธนาคารอิสลามแห่งประเทศไทย (IBank)",
    aliases: ["อิสลาม", "ISLAMIC", "IBANK"],
  },
];

function findBankName(text: string): string | undefined {
  const upper = text.toUpperCase();
  for (const { canonical, aliases } of BANK_ALIASES) {
    for (const alias of aliases) {
      const needle = alias.toUpperCase();
      if (upper.includes(needle)) return canonical;
    }
  }
  return undefined;
}

function findBranch(text: string, lines: string[]): string | undefined {
  // Pattern 1: "สาขา X" inline (but skip if X is itself a label like "Branch")
  const inline = text.match(/สาขา\s*[:\-]?\s*([^\n,]{1,40})/);
  if (inline) {
    const v = inline[1].trim();
    if (v && !/^[—\-]+$/.test(v) && !/^Branch$/i.test(v)) return v;
  }
  // Pattern 2: "Branch: X"
  const en = text.match(/Branch\s*[:\-]?\s*([^\n]{1,40})/i);
  if (en) {
    const v = en[1].trim();
    if (v && !/^สาขา$/i.test(v)) return v;
  }
  // Pattern 3: scan after a "สาขา" / "Branch" label line, skipping further
  // label lines (bilingual stacked layout).
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (/^(?:สาขา|Branch)$/i.test(ln)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const candidate = lines[j].trim();
        if (!candidate) continue;
        if (isLabelLine(candidate)) continue;
        if (/^[—\-_]+$/.test(candidate)) continue;
        if (candidate.length > 1) return candidate;
      }
    }
  }
  return undefined;
}

function findAccountNumber(text: string): string | undefined {
  // Most Thai bank accounts are 10 digits. Common formats:
  //   XXX-X-XXXXX-X  (KBank, BBL, SCB)
  //   XXX-XXX-XXXX   (Krungsri, KTB sometimes)
  //   XXXXXXXXXX     (raw)
  // Try formatted first because raw can collide with other long numbers
  const formatted = text.match(/(\d{3}[-\s]\d{1}[-\s]\d{5}[-\s]\d{1})/);
  if (formatted) return formatted[1].replace(/[\s]/g, "-");

  const generic = text.match(/(\d{3}[-\s]\d{3}[-\s]\d{4})/);
  if (generic) return generic[1].replace(/[\s]/g, "-");

  // Raw 10-digit number not adjacent to many other digits (avoid 13-digit
  // ID numbers). Allow optional whitespace between groups.
  const raw = text.match(/(?:^|[^\d])(\d{10})(?:[^\d]|$)/);
  if (raw) {
    const n = raw[1];
    // Format as XXX-X-XXXXX-X for readability
    return `${n.slice(0, 3)}-${n.slice(3, 4)}-${n.slice(4, 9)}-${n.slice(9, 10)}`;
  }
  return undefined;
}

// Lines that are themselves known labels on Thai/English bank books — we
// must skip past them when hunting for the actual value.
const LABEL_PATTERNS = [
  /^ชื่อบัญชี/i,
  /^Account\s*Name/i,
  /^เลขที่บัญชี/i,
  /^Account\s*No\.?/i,
  /^Account\s*Number/i,
  /^สาขา/i,
  /^Branch/i,
  /^ประเภทบัญชี/i,
  /^Account\s*Type/i,
  /^วันที่/i,
  /^Date/i,
];

const isLabelLine = (line: string): boolean => {
  const trimmed = line.trim();
  return LABEL_PATTERNS.some((re) => re.test(trimmed));
};

function findAccountName(lines: string[]): string | undefined {
  // Pattern 1: line right after a label like "ชื่อบัญชี" or "Account Name".
  // Bank books typically use bilingual labels stacked together:
  //
  //   ชื่อบัญชี
  //   Account Name
  //   น.ส. เกษศิรินทร์ จงสุขสันติกูล   ← actual value
  //
  // so when we land on a label line we must keep skipping additional label
  // lines until we hit something that looks like real content.
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/ชื่อบัญชี/i.test(ln) || /Account\s*Name/i.test(ln)) {
      // Try same-line value first (e.g. "ชื่อบัญชี: นายสมชาย")
      const sameLine = ln
        .replace(/^.*?(?:ชื่อบัญชี|Account\s*Name)\s*[:\-]?\s*/i, "")
        .trim();
      if (
        sameLine &&
        sameLine.length > 2 &&
        !/^[—\-_]+$/.test(sameLine) &&
        !isLabelLine(sameLine)
      ) {
        return sameLine;
      }
      // Otherwise scan forward, skipping any subsequent label lines
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const candidate = lines[j].trim();
        if (!candidate) continue;
        if (isLabelLine(candidate)) continue;
        if (/^[—\-_]+$/.test(candidate)) continue;
        if (candidate.length > 2) return candidate;
      }
    }
  }
  // Pattern 2: any line starting with นาย / นาง / น.ส. / MR / MISS
  for (const ln of lines) {
    if (/^(?:นาย|นาง|น\.?ส\.?|MR\.?|MRS\.?|MISS|MS\.?)\s+/iu.test(ln)) {
      return ln.trim();
    }
  }
  return undefined;
}

export function parseBankBookOcr(rawText: string): BankOcrFields {
  const text = rawText.replace(/\r/g, "");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    bankName: findBankName(text),
    bankBranch: findBranch(text, lines),
    accountNumber: findAccountNumber(text),
    accountName: findAccountName(lines),
  };
}
