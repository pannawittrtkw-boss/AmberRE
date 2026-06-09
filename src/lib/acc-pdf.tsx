/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/stylesheet";
import { splitThai } from "./thai-segment";

Font.register({
  family: "Sarabun",
  fonts: [
    { src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf" },
    {
      src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

Font.registerHyphenationCallback((word) => [word]);

function thaify(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") {
    const fragments = splitThai(node);
    if (fragments.length <= 1) return node;
    return fragments.map((frag, i) => <Text key={`t${i}`}>{frag}</Text>);
  }
  if (typeof node === "number" || node == null || typeof node === "boolean") return node;
  if (Array.isArray(node)) return node.map(thaify);
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (props.children !== undefined)
      return React.cloneElement(node, {} as Record<string, never>, thaify(props.children));
    return node;
  }
  return node;
}

type TTextProps = { children?: React.ReactNode; style?: Style | Style[]; wrap?: boolean };
function TText({ children, style, wrap }: TTextProps) {
  return (
    <Text style={style} wrap={wrap}>
      {thaify(children)}
    </Text>
  );
}

// Bilingual label: Thai main + English sub
function BiLabel({
  th, en, styleMain, styleSub,
}: { th: string; en: string; styleMain?: Style | Style[]; styleSub?: Style | Style[] }) {
  return (
    <View>
      <TText style={styleMain}>{th}</TText>
      <Text style={styleSub}>{en}</Text>
    </View>
  );
}

export type AccDocType = "INVOICE" | "BILLING_NOTE" | "RECEIPT";

export interface AccItem {
  description: string;
  qty: number;
  unitPrice: number;
  discountPct?: number;
  amount: number;
}

export interface AccPdfData {
  docType: AccDocType;
  docNumber: string;
  date: string;
  dueDate?: string;
  refDocNumber?: string;

  companyName: string;
  companyAddress?: string;
  companyTaxId?: string;
  companyPhone?: string;
  companyLogoUrl?: string | null;
  companySignatureUrl?: string | null;
  companyAuthorizedName?: string;

  customerName: string;
  customerAddress?: string;
  customerTaxId?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerContactName?: string;

  items: AccItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  note?: string;

  paymentMethod?: string;
}

const GOLD = "#C8A951";
const TEAL = "#0D9488";
const BLACK = "#1A1A1A";
const GRAY = "#666666";
const GRAY2 = "#999999";
const LIGHT = "#F8F8F8";
const BORDER = "#E2E2E2";

const TH_DIGITS: Record<number, string> = {
  0: "ศูนย์", 1: "หนึ่ง", 2: "สอง", 3: "สาม", 4: "สี่",
  5: "ห้า", 6: "หก", 7: "เจ็ด", 8: "แปด", 9: "เก้า",
};

export function bahtText(num: number): string {
  if (num === 0) return "ศูนย์บาทถ้วน";
  const intPart = Math.floor(Math.abs(num));
  const intStr = String(intPart);
  const len = intStr.length;
  const places = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  const readChunk = (chunk: string): string => {
    let result = "";
    const cLen = chunk.length;
    for (let i = 0; i < cLen; i++) {
      const digit = parseInt(chunk[i], 10);
      const placeIdx = cLen - i - 1;
      if (digit === 0) continue;
      if (placeIdx === 1 && digit === 1) result += "สิบ";
      else if (placeIdx === 1 && digit === 2) result += "ยี่สิบ";
      else if (placeIdx === 0 && digit === 1 && cLen > 1) result += "เอ็ด";
      else result += TH_DIGITS[digit] + (places[placeIdx] || "");
    }
    return result;
  };
  let result = "";
  if (len > 6) {
    result += readChunk(intStr.slice(0, len - 6)) + "ล้าน";
    const rest = intStr.slice(len - 6);
    if (parseInt(rest, 10) > 0) result += readChunk(rest);
  } else {
    result += readChunk(intStr);
  }
  return (num < 0 ? "ลบ" : "") + result + "บาทถ้วน";
}

function docLabels(docType: AccDocType): { th: string; en: string; color: string } {
  if (docType === "INVOICE") return { th: "ใบแจ้งหนี้", en: "INVOICE", color: GOLD };
  if (docType === "BILLING_NOTE") return { th: "ใบวางบิล", en: "BILLING NOTE", color: TEAL };
  return { th: "ใบเสร็จรับเงิน", en: "RECEIPT", color: GOLD };
}

function sigRoles(docType: AccDocType): { companyTh: string; companyEn: string; customerTh: string; customerEn: string } {
  if (docType === "RECEIPT") return { companyTh: "ผู้รับเงิน", companyEn: "Receiver", customerTh: "ผู้จ่ายเงิน", customerEn: "Payer" };
  if (docType === "BILLING_NOTE") return { companyTh: "ผู้ออกใบวางบิล", companyEn: "Issuer", customerTh: "ผู้รับบิล", customerEn: "Recipient" };
  return { companyTh: "ผู้ออกใบแจ้งหนี้", companyEn: "Issuer", customerTh: "ผู้รับเอกสาร", customerEn: "Recipient" };
}

const PAYMENT_OPTIONS = [
  { key: "CASH",     th: "เงินสด",       en: "Cash" },
  { key: "CHEQUE",   th: "เช็ค",         en: "Cheque" },
  { key: "TRANSFER", th: "โอนเงิน",      en: "Transfer" },
  { key: "CREDIT",   th: "บัตรเครดิต",   en: "Credit" },
];

const s = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 9,
    paddingTop: 32,
    paddingBottom: 90,
    paddingHorizontal: 38,
    lineHeight: 1.4,
    color: BLACK,
  },

  // ── Header ──────────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
  },
  logoImg: { width: 80, height: 48, objectFit: "contain" },
  logoPlaceholder: { width: 80 },
  docTitleBlock: { alignItems: "flex-end" },
  docTitleTh: { fontSize: 20, fontWeight: "bold", textAlign: "right" },
  docTitleEn: { fontSize: 11, fontWeight: "bold", textAlign: "right", letterSpacing: 1 },
  docOriginal: { fontSize: 8, color: GRAY2, textAlign: "right", marginTop: 2 },

  // ── Two-column info ───────────────────────────────────────
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  companyBlock: { flex: 1, paddingRight: 10 },
  companyName: { fontSize: 10.5, fontWeight: "bold", marginBottom: 1 },
  companyDetailTh: { fontSize: 8, color: GRAY, lineHeight: 1.5 },
  companyDetailEn: { fontSize: 7, color: GRAY2, lineHeight: 1.4 },
  docInfoBlock: { width: 185 },
  docInfoRow: { flexDirection: "row", marginBottom: 4 },
  docInfoLabelBlock: { width: 80 },
  docInfoLabelTh: { fontSize: 8, color: GRAY },
  docInfoLabelEn: { fontSize: 7, color: GRAY2 },
  docInfoVal: { flex: 1, fontSize: 8.5, fontWeight: "bold" },

  // ── Customer box ─────────────────────────────────────────
  customerBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    backgroundColor: LIGHT,
    padding: 10,
    marginBottom: 12,
  },
  customerSectionLabel: { fontSize: 7.5, color: GRAY, fontWeight: "bold", marginBottom: 4, letterSpacing: 0.5 },
  customerName: { fontSize: 10, fontWeight: "bold", marginBottom: 1 },
  customerDetailTh: { fontSize: 8, color: GRAY },
  customerDetailEn: { fontSize: 7, color: GRAY2 },

  // ── Items table ───────────────────────────────────────────
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BLACK,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  thCell: { fontSize: 7.5, color: "#FFFFFF", fontWeight: "bold" },
  thCellSub: { fontSize: 6, color: "#CCCCCC" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowAlt: { backgroundColor: "#FAFAFA" },
  tableCell: { fontSize: 8.5 },
  colNo: { width: 20 },
  colDesc: { flex: 1, paddingRight: 4 },
  colQty: { width: 38, textAlign: "right" },
  colPrice: { width: 68, textAlign: "right" },
  colDisc: { width: 48, textAlign: "right" },
  colAmount: { width: 70, textAlign: "right" },

  // ── Totals ────────────────────────────────────────────────
  totalsBlock: {
    alignItems: "flex-end",
    marginTop: 8,
    marginBottom: 10,
  },
  totalsRow: {
    flexDirection: "row",
    width: 240,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.3,
    borderBottomColor: BORDER,
  },
  totalsLabelBlock: { flex: 1 },
  totalsLabelTh: { fontSize: 8, color: GRAY },
  totalsLabelEn: { fontSize: 6.5, color: GRAY2 },
  totalsVal: { width: 80, textAlign: "right", fontSize: 8.5 },
  totalsFinalRow: {
    flexDirection: "row",
    width: 240,
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: BLACK,
    borderRadius: 3,
    marginTop: 3,
  },
  totalsFinalLabelBlock: { flex: 1 },
  totalsFinalLabelTh: { fontSize: 9, color: "#FFFFFF", fontWeight: "bold" },
  totalsFinalLabelEn: { fontSize: 7, color: "#CCCCCC" },
  totalsFinalVal: { width: 80, textAlign: "right", fontSize: 9.5, color: GOLD, fontWeight: "bold", alignSelf: "center" },
  bahtTextRow: {
    flexDirection: "row",
    width: 240,
    paddingHorizontal: 6,
    marginTop: 3,
  },
  bahtTextVal: { fontSize: 7, color: GRAY2, flex: 1, textAlign: "right" },

  // ── Note ─────────────────────────────────────────────────
  noteBox: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: LIGHT,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
  },
  noteLabelTh: { fontSize: 7.5, color: GRAY, fontWeight: "bold" },
  noteLabelEn: { fontSize: 6.5, color: GRAY2, marginBottom: 3 },
  noteText: { fontSize: 8.5, color: BLACK },

  // ── Payment method ────────────────────────────────────────
  paymentSection: { marginBottom: 12 },
  paymentLabelTh: { fontSize: 8, color: GRAY, fontWeight: "bold" },
  paymentLabelEn: { fontSize: 6.5, color: GRAY2, marginBottom: 6 },
  paymentRow: { flexDirection: "row", gap: 12 },
  paymentItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  paymentBox: {
    width: 12,
    height: 12,
    borderWidth: 0.8,
    borderColor: BLACK,
    borderRadius: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentBoxChecked: { backgroundColor: GOLD, borderColor: GOLD },
  paymentCheckMark: { fontSize: 7, color: "#FFFFFF", fontWeight: "bold" },
  paymentTextTh: { fontSize: 8 },
  paymentTextEn: { fontSize: 6.5, color: GRAY2 },

  // ── Signature block ───────────────────────────────────────
  sigBlock: {
    position: "absolute",
    bottom: 20,
    left: 38,
    right: 38,
    flexDirection: "row",
    gap: 16,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 8,
  },
  sigCol: { flex: 1, alignItems: "center" },
  sigInNameTh: { fontSize: 7.5, color: GRAY, textAlign: "center" },
  sigInNameEn: { fontSize: 6.5, color: GRAY2, textAlign: "center", marginBottom: 3 },
  sigImg: { width: 80, height: 32, objectFit: "contain", marginBottom: 2 },
  sigImgPlaceholder: { height: 32 },
  sigLine: { borderBottomWidth: 0.8, borderBottomColor: BLACK, width: "90%", marginBottom: 3 },
  sigName: { fontSize: 7.5, textAlign: "center", color: GRAY },
  sigRoleTh: { fontSize: 8.5, textAlign: "center", fontWeight: "bold" },
  sigRoleEn: { fontSize: 7, textAlign: "center", color: GRAY2 },
  sigDateTh: { fontSize: 7.5, textAlign: "center", color: GRAY2, marginTop: 2 },
  sigDateEn: { fontSize: 6.5, textAlign: "center", color: GRAY2 },
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Bilingual table header cell
function ThCell({
  th, en, style,
}: { th: string; en: string; style: Style | Style[] }) {
  return (
    <View style={style}>
      <TText style={s.thCell}>{th}</TText>
      <Text style={s.thCellSub}>{en}</Text>
    </View>
  );
}

export function AccPdf({ data }: { data: AccPdfData }) {
  const { th: titleTh, en: titleEn, color: titleColor } = docLabels(data.docType);
  const roles = sigRoles(data.docType);
  const hasDiscount = data.items.some((it) => (it.discountPct ?? 0) > 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View>
            {data.companyLogoUrl ? (
              <Image src={data.companyLogoUrl} style={s.logoImg} />
            ) : (
              <View style={s.logoPlaceholder} />
            )}
          </View>
          <View style={s.docTitleBlock}>
            <TText style={[s.docTitleTh, { color: titleColor }]}>{titleTh}</TText>
            <Text style={[s.docTitleEn, { color: titleColor }]}>{titleEn}</Text>
            <TText style={s.docOriginal}>ต้นฉบับ / Original</TText>
          </View>
        </View>

        {/* ── Company + Doc Info ── */}
        <View style={s.twoCol}>
          <View style={s.companyBlock}>
            <TText style={s.companyName}>{data.companyName}</TText>
            {data.companyAddress && (
              <TText style={s.companyDetailTh}>{data.companyAddress}</TText>
            )}
            {data.companyTaxId && (
              <>
                <TText style={s.companyDetailTh}>{"เลขประจำตัวผู้เสียภาษี: " + data.companyTaxId}</TText>
                <Text style={s.companyDetailEn}>{"Tax ID: " + data.companyTaxId}</Text>
              </>
            )}
            {data.companyPhone && (
              <TText style={s.companyDetailTh}>{"โทร / Tel: " + data.companyPhone}</TText>
            )}
          </View>
          <View style={s.docInfoBlock}>
            <View style={s.docInfoRow}>
              <View style={s.docInfoLabelBlock}>
                <TText style={s.docInfoLabelTh}>เลขที่</TText>
                <Text style={s.docInfoLabelEn}>No.</Text>
              </View>
              <TText style={s.docInfoVal}>{data.docNumber}</TText>
            </View>
            <View style={s.docInfoRow}>
              <View style={s.docInfoLabelBlock}>
                <TText style={s.docInfoLabelTh}>วันที่</TText>
                <Text style={s.docInfoLabelEn}>Date</Text>
              </View>
              <TText style={s.docInfoVal}>{data.date}</TText>
            </View>
            {data.dueDate && (
              <View style={s.docInfoRow}>
                <View style={s.docInfoLabelBlock}>
                  <TText style={s.docInfoLabelTh}>ครบกำหนด</TText>
                  <Text style={s.docInfoLabelEn}>Due Date</Text>
                </View>
                <TText style={s.docInfoVal}>{data.dueDate}</TText>
              </View>
            )}
            {data.refDocNumber && (
              <View style={s.docInfoRow}>
                <View style={s.docInfoLabelBlock}>
                  <TText style={s.docInfoLabelTh}>อ้างถึง</TText>
                  <Text style={s.docInfoLabelEn}>Reference</Text>
                </View>
                <TText style={s.docInfoVal}>{data.refDocNumber}</TText>
              </View>
            )}
          </View>
        </View>

        {/* ── Customer ── */}
        <View style={s.customerBox}>
          <TText style={s.customerSectionLabel}>ลูกค้า / CUSTOMER</TText>
          <TText style={s.customerName}>{data.customerName}</TText>
          {data.customerContactName && (
            <TText style={s.customerDetailTh}>{"ผู้ติดต่อ / Contact: " + data.customerContactName}</TText>
          )}
          {data.customerAddress && (
            <TText style={s.customerDetailTh}>{data.customerAddress}</TText>
          )}
          {data.customerTaxId && (
            <>
              <TText style={s.customerDetailTh}>{"เลขผู้เสียภาษี: " + data.customerTaxId}</TText>
              <Text style={s.customerDetailEn}>{"Tax ID: " + data.customerTaxId}</Text>
            </>
          )}
          {data.customerPhone && (
            <TText style={s.customerDetailTh}>{"โทร / Tel: " + data.customerPhone}</TText>
          )}
          {data.customerEmail && (
            <Text style={s.customerDetailEn}>{"Email: " + data.customerEmail}</Text>
          )}
        </View>

        {/* ── Items Table ── */}
        <View style={s.tableHeader}>
          <ThCell th="#" en="#" style={s.colNo} />
          <ThCell th="รายละเอียด" en="Description" style={s.colDesc} />
          <ThCell th="จำนวน" en="Qty" style={[s.colQty, { textAlign: "right" }]} />
          <ThCell th="ราคาต่อหน่วย" en="Unit Price" style={[s.colPrice, { textAlign: "right" }]} />
          {hasDiscount && (
            <ThCell th="ส่วนลด%" en="Disc%" style={[s.colDisc, { textAlign: "right" }]} />
          )}
          <ThCell th="มูลค่า" en="Amount" style={[s.colAmount, { textAlign: "right" }]} />
        </View>
        {data.items.map((item, idx) => (
          <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
            <TText style={[s.tableCell, s.colNo]}>{(idx + 1).toString()}</TText>
            <TText style={[s.tableCell, s.colDesc]}>{item.description}</TText>
            <TText style={[s.tableCell, s.colQty]}>{item.qty.toString()}</TText>
            <TText style={[s.tableCell, s.colPrice]}>{fmt(item.unitPrice)}</TText>
            {hasDiscount && (
              <TText style={[s.tableCell, s.colDisc]}>
                {item.discountPct ? item.discountPct + "%" : "—"}
              </TText>
            )}
            <TText style={[s.tableCell, s.colAmount]}>{fmt(item.amount)}</TText>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={s.totalsBlock}>
          <View style={s.totalsRow}>
            <View style={s.totalsLabelBlock}>
              <TText style={s.totalsLabelTh}>รวมเป็นเงิน</TText>
              <Text style={s.totalsLabelEn}>Subtotal</Text>
            </View>
            <Text style={s.totalsVal}>{fmt(data.subtotal)}</Text>
          </View>
          <View style={s.totalsRow}>
            <View style={s.totalsLabelBlock}>
              <TText style={s.totalsLabelTh}>{"ภาษีมูลค่าเพิ่ม " + data.vatRate + "%"}</TText>
              <Text style={s.totalsLabelEn}>{"VAT " + data.vatRate + "%"}</Text>
            </View>
            <Text style={s.totalsVal}>{fmt(data.vatAmount)}</Text>
          </View>
          <View style={s.totalsFinalRow}>
            <View style={s.totalsFinalLabelBlock}>
              <TText style={s.totalsFinalLabelTh}>รวมทั้งสิ้น</TText>
              <Text style={s.totalsFinalLabelEn}>Grand Total (THB)</Text>
            </View>
            <Text style={s.totalsFinalVal}>{fmt(data.totalAmount)}</Text>
          </View>
          <View style={s.bahtTextRow}>
            <TText style={s.bahtTextVal}>{"(" + bahtText(data.totalAmount) + ")"}</TText>
          </View>
        </View>

        {/* ── Payment Method (Receipt only) ── */}
        {data.docType === "RECEIPT" && (
          <View style={s.paymentSection}>
            <TText style={s.paymentLabelTh}>วิธีชำระเงิน</TText>
            <Text style={s.paymentLabelEn}>Payment Method</Text>
            <View style={s.paymentRow}>
              {PAYMENT_OPTIONS.map((m) => (
                <View key={m.key} style={s.paymentItem}>
                  <View style={[s.paymentBox, data.paymentMethod === m.key ? s.paymentBoxChecked : {}]}>
                    {data.paymentMethod === m.key && (
                      <Text style={s.paymentCheckMark}>✓</Text>
                    )}
                  </View>
                  <View>
                    <TText style={s.paymentTextTh}>{m.th}</TText>
                    <Text style={s.paymentTextEn}>{m.en}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Note ── */}
        {data.note && (
          <View style={s.noteBox}>
            <TText style={s.noteLabelTh}>หมายเหตุ</TText>
            <Text style={s.noteLabelEn}>Remark</Text>
            <TText style={s.noteText}>{data.note}</TText>
          </View>
        )}

        {/* ── Signature Block ── */}
        <View fixed style={s.sigBlock}>
          {/* Company side */}
          <View style={s.sigCol}>
            <TText style={s.sigInNameTh}>{"ในนาม " + data.companyName}</TText>
            <Text style={s.sigInNameEn}>{"On behalf of " + data.companyName}</Text>
            {data.companySignatureUrl ? (
              <Image src={data.companySignatureUrl} style={s.sigImg} />
            ) : (
              <View style={s.sigImgPlaceholder} />
            )}
            <View style={s.sigLine} />
            {data.companyAuthorizedName && (
              <TText style={s.sigName}>{"(" + data.companyAuthorizedName + ")"}</TText>
            )}
            <TText style={s.sigRoleTh}>{roles.companyTh}</TText>
            <Text style={s.sigRoleEn}>{roles.companyEn}</Text>
            <TText style={s.sigDateTh}>วันที่ / Date .................................</TText>
          </View>
          {/* Customer side */}
          <View style={s.sigCol}>
            <TText style={s.sigInNameTh}>{"ในนาม " + data.customerName}</TText>
            <Text style={s.sigInNameEn}>{"On behalf of " + data.customerName}</Text>
            <View style={s.sigImgPlaceholder} />
            <View style={s.sigLine} />
            <TText style={s.sigRoleTh}>{roles.customerTh}</TText>
            <Text style={s.sigRoleEn}>{roles.customerEn}</Text>
            <TText style={s.sigDateTh}>วันที่ / Date .................................</TText>
          </View>
        </View>

      </Page>
    </Document>
  );
}
