import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "public", "thai-address");

function readJSON(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf-8"));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const provinceId = searchParams.get("province_id");
  const amphureId = searchParams.get("amphure_id");

  try {
    if (type === "provinces") {
      const data = readJSON("provinces.json");
      return NextResponse.json({ success: true, data }, {
        headers: { "Cache-Control": "public, max-age=86400" },
      });
    }

    if (type === "districts" && provinceId) {
      const all = readJSON("amphures.json") as { id: number; nameTh: string; provinceId: number }[];
      const filtered = all.filter((a) => String(a.provinceId) === provinceId);
      return NextResponse.json({ success: true, data: filtered }, {
        headers: { "Cache-Control": "public, max-age=86400" },
      });
    }

    if (type === "tambons" && amphureId) {
      const all = readJSON("tambons.json") as { id: number; nameTh: string; amphureId: number; zipCode?: number }[];
      const filtered = all.filter((t) => String(t.amphureId) === amphureId);
      return NextResponse.json({ success: true, data: filtered }, {
        headers: { "Cache-Control": "public, max-age=86400" },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid params" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
