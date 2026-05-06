import { getStationFullName, getStationThaiName } from "./stations";

const FURNITURE_MAP: Record<string, { en: string; th: string }> = {
  bed: { en: "Bed", th: "เตียง" },
  mattress: { en: "Mattress", th: "ฟูก/ที่นอน" },
  wardrobe: { en: "Wardrobe", th: "ตู้เสื้อผ้า" },
  dressingTable: { en: "Dressing Table", th: "โต๊ะเครื่องแป้ง" },
  sofa: { en: "Sofa", th: "โซฟา" },
  coffeeTable: { en: "Coffee Table", th: "โต๊ะกลาง" },
  tvCabinet: { en: "TV Cabinet", th: "ชั้นวางทีวี" },
  curtains: { en: "Curtains / Blinds", th: "ผ้าม่าน/มู่ลี่" },
  kitchenCounter: { en: "Kitchen Counter", th: "เคาน์เตอร์ครัว" },
  sink: { en: "Sink", th: "ซิงก์ล้างจาน" },
  diningTable: { en: "Dining Table", th: "โต๊ะอาหาร" },
  chairs: { en: "Chairs", th: "เก้าอี้" },
  showerScreen: { en: "Shower Screen", th: "ฉากกั้นอาบน้ำ" },
};

const APPLIANCE_MAP: Record<string, { en: string; th: string }> = {
  airConditioner: { en: "Air Conditioner", th: "แอร์" },
  tv: { en: "TV", th: "ทีวี" },
  refrigerator: { en: "Refrigerator", th: "ตู้เย็น" },
  microwave: { en: "Microwave", th: "ไมโครเวฟ" },
  stove: { en: "Stove", th: "เตาไฟฟ้า/เตาแก๊ส" },
  cookerHood: { en: "Cooker Hood", th: "เครื่องดูดควัน" },
  washingMachine: { en: "Washing Machine", th: "เครื่องซักผ้า" },
  digitalDoorLock: { en: "Digital Door Lock", th: "Digital Door Lock" },
  waterHeater: { en: "Water Heater", th: "เครื่องทำน้ำอุ่น" },
};

const FACILITY_MAP: Record<string, { en: string; th: string }> = {
  petFriendly: { en: "Pet-Friendly", th: "เลี้ยงสัตว์ได้" },
  convenienceStore: { en: "Convenience Store", th: "ร้านสะดวกซื้อ" },
  coWorkingSpace: { en: "Co-working Space", th: "Co-working Space" },
  evCharger: { en: "EV Charger", th: "EV Charger" },
  garden: { en: "Garden", th: "สวนหย่อม" },
  swimmingPool: { en: "Swimming Pool", th: "สระว่ายน้ำ" },
  parking: { en: "Parking", th: "ที่จอดรถ" },
  sauna: { en: "Sauna", th: "ซาวน่า" },
  playground: { en: "Playground", th: "สนามเด็กเล่น" },
  library: { en: "Library", th: "ห้องสมุด" },
  security24h: { en: "24/7 Security", th: "รักษาความปลอดภัย 24 ชม." },
  karaokeRoom: { en: "Karaoke Room", th: "ห้องคาราโอเกะ" },
  meetingRoom: { en: "Meeting Room", th: "ห้องประชุม" },
  fitnessGym: { en: "Fitness / Gym", th: "ฟิตเนส" },
  clubhouse: { en: "Clubhouse", th: "คลับเฮ้าส์" },
  snookerTable: { en: "Snooker Table", th: "โต๊ะสนุ๊ก" },
  basketballCourt: { en: "Basketball Court", th: "สนามบาส" },
  badmintonCourt: { en: "Badminton Court", th: "สนามแบดมินตัน" },
  lowRise: { en: "Low-Rise", th: "Low-Rise" },
  highRise: { en: "High-Rise", th: "High-Rise" },
  bedroomPartition: { en: "Bedroom Partition", th: "ฉากกั้นห้องนอน" },
  kitchenPartition: { en: "Kitchen Partition", th: "ฉากกั้นห้องครัว" },
};

export interface MarketingProperty {
  projectName?: string | null;
  titleTh: string;
  titleEn?: string | null;
  listingType: string;
  price: number;
  salePrice?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sizeSqm?: number | null;
  floor?: number | null;
  building?: string | null;
  condition?: string | null;
  postFrom?: string | null;
  furniture: string[];
  appliances: string[];
  facilities: string[];
  stations: string[];
}

