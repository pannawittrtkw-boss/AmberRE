import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Station code → { province, district } mapping (exact nameTh from amphures.json)
const STATION_LOCATION: Record<string, { province: string; district: string }> = {
  // BTS Sukhumvit — South extension (Samut Prakan)
  E15: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ" },
  E16: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ" },
  E17: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ" },
  E18: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ" },
  E19: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ" },
  E20: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ" },
  E21: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ" },
  E22: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ" },
  E23: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ" },

  // BTS Sukhumvit — Bangkok (Bang Na / Phra Khanong)
  E12: { province: "กรุงเทพมหานคร", district: "เขตบางนา" },
  E13: { province: "กรุงเทพมหานคร", district: "เขตบางนา" },
  E14: { province: "กรุงเทพมหานคร", district: "เขตบางนา" },
  E9:  { province: "กรุงเทพมหานคร", district: "เขตพระโขนง" },
  E10: { province: "กรุงเทพมหานคร", district: "เขตพระโขนง" },
  E11: { province: "กรุงเทพมหานคร", district: "เขตพระโขนง" },
  E8:  { province: "กรุงเทพมหานคร", district: "เขตคลองเตย" },

  // BTS Sukhumvit — Watthana / Khlong Toei
  E3:  { province: "กรุงเทพมหานคร", district: "เขตวัฒนา" },
  E4:  { province: "กรุงเทพมหานคร", district: "เขตวัฒนา" },
  E5:  { province: "กรุงเทพมหานคร", district: "เขตวัฒนา" },
  E6:  { province: "กรุงเทพมหานคร", district: "เขตวัฒนา" },
  E7:  { province: "กรุงเทพมหานคร", district: "เขตวัฒนา" },

  // BTS Sukhumvit — Pathum Wan
  CEN: { province: "กรุงเทพมหานคร", district: "เขตปทุมวัน" },
  E1:  { province: "กรุงเทพมหานคร", district: "เขตปทุมวัน" },
  E2:  { province: "กรุงเทพมหานคร", district: "เขตปทุมวัน" },
  W1:  { province: "กรุงเทพมหานคร", district: "เขตปทุมวัน" },
  S1:  { province: "กรุงเทพมหานคร", district: "เขตปทุมวัน" },

  // BTS Sukhumvit North — Ratchathewi / Phaya Thai
  N1:  { province: "กรุงเทพมหานคร", district: "เขตราชเทวี" },
  N2:  { province: "กรุงเทพมหานคร", district: "เขตราชเทวี" },
  N3:  { province: "กรุงเทพมหานคร", district: "เขตราชเทวี" },
  N4:  { province: "กรุงเทพมหานคร", district: "เขตพญาไท" },
  N5:  { province: "กรุงเทพมหานคร", district: "เขตพญาไท" },
  N6:  { province: "กรุงเทพมหานคร", district: "เขตพญาไท" },
  N7:  { province: "กรุงเทพมหานคร", district: "เขตพญาไท" },

  // BTS Sukhumvit North — Chatuchak / Bang Khen
  N8:  { province: "กรุงเทพมหานคร", district: "เขตจตุจักร" },
  N9:  { province: "กรุงเทพมหานคร", district: "เขตจตุจักร" },
  N10: { province: "กรุงเทพมหานคร", district: "เขตจตุจักร" },
  N11: { province: "กรุงเทพมหานคร", district: "เขตจตุจักร" },
  N12: { province: "กรุงเทพมหานคร", district: "เขตจตุจักร" },
  N13: { province: "กรุงเทพมหานคร", district: "เขตจตุจักร" },
  N14: { province: "กรุงเทพมหานคร", district: "เขตบางเขน" },
  N15: { province: "กรุงเทพมหานคร", district: "เขตบางเขน" },
  N16: { province: "กรุงเทพมหานคร", district: "เขตดอนเมือง" },
  N17: { province: "กรุงเทพมหานคร", district: "เขตดอนเมือง" },
  N18: { province: "กรุงเทพมหานคร", district: "เขตสายไหม" },
  N19: { province: "กรุงเทพมหานคร", district: "เขตสายไหม" },
  N20: { province: "ปทุมธานี", district: "ลำลูกกา" },
  N21: { province: "ปทุมธานี", district: "ลำลูกกา" },
  N22: { province: "ปทุมธานี", district: "คลองหลวง" },
  N23: { province: "ปทุมธานี", district: "คลองหลวง" },
  N24: { province: "ปทุมธานี", district: "ลำลูกกา" },

  // BTS Silom — Bangkok
  S2:  { province: "กรุงเทพมหานคร", district: "เขตบางรัก" },
  S3:  { province: "กรุงเทพมหานคร", district: "เขตยานนาวา" },
  S4:  { province: "กรุงเทพมหานคร", district: "เขตสาทร" },
  S5:  { province: "กรุงเทพมหานคร", district: "เขตบางรัก" },
  S6:  { province: "กรุงเทพมหานคร", district: "เขตบางรัก" },
  S7:  { province: "กรุงเทพมหานคร", district: "เขตคลองสาน" },
  S8:  { province: "กรุงเทพมหานคร", district: "เขตธนบุรี" },
  S9:  { province: "กรุงเทพมหานคร", district: "เขตธนบุรี" },
  S10: { province: "กรุงเทพมหานคร", district: "เขตธนบุรี" },
  S11: { province: "กรุงเทพมหานคร", district: "เขตจอมทอง" },
  S12: { province: "กรุงเทพมหานคร", district: "เขตภาษีเจริญ" },

  // BTS Gold Line
  G1:  { province: "กรุงเทพมหานคร", district: "เขตคลองสาน" },
  G2:  { province: "กรุงเทพมหานคร", district: "เขตคลองสาน" },
  G3:  { province: "กรุงเทพมหานคร", district: "เขตคลองสาน" },

  // MRT Blue Line — West (Thonburi side)
  BL01: { province: "กรุงเทพมหานคร", district: "เขตบางกอกใหญ่" },
  BL02: { province: "กรุงเทพมหานคร", district: "เขตบางพลัด" },
  BL03: { province: "กรุงเทพมหานคร", district: "เขตบางกอกน้อย" },
  BL04: { province: "กรุงเทพมหานคร", district: "เขตบางกอกน้อย" },
  BL05: { province: "กรุงเทพมหานคร", district: "เขตบางพลัด" },
  BL06: { province: "กรุงเทพมหานคร", district: "เขตบางพลัด" },
  BL07: { province: "กรุงเทพมหานคร", district: "เขตบางพลัด" },
  BL08: { province: "กรุงเทพมหานคร", district: "เขตบางพลัด" },
  BL09: { province: "กรุงเทพมหานคร", district: "เขตบางซื่อ" },
  BL10: { province: "กรุงเทพมหานคร", district: "เขตบางซื่อ" },
  BL11: { province: "กรุงเทพมหานคร", district: "เขตบางซื่อ" },

  // MRT Blue Line — Chatuchak / Phaya Thai
  BL12: { province: "กรุงเทพมหานคร", district: "เขตจตุจักร" },
  BL13: { province: "กรุงเทพมหานคร", district: "เขตจตุจักร" },
  BL14: { province: "กรุงเทพมหานคร", district: "เขตจตุจักร" },
  BL15: { province: "กรุงเทพมหานคร", district: "เขตจตุจักร" },

  // MRT Blue Line — Huai Khwang / Din Daeng
  BL16: { province: "กรุงเทพมหานคร", district: "เขตห้วยขวาง" },
  BL17: { province: "กรุงเทพมหานคร", district: "เขตห้วยขวาง" },
  BL18: { province: "กรุงเทพมหานคร", district: "เขตห้วยขวาง" },
  BL19: { province: "กรุงเทพมหานคร", district: "เขตห้วยขวาง" },
  BL20: { province: "กรุงเทพมหานคร", district: "เขตห้วยขวาง" },
  BL21: { province: "กรุงเทพมหานคร", district: "เขตดินแดง" },

  // MRT Blue Line — Sukhumvit / Khlong Toei / Sathon / Bang Rak
  BL22: { province: "กรุงเทพมหานคร", district: "เขตวัฒนา" },
  BL23: { province: "กรุงเทพมหานคร", district: "เขตคลองเตย" },
  BL24: { province: "กรุงเทพมหานคร", district: "เขตคลองเตย" },
  BL25: { province: "กรุงเทพมหานคร", district: "เขตสาทร" },
  BL26: { province: "กรุงเทพมหานคร", district: "เขตบางรัก" },
  BL27: { province: "กรุงเทพมหานคร", district: "เขตบางรัก" },
  BL28: { province: "กรุงเทพมหานคร", district: "เขตป้อมปราบศัตรูพ่าย" },
  BL29: { province: "กรุงเทพมหานคร", district: "เขตสัมพันธวงศ์" },
  BL30: { province: "กรุงเทพมหานคร", district: "เขตพระนคร" },
  BL31: { province: "กรุงเทพมหานคร", district: "เขตพระนคร" },
  BL32: { province: "กรุงเทพมหานคร", district: "เขตบางกอกใหญ่" },
  BL33: { province: "กรุงเทพมหานคร", district: "เขตภาษีเจริญ" },
  BL34: { province: "กรุงเทพมหานคร", district: "เขตภาษีเจริญ" },
  BL35: { province: "กรุงเทพมหานคร", district: "เขตภาษีเจริญ" },
  BL36: { province: "กรุงเทพมหานคร", district: "เขตภาษีเจริญ" },
  BL37: { province: "กรุงเทพมหานคร", district: "เขตบางแค" },
  BL38: { province: "กรุงเทพมหานคร", district: "เขตบางแค" },

  // MRT Purple Line — Nonthaburi
  PP01: { province: "นนทบุรี", district: "บางใหญ่" },
  PP02: { province: "นนทบุรี", district: "บางใหญ่" },
  PP03: { province: "นนทบุรี", district: "บางใหญ่" },
  PP04: { province: "นนทบุรี", district: "บางบัวทอง" },
  PP05: { province: "นนทบุรี", district: "บางบัวทอง" },
  PP06: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PP07: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PP08: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PP09: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PP10: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PP11: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PP12: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PP13: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PP14: { province: "กรุงเทพมหานคร", district: "เขตบางซื่อ" },
  PP15: { province: "กรุงเทพมหานคร", district: "เขตบางซื่อ" },
  PP16: { province: "กรุงเทพมหานคร", district: "เขตบางซื่อ" },

  // MRT Yellow Line
  YL01: { province: "กรุงเทพมหานคร", district: "เขตจตุจักร" },
  YL02: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  YL03: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  YL04: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  YL05: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  YL06: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  YL07: { province: "กรุงเทพมหานคร", district: "เขตวังทองหลาง" },
  YL08: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  YL09: { province: "กรุงเทพมหานคร", district: "เขตบางกะปิ" },
  YL10: { province: "กรุงเทพมหานคร", district: "เขตบึงกุ่ม" },
  YL11: { province: "กรุงเทพมหานคร", district: "เขตสะพานสูง" },
  YL12: { province: "กรุงเทพมหานคร", district: "เขตสะพานสูง" },
  YL13: { province: "กรุงเทพมหานคร", district: "เขตประเวศ" },
  YL14: { province: "กรุงเทพมหานคร", district: "เขตประเวศ" },
  YL15: { province: "กรุงเทพมหานคร", district: "เขตประเวศ" },
  YL16: { province: "กรุงเทพมหานคร", district: "เขตประเวศ" },
  YL17: { province: "กรุงเทพมหานคร", district: "เขตประเวศ" },
  YL18: { province: "กรุงเทพมหานคร", district: "เขตประเวศ" },
  YL19: { province: "กรุงเทพมหานคร", district: "เขตบางนา" },
  YL20: { province: "กรุงเทพมหานคร", district: "เขตบางนา" },
  YL21: { province: "สมุทรปราการ", district: "บางพลี" },
  YL22: { province: "สมุทรปราการ", district: "บางพลี" },
  YL23: { province: "สมุทรปราการ", district: "บางพลี" },
  YL24: { province: "สมุทรปราการ", district: "เมืองสมุทรปราการ" },

  // MRT Pink Line
  PK01: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PK02: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PK03: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PK04: { province: "นนทบุรี", district: "เมืองนนทบุรี" },
  PK05: { province: "นนทบุรี", district: "ปากเกร็ด" },
  PK06: { province: "นนทบุรี", district: "ปากเกร็ด" },
  PK07: { province: "นนทบุรี", district: "ปากเกร็ด" },
  PK08: { province: "นนทบุรี", district: "ปากเกร็ด" },
  PK09: { province: "นนทบุรี", district: "ปากเกร็ด" },
  PK10: { province: "นนทบุรี", district: "ปากเกร็ด" },
  PK11: { province: "กรุงเทพมหานคร", district: "เขตหลักสี่" },
  PK12: { province: "กรุงเทพมหานคร", district: "เขตหลักสี่" },
  PK13: { province: "กรุงเทพมหานคร", district: "เขตหลักสี่" },
  PK14: { province: "กรุงเทพมหานคร", district: "เขตหลักสี่" },
  PK15: { province: "กรุงเทพมหานคร", district: "เขตบางเขน" },
  PK16: { province: "กรุงเทพมหานคร", district: "เขตบางเขน" },
  PK17: { province: "กรุงเทพมหานคร", district: "เขตบางเขน" },
  PK18: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  PK19: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  PK20: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  PK21: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  PK22: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  PK23: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  PK24: { province: "กรุงเทพมหานคร", district: "เขตบึงกุ่ม" },
  PK25: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  PK26: { province: "กรุงเทพมหานคร", district: "เขตลาดพร้าว" },
  PK27: { province: "กรุงเทพมหานคร", district: "เขตมีนบุรี" },
  PK28: { province: "กรุงเทพมหานคร", district: "เขตมีนบุรี" },
  PK29: { province: "กรุงเทพมหานคร", district: "เขตมีนบุรี" },
  PK30: { province: "กรุงเทพมหานคร", district: "เขตมีนบุรี" },

  // Airport Rail Link
  A1: { province: "กรุงเทพมหานคร", district: "เขตราชเทวี" },
  A2: { province: "กรุงเทพมหานคร", district: "เขตราชเทวี" },
  A3: { province: "กรุงเทพมหานคร", district: "เขตราชเทวี" },
  A4: { province: "กรุงเทพมหานคร", district: "เขตสะพานสูง" },
  A5: { province: "กรุงเทพมหานคร", district: "เขตบางกะปิ" },
  A6: { province: "กรุงเทพมหานคร", district: "เขตลาดกระบัง" },
  A7: { province: "กรุงเทพมหานคร", district: "เขตลาดกระบัง" },
  A8: { province: "สมุทรปราการ", district: "บางพลี" },
};

function resolveFromStations(nearbyStations: string | null): { province: string; district: string } | null {
  if (!nearbyStations) return null;
  try {
    const stations: string[] = JSON.parse(nearbyStations);
    for (const s of stations) {
      const loc = STATION_LOCATION[s];
      if (loc) return loc;
    }
  } catch {}
  return null;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Fetch all properties without province set
  const properties = await prisma.property.findMany({
    where: { province: null },
    select: { id: true, nearbyStations: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const prop of properties) {
    const loc = resolveFromStations(prop.nearbyStations);
    if (!loc) { skipped++; continue; }

    await prisma.property.update({
      where: { id: prop.id },
      data: { province: loc.province, district: loc.district },
    });
    updated++;
  }

  return NextResponse.json({ success: true, updated, skipped, total: properties.length });
}
