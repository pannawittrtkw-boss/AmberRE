// Station name lookup - works in both server and client components
const STATION_NAMES: Record<string, string> = {
  // BTS Sukhumvit
  N24: "คูคต", N23: "แยกคลองหลวง", N22: "ม.ธรรมศาสตร์", N21: "เมืองเอก",
  N20: "พหลโยธิน 59", N19: "สายหยุด", N18: "สะพานใหม่", N17: "พิพิธภัณฑ์กองทัพอากาศ",
  N16: "รพ.ภูมิพล", N15: "กรมทหารราบที่ 11", N14: "วัดพระศรีมหาธาตุ",
  N13: "พหลโยธิน 24", N12: "รัชโยธิน", N11: "เสนานิคม", N10: "ม.เกษตรศาสตร์",
  N9: "ห้าแยกลาดพร้าว", N8: "หมอชิต", N7: "สะพานควาย", N6: "เสนารวม",
  N5: "อารีย์", N4: "สนามเป้า", N3: "อนุสาวรีย์ชัยฯ", N2: "พญาไท",
  N1: "ราชเทวี", CEN: "สยาม",
  E1: "ชิดลม", E2: "เพลินจิต", E3: "นานา", E4: "อโศก",
  E5: "พร้อมพงษ์", E6: "ทองหล่อ", E7: "เอกมัย", E8: "พระโขนง",
  E9: "อ่อนนุช", E10: "บางจาก", E11: "ปุณณวิถี", E12: "อุดมสุข",
  E13: "บางนา", E14: "แบริ่ง", E15: "สำโรง", E16: "ปู่เจ้า",
  E17: "ช้างเอราวัณ", E18: "โรงเรียนนายเรือ", E19: "ปากน้ำ",
  E20: "ศรีนครินทร์", E21: "แพรกษา", E22: "สายลวด", E23: "เคหะฯ",
  // BTS Silom
  W1: "สนามกีฬาแห่งชาติ", S1: "ราชดำริ", S2: "ศาลาแดง", S3: "ช่องนนทรี",
  S4: "เซนต์หลุยส์", S5: "สุรศักดิ์", S6: "สะพานตากสิน", S7: "กรุงธนบุรี",
  S8: "วงเวียนใหญ่", S9: "โพธิ์นิมิตร", S10: "ตลาดพลู", S11: "วุฒากาศ", S12: "บางหว้า",
  // BTS Gold
  G1: "กรุงธนบุรี", G2: "เจริญนคร", G3: "คลองสาน",
  // MRT Blue
  BL01: "ท่าพระ", BL02: "จรัญฯ 13", BL03: "ไฟฉาย", BL04: "บางขุนนนท์",
  BL05: "บางยี่ขัน", BL06: "สิรินธร", BL07: "บางพลัด", BL08: "บางอ้อ",
  BL09: "บางโพ", BL10: "เตาปูน", BL11: "บางซื่อ", BL12: "กำแพงเพชร",
  BL13: "สวนจตุจักร", BL14: "พหลโยธิน", BL15: "ลาดพร้าว", BL16: "รัชดาภิเษก",
  BL17: "สุทธิสาร", BL18: "ห้วยขวาง", BL19: "ศูนย์วัฒนธรรมฯ", BL20: "พระราม 9",
  BL21: "เพชรบุรี", BL22: "สุขุมวิท", BL23: "ศูนย์ประชุมฯ สิริกิติ์", BL24: "คลองเตย",
  BL25: "ลุมพินี", BL26: "สีลม", BL27: "สามย่าน", BL28: "หัวลำโพง",
  BL29: "วัดมังกร", BL30: "สามยอด", BL31: "สนามไชย", BL32: "อิสรภาพ",
  BL33: "บางไผ่", BL34: "บางหว้า", BL35: "เพชรเกษม 48", BL36: "ภาษีเจริญ",
  BL37: "บางแค", BL38: "หลักสอง",
  // MRT Purple
  PP01: "คลองบางไผ่", PP02: "ตลาดบางใหญ่", PP03: "สามแยกบางใหญ่", PP04: "บางพลู",
  PP05: "บางรักใหญ่", PP06: "บางรักน้อย-ท่าอิฐ", PP07: "ไทรม้า",
  PP08: "สะพานพระนั่งเกล้า", PP09: "แยกนนทบุรี 1", PP10: "บางกระสอ",
  PP11: "ศูนย์ราชการนนทบุรี", PP12: "กระทรวงสาธารณสุข", PP13: "แยกติวานนท์",
  PP14: "วงศ์สว่าง", PP15: "บางซ่อน", PP16: "เตาปูน",
  // MRT Yellow
  YL01: "ลาดพร้าว", YL02: "พหลโยธิน 48", YL03: "ภาวนา", YL04: "โชคชัย 4",
  YL05: "ลาดพร้าว 71", YL06: "ลาดพร้าว 83", YL07: "มหาดไทย",
  YL08: "ลาดพร้าว 101", YL09: "บางกะปิ", YL10: "แยกลำสาลี", YL11: "ศรีกรีฑา",
  YL12: "หัวหมาก", YL13: "กลันตัน", YL14: "ศรีนุช", YL15: "ศรีนครินทร์ 38",
  YL16: "สวนหลวง ร.9", YL17: "ศรีอุดม", YL18: "ศรีเอี่ยม", YL19: "ศรีลาซาล",
  YL20: "ศรีแบริ่ง", YL21: "ศรีด่าน", YL22: "ศรีเทพา", YL23: "ทิพวัล", YL24: "สำโรง",
  // MRT Pink
  PK01: "ศูนย์ราชการนนทบุรี", PK02: "แคราย", PK03: "สนามบินน้ำ", PK04: "สามัคคี",
  PK05: "กรมชลประทาน", PK06: "ปากเกร็ด", PK07: "เลี่ยงเมืองปากเกร็ด",
  PK08: "แจ้งวัฒนะ-ปากเกร็ด 28", PK09: "ศรีรัช", PK10: "เมืองทองธานี",
  PK11: "แจ้งวัฒนะ 14", PK12: "ศูนย์ราชการฯ", PK13: "โทรคมนาคมแห่งชาติ",
  PK14: "หลักสี่", PK15: "ราชภัฏพระนคร", PK16: "นพรัตนราชธานี",
  PK17: "วัดพระศรีมหาธาตุ", PK18: "รามอินทรา 3", PK19: "ลาดปลาเค้า",
  PK20: "รามอินทรา กม.4", PK21: "มัยลาภ", PK22: "วัชรพล", PK23: "รามอินทรา กม.6",
  PK24: "คู้บอน", PK25: "รามอินทรา กม.9", PK26: "วงแหวน-รามอินทรา",
  PK27: "นพรัตน์", PK28: "บางชัน", PK29: "เศรษฐบุตรบำเพ็ญ", PK30: "มีนบุรี",
  // Airport Rail Link
  A1: "พญาไท", A2: "ราชปรารภ", A3: "มักกะสัน", A4: "รามคำแหง",
  A5: "หัวหมาก", A6: "บ้านทับช้าง", A7: "ลาดกระบัง", A8: "สุวรรณภูมิ",
};

