import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Template columns definition
const COLUMNS = [
  { header: "Project Name / ชื่อโครงการ*", key: "projectName", example: "Niche Mono Sukhumvit - Puchao" },
  { header: "Listing Type* (RENT/SALE/RENT_AND_SALE)", key: "listingType", example: "RENT_AND_SALE" },
  { header: "Rent Price / ราคาเช่า", key: "price", example: "12000" },
  { header: "Sale Price / ราคาขาย", key: "salePrice", example: "2320000" },
  { header: "Size (sqm) / ขนาด", key: "sizeSqm", example: "35" },
  { header: "Floor / ชั้น", key: "floor", example: "6" },
  { header: "Building / ตึก", key: "building", example: "A" },
  { header: "Bedrooms / ห้องนอน", key: "bedrooms", example: "1" },
  { header: "Bathrooms / ห้องน้ำ", key: "bathrooms", example: "1" },
  { header: "Source Link", key: "sourceLink", example: "https://facebook.com/..." },
  { header: "Link Page", key: "linkPage", example: "https://facebook.com/page/..." },
  { header: "Post From (OWNER/AGENT)", key: "postFrom", example: "OWNER" },
  { header: "Nearby Stations / สถานีใกล้เคียง (คั่นด้วย ,)", key: "nearbyStations", example: "E16,E17,E18" },
  { header: "Furniture (คั่นด้วย ,)", key: "furnitureDetails", example: "bed,mattress,wardrobe,sofa,tvCabinet" },
  { header: "Appliances (คั่นด้วย ,)", key: "electricalAppliances", example: "airConditioner,tv,refrigerator,washingMachine" },
  { header: "Owner Name / ชื่อเจ้าของ", key: "ownerName", example: "สมชาย" },
  { header: "Owner Phone / เบอร์โทร", key: "ownerPhone", example: "081-234-5678" },
  { header: "Owner Line ID", key: "ownerLineId", example: "somchai123" },
  { header: "Owner Facebook URL", key: "ownerFacebookUrl", example: "" },
  { header: "Co-Agent Name", key: "coAgentName", example: "" },
  { header: "Co-Agent Phone", key: "coAgentPhone", example: "" },
  { header: "Co-Agent Line ID", key: "coAgentLineId", example: "" },
  { header: "Co-Agent Facebook URL", key: "coAgentFacebookUrl", example: "" },
  { header: "Status (PENDING/WAITING/VERIFIED/ADDED_PROPERTIES/NOT_ACCEPT/NOT_AVAILABLE)", key: "status", example: "PENDING" },
  { header: "Category (NORMAL/LUXURY)", key: "category", example: "NORMAL" },
  { header: "Priority (NORMAL/URGENT)", key: "priority", example: "NORMAL" },
  { header: "Available Date / วันที่พร้อมเข้าอยู่ (YYYY-MM-DD)", key: "availableDate", example: "2026-03-14" },
  { header: "Latitude", key: "latitude", example: "13.638747" },
  { header: "Longitude", key: "longitude", example: "100.592321" },
  { header: "Note / หมายเหตุ", key: "note", example: "Fully furnished" },
];

// Furniture & Appliance reference
const FURNITURE_REF = [
  "bed = เตียง", "mattress = ฟูก/ที่นอน", "wardrobe = ตู้เสื้อผ้า", "dressingTable = โต๊ะเครื่องแป้ง",
  "sofa = โซฟา", "coffeeTable = โต๊ะกลาง", "tvCabinet = ชั้นวางทีวี", "curtains = ผ้าม่าน/มู่ลี่",
  "kitchenCounter = เคาน์เตอร์ครัว", "sink = ซิงก์ล้างจาน", "diningTable = โต๊ะอาหาร",
  "chairs = เก้าอี้", "showerScreen = ฉากกั้นอาบน้ำ",
];

const APPLIANCE_REF = [
  "airConditioner = แอร์", "tv = ทีวี", "refrigerator = ตู้เย็น", "microwave = ไมโครเวฟ",
  "stove = เตาไฟฟ้า/เตาแก๊ส", "cookerHood = เครื่องดูดควัน", "washingMachine = เครื่องซักผ้า",
  "digitalDoorLock = Digital Door Lock", "waterHeater = เครื่องทำน้ำอุ่น",
];

export async function GET() {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Template with headers + example row
    const headers = COLUMNS.map((c) => c.header);
    const exampleRow = COLUMNS.map((c) => c.example);
    const wsData = [headers, exampleRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws["!cols"] = COLUMNS.map((c) => ({ wch: Math.max(c.header.length, 20) }));

    XLSX.utils.book_append_sheet(wb, ws, "Properties");

    // Sheet 2: Reference guide
    const refData = [
      ["คู่มือการกรอกข้อมูล / Data Entry Guide"],
      [],
      ["Furniture Keys (ใส่คั่นด้วย , เช่น bed,mattress,sofa)"],
      ...FURNITURE_REF.map((r) => [r]),
      [],
      ["Appliance Keys (ใส่คั่นด้วย , เช่น airConditioner,tv,refrigerator)"],
      ...APPLIANCE_REF.map((r) => [r]),
      [],
      ["Station Codes (ใส่คั่นด้วย , เช่น E16,E17,BL22)"],
      ["BTS Sukhumvit: N24-คูคต ... CEN-สยาม ... E23-เคหะฯ"],
      ["BTS Silom: W1-สนามกีฬาฯ ... S12-บางหว้า"],
      ["MRT Blue: BL01-ท่าพระ ... BL38-หลักสอง"],
      ["MRT Purple: PP01-คลองบางไผ่ ... PP16-เตาปูน"],
      ["MRT Yellow: YL01-ลาดพร้าว ... YL24-สำโรง"],
      ["MRT Pink: PK01-ศูนย์ราชการนนทบุรี ... PK30-มีนบุรี"],
      ["Airport Rail Link: A1-พญาไท ... A8-สุวรรณภูมิ"],
      [],
      ["Listing Type: RENT, SALE, RENT_AND_SALE"],
      ["Status: PENDING, WAITING, VERIFIED, VERIFIED_OVER_10_DAYS, ADDED_PROPERTIES, NOT_ACCEPT, NOT_AVAILABLE, RENTED, SOLD"],
      ["Category: NORMAL, LUXURY"],
      ["Priority: NORMAL, URGENT"],
      ["Post From: OWNER, AGENT"],
    ];
    const wsRef = XLSX.utils.aoa_to_sheet(refData);
    wsRef["!cols"] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsRef, "Guide");

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=npb-property-template.xlsx",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ success: false, error: "Export failed" }, { status: 500 });
  }
}
