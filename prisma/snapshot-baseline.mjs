// One-time migration: promote the current `contract_clause_overrides` to
// `contract_clause_baseline` (the new "Standard" snapshot the editor's
// Reset falls back to), then clear `contract_clause_overrides` so the
// template editor opens with 0 outstanding edits.
//
// Idempotent guards:
//   - if baseline already exists with content, skip (do not clobber)
//   - if overrides is empty, nothing to do
//
// Run with:  node --env-file=.env prisma/snapshot-baseline.mjs

import { PrismaClient } from "@prisma/client";

const OVERRIDES_KEY = "contract_clause_overrides";
const BASELINE_KEY = "contract_clause_baseline";

const prisma = new PrismaClient();

async function main() {
  const [overrides, baseline] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: OVERRIDES_KEY } }),
    prisma.siteSetting.findUnique({ where: { key: BASELINE_KEY } }),
  ]);

  const overridesJson = overrides?.valueTh ?? "";
  const baselineJson = baseline?.valueTh ?? "";

  console.log("Current overrides length:", overridesJson.length);
  console.log("Current baseline length :", baselineJson.length);

  if (baselineJson && baselineJson.trim() !== "") {
    console.log("Baseline already exists — skipping snapshot to avoid clobber.");
    return;
  }

  if (!overridesJson || overridesJson.trim() === "") {
    console.log("No overrides to snapshot. Done.");
    return;
  }

  // Sanity-check that overrides is valid JSON map
  try {
    const parsed = JSON.parse(overridesJson);
    const numKeys =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? Object.keys(parsed).length
        : 0;
    console.log(`Snapshotting ${numKeys} override entries → baseline.`);
  } catch (e) {
    console.error("Overrides JSON is invalid; aborting:", e);
    process.exitCode = 1;
    return;
  }

  await prisma.$transaction([
    prisma.siteSetting.upsert({
      where: { key: BASELINE_KEY },
      update: { valueTh: overridesJson },
      create: { key: BASELINE_KEY, valueTh: overridesJson },
    }),
    prisma.siteSetting.upsert({
      where: { key: OVERRIDES_KEY },
      update: { valueTh: null },
      create: { key: OVERRIDES_KEY, valueTh: null },
    }),
  ]);

  console.log("Done. Overrides cleared; baseline set.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