const STATION_NAMES_EN: Record<string, string> = {
  // BTS Sukhumvit
  N24: "Khu Khot", N23: "Yak Khlong Luang", N22: "Thammasat University", N21: "Mueang Ek - Wat Phra Si Mahathat",
  N20: "Phahon Yothin 59", N19: "Sai Yud", N18: "Saphan Mai", N17: "Royal Thai Air Force Museum",
  N16: "Bhumibol Adulyadej Hospital", N15: "11th Infantry Regiment", N14: "Wat Phra Si Mahathat",
  N13: "Phahon Yothin 24", N12: "Ratchayothin", N11: "Senanikom", N10: "Kasetsart University",
  N9: "Ha Yaek Lat Phrao", N8: "Mo Chit", N7: "Saphan Khwai", N6: "Sena Ruam",
  N5: "Ari", N4: "Sanam Pao", N3: "Victory Monument", N2: "Phaya Thai",
  N1: "Ratchathewi", CEN: "Siam",
  E1: "Chit Lom", E2: "Phloen Chit", E3: "Nana", E4: "Asok",
  E5: "Phrom Phong", E6: "Thong Lo", E7: "Ekkamai", E8: "Phra Khanong",
  E9: "On Nut", E10: "Bang Chak", E11: "Punnawithi", E12: "Udom Suk",
  E13: "Bang Na", E14: "Bearing", E15: "Samrong", E16: "Pu Chao",
  E17: "Chang Erawan", E18: "Royal Thai Naval Academy", E19: "Pak Nam",
  E20: "Si Nagarindra", E21: "Phraek Sa", E22: "Sai Luat", E23: "Kheha",
  // BTS Silom
  W1: "National Stadium", S1: "Ratchadamri", S2: "Sala Daeng", S3: "Chong Nonsi",
  S4: "Saint Louis", S5: "Surasak", S6: "Saphan Taksin", S7: "Krung Thon Buri",
  S8: "Wongwian Yai", S9: "Pho Nimit", S10: "Talat Phlu", S11: "Wutthakat", S12: "Bang Wa",
  // BTS Gold
  G1: "Krung Thon Buri", G2: "Charoen Nakhon", G3: "Khlong San",
  // MRT Blue
  BL01: "Tha Phra", BL02: "Charan 13", BL03: "Fai Chai", BL04: "Bang Khun Non",
  BL05: "Bang Yi Khan", BL06: "Sirindhorn", BL07: "Bang Phlat", BL08: "Bang O",
  BL09: "Bang Pho", BL10: "Tao Poon", BL11: "Bang Sue", BL12: "Kamphaeng Phet",
  BL13: "Chatuchak Park", BL14: "Phahon Yothin", BL15: "Lat Phrao", BL16: "Ratchadaphisek",
  BL17: "Sutthisan", BL18: "Huai Khwang", BL19: "Thailand Cultural Centre", BL20: "Phra Ram 9",
  BL21: "Phetchaburi", BL22: "Sukhumvit", BL23: "Queen Sirikit National Convention Centre", BL24: "Khlong Toei",
  BL25: "Lumphini", BL26: "Si Lom", BL27: "Sam Yan", BL28: "Hua Lamphong",
  BL29: "Wat Mangkon", BL30: "Sam Yot", BL31: "Sanam Chai", BL32: "Itsaraphap",
  BL33: "Bang Phai", BL34: "Bang Wa", BL35: "Phet Kasem 48", BL36: "Phasi Charoen",
  BL37: "Bang Khae", BL38: "Lak Song",
  // MRT Purple
  PP01: "Khlong Bang Phai", PP02: "Talad Bang Yai", PP03: "Sam Yaek Bang Yai", PP04: "Bang Phlu",
  PP05: "Bang Rak Yai", PP06: "Bang Rak Noi Tha It", PP07: "Sai Ma",
  PP08: "Phra Nang Klao Bridge", PP09: "Yaek Nonthaburi 1", PP10: "Bang Krasor",
  PP11: "Nonthaburi Civic Center", PP12: "Ministry of Public Health", PP13: "Yaek Tiwanon",
  PP14: "Wong Sawang", PP15: "Bang Son", PP16: "Tao Poon",
  // MRT Yellow
  YL01: "Lat Phrao", YL02: "Phahon Yothin 48", YL03: "Phawana", YL04: "Chok Chai 4",
  YL05: "Lat Phrao 71", YL06: "Lat Phrao 83", YL07: "Mahat Thai",
  YL08: "Lat Phrao 101", YL09: "Bang Kapi", YL10: "Yaek Lam Sali", YL11: "Si Kritha",
  YL12: "Hua Mak", YL13: "Kalantan", YL14: "Si Nut", YL15: "Srinagarindra 38",
  YL16: "Suan Luang Rama IX", YL17: "Si Udom", YL18: "Si Iam", YL19: "Si La Salle",
  YL20: "Si Bearing", YL21: "Si Dan", YL22: "Si Thepha", YL23: "Thipphawan", YL24: "Samrong",
  // MRT Pink
  PK01: "Nonthaburi Civic Center", PK02: "Khae Rai", PK03: "Sanambin Nam", PK04: "Samakkhi",
  PK05: "Royal Irrigation Department", PK06: "Pak Kret", PK07: "Pak Kret Bypass",
  PK08: "Chaeng Watthana-Pak Kret 28", PK09: "Si Rat", PK10: "Muang Thong Thani",
  PK11: "Chaeng Watthana 14", PK12: "Government Complex", PK13: "Thot Damri",
  PK14: "Lak Si", PK15: "Ratchapruek", PK16: "Nopphawong",
  PK17: "Wat Phra Sri Mahathat", PK18: "Ram Inthra 3", PK19: "Lat Phrao Intersection",
  PK20: "Ram Inthra Kilo 4", PK21: "Maiyalap", PK22: "Watcharapol", PK23: "Ram Inthra Kilo 6",
  PK24: "Khu Bon", PK25: "Ram Inthra Kilo 9", PK26: "Outer Ring Road-Ram Inthra",
  PK27: "Nopparat", PK28: "Bang Chan", PK29: "Setthabutbamphen", PK30: "Min Buri",
  // Airport Rail Link
  A1: "Phaya Thai", A2: "Ratchaprarop", A3: "Makkasan", A4: "Ramkhamhaeng",
  A5: "Hua Mak", A6: "Ban Thap Chang", A7: "Lat Krabang", A8: "Suvarnabhumi",
};

