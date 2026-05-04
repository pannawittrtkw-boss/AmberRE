// Bilingual catalogs for contract attachments. These match the company's
// existing furniture/appliance form on the property page so contracts can
// reuse the same vocabulary.

export type Bilingual = { key: string; th: string; en: string };

export const FURNITURE_OPTIONS: Bilingual[] = [
  { key: "bed", th: "เตียง", en: "Bed" },
  { key: "mattress", th: "ฟูก / ที่นอน", en: "Mattress" },
  { key: "wardrobe", th: "ตู้เสื้อผ้า", en: "Wardrobe" },
  { key: "dressingTable", th: "โต๊ะเครื่องแป้ง", en: "Dressing Table" },
  { key: "sofa", th: "โซฟา", en: "Sofa" },
  { key: "coffeeTable", th: "โต๊ะกลาง", en: "Coffee Table" },
  { key: "tvCabinet", th: "ชั้นวางทีวี", en: "TV Cabinet" },
  { key: "curtains", th: "ผ้าม่าน / มู่ลี่", en: "Curtains / Blinds" },
  { key: "kitchenCounter", th: "เคาน์เตอร์ครัว", en: "Kitchen Counter" },
  { key: "sink", th: "ซิงก์ล้างจาน", en: "Sink" },
  { key: "diningTable", th: "โต๊ะอาหาร", en: "Dining Table" },
  { key: "chairs", th: "เก้าอี้", en: "Chairs" },
  { key: "showerScreen", th: "ฉากกั้นอาบน้ำ", en: "Shower Screen" },
];

export const APPLIANCE_OPTIONS: Bilingual[] = [
  { key: "airConditioner", th: "แอร์", en: "Air Conditioner" },
  { key: "tv", th: "ทีวี", en: "TV" },
  { key: "refrigerator", th: "ตู้เย็น", en: "Refrigerator" },
  { key: "microwave", th: "ไมโครเวฟ", en: "Microwave" },
  { key: "stove", th: "เตาไฟฟ้า / เตาแก๊ส", en: "Stove" },
  { key: "cookerHood", th: "เครื่องดูดควัน", en: "Cooker Hood" },
  { key: "washingMachine", th: "เครื่องซักผ้า", en: "Washing Machine" },
  { key: "digitalDoorLock", th: "ดิจิตอลล็อค", en: "Digital Door Lock" },
  { key: "waterHeater", th: "เครื่องทำน้ำอุ่น", en: "Water Heater" },
];

export const OTHER_ITEM_OPTIONS: Bilingual[] = [
  { key: "roomKey", th: "กุญแจห้อง", en: "Room Key" },
  { key: "roomKeycard", th: "คีย์การ์ดเข้าห้อง", en: "Room Keycard" },
  { key: "mailboxKey", th: "กุญแจ Mailbox", en: "Mailbox Key" },
  { key: "buildingKeycard", th: "คีย์การ์ดเข้าอาคาร", en: "Building Keycard" },
  { key: "parkingKeycard", th: "คีย์การ์ดที่จอดรถ", en: "Parking Keycard" },
];

export type ContractItem = { key: string; qty: number };

/**
 * Parse the JSON-encoded list stored in a contract field.
 * Falls back to legacy newline-delimited text by returning an empty array
 * (legacy text won't have a "key" so PDF will simply skip those rows).
 */
export function parseContractItems(json: string | null | undefined): ContractItem[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x) => x && typeof x.key === "string" && typeof x.qty === "number" && x.qty > 0
      )
      .map((x) => ({ key: x.key, qty: Math.max(1, Math.floor(x.qty)) }));
  } catch {
    return [];
  }
}

export function findOption(
  options: Bilingual[],
  key: string
): Bilingual | undefined {
  return options.find((o) => o.key === key);
}

export function formatItemForPdf(
  item: ContractItem,
  options: Bilingual[]
): { th: string; en: string } | null {
  const opt = findOption(options, item.key);
  if (!opt) return null;
  return {
    th: `${opt.th} ${item.qty} ${item.qty > 0 ? "" : ""}`.trim() + ` (${item.qty})`,
    en: `${item.qty} × ${opt.en}`,
  };
}
