"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Search, Check, ZoomIn, ZoomOut, RotateCcw, List, Map } from "lucide-react";

// ====================================================
// Station coordinate data for SVG Transit Map
// Format: [id, code, nameTh, nameEn, x, y]
// ====================================================
type SC = [string, string, string, string, number, number];

interface TransitLine {
  key: string;
  nameTh: string;
  nameEn: string;
  color: string;
  width: number;
  stations: SC[];
  // Optional: path segments for drawing curves
  pathSegments?: { from: number; to: number; path: string }[];
}

// Interchange connections: [stationA_id, stationB_id]
const INTERCHANGES: [string, string][] = [
  ["N8", "BL13"],   // Mo Chit ↔ Chatuchak Park
  ["N9", "BL15"],   // Ha Yaek Lat Phrao ↔ Lat Phrao
  ["E4", "BL22"],   // Asok ↔ Sukhumvit
  ["N2", "A1"],     // Phaya Thai ↔ Phaya Thai ARL
  ["S2", "BL26"],   // Sala Daeng ↔ Si Lom
  ["CEN", "W1"],    // Siam interchange
  ["S7", "G1"],     // Krung Thon Buri ↔ Gold
  ["S12", "BL34"],  // Bang Wa ↔ Bang Wa
  ["BL10", "PP16"], // Tao Poon ↔ Tao Poon
  ["E15", "YL24"],  // Samrong Green ↔ Yellow
  ["BL21", "A3"],   // Phetchaburi ↔ Makkasan
  ["PK01", "PP11"], // Nonthaburi CC
  ["N14", "PK17"],  // Wat Phra Sri Mahathat
  ["YL01", "BL15"], // Lat Phrao Yellow ↔ Blue
  ["YL12", "A5"],   // Hua Mak
];

