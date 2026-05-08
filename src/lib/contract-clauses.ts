// Custom clauses appended to a rental contract after section 11 of the
// standard agreement. Each clause is bilingual — Thai (th) + English (en) —
// matching the rest of the contract layout.
//
// A site-wide DEFAULT template is stored in the SiteSetting table under
// the key below. Each contract gets its own copy on creation; per-contract
// edits do not flow back to the template.

export const DEFAULT_CLAUSES_SETTING_KEY = "contract_default_clauses";

export interface CustomClause {
  th: string;
  en: string;
}

export function parseCustomClauses(json: string | null | undefined): CustomClause[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        th: typeof item?.th === "string" ? item.th : "",
        en: typeof item?.en === "string" ? item.en : "",
      }))
      .filter((c) => c.th.trim() !== "" || c.en.trim() !== "");
  } catch {
    return [];
  }
}

export function serializeCustomClauses(clauses: CustomClause[]): string {
  const cleaned = clauses
    .map((c) => ({ th: c.th.trim(), en: c.en.trim() }))
    .filter((c) => c.th !== "" || c.en !== "");
  return cleaned.length > 0 ? JSON.stringify(cleaned) : "";
}
