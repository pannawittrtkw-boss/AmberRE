import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { pushMessage, STATUS_LABEL } from "@/app/api/line/url-checker/route";

export async function POST(req: NextRequest) {
  try {
    const { urlId, status, fullyFurnished, fullyElectric, readyToMoveIn, remark, seq, by } = await req.json();

    if (!urlId || !status) {
      return NextResponse.json({ success: false, error: "Missing params" }, { status: 400 });
    }

    const urlRecord = await prisma.lineUrlHistory.findFirst({
      where: { id: Number(urlId) },
    });

    if (!urlRecord) {
      return NextResponse.json({ success: false, error: "Record not found" }, { status: 404 });
    }

    // Create property
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (!adminUser) {
      return NextResponse.json({ success: false, error: "No ADMIN user found" }, { status: 500 });
    }

    const propData: Prisma.PropertyUncheckedCreateInput = {
      titleTh:         "รายการใหม่ (จาก ScanLink)",
      propertyType:    "CONDO",
      listingType:     "RENT",
      price:           new Prisma.Decimal(0),
      sourceLink:      urlRecord.url,
      status:          "VERIFIED",
      foreignerAccept: status === "ACCEPT_ALL" ? "ACCEPT" : "NOT_ACCEPT",
      fullyFurnished:  fullyFurnished ?? false,
      fullyElectric:   fullyElectric  ?? false,
      availableDate:   readyToMoveIn  ? new Date() : undefined,
      note:            remark || undefined,
      ownerId:         adminUser.id,
    };

    await prisma.property.create({ data: propData });

    // Update lineUrlHistory status
    await prisma.lineUrlHistory.update({
      where: { id: Number(urlId) },
      data:  { status, reviewedAt: new Date(), reviewedBy: by || null },
    });

    // Push confirmation to LINE group
    const statusLabel = status in STATUS_LABEL ? STATUS_LABEL[status] : "✅ Accepted";
    const yes = "✅";
    const no  = "❌";

    const lines = [
      `${statusLabel} [#${seq}] — บันทึกแล้ว`,
      by ? `By ${by}` : null,
      `🛋 Fully Furnished: ${fullyFurnished ? yes : no}`,
      `⚡ Fully Electric: ${fullyElectric   ? yes : no}`,
      `✅ Ready to move in: ${readyToMoveIn  ? yes : no}`,
      remark ? `📝 Remark: ${remark}` : null,
    ].filter(Boolean).join("\n");

    await pushMessage(urlRecord.groupId, [{ type: "text", text: lines }]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[scanlink/accept] error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
