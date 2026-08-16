import prisma from "@/lib/prisma";

// The broker/agent side of the commission appointment agreement is the same
// person/company on every contract, so it's set once site-wide from
// /admin/contracts/commission-agent — not per contract. Stored as
// SiteSetting rows, same pattern as the lease-agreement witnesses.
export const COMMISSION_AGENT_SETTING_KEYS = {
  name: "commission_agent_name",
  address: "commission_agent_address",
  idCard: "commission_agent_id_card",
  phone: "commission_agent_phone",
  idImage: "commission_agent_id_image",
  signature: "commission_agent_signature",
} as const;

export async function getCommissionAgentSettings() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: Object.values(COMMISSION_AGENT_SETTING_KEYS) } },
  });
  const map = new Map(rows.map((r) => [r.key, r.valueTh]));
  return {
    agentName: map.get(COMMISSION_AGENT_SETTING_KEYS.name) || null,
    agentAddress: map.get(COMMISSION_AGENT_SETTING_KEYS.address) || null,
    agentIdCard: map.get(COMMISSION_AGENT_SETTING_KEYS.idCard) || null,
    agentPhone: map.get(COMMISSION_AGENT_SETTING_KEYS.phone) || null,
    agentIdImage: map.get(COMMISSION_AGENT_SETTING_KEYS.idImage) || null,
    agentSignature: map.get(COMMISSION_AGENT_SETTING_KEYS.signature) || null,
  };
}
