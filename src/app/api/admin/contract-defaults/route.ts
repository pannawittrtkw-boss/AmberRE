import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  DEFAULT_CLAUSES_SETTING_KEY,
  parseCustomClauses,
  serializeCustomClauses,
  type CustomClause,
} from "@/lib/contract-clauses";

export const runtime = "nodejs";

/**
 * GET /api/admin/contract-defaults
 * Returns the global default custom-clauses template used to seed new
 * contracts. Stored in SiteSetting under "contract_default_clauses" with
 * the JSON payload in valueTh.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const setting = await prisma.siteSetting.findUnique({
    where: { key: DEFAULT_CLAUSES_SETTING_KEY },
  });
  const clauses: CustomClause[] = parseCustomClauses(setting?.valueTh);
  return NextResponse.json({ success: true, data: { clauses } });
}

/**
 * PUT /api/admin/contract-defaults
 * Body: { clauses: CustomClause[] }
 * Replaces the global default template. Existing contracts are not
 * affected — only new contracts created after this point will pre-fill
 * from the new template.
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  let body: { clauses?: CustomClause[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const incoming = Array.isArray(body.clauses) ? body.clauses : [];
  const serialised = serializeCustomClauses(incoming);

  await prisma.siteSetting.upsert({
    where: { key: DEFAULT_CLAUSES_SETTING_KEY },
    update: { valueTh: serialised || null },
    create: {
      key: DEFAULT_CLAUSES_SETTING_KEY,
      valueTh: serialised || null,
    },
  });

  return NextResponse.json({
    success: true,
    data: { clauses: parseCustomClauses(serialised) },
  });
}
