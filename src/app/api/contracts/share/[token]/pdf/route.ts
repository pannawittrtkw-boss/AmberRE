import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// Serve the signed PDF for a share link.
// 1. Try to proxy the stored signedPdfUrl (may be Blob — could be blocked).
// 2. Fall back to the dynamic PDF generated via a sign token.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const contract = await prisma.contract.findFirst({
    where: { shareToken: token },
    select: {
      contractNumber: true,
      signedPdfUrl: true,
      lessorSignToken: true,
      lesseeSignToken: true,
      jointLesseeSignToken: true,
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hdrs = await headers();
  const host = hdrs.get("host") || "";
  const proto = hdrs.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;

  // Attempt 1: proxy the stored signed PDF
  if (contract.signedPdfUrl) {
    try {
      const res = await fetch(contract.signedPdfUrl);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        return new NextResponse(buf, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${contract.contractNumber}-signed.pdf"`,
          },
        });
      }
    } catch {
      // Blob blocked or unavailable — fall through to dynamic PDF
    }
  }

  // Attempt 2: dynamically generated PDF via any sign token
  const signToken =
    contract.lessorSignToken ||
    contract.lesseeSignToken ||
    contract.jointLesseeSignToken;

  if (signToken) {
    const pdfRes = await fetch(`${base}/api/sign/${signToken}/pdf`);
    if (pdfRes.ok) {
      const buf = await pdfRes.arrayBuffer();
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${contract.contractNumber}.pdf"`,
        },
      });
    }
  }

  return NextResponse.json({ error: "PDF not available" }, { status: 503 });
}