const TRANSIT_LINES: TransitLine[] = [
  // ============ BTS SUKHUMVIT (GREEN) ============
  {
    key: "sukhumvit",
    nameTh: "BTS สุขุมวิท",
    nameEn: "BTS Sukhumvit",
    color: "#5C8A3C",
    width: 4,
    stations: [
      // North vertical section (right side of map, going south)
      ["N24", "N24", "คูคต", "Khu Khot", 770, 38],
      ["N23", "N23", "แยก คปอ.", "Yaek Kor Por Aor", 770, 62],
      ["N22", "N22", "ม.ธรรมศาสตร์ รังสิต", "Thammasat Rangsit", 770, 86],
      ["N21", "N21", "เมืองเอก", "Mueang Ek", 770, 110],
      ["N20", "N20", "พหลโยธิน 59", "Phahon Yothin 59", 770, 134],
      ["N19", "N19", "สายหยุด", "Sai Yud", 770, 158],
      ["N18", "N18", "สะพานใหม่", "Saphan Mai", 770, 182],
      ["N17", "N17", "พิพิธภัณฑ์กองทัพอากาศ", "Royal Thai Air Force Museum", 770, 206],
      ["N16", "N16", "รพ.ภูมิพล", "Bhumibol Adulyadej Hospital", 770, 230],
      ["N15", "N15", "กรมทหารราบที่ 11", "11th Infantry Regiment", 770, 256],
      ["N14", "N14", "วัดพระศรีมหาธาตุ", "Wat Phra Sri Mahathat", 770, 282],
      ["N13", "N13", "พหลโยธิน 24", "Phahon Yothin 24", 765, 310],
      ["N12", "N12", "รัชโยธิน", "Ratchayothin", 758, 336],
      ["N11", "N11", "เสนานิคม", "Sena Nikhom", 750, 360],
      ["N10", "N10", "ม.เกษตรศาสตร์", "Kasetsart University", 740, 384],
      ["N9", "N9", "ห้าแยกลาดพร้าว", "Ha Yaek Lat Phrao", 728, 408],
      // Diagonal to Siam (southwest)
      ["N8", "N8", "หมอชิต", "Mo Chit", 708, 435],
      ["N7", "N7", "สะพานควาย", "Saphan Khwai", 692, 458],
      ["N6", "N6", "เสนารวม", "Sena Ruam", 678, 479],
      ["N5", "N5", "อารีย์", "Ari", 664, 500],
      ["N4", "N4", "สนามเป้า", "Sanam Pao", 650, 520],
      ["N3", "N3", "อนุสาวรีย์ชัยฯ", "Victory Monument", 634, 542],
      ["N2", "N2", "พญาไท", "Phaya Thai", 618, 566],
      ["N1", "N1", "ราชเทวี", "Ratchathewi", 598, 596],
      ["CEN", "CEN", "สยาม", "Siam", 575, 628],
      // East horizontal section
      ["E1", "E1", "ชิดลม", "Chit Lom", 608, 640],
      ["E2", "E2", "เพลินจิต", "Phloen Chit", 635, 640],
      ["E3", "E3", "นานา", "Nana", 662, 640],
      ["E4", "E4", "อโศก", "Asok", 689, 640],
      ["E5", "E5", "พร้อมพงษ์", "Phrom Phong", 716, 640],
      ["E6", "E6", "ทองหล่อ", "Thong Lo", 743, 640],
      ["E7", "E7", "เอกมัย", "Ekkamai", 770, 640],
      ["E8", "E8", "พระโขนง", "Phra Khanong", 797, 640],
      ["E9", "E9", "อ่อนนุช", "On Nut", 824, 640],
      ["E10", "E10", "บางจาก", "Bang Chak", 851, 640],
      ["E11", "E11", "ปุณณวิถี", "Punnawithi", 878, 640],
      ["E12", "E12", "อุดมสุข", "Udom Suk", 905, 640],
      ["E13", "E13", "บางนา", "Bang Na", 932, 640],
      ["E14", "E14", "แบริ่ง", "Bearing", 959, 640],
      // Turn south
      ["E15", "E15", "สำโรง", "Samrong", 978, 668],
      ["E16", "E16", "ปู่เจ้า", "Pu Chao", 982, 700],
      ["E17", "E17", "ช้างเอราวัณ", "Chang Erawan", 982, 730],
      ["E18", "E18", "รร.นายเรือ", "Royal Thai Naval Academy", 982, 760],
      ["E19", "E19", "ปากน้ำ", "Pak Nam", 982, 790],
      ["E20", "E20", "ศรีนครินทร์", "Srinagarindra", 982, 820],
      ["E21", "E21", "แพรกษา", "Phraek Sa", 982, 850],
      ["E22", "E22", "สายลวด", "Sai Luat", 982, 880],
      ["E23", "E23", "เคหะฯ", "Kheha", 982, 910],
    ],
  },
  // ============ BTS SILOM (DARK GREEN) ============
  {
    key: "silom",
    nameTh: "BTS สีลม",
    nameEn: "BTS Silom",
    color: "#006837",
    width: 4,
    stations: [
      ["W1", "W1", "สนามกีฬาแห่งชาติ", "National Stadium", 548, 628],
      ["S1", "S1", "ราชดำริ", "Ratchadamri", 548, 656],
      ["S2", "S2", "ศาลาแดง", "Sala Daeng", 542, 682],
      ["S3", "S3", "ช่องนนทรี", "Chong Nonsi", 530, 706],
      ["S4", "S4", "เซนต์หลุยส์", "Saint Louis", 516, 728],
      ["S5", "S5", "สุรศักดิ์", "Surasak", 502, 748],
      ["S6", "S6", "สะพานตากสิน", "Saphan Taksin", 484, 770],
      ["S7", "S7", "กรุงธนบุรี", "Krung Thon Buri", 458, 792],
      ["S8", "S8", "วงเวียนใหญ่", "Wongwian Yai", 430, 800],
      ["S9", "S9", "โพธิ์นิมิตร", "Pho Nimit", 404, 800],
      ["S10", "S10", "ตลาดพลู", "Talat Phlu", 378, 800],
      ["S11", "S11", "วุฒากาศ", "Wutthakat", 352, 800],
      ["S12", "S12", "บางหว้า", "Bang Wa", 326, 800],
    ],
  },
  // ============ BTS GOLD LINE ============
  {
    key: "gold",
    nameTh: "BTS สีทอง",
    nameEn: "BTS Gold",
    color: "#C5992E",
    width: 3,
    stations: [
      ["G1", "G1", "กรุงธนบุรี", "Krung Thon Buri", 458, 792],
      ["G2", "G2", "เจริญนคร", "Charoen Nakhon", 458, 822],
      ["G3", "G3", "คลองสาน", "Khlong San", 458, 852],
    ],
  },
  // ============ MRT BLUE LINE ============
  {
    key: "blue",
    nameTh: "MRT สีน้ำเงิน",
    nameEn: "MRT Blue",
    color: "#1E3A8A",
    width: 4,
    stations: [
      // West side (going north from Tha Phra)
      ["BL01", "BL01", "ท่าพระ", "Tha Phra", 348, 816],
      ["BL02", "BL02", "จรัญฯ 13", "Charan 13", 335, 792],
      ["BL03", "BL03", "ไฟฉาย", "Fai Chai", 322, 768],
      ["BL04", "BL04", "บางขุนนนท์", "Bang Khun Non", 312, 742],
      ["BL05", "BL05", "บางยี่ขัน", "Bang Yi Khan", 306, 714],
      ["BL06", "BL06", "สิรินธร", "Sirindhorn", 302, 686],
      ["BL07", "BL07", "บางพลัด", "Bang Phlat", 302, 658],
      ["BL08", "BL08", "บางอ้อ", "Bang O", 308, 628],
      ["BL09", "BL09", "บางโพ", "Bang Pho", 328, 590],
      // Top section (east from Tao Poon to Lat Phrao)
      ["BL10", "BL10", "เตาปูน", "Tao Poon", 378, 505],
      ["BL11", "BL11", "บางซื่อ", "Bang Sue", 425, 488],
      ["BL12", "BL12", "กำแพงเพชร", "Kamphaeng Phet", 480, 474],
      ["BL13", "BL13", "สวนจตุจักร", "Chatuchak Park", 548, 460],
      ["BL14", "BL14", "พหลโยธิน", "Phahon Yothin", 610, 448],
      ["BL15", "BL15", "ลาดพร้าว", "Lat Phrao", 665, 438],
      // Right side (south from Lat Phrao)
      ["BL16", "BL16", "รัชดาภิเษก", "Ratchadaphisek", 695, 462],
      ["BL17", "BL17", "สุทธิสาร", "Sutthisan", 710, 488],
      ["BL18", "BL18", "ห้วยขวาง", "Huai Khwang", 722, 514],
      ["BL19", "BL19", "ศูนย์วัฒนธรรมฯ", "Thailand Cultural Centre", 730, 540],
      ["BL20", "BL20", "พระราม 9", "Phra Ram 9", 732, 566],
      ["BL21", "BL21", "เพชรบุรี", "Phetchaburi", 730, 594],
      ["BL22", "BL22", "สุขุมวิท", "Sukhumvit", 722, 622],
      ["BL23", "BL23", "ศูนย์ประชุมฯ สิริกิติ์", "Queen Sirikit NCC", 708, 648],
      // South curve (back west)
      ["BL24", "BL24", "คลองเตย", "Khlong Toei", 690, 672],
      ["BL25", "BL25", "ลุมพินี", "Lumphini", 668, 692],
      ["BL26", "BL26", "สีลม", "Si Lom", 642, 706],
      ["BL27", "BL27", "สามย่าน", "Sam Yan", 616, 718],
      ["BL28", "BL28", "หัวลำโพง", "Hua Lamphong", 590, 730],
      // Bottom section (west)
      ["BL29", "BL29", "วัดมังกร", "Wat Mangkon", 560, 742],
      ["BL30", "BL30", "สามยอด", "Sam Yot", 530, 754],
      ["BL31", "BL31", "สนามไชย", "Sanam Chai", 500, 766],
      ["BL32", "BL32", "อิสรภาพ", "Itsaraphap", 468, 778],
      ["BL33", "BL33", "บางไผ่", "Bang Phai", 428, 794],
      ["BL34", "BL34", "บางหว้า", "Bang Wa", 388, 808],
      // Extension southwest
      ["BL35", "BL35", "เพชรเกษม 48", "Phet Kasem 48", 354, 832],
      ["BL36", "BL36", "ภาษีเจริญ", "Phasi Charoen", 324, 854],
      ["BL37", "BL37", "บางแค", "Bang Khae", 296, 876],
      ["BL38", "BL38", "หลักสอง", "Lak Song", 268, 898],
    ],
  },
  // ============ MRT PURPLE LINE ============
  {
    key: "purple",
    nameTh: "MRT สีม่วง",
    nameEn: "MRT Purple",
    color: "#6B21A8",
    width: 4,
    stations: [
      ["PP01", "PP01", "คลองบางไผ่", "Khlong Bang Phai", 98, 180],
      ["PP02", "PP02", "ตลาดบางใหญ่", "Talad Bang Yai", 112, 204],
      ["PP03", "PP03", "สามแยกบางใหญ่", "Sam Yaek Bang Yai", 126, 228],
      ["PP04", "PP04", "บางพลู", "Bang Phlu", 142, 252],
      ["PP05", "PP05", "บางรักใหญ่", "Bang Rak Yai", 158, 276],
      ["PP06", "PP06", "บางรักน้อย-ท่าอิฐ", "Bang Rak Noi Tha It", 174, 300],
      ["PP07", "PP07", "ไทรม้า", "Sai Ma", 192, 322],
      ["PP08", "PP08", "สะพานพระนั่งเกล้า", "Phra Nang Klao Bridge", 210, 344],
      ["PP09", "PP09", "แยกนนทบุรี 1", "Yaek Nonthaburi 1", 228, 366],
      ["PP10", "PP10", "บางกระสอ", "Bang Krasor", 248, 386],
      ["PP11", "PP11", "ศูนย์ราชการนนทบุรี", "Nonthaburi Civic Center", 270, 404],
      ["PP12", "PP12", "กระทรวงสาธารณสุข", "Ministry of Public Health", 292, 420],
      ["PP13", "PP13", "แยกติวานนท์", "Yaek Tiwanon", 312, 438],
      ["PP14", "PP14", "วงศ์สว่าง", "Wong Sawang", 330, 456],
      ["PP15", "PP15", "บางซ่อน", "Bang Son", 352, 478],
      ["PP16", "PP16", "เตาปูน", "Tao Poon", 378, 505],
    ],
  },
  // ============ MRT YELLOW LINE ============
  {
    key: "yellow",
    nameTh: "MRT สีเหลือง",
    nameEn: "MRT Yellow",
    color: "#EAB308",
    width: 4,
    stations: [
      // From Lat Phrao going east
      ["YL01", "YL01", "ลาดพร้าว", "Lat Phrao", 695, 422],
      ["YL02", "YL02", "พหลโยธิน 48", "Phahon Yothin 48", 728, 414],
      ["YL03", "YL03", "ภาวนา", "Phawana", 758, 420],
      ["YL04", "YL04", "โชคชัย 4", "Chok Chai 4", 788, 428],
      ["YL05", "YL05", "ลาดพร้าว 71", "Lat Phrao 71", 818, 436],
      ["YL06", "YL06", "ลาดพร้าว 83", "Lat Phrao 83", 848, 444],
      ["YL07", "YL07", "มหาดไทย", "Mahat Thai", 878, 454],
      ["YL08", "YL08", "ลาดพร้าว 101", "Lat Phrao 101", 906, 465],
      ["YL09", "YL09", "บางกะปิ", "Bang Kapi", 932, 478],
      // Curving south
      ["YL10", "YL10", "แยกลำสาลี", "Yaek Lam Sali", 954, 496],
      ["YL11", "YL11", "ศรีกรีฑา", "Si Kritha", 970, 520],
      ["YL12", "YL12", "หัวหมาก", "Hua Mak", 982, 546],
      ["YL13", "YL13", "กลันตัน", "Kalantan", 992, 572],
      ["YL14", "YL14", "ศรีนุช", "Si Nut", 998, 598],
      ["YL15", "YL15", "ศรีนครินทร์ 38", "Srinagarindra 38", 1002, 624],
      ["YL16", "YL16", "สวนหลวง ร.9", "Suan Luang Rama IX", 1004, 650],
      // Going south (east of green south section)
      ["YL17", "YL17", "ศรีอุดม", "Si Udom", 1016, 672],
      ["YL18", "YL18", "ศรีเอี่ยม", "Si Iam", 1024, 696],
      ["YL19", "YL19", "ศรีลาซาล", "Si La Salle", 1030, 720],
      ["YL20", "YL20", "ศรีแบริ่ง", "Si Bearing", 1034, 744],
      ["YL21", "YL21", "ศรีด่าน", "Si Dan", 1034, 768],
      ["YL22", "YL22", "ศรีเทพา", "Si Thepha", 1024, 790],
      ["YL23", "YL23", "ทิพวัล", "Thipphawan", 1010, 808],
      // Connects to Samrong (same point as E15)
      ["YL24", "YL24", "สำโรง", "Samrong", 978, 668],
    ],
  },
  // ============ MRT PINK LINE ============
  {
    key: "pink",
    nameTh: "MRT สีชมพู",
    nameEn: "MRT Pink",
    color: "#EC4899",
    width: 4,
    stations: [
      // Starts near Purple PP11 Nonthaburi CC
      ["PK01", "PK01", "ศูนย์ราชการนนทบุรี", "Nonthaburi Civic Center", 270, 404],
      // Goes northeast
      ["PK02", "PK02", "แคราย", "Khae Rai", 305, 378],
      ["PK03", "PK03", "สนามบินน้ำ", "Sanambin Nam", 338, 356],
      ["PK04", "PK04", "สามัคคี", "Samakkhi", 365, 336],
      // Curves north/west to Pak Kret area
      ["PK05", "PK05", "กรมชลประทาน", "Royal Irrigation Department", 345, 312],
      ["PK06", "PK06", "ปากเกร็ด", "Pak Kret", 325, 290],
      // Curves back east
      ["PK07", "PK07", "เลี่ยงเมืองปากเกร็ด", "Pak Kret Bypass", 358, 268],
      ["PK08", "PK08", "แจ้งวัฒนะ-ปากเกร็ด 28", "Chaeng Watthana-Pak Kret 28", 394, 256],
      ["PK09", "PK09", "ศรีรัช", "Si Rat", 430, 248],
      ["PK10", "PK10", "เมืองทองธานี", "Muang Thong Thani", 466, 242],
      // Horizontal east across top
      ["PK11", "PK11", "แจ้งวัฒนะ 14", "Chaeng Watthana 14", 502, 238],
      ["PK12", "PK12", "ศูนย์ราชการฯ", "Government Complex", 540, 236],
      ["PK13", "PK13", "โทรคมนาคมแห่งชาติ", "National Telecom", 578, 236],
      ["PK14", "PK14", "หลักสี่", "Lak Si", 616, 238],
      ["PK15", "PK15", "ราชภัฏพระนคร", "Rajabhat Phranakhon", 652, 242],
      ["PK16", "PK16", "นพรัตนราชธานี", "Nopphawong", 688, 250],
      ["PK17", "PK17", "วัดพระศรีมหาธาตุ", "Wat Phra Sri Mahathat", 722, 260],
      // Continues east
      ["PK18", "PK18", "รามอินทรา 3", "Ram Inthra 3", 758, 262],
      ["PK19", "PK19", "ลาดปลาเค้า", "Lat Pla Khao", 792, 260],
      ["PK20", "PK20", "รามอินทรา กม.4", "Ram Inthra Km.4", 826, 258],
      ["PK21", "PK21", "มัยลาภ", "Maiyalap", 860, 256],
      ["PK22", "PK22", "วัชรพล", "Watcharapol", 894, 256],
      ["PK23", "PK23", "รามอินทรา กม.6", "Ram Inthra Km.6", 928, 258],
      ["PK24", "PK24", "คู้บอน", "Khu Bon", 960, 264],
      // Curves southeast to Min Buri
      ["PK25", "PK25", "รามอินทรา กม.9", "Ram Inthra Km.9", 992, 272],
      ["PK26", "PK26", "วงแหวน-รามอินทรา", "Outer Ring Road-Ram Inthra", 1022, 284],
      ["PK27", "PK27", "นพรัตน์", "Nopparat", 1050, 300],
      ["PK28", "PK28", "บางชัน", "Bang Chan", 1076, 320],
      ["PK29", "PK29", "เศรษฐบุตรบำเพ็ญ", "Setthabutbamphen", 1098, 344],
      ["PK30", "PK30", "มีนบุรี", "Min Buri", 1118, 372],
    ],
  },
  // ============ AIRPORT RAIL LINK (RED) ============
  {
    key: "arl",
    nameTh: "แอร์พอร์ต เรล ลิงก์",
    nameEn: "Airport Rail Link",
    color: "#DC2626",
    width: 3,
    stations: [
      ["A1", "A1", "พญาไท", "Phaya Thai", 618, 566],
      ["A2", "A2", "ราชปรารภ", "Ratchaprarop", 656, 564],
      ["A3", "A3", "มักกะสัน", "Makkasan", 700, 572],
      ["A4", "A4", "รามคำแหง", "Ramkhamhaeng", 778, 576],
      ["A5", "A5", "หัวหมาก", "Hua Mak", 852, 580],
      ["A6", "A6", "บ้านทับช้าง", "Ban Thap Chang", 928, 584],
      ["A7", "A7", "ลาดกระบัง", "Lat Krabang", 1005, 588],
      ["A8", "A8", "สุวรรณภูมิ", "Suvarnabhumi", 1100, 594],
    ],
  },
];

