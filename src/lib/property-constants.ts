// Single source of truth for property type + price range options. Previously
// the set of property types (and later the price brackets) was copy-pasted
// independently across ~15 files with no shared constant, which is how LAND
// ended up missing from src/types/index.ts's PropertyType union. New types
// should only ever need to be added here.

export const PROPERTY_TYPES = [
  "CONDO",
  "HOUSE",
  "TOWNHOUSE",
  "LAND",
  "OFFICE",
  "WAREHOUSE",
] as const;

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABEL_TH: Record<PropertyTypeValue, string> = {
  CONDO: "คอนโด",
  HOUSE: "บ้านเดี่ยว",
  TOWNHOUSE: "ทาวน์เฮาส์",
  LAND: "ที่ดิน",
  OFFICE: "สำนักงาน",
  WAREHOUSE: "โกดัง/คลังสินค้า",
};

export const PROPERTY_TYPE_LABEL_EN: Record<PropertyTypeValue, string> = {
  CONDO: "Condo",
  HOUSE: "House",
  TOWNHOUSE: "Townhouse",
  LAND: "Land",
  OFFICE: "Office",
  WAREHOUSE: "Warehouse",
};

export function propertyTypeLabel(type: string | null | undefined, locale: string): string {
  if (!type) return "";
  const map = locale === "th" ? PROPERTY_TYPE_LABEL_TH : PROPERTY_TYPE_LABEL_EN;
  return (map as Record<string, string>)[type] ?? type;
}

// Property types with no bedroom/bathroom concept — used to gate the
// bedroom/bathroom UI and to show land-size/area fields instead.
export const NO_BEDROOM_PROPERTY_TYPES = ["LAND", "OFFICE", "WAREHOUSE"] as const;
export function hasNoBedrooms(type: string | null | undefined): boolean {
  return !!type && (NO_BEDROOM_PROPERTY_TYPES as readonly string[]).includes(type);
}

// ---------------------------------------------------------------------------
// Price ranges — rent and sale operate on completely different scales, so
// each listing mode gets its own preset bracket list instead of one dropdown
// trying to serve both.
// ---------------------------------------------------------------------------

export interface PriceRangeOption {
  value: string; // "<min>-<max>" or "<min>-" for the open-ended top bracket
  min: number;
  max: number | null;
  labelTh: string;
  labelEn: string;
}

export const RENT_PRICE_RANGES: PriceRangeOption[] = [
  { value: "0-10000", min: 0, max: 10000, labelTh: "0 - 10,000", labelEn: "0 - 10,000" },
  { value: "10000-30000", min: 10000, max: 30000, labelTh: "10,000 - 30,000", labelEn: "10,000 - 30,000" },
  { value: "30000-50000", min: 30000, max: 50000, labelTh: "30,000 - 50,000", labelEn: "30,000 - 50,000" },
  { value: "50000-100000", min: 50000, max: 100000, labelTh: "50,000 - 100,000", labelEn: "50,000 - 100,000" },
  { value: "100000-200000", min: 100000, max: 200000, labelTh: "100,000 - 200,000", labelEn: "100,000 - 200,000" },
  { value: "200000-", min: 200000, max: null, labelTh: "มากกว่า 200,000", labelEn: "200,000+" },
];

export const SALE_PRICE_RANGES: PriceRangeOption[] = [
  { value: "0-1000000", min: 0, max: 1000000, labelTh: "0 - 1 ล้าน", labelEn: "0 - 1M" },
  { value: "1000000-3000000", min: 1000000, max: 3000000, labelTh: "1 - 3 ล้าน", labelEn: "1M - 3M" },
  { value: "3000000-5000000", min: 3000000, max: 5000000, labelTh: "3 - 5 ล้าน", labelEn: "3M - 5M" },
  { value: "5000000-10000000", min: 5000000, max: 10000000, labelTh: "5 - 10 ล้าน", labelEn: "5M - 10M" },
  { value: "10000000-50000000", min: 10000000, max: 50000000, labelTh: "10 - 50 ล้าน", labelEn: "10M - 50M" },
  { value: "50000000-", min: 50000000, max: null, labelTh: "มากกว่า 50 ล้าน", labelEn: "50M+" },
];

export function getPriceRanges(listingType: "RENT" | "SALE"): PriceRangeOption[] {
  return listingType === "RENT" ? RENT_PRICE_RANGES : SALE_PRICE_RANGES;
}

export function parsePriceRangeValue(value: string): { min?: number; max?: number } {
  if (!value) return {};
  const [minStr, maxStr] = value.split("-");
  const result: { min?: number; max?: number } = {};
  if (minStr) result.min = Number(minStr);
  if (maxStr) result.max = Number(maxStr);
  return result;
}
