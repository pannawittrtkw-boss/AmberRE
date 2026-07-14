import prisma from "@/lib/prisma";

// The two lease-agreement witnesses are set once, site-wide, from
// /admin/contracts/witnesses — not per contract. Stored as SiteSetting rows
// (same table the site logo uses) rather than Contract columns, since every
// generated PDF should embed the same pair of witnesses.
export const WITNESS_SETTING_KEYS = {
  witness1Name: "contract_witness1_name",
  witness1Signature: "contract_witness1_signature",
  witness2Name: "contract_witness2_name",
  witness2Signature: "contract_witness2_signature",
} as const;

export async function getWitnessSettings() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Object.values(WITNESS_SETTING_KEYS) } },
  });
  const map = new Map(rows.map((r) => [r.key, r.valueTh]));
  return {
    witness1Name: map.get(WITNESS_SETTING_KEYS.witness1Name) || null,
    witness1Signature: map.get(WITNESS_SETTING_KEYS.witness1Signature) || null,
    witness2Name: map.get(WITNESS_SETTING_KEYS.witness2Name) || null,
    witness2Signature: map.get(WITNESS_SETTING_KEYS.witness2Signature) || null,
  };
}
