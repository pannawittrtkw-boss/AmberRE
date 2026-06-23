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