// Build lookup maps
type StationInfo = { code: string; nameTh: string; nameEn: string; x: number; y: number; lineKey: string; color: string };
const ALL_STATIONS_MAP: globalThis.Map<string, StationInfo> = new globalThis.Map();
TRANSIT_LINES.forEach((line) => {
  line.stations.forEach(([id, code, nameTh, nameEn, x, y]) => {
    if (!ALL_STATIONS_MAP.has(id)) {
      ALL_STATIONS_MAP.set(id, { code, nameTh, nameEn, x, y, lineKey: line.key, color: line.color });
    }
  });
});

// ====================================================
// Component
// ====================================================

interface StationTransitMapProps {
  selectedStations: string[];
  onChange: (stations: string[]) => void;
  onClose: () => void;
}

export default function StationTransitMap({
  selectedStations,
  onChange,
  onClose,
}: StationTransitMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [expandedLines, setExpandedLines] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const toggleStation = useCallback(
    (id: string) => {
      onChange(
        selectedStations.includes(id)
          ? selectedStations.filter((s) => s !== id)
          : [...selectedStations, id]
      );
    },
    [selectedStations, onChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(3, Math.max(0.4, z + delta)));
  };

  // Touch support
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStart) {
      setPan({ x: e.touches[0].clientX - touchStart.x, y: e.touches[0].clientY - touchStart.y });
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Search filter
  const searchResults: [string, StationInfo][] = searchTerm.trim()
    ? (Array.from(ALL_STATIONS_MAP.entries()) as [string, StationInfo][]).filter(
        ([, s]) =>
          s.nameTh.includes(searchTerm) ||
          s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const focusStation = (id: string) => {
    const s = ALL_STATIONS_MAP.get(id);
    if (!s) return;
    setZoom(2);
    setPan({ x: -s.x * 2 + 400, y: -s.y * 2 + 300 });
    setSearchTerm("");
  };

  // Selected station tag data
  const selectedTags = selectedStations.map((id) => {
    const s = ALL_STATIONS_MAP.get(id);
    return s ? { id, code: s.code, nameTh: s.nameTh, color: s.color } : null;
  }).filter(Boolean) as { id: string; code: string; nameTh: string; color: string }[];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-[95vw] h-[92vh] max-w-[1200px] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🚇</div>
            <div>
              <h2 className="text-base font-bold text-white">
                แผนที่เส้นทางรถไฟฟ้า / Transit Map
              </h2>
              <p className="text-xs text-white/70">
                {selectedStations.length > 0
                  ? `เลือกแล้ว ${selectedStations.length} สถานี`
                  : "คลิกสถานีเพื่อเลือก / Click to select stations"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-white/20 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("map")}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  viewMode === "map" ? "bg-white text-gray-800" : "text-white/80"
                }`}
              >
                <Map className="w-3 h-3" /> Map
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  viewMode === "list" ? "bg-white text-gray-800" : "text-white/80"
                }`}
              >
                <List className="w-3 h-3" /> List
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2 border-b bg-gray-50 flex-shrink-0 relative">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาสถานี... / Search station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-lg shadow-xl border max-h-60 overflow-y-auto z-10">
              {searchResults.slice(0, 20).map(([id, s]) => (
                <button
                  key={id}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left text-sm"
                  onClick={() => {
                    toggleStation(id);
                    if (viewMode === "map") focusStation(id);
                    setSearchTerm("");
                  }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="font-mono text-xs font-bold min-w-[40px]" style={{ color: s.color }}>
                    {s.code}
                  </span>
                  <span className="flex-1">
                    {s.nameTh} <span className="text-gray-400">{s.nameEn}</span>
                  </span>
                  {selectedStations.includes(id) && <Check className="w-4 h-4 text-green-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="px-4 py-2 border-b bg-blue-50 flex flex-wrap gap-1 max-h-16 overflow-y-auto flex-shrink-0">
            {selectedTags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: t.color }}
              >
                {t.code} {t.nameTh}
                <button onClick={() => toggleStation(t.id)} className="hover:bg-white/30 rounded-full">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden relative">
          {viewMode === "map" ? (
            <>
              {/* SVG Map */}
              <div
                className="w-full h-full cursor-grab active:cursor-grabbing bg-gray-100 overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => setTouchStart(null)}
              >
                <svg
                  ref={svgRef}
                  viewBox="0 0 1200 980"
                  className="w-full h-full"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "center center",
                    transition: dragging ? "none" : "transform 0.15s ease-out",
                  }}
                >
                  {/* Background */}
                  <rect x="0" y="0" width="1200" height="980" fill="#f8f9fa" rx="8" />

                  {/* Chao Phraya River (decorative) */}
                  <path
                    d="M 440 740 Q 460 720, 450 700 Q 440 680, 455 650 Q 470 620, 460 595 Q 450 570, 465 540"
                    fill="none"
                    stroke="#bfdbfe"
                    strokeWidth="12"
                    opacity="0.4"
                    strokeLinecap="round"
                  />

                  {/* Title */}
                  <text x="35" y="30" fontSize="14" fontWeight="bold" fill="#1f2937" fontFamily="sans-serif">
                    แผนที่เส้นทางรถไฟฟ้า
                  </text>
                  <text x="35" y="44" fontSize="9" fill="#6b7280" fontFamily="sans-serif">
                    BTS / MRT / Airport Rail Link
                  </text>

                  {/* Legend */}
                  {TRANSIT_LINES.map((line, i) => (
                    <g key={line.key} transform={`translate(35, ${60 + i * 16})`}>
                      <line x1="0" y1="0" x2="18" y2="0" stroke={line.color} strokeWidth="3" strokeLinecap="round" />
                      <text x="24" y="3" fontSize="7" fill="#374151" fontFamily="sans-serif">
                        {line.nameTh}
                      </text>
                    </g>
                  ))}

                  {/* Draw all line paths */}
                  {TRANSIT_LINES.map((line) => {
                    // Yellow line: draw main path (YL01-YL23), skip YL24 (Samrong interchange drawn separately)
                    const stationsForPath = line.key === "yellow"
                      ? line.stations.filter(([id]) => id !== "YL24")
                      : line.stations;
                    const points = stationsForPath.map(([, , , , x, y]) => `${x},${y}`).join(" ");
                    return (
                      <polyline
                        key={line.key}
                        points={points}
                        fill="none"
                        stroke={line.color}
                        strokeWidth={line.width}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.85}
                      />
                    );
                  })}
                  {/* Yellow line connection from YL23 Thipphawan to YL24 Samrong */}
                  <line x1={1010} y1={808} x2={978} y2={668} stroke="#EAB308" strokeWidth={3} strokeDasharray="6 3" opacity={0.7} />

                  {/* Blue line loop closure (BL01 Tha Phra connects to BL33 Bang Phai area) */}
                  <line
                    x1={348} y1={816}
                    x2={388} y2={808}
                    stroke="#1E3A8A"
                    strokeWidth={3}
                    strokeDasharray="4 3"
                    opacity={0.5}
                  />

                  {/* Interchange connections */}
                  {INTERCHANGES.map(([a, b], i) => {
                    const sa = ALL_STATIONS_MAP.get(a);
                    const sb = ALL_STATIONS_MAP.get(b);
                    if (!sa || !sb || a === b) return null;
                    const dist = Math.sqrt((sa.x - sb.x) ** 2 + (sa.y - sb.y) ** 2);
                    if (dist < 5 || dist > 80) return null;
                    return (
                      <line
                        key={`ic-${i}`}
                        x1={sa.x}
                        y1={sa.y}
                        x2={sb.x}
                        y2={sb.y}
                        stroke="#9CA3AF"
                        strokeWidth={2}
                        strokeDasharray="3 2"
                      />
                    );
                  })}

                  {/* Draw stations */}
                  {TRANSIT_LINES.map((line) =>
                    line.stations.map(([id, code, nameTh, nameEn, x, y]) => {
                      const isSelected = selectedStations.includes(id);
                      const isHovered = hoveredStation === id;
                      const isInterchange = INTERCHANGES.some(
                        ([a, b]) => (a === id || b === id) && a !== b
                      );
                      const r = isInterchange ? 6 : 4.5;

                      return (
                        <g
                          key={`${line.key}-${id}`}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStation(id);
                          }}
                          onMouseEnter={() => setHoveredStation(id)}
                          onMouseLeave={() => setHoveredStation(null)}
                        >
                          {/* Hit area */}
                          <circle cx={x} cy={y} r={12} fill="transparent" />

                          {/* Station circle */}
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? r + 1.5 : r}
                            fill={isSelected ? line.color : "white"}
                            stroke={line.color}
                            strokeWidth={isInterchange ? 2.5 : 2}
                            className="transition-all duration-150"
                          />
                          {isInterchange && !isSelected && (
                            <circle
                              cx={x}
                              cy={y}
                              r={r - 2}
                              fill="white"
                              stroke={line.color}
                              strokeWidth={1}
                            />
                          )}

                          {/* Check mark for selected */}
                          {isSelected && (
                            <text
                              x={x}
                              y={y + 1}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="7"
                              fill="white"
                              fontWeight="bold"
                            >
                              ✓
                            </text>
                          )}

                          {/* Station code label */}
                          <text
                            x={x}
                            y={y - r - 3}
                            textAnchor="middle"
                            fontSize="6"
                            fontWeight="bold"
                            fill={line.color}
                            fontFamily="monospace"
                            opacity={isHovered || isSelected ? 1 : 0.7}
                          >
                            {code}
                          </text>

                          {/* Station name (shown on hover or when zoomed in) */}
                          {(isHovered || isSelected) && (
                            <g>
                              <rect
                                x={x + r + 4}
                                y={y - 7}
                                width={nameTh.length * 7 + 10}
                                height={14}
                                rx={3}
                                fill="white"
                                stroke={line.color}
                                strokeWidth={0.5}
                                opacity={0.95}
                              />
                              <text
                                x={x + r + 9}
                                y={y + 2}
                                fontSize="7"
                                fill="#1f2937"
                                fontFamily="sans-serif"
                                fontWeight={isSelected ? "bold" : "normal"}
                              >
                                {nameTh}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })
                  )}

                  {/* Suvarnabhumi Airport icon */}
                  <g transform="translate(1100, 594)">
                    <text x="10" y="-8" fontSize="12">✈️</text>
                    <text x="8" y="10" fontSize="7" fill="#DC2626" fontWeight="bold" fontFamily="sans-serif">
                      สุวรรณภูมิ
                    </text>
                  </g>
                </svg>
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-1">
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.3))}
                  className="p-2 bg-white rounded-lg shadow-md border hover:bg-gray-50 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.4, z - 0.3))}
                  className="p-2 bg-white rounded-lg shadow-md border hover:bg-gray-50 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={resetView}
                  className="p-2 bg-white rounded-lg shadow-md border hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom level indicator */}
              <div className="absolute bottom-4 left-4 bg-white/90 px-2 py-1 rounded text-xs text-gray-500 shadow">
                {Math.round(zoom * 100)}% — ลากเพื่อเลื่อน / Scroll เพื่อซูม
              </div>
            </>
          ) : (
            /* List View */
            <div className="overflow-y-auto h-full">
              {TRANSIT_LINES.map((line) => {
                const isExpanded = expandedLines.includes(line.key);
                const selectedCount = line.stations.filter(([id]) =>
                  selectedStations.includes(id)
                ).length;
                return (
                  <div key={line.key} className="border-b">
                    <button
                      onClick={() =>
                        setExpandedLines((prev) =>
                          prev.includes(line.key)
                            ? prev.filter((k) => k !== line.key)
                            : [...prev, line.key]
                        )
                      }
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50"
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: line.color }} />
                      <span className="font-semibold text-sm flex-1 text-left">
                        {line.nameTh}
                        <span className="text-gray-400 ml-2 font-normal text-xs">{line.nameEn}</span>
                      </span>
                      {selectedCount > 0 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: line.color }}
                        >
                          {selectedCount}
                        </span>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3">
                        <button
                          onClick={() => {
                            const ids = line.stations.map(([id]) => id);
                            const allSelected = ids.every((id) => selectedStations.includes(id));
                            if (allSelected) {
                              onChange(selectedStations.filter((id) => !ids.includes(id)));
                            } else {
                              onChange([...selectedStations, ...ids.filter((id) => !selectedStations.includes(id))]);
                            }
                          }}
                          className="text-xs mb-2 px-3 py-1 rounded-full border"
                          style={{ borderColor: line.color, color: line.color }}
                        >
                          {line.stations.every(([id]) => selectedStations.includes(id)) ? "Deselect All" : "Select All"}
                        </button>
                        <div className="relative ml-3">
                          <div
                            className="absolute left-[6px] top-0 bottom-0 w-[3px] rounded"
                            style={{ backgroundColor: line.color }}
                          />
                          {line.stations.map(([id, code, nameTh, nameEn]) => {
                            const isSelected = selectedStations.includes(id);
                            return (
                              <button
                                key={id}
                                onClick={() => toggleStation(id)}
                                className={`relative w-full flex items-center gap-3 pl-6 pr-3 py-1 rounded text-left text-sm ${
                                  isSelected ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                                }`}
                              >
                                <div
                                  className="absolute left-0 w-[15px] h-[15px] rounded-full border-[2.5px]"
                                  style={{
                                    borderColor: line.color,
                                    backgroundColor: isSelected ? line.color : "white",
                                  }}
                                >
                                  {isSelected && (
                                    <Check className="w-2 h-2 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                  )}
                                </div>
                                <span className="font-mono text-xs font-bold min-w-[36px]" style={{ color: line.color }}>
                                  {code}
                                </span>
                                <span className="flex-1">
                                  {nameTh}
                                  <span className="text-gray-400 ml-1 text-xs">{nameEn}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-gray-500">
            เลือกแล้ว {selectedStations.length} สถานี
          </span>
          <div className="flex gap-2">
            {selectedStations.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-100"
              >
                ล้างทั้งหมด
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700"
            >
              ตกลง ({selectedStations.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { TRANSIT_LINES, ALL_STATIONS_MAP };
