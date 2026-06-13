import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pushMessage, STATUS_LABEL } from "@/app/api/line/url-checker/route";

export async function POST(req: NextRequest) {
  try {
    const { propId, urlId, fullyFurnished, fullyElectric, readyToMoveIn, seq, by } = await req.json();

    if (!propId || !urlId) {
      return NextResponse.json({ success: false, error: "Missing params" }, { status: 400 });
    }

    // Update property with room details
    await prisma.property.update({
      where: { id: Number(propId) },
      data: {
        fullyFurnished: fullyFurnished ?? false,
        fullyElectric: fullyElectric ?? false,
        availableDate: readyToMoveIn ? new Date() : undefined,
      },
    });

    // Push confirmation to LINE group
    const urlRecord = await prisma.lineUrlHistory.findFirst({
      where: { id: Number(urlId) },
    });

    if (urlRecord) {
      const statusLabel = urlRecord.status in STATUS_LABEL
        ? STATUS_LABEL[urlRecord.status]
        : "✅ Accepted";

      const lines = [
        `${statusLabel} [#${seq}] — บันทึกแล้ว`,
        by ? `By ${by}` : null,
        `🛋 Fully Furnished: ${fullyFurnished ? "✓" : "✗"}`,
        `⚡ Fully Electric: ${fullyElectric ? "✓" : "✗"}`,
        `✅ Ready to move in: ${readyToMoveIn ? "✓" : "✗"}`,
      ].filter(Boolean).join("\n");

      await pushMessage(urlRecord.groupId, [{ type: "text", text: lines }]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[scanlink/accept] error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
