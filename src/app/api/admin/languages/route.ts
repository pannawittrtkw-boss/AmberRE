import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const LOCALES = ["th", "en", "zh", "my"] as const;
const MESSAGES_DIR = path.join(process.cwd(), "src", "messages");

function flattenObject(obj: Record<string, any>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], fullKey));
    } else {
      result[fullKey] = String(obj[key] ?? "");
    }
  }
  return result;
}

function setNestedValue(obj: Record<string, any>, keyPath: string, value: string) {
  const keys = keyPath.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current) || typeof current[keys[i]] !== "object") {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

// GET - Read all translation files
export async function GET() {
  try {
    const translations: Record<string, Record<string, string>> = {};

    for (const locale of LOCALES) {
      const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
      const content = await fs.readFile(filePath, "utf-8");
      const json = JSON.parse(content);
      translations[locale] = flattenObject(json);
    }

    // Collect all unique keys
    const allKeys = new Set<string>();
    for (const locale of LOCALES) {
      for (const key of Object.keys(translations[locale])) {
        allKeys.add(key);
      }
    }

    // Build rows
    const rows = Array.from(allKeys)
      .sort()
      .map((key) => ({
        key,
        th: translations.th[key] || "",
        en: translations.en[key] || "",
        zh: translations.zh[key] || "",
        my: translations.my[key] || "",
      }));

    return NextResponse.json({ success: true, data: rows });
  } catch (error: unknown) {
    console.error("Languages GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PUT - Update a translation value
export async function PUT(req: NextRequest) {
  try {
    const { key, locale, value } = await req.json();

    if (!key || !locale || !LOCALES.includes(locale)) {
      return NextResponse.json(
        { success: false, error: "Invalid key or locale" },
        { status: 400 }
      );
    }

    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const content = await fs.readFile(filePath, "utf-8");
    const json = JSON.parse(content);

    setNestedValue(json, key, value);

    await fs.writeFile(filePath, JSON.stringify(json, null, 2) + "\n", "utf-8");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Languages PUT error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST - Add a new translation key
export async function POST(req: NextRequest) {
  try {
    const { key, th, en, zh, my } = await req.json();

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Key is required" },
        { status: 400 }
      );
    }

    const values: Record<string, string> = { th: th || "", en: en || "", zh: zh || "", my: my || "" };

    for (const locale of LOCALES) {
      const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
      const content = await fs.readFile(filePath, "utf-8");
      const json = JSON.parse(content);

      setNestedValue(json, key, values[locale]);

      await fs.writeFile(filePath, JSON.stringify(json, null, 2) + "\n", "utf-8");
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Languages POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE - Remove a translation key
export async function DELETE(req: NextRequest) {
  try {
    const { key } = await req.json();

    if (!key) {
      return NextResponse.json(
        { success: false, error: "Key is required" },
        { status: 400 }
      );
    }

    function deleteNestedKey(obj: Record<string, any>, keyPath: string) {
      const keys = keyPath.split(".");
      let current = obj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) return;
        current = current[keys[i]];
      }
      delete current[keys[keys.length - 1]];
    }

    for (const locale of LOCALES) {
      const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
      const content = await fs.readFile(filePath, "utf-8");
      const json = JSON.parse(content);

      deleteNestedKey(json, key);

      await fs.writeFile(filePath, JSON.stringify(json, null, 2) + "\n", "utf-8");
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Languages DELETE error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
