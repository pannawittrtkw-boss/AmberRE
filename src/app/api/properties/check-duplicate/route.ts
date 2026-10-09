import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { findPossibleDuplicates } from "@/lib/property-dedup";

function requireAgent(session: any) {
  const role = (session?.user as any)?.role;
  return role === "CO_AGENT" || role === "ADMIN";
}

// Live "possible duplicate" check, called repeatedly as an agent/admin
// fills out the add/edit property form — never blocks submission, just
// warns. See src/lib/property-dedup.ts for the matching logic.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !requireAgent(session)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const matches = await findPossibleDuplicates({
    sourceLink: body.sourceLink ?? null,
    ownerPhone: body.ownerPhone ?? null,
    ownerLineId: body.ownerLineId ?? null,
    ownerFacebookUrl: body.ownerFacebookUrl ?? null,
    projectName: body.projectName ?? null,
    projectId: body.projectId ? Number(body.projectId) : null,
    building: body.building ?? null,
    floor: body.floor != null && body.floor !== "" ? Number(body.floor) : null,
    latitude: body.latitude != null ? Number(body.latitude) : null,
    longitude: body.longitude != null ? Number(body.longitude) : null,
    excludePropertyId: body.excludePropertyId ? Number(body.excludePropertyId) : null,
  });

  if (matches.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  const isAdmin = (session.user as any).role === "ADMIN";
  const viewerId = Number((session.user as any).id);

  // A viewer only learns who submitted a match when they could already
  // see that property through the normal list (their own rows, or any
  // row if they're an admin) — otherwise "ตัวแทนอื่น" (another agent),
  // no edit link, so this check can't become a way to discover who's
  // behind a listing an agent wouldn't otherwise be allowed to see.
  const agentIds = [...new Set(matches.map((m) => m.agentId).filter((id): id is number => id != null))];
  const agents = agentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const agentById = new Map(agents.map((a) => [a.id, a]));

  const data = matches.map((m) => {
    if (m.source === "SCANLINK") {
      const sentDate = m.scanlinkSentAt ? new Date(m.scanlinkSentAt).toLocaleDateString("th-TH") : null;
      return {
        ...m,
        submittedBy: [
          "ลิงค์นี้ถูกเก็บข้อมูลไว้แล้วโดย Admin",
          sentDate ? `เมื่อ ${sentDate}` : null,
        ]
          .filter(Boolean)
          .join(" "),
        // The ScanLink dashboard is admin-only navigation (not in the
        // CO_AGENT allowlist), so only link there for an admin viewer.
        editUrl: isAdmin ? "/admin/scanlink" : null,
      };
    }

    const canSeeDetail = isAdmin || m.agentId === viewerId;
    let submittedBy: string;
    if (m.agentId == null) {
      submittedBy = "บริษัท";
    } else if (!canSeeDetail) {
      submittedBy = "ตัวแทนอื่น";
    } else {
      const agent = agentById.get(m.agentId);
      submittedBy = agent ? `${agent.firstName} ${agent.lastName}`.trim() : "ตัวแทน";
    }
    return {
      ...m,
      submittedBy,
      editUrl: canSeeDetail ? `/admin/properties/add?edit=${m.propertyId}` : null,
    };
  });

  return NextResponse.json({ success: true, data });
}