const DIVIDER = "_____________";
const STAR_DIVIDER = "*******************";

const FIXED_CONTACT_BLOCK = `_____________
🎀 Contact for more details 🎀
📞 095-680-9191 (AG Namphung)
💬 ID Line: @cfx5958x
📧 Email: npb.property8@gmail.com
🤝 Accept Co-Agents
🏠 Property for sale & rent
_____________
#BangkokCondo
#CondoForRent
#BangnaCondo
#BangkokRental
#PropertyBangkok
#CondoForRent
#RentCondo
#ApartmentForRent
#BangkokLiving
#CondoLife
#ReadyToMoveIn`;

function fmtNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function buildBlock(p: MarketingProperty, lang: "en" | "th"): string {
  const isRent =
    p.listingType === "RENT" || p.listingType === "RENT_AND_SALE";
  const isSale =
    p.listingType === "SALE" || p.listingType === "RENT_AND_SALE";

  const T =
    lang === "th"
      ? {
          forRent: "ให้เช่า",
          forSale: "ขาย",
          forBoth: "ให้เช่า / ขาย",
          thbMonth: "บาท/เดือน",
          thb: "บาท",
          rentLabel: "ค่าเช่า",
          saleLabel: "ราคาขาย",
          contractTerms: "สัญญา 1 ปี | มัดจำ 2 เดือน + ล่วงหน้า 1 เดือน",
          readyMoveInOwner: "พร้อมเข้าอยู่ | ดีลตรงเจ้าของ",
          readyMoveIn: "พร้อมเข้าอยู่",
          studio: "สตูดิโอ",
          bedroom: "ห้องนอน",
          bathroom: "ห้องน้ำ",
          sqm: "ตร.ม.",
          floor: "ชั้น",
          building: "อาคาร",
          furniture: "เฟอร์นิเจอร์ในห้อง",
          appliances: "เครื่องใช้ไฟฟ้า",
          facilities: "สิ่งอำนวยความสะดวก",
          highlights: "จุดเด่น",
          highMrtNear: (s: string) => `ติด ${s} เดินทางสะดวกมาก`,
          highHighFloor: "ชั้นสูง วิวสวย โปร่งโล่ง",
          highBrandNew: "มือ 1 พร้อมเข้าอยู่",
          highFullFacilities: "ส่วนกลางครบครัน",
          highInProject: (n: string) => `อยู่ในโครงการ ${n}`,
        }
      : {
          forRent: "For Rent",
          forSale: "For Sale",
          forBoth: "For Rent / Sale",
          thbMonth: "THB/month",
          thb: "THB",
          rentLabel: "Rent",
          saleLabel: "Sale Price",
          contractTerms: "1-year contract | 2-month deposit + 1-month advance",
          readyMoveInOwner: "Ready to move in | Direct deal with owner",
          readyMoveIn: "Ready to move in",
          studio: "Studio",
          bedroom: "Bedroom",
          bathroom: "Bathroom",
          sqm: "sq.m.",
          floor: "Floor",
          building: "Building",
          furniture: "Furniture",
          appliances: "Electrical Appliances",
          facilities: "Facilities",
          highlights: "Highlights",
          highMrtNear: (s: string) => `Convenient access to ${s}`,
          highHighFloor: "High floor with nice view",
          highBrandNew: "Brand new, ready to move in",
          highFullFacilities: "Full facilities in project",
          highInProject: (n: string) => `Located in ${n}`,
        };

  const lines: string[] = [];

  // Header
  const titleByLang =
    lang === "en" && p.titleEn ? p.titleEn : p.titleTh;
  const projectName = p.projectName || titleByLang;
  const listingLabel = isRent && isSale
    ? T.forBoth
    : isRent
    ? T.forRent
    : T.forSale;
  lines.push(`✨ ${listingLabel} | ${projectName} 🌻`);

  // Stations
  if (p.stations.length > 0) {
    const fmt = lang === "th" ? getStationThaiName : getStationFullName;
    lines.push(`🚆 ${p.stations.map(fmt).join(" • ")}`);
  }

  // Prices
  if (isRent && p.price > 0) {
    lines.push(`💰 ${fmtNumber(p.price)} ${T.thbMonth}`);
  }
  if (isSale) {
    const saleVal = p.salePrice && p.salePrice > 0 ? p.salePrice : !isRent ? p.price : null;
    if (saleVal && saleVal > 0) {
      lines.push(`💎 ${T.saleLabel}: ${fmtNumber(saleVal)} ${T.thb}`);
    }
  }

  // Contract terms (rent only)
  if (isRent) {
    lines.push(`📑 ${T.contractTerms}`);
  }

  // Ownership / availability
  if (p.postFrom === "OWNER") {
    lines.push(`✨ ${T.readyMoveInOwner}`);
  } else {
    lines.push(`✨ ${T.readyMoveIn}`);
  }

  lines.push(DIVIDER);

  // Stats
  const stats: string[] = [];
  if (p.bedrooms !== undefined && p.bedrooms !== null) {
    if (p.bedrooms === 0) {
      stats.push(T.studio);
    } else {
      const plural = lang === "en" && p.bedrooms !== 1 ? "s" : "";
      stats.push(`${p.bedrooms} ${T.bedroom}${plural}`);
    }
  }
  if (p.bathrooms && p.bathrooms > 0) {
    const plural = lang === "en" && p.bathrooms !== 1 ? "s" : "";
    stats.push(`${p.bathrooms} ${T.bathroom}${plural}`);
  }
  if (p.sizeSqm && p.sizeSqm > 0) {
    stats.push(`${p.sizeSqm} ${T.sqm}`);
  }
  if (stats.length > 0) {
    lines.push(`🏡 ${stats.join(" | ")}`);
  }

  if (p.floor) {
    let floorLine = `🏢 ${T.floor} ${p.floor}`;
    if (p.building) {
      floorLine += ` (${T.building} ${p.building})`;
    }
    lines.push(floorLine);
  }

  lines.push(DIVIDER);

  // Furniture
  const furnitureLabels: string[] = [];
  p.furniture.forEach((k) => {
    const m = FURNITURE_MAP[k];
    if (m) furnitureLabels.push(m[lang] || m.en);
  });
  if (furnitureLabels.length > 0) {
    lines.push(`🛋️ ${T.furniture}`);
    furnitureLabels.forEach((item) => lines.push(`• ${item}`));
    lines.push(DIVIDER);
  }

  // Electrical Appliances
  const applianceLabels: string[] = [];
  p.appliances.forEach((k) => {
    const m = APPLIANCE_MAP[k];
    if (m) applianceLabels.push(m[lang] || m.en);
  });
  if (applianceLabels.length > 0) {
    lines.push(`⚡ ${T.appliances}`);
    applianceLabels.forEach((item) => lines.push(`• ${item}`));
    lines.push(DIVIDER);
  }

  // Facilities
  if (p.facilities.length > 0) {
    lines.push(`🏊 ${T.facilities}`);
    p.facilities.forEach((k) => {
      const m = FACILITY_MAP[k];
      const label = m ? m[lang] || m.en : k;
      lines.push(`• ${label}`);
    });
    lines.push(DIVIDER);
  }

  // Highlights — auto-derive from data
  const highlights: string[] = [];
  if (p.stations.length > 0) {
    const stn =
      lang === "th"
        ? getStationThaiName(p.stations[0])
        : getStationFullName(p.stations[0]);
    highlights.push(T.highMrtNear(stn));
  }
  if (p.floor && p.floor >= 20) {
    highlights.push(T.highHighFloor);
  }
  if (p.condition === "FIRST_HAND") {
    highlights.push(T.highBrandNew);
  }
  if (p.facilities.length >= 5) {
    highlights.push(T.highFullFacilities);
  } else if (p.projectName) {
    highlights.push(T.highInProject(p.projectName));
  }
  if (highlights.length > 0) {
    lines.push(`🌆 ${T.highlights}`);
    highlights.forEach((h) => lines.push(`• ${h}`));
  }

  return lines.join("\n");
}

export function buildMarketingDescription(p: MarketingProperty): string {
  const en = buildBlock(p, "en");
  const th = buildBlock(p, "th");
  return [en, STAR_DIVIDER, th, FIXED_CONTACT_BLOCK].join("\n");
}
