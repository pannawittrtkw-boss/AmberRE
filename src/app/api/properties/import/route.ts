import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

// Column key mapping (same order as export template)
const KEY_MAP = [
  "projectName", "listingType", "price", "salePrice", "sizeSqm",
  "floor", "building", "bedrooms", "bathrooms",
  "sourceLink", "linkPage", "postFrom", "nearbyStations",
  "furnitureDetails", "electricalAppliances",
  "ownerName", "ownerPhone", "ownerLineId", "ownerFacebookUrl",
  "coAgentName", "coAgentPhone", "coAgentLineId", "coAgentFacebookUrl",
  "status", "category", "priority", "availableDate",
  "latitude", "longitude", "note",
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!["ADMIN", "AGENT", "OWNER"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const userId = Number((session.user as any).id);
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const wb = XLSX.read(bytes, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (rows.length < 2) {
      return NextResponse.json({ success: false, error: "ไฟล์ไม่มีข้อมูล (ต้องมีอย่างน้อย 1 แถวข้อมูล)" });
    }

    // Skip header row
    const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell !== undefined && cell !== ""));

    const results: { row: number; success: boolean; error?: string; id?: number }[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // Excel row number (1-based + header)

      try {
        // Map columns to keys
        const data: any = {};
        KEY_MAP.forEach((key, idx) => {
          const val = row[idx];
          if (val !== undefined && val !== "") {
            data[key] = String(val).trim();
          }
        });

        // Validate required fields
        if (!data.projectName) {
          results.push({ row: rowNum, success: false, error: "Project Name is required" });
          continue;
        }

        // Parse numeric fields
        const price = parseFloat(data.price) || 0;
        const salePrice = data.salePrice ? parseFloat(data.salePrice) : null;
        const sizeSqm = data.sizeSqm ? parseFloat(data.sizeSqm) : null;
        const floor = data.floor ? parseInt(data.floor) : null;
        const bedrooms = data.bedrooms ? parseInt(data.bedrooms) : 0;
        const bathrooms = data.bathrooms ? parseInt(data.bathrooms) : 0;
        const latitude = data.latitude ? parseFloat(data.latitude) : null;
        const longitude = data.longitude ? parseFloat(data.longitude) : null;

        // Parse comma-separated arrays to JSON
        const furnitureDetails = data.furnitureDetails
          ? JSON.stringify(data.furnitureDetails.split(",").map((s: string) => s.trim()).filter(Boolean))
          : null;
        const electricalAppliances = data.electricalAppliances
          ? JSON.stringify(data.electricalAppliances.split(",").map((s: string) => s.trim()).filter(Boolean))
          : null;
        const nearbyStations = data.nearbyStations
          ? JSON.stringify(data.nearbyStations.split(",").map((s: string) => s.trim()).filter(Boolean))
          : null;

        // Parse date
        let availableDate: Date | null = null;
        if (data.availableDate) {
          const d = new Date(data.availableDate);
          if (!isNaN(d.getTime())) availableDate = d;
        }

        const property = await prisma.property.create({
          data: {
            titleTh: data.projectName,
            propertyType: "CONDO",
            listingType: data.listingType || "RENT",
            price,
            salePrice,
            sizeSqm,
            floor,
            bedrooms,
            bathrooms,
            building: data.building || null,
            projectName: data.projectName,
            sourceLink: data.sourceLink || null,
            linkPage: data.linkPage || null,
            postFrom: data.postFrom || "OWNER",
            furnitureDetails,
            electricalAppliances,
            nearbyStations,
            ownerName: data.ownerName || null,
            ownerPhone: data.ownerPhone || null,
            ownerLineId: data.ownerLineId || null,
            ownerFacebookUrl: data.ownerFacebookUrl || null,
            coAgentName: data.coAgentName || null,
            coAgentPhone: data.coAgentPhone || null,
            coAgentLineId: data.coAgentLineId || null,
            coAgentFacebookUrl: data.coAgentFacebookUrl || null,
            status: data.status || "PENDING",
            category: data.category || "NORMAL",
            priority: data.priority || "NORMAL",
            availableDate,
            latitude,
            longitude,
            note: data.note || null,
            ownerId: userId,
          },
        });

        results.push({ row: rowNum, success: true, id: property.id });
      } catch (err: any) {
        results.push({ row: rowNum, success: false, error: err?.message || "Unknown error" });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        total: dataRows.length,
        success: successCount,
        failed: failCount,
        results,
      },
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Import failed" },
      { status: 500 }
    );
  }
}
