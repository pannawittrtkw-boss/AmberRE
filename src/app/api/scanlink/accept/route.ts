import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { pushMessage, STATUS_LABEL } from "@/app/api/line/url-checker/route";

export async function POST(req: NextRequest) {
  try {
    const { urlId, status, fullyFurnished, fullyElectric, readyToMoveIn, remark, seq, by, condoName, price } = await req.json();

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
      titleTh:         condoName || "รายการใหม่ (จาก ScanLink)",
      propertyType:    "CONDO",
      listingType:     "RENT",
      price:           new Prisma.Decimal(price ?? 0),
      projectName:     condoName || undefined,
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

    // Push confirmation to LINE group (quote the original message)
    const statusLabel = status in STATUS_LABEL ? STATUS_LABEL[status] : "✅ Accepted";
    const yes = "✅";
    const no  = "❌";

    const infoLines = [
      condoName ? `Name : ${condoName}` : null,
      price != null ? `Price : ${price}` : null,
    ].filter(Boolean).join("\n");

    const detailLines = [
      `🛋 Fully Furnished: ${fullyFurnished ? yes : no}`,
      `⚡ Fully Electric: ${fullyElectric   ? yes : no}`,
      `✅ Ready to move in: ${readyToMoveIn  ? yes : no}`,
      remark ? `📝 Remark: ${remark}` : null,
    ].filter(Boolean).join("\n");

    const sections = [
      `${statusLabel} [#${seq}]`,
      infoLines || null,
      detailLines,
    ].filter(Boolean).join("\n\n");

    const msg: Record<string, unknown> = { type: "text", text: sections };
    if (urlRecord.quoteToken) msg.quoteToken = urlRecord.quoteToken;

    try {
      await pushMessage(urlRecord.groupId, [msg]);
    } catch {
      // quoteToken อาจหมดอายุ — ส่งใหม่โดยไม่มี quoteToken
      const { quoteToken: _qt, ...msgWithoutQuote } = msg;
      await pushMessage(urlRecord.groupId, [msgWithoutQuote]);
    }

    // Push to Ready-to-Post group (ACCEPT_ALL only)
    const readyToPostGroupId = process.env.LINE_READY_TO_POST_GROUP_ID;
    if (status === "ACCEPT_ALL" && readyToPostGroupId) {
      const now = new Date();
      const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${String(now.getFullYear()).slice(-2)}`;

      const readyToPostLines = [
        condoName ? `Name : ${condoName}` : null,
        price != null ? `Price : ${price}` : null,
      ].filter(Boolean).join("\n");

      const readyToPostSections = [
        `${statusLabel} [#${seq}]`,
        `Link : ${urlRecord.url}`,
        readyToPostLines || null,
        detailLines,
        `Date : ${dateStr}`,
      ].filter(Boolean).join("\n\n");

      await pushMessage(readyToPostGroupId, [{ type: "text", text: readyToPostSections }]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[scanlink/accept] error:", error);
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
