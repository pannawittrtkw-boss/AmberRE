import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "public", "thai-address");
const BASE = "https://raw.githubusercontent.com/kongvut/thai-province-data/master/formats/json";

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("⏳ Fetching provinces (77)...");
  const provinces = await fetchJSON(`${BASE}/provinces.json`);
  const provOut = provinces.map((p) => ({ id: p.id, nameTh: p.name_th, nameEn: p.name_en }));
  fs.writeFileSync(path.join(OUTPUT_DIR, "provinces.json"), JSON.stringify(provOut));
  console.log(`✅ Provinces: ${provOut.length} records`);

  console.log("⏳ Fetching districts (amphures)...");
  const districts = await fetchJSON(`${BASE}/districts.json`);
  const distOut = districts.map((d) => ({ id: d.id, nameTh: d.name_th, nameEn: d.name_en, provinceId: d.province_id }));
  fs.writeFileSync(path.join(OUTPUT_DIR, "amphures.json"), JSON.stringify(distOut));
  console.log(`✅ Districts: ${distOut.length} records`);

  console.log("⏳ Fetching subdistricts (tambons)...");
  const tambons = await fetchJSON(`${BASE}/sub_districts.json`);
  const tambOut = tambons.map((t) => ({ id: t.id, nameTh: t.name_th, nameEn: t.name_en, amphureId: t.district_id, zipCode: t.zip_code }));
  fs.writeFileSync(path.join(OUTPUT_DIR, "tambons.json"), JSON.stringify(tambOut));
  console.log(`✅ Subdistricts: ${tambOut.length} records`);

  console.log("\n🎉 Done! Files saved to public/thai-address/");
}

main().catch((e) => { console.error("❌ Error:", e.message); process.exit(1); });