function linePrefix(code: string): string {
  if (code.startsWith("BL")) return "MRT";
  if (code.startsWith("PP")) return "MRT";
  if (code.startsWith("YL")) return "MRT";
  if (code.startsWith("PK")) return "MRT";
  if (code.startsWith("A")) return "ARL";
  return "BTS";
}

export function getStationThaiName(code: string): string {
  return STATION_NAMES[code] || code;
}

export function getStationEnName(code: string): string {
  return STATION_NAMES_EN[code] || STATION_NAMES[code] || code;
}

export function getStationFullName(code: string): string {
  const name = getStationEnName(code);
  return `${linePrefix(code)} ${name}`;
}

export function getStationThaiFullName(code: string): string {
  const name = getStationThaiName(code);
  return `${linePrefix(code)} ${name}`;
}

// =============================================
// Full station/line dataset (grouped by line, with colors) — used by
// StationMapSelector and the AI-enrich route. Lives in this plain,
// non-"use client" module (like the lookup helpers above) so server-only
// code such as API routes can import it too; importing data from a
// "use client" file breaks when the importer is a Route Handler, since
// Next.js replaces that module's exports with client-reference stubs in
// the server bundle.
// =============================================

export interface StationData {
  id: string;
  nameTh: string;
  nameEn: string;
  code: string;
  line: string;
}

export interface LineData {
  key: string;
  nameTh: string;
  nameEn: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  stations: StationData[];
}

