"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check, Train, ChevronDown, ChevronUp } from "lucide-react";

// =============================================
// Complete BTS / MRT / ARL Station Data
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

const LINES: LineData[] = [
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

interface StationMapSelectorProps {
  selectedStations: string[];
  onChange: (stations: string[]) => void;
  onClose: () => void;
}

export default function StationMapSelector({
  selectedStations,
  onChange,
  onClose,
}: StationMapSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLines, setExpandedLines] = useState<string[]>([]);

  const toggleLine = (lineKey: string) => {
    setExpandedLines((prev) =>
      prev.includes(lineKey)
        ? prev.filter((k) => k !== lineKey)
        : [...prev, lineKey]
    );
  };

  const toggleStation = (stationId: string) => {
    onChange(
      selectedStations.includes(stationId)
        ? selectedStations.filter((id) => id !== stationId)
        : [...selectedStations, stationId]
    );
  };

  const toggleAllInLine = (line: LineData) => {
    const lineStationIds = line.stations.map((s) => s.id);
    const allSelected = lineStationIds.every((id) => selectedStations.includes(id));
    if (allSelected) {
      onChange(selectedStations.filter((id) => !lineStationIds.includes(id)));
    } else {
      const newIds = lineStationIds.filter((id) => !selectedStations.includes(id));
      onChange([...selectedStations, ...newIds]);
    }
  };

  const filteredLines = useMemo(() => {
    if (!searchTerm.trim()) return LINES;
    const term = searchTerm.toLowerCase();
    return LINES.map((line) => ({
      ...line,
      stations: line.stations.filter(
        (s) =>
          s.nameEn.toLowerCase().includes(term) ||
          s.nameTh.includes(term) ||
          s.code.toLowerCase().includes(term)
      ),
    })).filter((line) => line.stations.length > 0);
  }, [searchTerm]);

  const selectedStationNames = useMemo(() => {
    const names: string[] = [];
    LINES.forEach((line) => {
      line.stations.forEach((s) => {
        if (selectedStations.includes(s.id)) {
          names.push(`${s.code} ${s.nameTh}`);
        }
      });
    });
    return names;
  }, [selectedStations]);

  // Lock body scroll while modal is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // SSR guard: only render after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const modal = (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-3">
            <Train className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">
                เลือกสถานีใกล้เคียง / Select Nearby Stations
              </h2>
              <p className="text-sm text-white/70">
                {selectedStations.length > 0
                  ? `เลือกแล้ว ${selectedStations.length} สถานี`
                  : "BTS / MRT / Airport Rail Link"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b bg-gray-50 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาสถานี... / Search station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Selected Tags */}
        {selectedStations.length > 0 && (
          <div className="px-6 py-3 border-b bg-blue-50 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto flex-shrink-0">
            {LINES.map((line) =>
              line.stations
                .filter((s) => selectedStations.includes(s.id))
                .map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: line.color }}
                  >
                    {s.code} {s.nameTh}
                    <button
                      type="button"
                      onClick={() => toggleStation(s.id)}
                      className="hover:bg-white/30 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
            )}
          </div>
        )}

        {/* Station Lines */}
        <div className="flex-1 overflow-y-auto">
          {filteredLines.map((line) => {
            const isExpanded = expandedLines.includes(line.key);
            const lineStationIds = line.stations.map((s) => s.id);
            const selectedInLine = lineStationIds.filter((id) =>
              selectedStations.includes(id)
            ).length;

            return (
              <div
                key={line.key}
                className="relative border-b border-gray-200 last:border-b-0"
              >
                {/* Colored vertical accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ backgroundColor: line.color }}
                />

                {/* Line Header */}
                <button
                  type="button"
                  onClick={() => toggleLine(line.key)}
                  className="w-full pl-6 pr-6 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow"
                      style={{ backgroundColor: line.color }}
                    />
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">
                        {line.nameTh}
                      </span>
                      <span className="text-xs text-gray-400">
                        {line.nameEn}
                      </span>
                    </div>
                    {selectedInLine > 0 && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shadow-sm"
                        style={{ backgroundColor: line.color }}
                      >
                        {selectedInLine} selected
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* Stations - Rail Map Style */}
                {isExpanded && (
                  <div className="px-6 pb-4">
                    {/* Select All for this line */}
                    <button
                      type="button"
                      onClick={() => toggleAllInLine(line)}
                      className="text-xs mb-3 px-3 py-1 rounded-full border hover:bg-gray-50 transition-colors"
                      style={{
                        borderColor: line.color,
                        color: line.color,
                      }}
                    >
                      {lineStationIds.every((id) =>
                        selectedStations.includes(id)
                      )
                        ? "Deselect All"
                        : "Select All"}
                    </button>

                    {/* Rail Line Visual */}
                    <div className="relative ml-4">
                      {/* Vertical Rail Line */}
                      <div
                        className="absolute left-[7px] top-0 bottom-0 w-[3px] rounded-full"
                        style={{ backgroundColor: line.color }}
                      />

                      {/* Stations */}
                      <div className="space-y-0.5">
                        {line.stations.map((station, idx) => {
                          const isSelected = selectedStations.includes(
                            station.id
                          );
                          return (
                            <button
                              key={station.id}
                              type="button"
                              onClick={() => toggleStation(station.id)}
                              className={`relative w-full flex items-center gap-3 pl-7 pr-3 py-1.5 rounded-lg text-left transition-all text-sm group ${
                                isSelected
                                  ? "bg-gray-100"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              {/* Station Dot */}
                              <div
                                className={`absolute left-0 w-[17px] h-[17px] rounded-full border-[3px] transition-all ${
                                  isSelected
                                    ? "scale-110"
                                    : "bg-white group-hover:scale-105"
                                }`}
                                style={{
                                  borderColor: line.color,
                                  backgroundColor: isSelected
                                    ? line.color
                                    : "white",
                                }}
                              >
                                {isSelected && (
                                  <Check className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                )}
                              </div>

                              {/* Station Code */}
                              <span
                                className="font-mono text-xs font-bold min-w-[40px]"
                                style={{ color: line.color }}
                              >
                                {station.code}
                              </span>

                              {/* Station Name */}
                              <span className="flex-1">
                                <span
                                  className={`${
                                    isSelected
                                      ? "font-semibold"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {station.nameTh}
                                </span>
                                <span className="text-gray-400 ml-2 text-xs">
                                  {station.nameEn}
                                </span>
                              </span>

                              {isSelected && (
                                <Check
                                  className="w-4 h-4 flex-shrink-0"
                                  style={{ color: line.color }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            เลือกแล้ว {selectedStations.length} สถานี
          </span>
          <div className="flex gap-3">
            {selectedStations.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Done ({selectedStations.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// Export station data for use in other components
export { LINES };
