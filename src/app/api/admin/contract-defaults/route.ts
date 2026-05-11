import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  DEFAULT_CLAUSES_SETTING_KEY,
  CLAUSE_OVERRIDES_SETTING_KEY,
  CLAUSE_BASELINE_SETTING_KEY,
  parseCustomClauses,
  serializeCustomClauses,
  parseClauseOverrides,
  serializeClauseOverrides,
  type CustomClause,
  type ClauseOverrideMap,
} from "@/lib/contract-clauses";

export const runtime = "nodejs";

/**
 * GET /api/admin/contract-defaults
 *
 * Returns the global default contract template, used to seed new contracts:
 *   - clauses          → array of {th, en} appended after section 11.6
 *   - clauseBaseline   → frozen "Standard" snapshot (the layer Reset goes
 *                        back to). Edits stack on top.
 *   - clauseOverrides  → working overrides on top of baseline (the user's
 *                        current edits). Empty when fully reset.
 *
 * All three are stored as JSON in SiteSetting.valueTh under separate keys.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const [appendedSetting, overridesSetting, baselineSetting] = await Promise.all([
    prisma.siteSetting.findUnique({
      where: { key: DEFAULT_CLAUSES_SETTING_KEY },
    }),
    prisma.siteSetting.findUnique({
      where: { key: CLAUSE_OVERRIDES_SETTING_KEY },
    }),
    prisma.siteSetting.findUnique({
      where: { key: CLAUSE_BASELINE_SETTING_KEY },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      clauses: parseCustomClauses(appendedSetting?.valueTh),
      clauseOverrides: parseClauseOverrides(overridesSetting?.valueTh),
      clauseBaseline: parseClauseOverrides(baselineSetting?.valueTh),
    },
  });
}

/**
 * PUT /api/admin/contract-defaults
 *
 * Body: { clauses?: CustomClause[]; clauseOverrides?: ClauseOverrideMap }
 *
 * Replaces the global template. Either field can be omitted to leave its
 * setting untouched. Existing contracts are unaffected — only new
 * contracts created after this point pre-fill from the new template.
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  let body: {
    clauses?: CustomClause[];
    clauseOverrides?: ClauseOverrideMap;
    clauseBaseline?: ClauseOverrideMap;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  if (Array.isArray(body.clauses)) {
    const serialised = serializeCustomClauses(body.clauses);
    await prisma.siteSetting.upsert({
      where: { key: DEFAULT_CLAUSES_SETTING_KEY },
      update: { valueTh: serialised || null },
      create: {
        key: DEFAULT_CLAUSES_SETTING_KEY,
        valueTh: serialised || null,
      },
    });
  }

  if (body.clauseBaseline && typeof body.clauseBaseline === "object") {
    const serialised = serializeClauseOverrides(body.clauseBaseline);
    await prisma.siteSetting.upsert({
      where: { key: CLAUSE_BASELINE_SETTING_KEY },
      update: { valueTh: serialised || null },
      create: {
        key: CLAUSE_BASELINE_SETTING_KEY,
        valueTh: serialised || null,
      },
    });
  }

  if (body.clauseOverrides && typeof body.clauseOverrides === "object") {
    const serialised = serializeClauseOverrides(body.clauseOverrides);
    await prisma.siteSetting.upsert({
      where: { key: CLAUSE_OVERRIDES_SETTING_KEY },
      update: { valueTh: serialised || null },
      create: {
        key: CLAUSE_OVERRIDES_SETTING_KEY,
        valueTh: serialised || null,
      },
    });
  }

  // Re-read to return the canonical state
  const [appendedSetting, overridesSetting, baselineSetting] = await Promise.all([
    prisma.siteSetting.findUnique({
      where: { key: DEFAULT_CLAUSES_SETTING_KEY },
    }),
    prisma.siteSetting.findUnique({
      where: { key: CLAUSE_OVERRIDES_SETTING_KEY },
    }),
    prisma.siteSetting.findUnique({
      where: { key: CLAUSE_BASELINE_SETTING_KEY },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      clauses: parseCustomClauses(appendedSetting?.valueTh),
      clauseOverrides: parseClauseOverrides(overridesSetting?.valueTh),
      clauseBaseline: parseClauseOverrides(baselineSetting?.valueTh),
    },
  });
}