export const LINES: LineData[] = [
  {
    key: "sukhumvit",
    nameTh: "BTS สายสุขุมวิท",
    nameEn: "BTS Sukhumvit Line",
    color: "#5C8A3C",
    bgColor: "bg-green-600",
    textColor: "text-green-700",
    borderColor: "border-green-600",
    stations: [
      { id: "N24", code: "N24", nameEn: "Khu Khot", nameTh: "คูคต", line: "sukhumvit" },
      { id: "N23", code: "N23", nameEn: "Yak Khlong Luang", nameTh: "แยกคลองหลวง", line: "sukhumvit" },
      { id: "N22", code: "N22", nameEn: "Thammasat University", nameTh: "มหาวิทยาลัยธรรมศาสตร์", line: "sukhumvit" },
      { id: "N21", code: "N21", nameEn: "Mueang Ek - Wat Phra Si Mahathat", nameTh: "เมืองเอก-วัดพระศรีมหาธาตุ", line: "sukhumvit" },
      { id: "N20", code: "N20", nameEn: "Phahon Yothin 59", nameTh: "พหลโยธิน 59", line: "sukhumvit" },
      { id: "N19", code: "N19", nameEn: "Sai Yud", nameTh: "สายหยุด", line: "sukhumvit" },
      { id: "N18", code: "N18", nameEn: "Saphan Mai", nameTh: "สะพานใหม่", line: "sukhumvit" },
      { id: "N17", code: "N17", nameEn: "Royal Thai Air Force Museum", nameTh: "พิพิธภัณฑ์กองทัพอากาศ", line: "sukhumvit" },
      { id: "N16", code: "N16", nameEn: "Bhumibol Adulyadej Hospital", nameTh: "โรงพยาบาลภูมิพล", line: "sukhumvit" },
      { id: "N15", code: "N15", nameEn: "11th Infantry Regiment", nameTh: "กรมทหารราบที่ 11", line: "sukhumvit" },
      { id: "N14", code: "N14", nameEn: "Wat Phra Si Mahathat", nameTh: "วัดพระศรีมหาธาตุ", line: "sukhumvit" },
      { id: "N13", code: "N13", nameEn: "Phahon Yothin 24", nameTh: "พหลโยธิน 24", line: "sukhumvit" },
      { id: "N12", code: "N12", nameEn: "Ratchayothin", nameTh: "รัชโยธิน", line: "sukhumvit" },
      { id: "N11", code: "N11", nameEn: "Senanikom", nameTh: "เสนานิคม", line: "sukhumvit" },
      { id: "N10", code: "N10", nameEn: "Kasetsart University", nameTh: "มหาวิทยาลัยเกษตรศาสตร์", line: "sukhumvit" },
      { id: "N9", code: "N9", nameEn: "Ha Yaek Lat Phrao", nameTh: "ห้าแยกลาดพร้าว", line: "sukhumvit" },
      { id: "N8", code: "N8", nameEn: "Mo Chit", nameTh: "หมอชิต", line: "sukhumvit" },
      { id: "N7", code: "N7", nameEn: "Saphan Khwai", nameTh: "สะพานควาย", line: "sukhumvit" },
      { id: "N6", code: "N6", nameEn: "Sena Ruam", nameTh: "เสนารวม", line: "sukhumvit" },
      { id: "N5", code: "N5", nameEn: "Ari", nameTh: "อารีย์", line: "sukhumvit" },
      { id: "N4", code: "N4", nameEn: "Sanam Pao", nameTh: "สนามเป้า", line: "sukhumvit" },
      { id: "N3", code: "N3", nameEn: "Victory Monument", nameTh: "อนุสาวรีย์ชัยสมรภูมิ", line: "sukhumvit" },
      { id: "N2", code: "N2", nameEn: "Phaya Thai", nameTh: "พญาไท", line: "sukhumvit" },
      { id: "N1", code: "N1", nameEn: "Ratchathewi", nameTh: "ราชเทวี", line: "sukhumvit" },
      { id: "CEN", code: "CEN", nameEn: "Siam", nameTh: "สยาม", line: "sukhumvit" },
      { id: "E1", code: "E1", nameEn: "Chit Lom", nameTh: "ชิดลม", line: "sukhumvit" },
      { id: "E2", code: "E2", nameEn: "Phloen Chit", nameTh: "เพลินจิต", line: "sukhumvit" },
      { id: "E3", code: "E3", nameEn: "Nana", nameTh: "นานา", line: "sukhumvit" },
      { id: "E4", code: "E4", nameEn: "Asok", nameTh: "อโศก", line: "sukhumvit" },
      { id: "E5", code: "E5", nameEn: "Phrom Phong", nameTh: "พร้อมพงษ์", line: "sukhumvit" },
      { id: "E6", code: "E6", nameEn: "Thong Lo", nameTh: "ทองหล่อ", line: "sukhumvit" },
      { id: "E7", code: "E7", nameEn: "Ekkamai", nameTh: "เอกมัย", line: "sukhumvit" },
      { id: "E8", code: "E8", nameEn: "Phra Khanong", nameTh: "พระโขนง", line: "sukhumvit" },
      { id: "E9", code: "E9", nameEn: "On Nut", nameTh: "อ่อนนุช", line: "sukhumvit" },
      { id: "E10", code: "E10", nameEn: "Bang Chak", nameTh: "บางจาก", line: "sukhumvit" },
      { id: "E11", code: "E11", nameEn: "Punnawithi", nameTh: "ปุณณวิถี", line: "sukhumvit" },
      { id: "E12", code: "E12", nameEn: "Udom Suk", nameTh: "อุดมสุข", line: "sukhumvit" },
      { id: "E13", code: "E13", nameEn: "Bang Na", nameTh: "บางนา", line: "sukhumvit" },
      { id: "E14", code: "E14", nameEn: "Bearing", nameTh: "แบริ่ง", line: "sukhumvit" },
      { id: "E15", code: "E15", nameEn: "Samrong", nameTh: "สำโรง", line: "sukhumvit" },
      { id: "E16", code: "E16", nameEn: "Pu Chao", nameTh: "ปู่เจ้า", line: "sukhumvit" },
      { id: "E17", code: "E17", nameEn: "Chang Erawan", nameTh: "ช้างเอราวัณ", line: "sukhumvit" },
      { id: "E18", code: "E18", nameEn: "Royal Thai Naval Academy", nameTh: "โรงเรียนนายเรือ", line: "sukhumvit" },
      { id: "E19", code: "E19", nameEn: "Pak Nam", nameTh: "ปากน้ำ", line: "sukhumvit" },
      { id: "E20", code: "E20", nameEn: "Si Nagarindra", nameTh: "ศรีนครินทร์", line: "sukhumvit" },
      { id: "E21", code: "E21", nameEn: "Phraek Sa", nameTh: "แพรกษา", line: "sukhumvit" },
      { id: "E22", code: "E22", nameEn: "Sai Luat", nameTh: "สายลวด", line: "sukhumvit" },
      { id: "E23", code: "E23", nameEn: "Kheha", nameTh: "เคหะฯ", line: "sukhumvit" },
    ],
  },
  {
    key: "silom",
    nameTh: "BTS สายสีลม",
    nameEn: "BTS Silom Line",
    color: "#006837",
    bgColor: "bg-emerald-700",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-700",
    stations: [
      { id: "W1", code: "W1", nameEn: "National Stadium", nameTh: "สนามกีฬาแห่งชาติ", line: "silom" },
      { id: "S1", code: "S1", nameEn: "Ratchadamri", nameTh: "ราชดำริ", line: "silom" },
      { id: "S2", code: "S2", nameEn: "Sala Daeng", nameTh: "ศาลาแดง", line: "silom" },
      { id: "S3", code: "S3", nameEn: "Chong Nonsi", nameTh: "ช่องนนทรี", line: "silom" },
      { id: "S4", code: "S4", nameEn: "Saint Louis", nameTh: "เซนต์หลุยส์", line: "silom" },
      { id: "S5", code: "S5", nameEn: "Surasak", nameTh: "สุรศักดิ์", line: "silom" },
      { id: "S6", code: "S6", nameEn: "Saphan Taksin", nameTh: "สะพานตากสิน", line: "silom" },
      { id: "S7", code: "S7", nameEn: "Krung Thon Buri", nameTh: "กรุงธนบุรี", line: "silom" },
      { id: "S8", code: "S8", nameEn: "Wongwian Yai", nameTh: "วงเวียนใหญ่", line: "silom" },
      { id: "S9", code: "S9", nameEn: "Pho Nimit", nameTh: "โพธิ์นิมิตร", line: "silom" },
      { id: "S10", code: "S10", nameEn: "Talat Phlu", nameTh: "ตลาดพลู", line: "silom" },
      { id: "S11", code: "S11", nameEn: "Wutthakat", nameTh: "วุฒากาศ", line: "silom" },
      { id: "S12", code: "S12", nameEn: "Bang Wa", nameTh: "บางหว้า", line: "silom" },
    ],
  },
  {
    key: "gold",
    nameTh: "BTS สายสีทอง",
    nameEn: "BTS Gold Line",
    color: "#C5992E",
    bgColor: "bg-yellow-600",
    textColor: "text-yellow-700",
    borderColor: "border-yellow-600",
    stations: [
      { id: "G1", code: "G1", nameEn: "Krung Thon Buri", nameTh: "กรุงธนบุรี", line: "gold" },
      { id: "G2", code: "G2", nameEn: "Charoen Nakhon", nameTh: "เจริญนคร", line: "gold" },
      { id: "G3", code: "G3", nameEn: "Khlong San", nameTh: "คลองสาน", line: "gold" },
    ],
  },
  {
    key: "blue",
    nameTh: "MRT สายสีน้ำเงิน",
    nameEn: "MRT Blue Line",
    color: "#1E3A8A",
    bgColor: "bg-blue-800",
    textColor: "text-blue-800",
    borderColor: "border-blue-800",
    stations: [
      { id: "BL01", code: "BL01", nameEn: "Tha Phra", nameTh: "ท่าพระ", line: "blue" },
      { id: "BL02", code: "BL02", nameEn: "Charan 13", nameTh: "จรัญฯ 13", line: "blue" },
      { id: "BL03", code: "BL03", nameEn: "Fai Chai", nameTh: "ไฟฉาย", line: "blue" },
      { id: "BL04", code: "BL04", nameEn: "Bang Khun Non", nameTh: "บางขุนนนท์", line: "blue" },
      { id: "BL05", code: "BL05", nameEn: "Bang Yi Khan", nameTh: "บางยี่ขัน", line: "blue" },
      { id: "BL06", code: "BL06", nameEn: "Sirindhorn", nameTh: "สิรินธร", line: "blue" },
      { id: "BL07", code: "BL07", nameEn: "Bang Phlat", nameTh: "บางพลัด", line: "blue" },
      { id: "BL08", code: "BL08", nameEn: "Bang O", nameTh: "บางอ้อ", line: "blue" },
      { id: "BL09", code: "BL09", nameEn: "Bang Pho", nameTh: "บางโพ", line: "blue" },
      { id: "BL10", code: "BL10", nameEn: "Tao Poon", nameTh: "เตาปูน", line: "blue" },
      { id: "BL11", code: "BL11", nameEn: "Bang Sue", nameTh: "บางซื่อ", line: "blue" },
      { id: "BL12", code: "BL12", nameEn: "Kamphaeng Phet", nameTh: "กำแพงเพชร", line: "blue" },
      { id: "BL13", code: "BL13", nameEn: "Chatuchak Park", nameTh: "สวนจตุจักร", line: "blue" },
      { id: "BL14", code: "BL14", nameEn: "Phahon Yothin", nameTh: "พหลโยธิน", line: "blue" },
      { id: "BL15", code: "BL15", nameEn: "Lat Phrao", nameTh: "ลาดพร้าว", line: "blue" },
      { id: "BL16", code: "BL16", nameEn: "Ratchadaphisek", nameTh: "รัชดาภิเษก", line: "blue" },
      { id: "BL17", code: "BL17", nameEn: "Sutthisan", nameTh: "สุทธิสาร", line: "blue" },
      { id: "BL18", code: "BL18", nameEn: "Huai Khwang", nameTh: "ห้วยขวาง", line: "blue" },
      { id: "BL19", code: "BL19", nameEn: "Thailand Cultural Centre", nameTh: "ศูนย์วัฒนธรรมแห่งประเทศไทย", line: "blue" },
      { id: "BL20", code: "BL20", nameEn: "Phra Ram 9", nameTh: "พระราม 9", line: "blue" },
      { id: "BL21", code: "BL21", nameEn: "Phetchaburi", nameTh: "เพชรบุรี", line: "blue" },
      { id: "BL22", code: "BL22", nameEn: "Sukhumvit", nameTh: "สุขุมวิท", line: "blue" },
      { id: "BL23", code: "BL23", nameEn: "Queen Sirikit National Convention Centre", nameTh: "ศูนย์การประชุมแห่งชาติสิริกิติ์", line: "blue" },
      { id: "BL24", code: "BL24", nameEn: "Khlong Toei", nameTh: "คลองเตย", line: "blue" },
      { id: "BL25", code: "BL25", nameEn: "Lumphini", nameTh: "ลุมพินี", line: "blue" },
      { id: "BL26", code: "BL26", nameEn: "Si Lom", nameTh: "สีลม", line: "blue" },
      { id: "BL27", code: "BL27", nameEn: "Sam Yan", nameTh: "สามย่าน", line: "blue" },
      { id: "BL28", code: "BL28", nameEn: "Hua Lamphong", nameTh: "หัวลำโพง", line: "blue" },
      { id: "BL29", code: "BL29", nameEn: "Wat Mangkon", nameTh: "วัดมังกร", line: "blue" },
      { id: "BL30", code: "BL30", nameEn: "Sam Yot", nameTh: "สามยอด", line: "blue" },
      { id: "BL31", code: "BL31", nameEn: "Sanam Chai", nameTh: "สนามไชย", line: "blue" },
      { id: "BL32", code: "BL32", nameEn: "Itsaraphap", nameTh: "อิสรภาพ", line: "blue" },
      { id: "BL33", code: "BL33", nameEn: "Bang Phai", nameTh: "บางไผ่", line: "blue" },
      { id: "BL34", code: "BL34", nameEn: "Bang Wa", nameTh: "บางหว้า", line: "blue" },
      { id: "BL35", code: "BL35", nameEn: "Phet Kasem 48", nameTh: "เพชรเกษม 48", line: "blue" },
      { id: "BL36", code: "BL36", nameEn: "Phasi Charoen", nameTh: "ภาษีเจริญ", line: "blue" },
      { id: "BL37", code: "BL37", nameEn: "Bang Khae", nameTh: "บางแค", line: "blue" },
      { id: "BL38", code: "BL38", nameEn: "Lak Song", nameTh: "หลักสอง", line: "blue" },
    ],
  },
  {
    key: "purple",
    nameTh: "MRT สายสีม่วง",
    nameEn: "MRT Purple Line",
    color: "#6B21A8",
    bgColor: "bg-purple-700",
    textColor: "text-purple-700",
    borderColor: "border-purple-700",
    stations: [
      { id: "PP01", code: "PP01", nameEn: "Khlong Bang Phai", nameTh: "คลองบางไผ่", line: "purple" },
      { id: "PP02", code: "PP02", nameEn: "Talad Bang Yai", nameTh: "ตลาดบางใหญ่", line: "purple" },
      { id: "PP03", code: "PP03", nameEn: "Sam Yaek Bang Yai", nameTh: "สามแยกบางใหญ่", line: "purple" },
      { id: "PP04", code: "PP04", nameEn: "Bang Phlu", nameTh: "บางพลู", line: "purple" },
      { id: "PP05", code: "PP05", nameEn: "Bang Rak Yai", nameTh: "บางรักใหญ่", line: "purple" },
      { id: "PP06", code: "PP06", nameEn: "Bang Rak Noi Tha It", nameTh: "บางรักน้อย-ท่าอิฐ", line: "purple" },
      { id: "PP07", code: "PP07", nameEn: "Sai Ma", nameTh: "ไทรม้า", line: "purple" },
      { id: "PP08", code: "PP08", nameEn: "Phra Nang Klao Bridge", nameTh: "สะพานพระนั่งเกล้า", line: "purple" },
      { id: "PP09", code: "PP09", nameEn: "Yaek Nonthaburi 1", nameTh: "แยกนนทบุรี 1", line: "purple" },
      { id: "PP10", code: "PP10", nameEn: "Bang Krasor", nameTh: "บางกระสอ", line: "purple" },
      { id: "PP11", code: "PP11", nameEn: "Nonthaburi Civic Center", nameTh: "ศูนย์ราชการนนทบุรี", line: "purple" },
      { id: "PP12", code: "PP12", nameEn: "Ministry of Public Health", nameTh: "กระทรวงสาธารณสุข", line: "purple" },
      { id: "PP13", code: "PP13", nameEn: "Yaek Tiwanon", nameTh: "แยกติวานนท์", line: "purple" },
      { id: "PP14", code: "PP14", nameEn: "Wong Sawang", nameTh: "วงศ์สว่าง", line: "purple" },
      { id: "PP15", code: "PP15", nameEn: "Bang Son", nameTh: "บางซ่อน", line: "purple" },
      { id: "PP16", code: "PP16", nameEn: "Tao Poon", nameTh: "เตาปูน", line: "purple" },
    ],
  },
  {
    key: "yellow",
    nameTh: "MRT สายสีเหลือง",
    nameEn: "MRT Yellow Line",
    color: "#F59E0B",
    bgColor: "bg-yellow-500",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-500",
    stations: [
      { id: "YL01", code: "YL01", nameEn: "Lat Phrao", nameTh: "ลาดพร้าว", line: "yellow" },
      { id: "YL02", code: "YL02", nameEn: "Phahon Yothin 48", nameTh: "พหลโยธิน 48", line: "yellow" },
      { id: "YL03", code: "YL03", nameEn: "Phawana", nameTh: "ภาวนา", line: "yellow" },
      { id: "YL04", code: "YL04", nameEn: "Chok Chai 4", nameTh: "โชคชัย 4", line: "yellow" },
      { id: "YL05", code: "YL05", nameEn: "Lat Phrao 71", nameTh: "ลาดพร้าว 71", line: "yellow" },
      { id: "YL06", code: "YL06", nameEn: "Lat Phrao 83", nameTh: "ลาดพร้าว 83", line: "yellow" },
      { id: "YL07", code: "YL07", nameEn: "Mahat Thai", nameTh: "มหาดไทย", line: "yellow" },
      { id: "YL08", code: "YL08", nameEn: "Lat Phrao 101", nameTh: "ลาดพร้าว 101", line: "yellow" },
      { id: "YL09", code: "YL09", nameEn: "Bang Kapi", nameTh: "บางกะปิ", line: "yellow" },
      { id: "YL10", code: "YL10", nameEn: "Yaek Lam Sali", nameTh: "แยกลำสาลี", line: "yellow" },
      { id: "YL11", code: "YL11", nameEn: "Si Kritha", nameTh: "ศรีกรีฑา", line: "yellow" },
      { id: "YL12", code: "YL12", nameEn: "Hua Mak", nameTh: "หัวหมาก", line: "yellow" },
      { id: "YL13", code: "YL13", nameEn: "Kalantan", nameTh: "กลันตัน", line: "yellow" },
      { id: "YL14", code: "YL14", nameEn: "Si Nut", nameTh: "ศรีนุช", line: "yellow" },
      { id: "YL15", code: "YL15", nameEn: "Srinagarindra 38", nameTh: "ศรีนครินทร์ 38", line: "yellow" },
      { id: "YL16", code: "YL16", nameEn: "Suan Luang Rama IX", nameTh: "สวนหลวง ร.9", line: "yellow" },
      { id: "YL17", code: "YL17", nameEn: "Si Udom", nameTh: "ศรีอุดม", line: "yellow" },
      { id: "YL18", code: "YL18", nameEn: "Si Iam", nameTh: "ศรีเอี่ยม", line: "yellow" },
      { id: "YL19", code: "YL19", nameEn: "Si La Salle", nameTh: "ศรีลาซาล", line: "yellow" },
      { id: "YL20", code: "YL20", nameEn: "Si Bearing", nameTh: "ศรีแบริ่ง", line: "yellow" },
      { id: "YL21", code: "YL21", nameEn: "Si Dan", nameTh: "ศรีด่าน", line: "yellow" },
      { id: "YL22", code: "YL22", nameEn: "Si Thepha", nameTh: "ศรีเทพา", line: "yellow" },
      { id: "YL23", code: "YL23", nameEn: "Thipphawan", nameTh: "ทิพวัล", line: "yellow" },
      { id: "YL24", code: "YL24", nameEn: "Samrong", nameTh: "สำโรง", line: "yellow" },
    ],
  },
  {
    key: "pink",
    nameTh: "MRT สายสีชมพู",
    nameEn: "MRT Pink Line",
    color: "#EC4899",
    bgColor: "bg-pink-500",
    textColor: "text-pink-600",
    borderColor: "border-pink-500",
    stations: [
      { id: "PK01", code: "PK01", nameEn: "Nonthaburi Civic Center", nameTh: "ศูนย์ราชการนนทบุรี", line: "pink" },
      { id: "PK02", code: "PK02", nameEn: "Khae Rai", nameTh: "แคราย", line: "pink" },
      { id: "PK03", code: "PK03", nameEn: "Sanambin Nam", nameTh: "สนามบินน้ำ", line: "pink" },
      { id: "PK04", code: "PK04", nameEn: "Samakkhi", nameTh: "สามัคคี", line: "pink" },
      { id: "PK05", code: "PK05", nameEn: "Royal Irrigation Department", nameTh: "กรมชลประทาน", line: "pink" },
      { id: "PK06", code: "PK06", nameEn: "Pak Kret", nameTh: "ปากเกร็ด", line: "pink" },
      { id: "PK07", code: "PK07", nameEn: "Pak Kret Bypass", nameTh: "เลี่ยงเมืองปากเกร็ด", line: "pink" },
      { id: "PK08", code: "PK08", nameEn: "Chaeng Watthana-Pak Kret 28", nameTh: "แจ้งวัฒนะ-ปากเกร็ด 28", line: "pink" },
      { id: "PK09", code: "PK09", nameEn: "Si Rat", nameTh: "ศรีรัช", line: "pink" },
      { id: "PK10", code: "PK10", nameEn: "Muang Thong Thani", nameTh: "เมืองทองธานี", line: "pink" },
      { id: "PK11", code: "PK11", nameEn: "Chaeng Watthana 14", nameTh: "แจ้งวัฒนะ 14", line: "pink" },
      { id: "PK12", code: "PK12", nameEn: "Government Complex", nameTh: "ศูนย์ราชการเฉลิมพระเกียรติ", line: "pink" },
      { id: "PK13", code: "PK13", nameEn: "Thot Damri", nameTh: "ทศกัณฐ์", line: "pink" },
      { id: "PK14", code: "PK14", nameEn: "Lak Si", nameTh: "หลักสี่", line: "pink" },
      { id: "PK15", code: "PK15", nameEn: "Ratchapruek", nameTh: "ราชภัฏพระนคร", line: "pink" },
      { id: "PK16", code: "PK16", nameEn: "Nopphawong", nameTh: "นพรัตนราชธานี", line: "pink" },
      { id: "PK17", code: "PK17", nameEn: "Wat Phra Sri Mahathat", nameTh: "วัดพระศรีมหาธาตุ", line: "pink" },
      { id: "PK18", code: "PK18", nameEn: "Ram Inthra 3", nameTh: "รามอินทรา 3", line: "pink" },
      { id: "PK19", code: "PK19", nameEn: "Lat Phrao Intersection", nameTh: "วงแหวนลาดพร้าว", line: "pink" },
      { id: "PK20", code: "PK20", nameEn: "Ram Inthra Kilo 4", nameTh: "รามอินทรา กม.4", line: "pink" },
      { id: "PK21", code: "PK21", nameEn: "Maiyalap", nameTh: "มัยลาภ", line: "pink" },
      { id: "PK22", code: "PK22", nameEn: "Watcharapol", nameTh: "วัชรพล", line: "pink" },
      { id: "PK23", code: "PK23", nameEn: "Ram Inthra Kilo 6", nameTh: "รามอินทรา กม.6", line: "pink" },
      { id: "PK24", code: "PK24", nameEn: "Khu Bon", nameTh: "คู้บอน", line: "pink" },
      { id: "PK25", code: "PK25", nameEn: "Ram Inthra Kilo 9", nameTh: "รามอินทรา กม.9", line: "pink" },
      { id: "PK26", code: "PK26", nameEn: "Outer Ring Road-Ram Inthra", nameTh: "วงแหวน-รามอินทรา", line: "pink" },
      { id: "PK27", code: "PK27", nameEn: "Nopparat", nameTh: "นพรัตน์", line: "pink" },
      { id: "PK28", code: "PK28", nameEn: "Bang Chan", nameTh: "บางชัน", line: "pink" },
      { id: "PK29", code: "PK29", nameEn: "Setthabutbamphen", nameTh: "เศรษฐบุตรบำเพ็ญ", line: "pink" },
      { id: "PK30", code: "PK30", nameEn: "Min Buri", nameTh: "มีนบุรี", line: "pink" },
    ],
  },
  {
    key: "arl",
    nameTh: "Airport Rail Link",
    nameEn: "Airport Rail Link",
    color: "#DC2626",
    bgColor: "bg-red-600",
    textColor: "text-red-600",
    borderColor: "border-red-600",
    stations: [
      { id: "A1", code: "A1", nameEn: "Phaya Thai", nameTh: "พญาไท", line: "arl" },
      { id: "A2", code: "A2", nameEn: "Ratchaprarop", nameTh: "ราชปรารภ", line: "arl" },
      { id: "A3", code: "A3", nameEn: "Makkasan", nameTh: "มักกะสัน", line: "arl" },
      { id: "A4", code: "A4", nameEn: "Ramkhamhaeng", nameTh: "รามคำแหง", line: "arl" },
      { id: "A5", code: "A5", nameEn: "Hua Mak", nameTh: "หัวหมาก", line: "arl" },
      { id: "A6", code: "A6", nameEn: "Ban Thap Chang", nameTh: "บ้านทับช้าง", line: "arl" },
      { id: "A7", code: "A7", nameEn: "Lat Krabang", nameTh: "ลาดกระบัง", line: "arl" },
      { id: "A8", code: "A8", nameEn: "Suvarnabhumi", nameTh: "สุวรรณภูมิ", line: "arl" },
    ],
  },
];
