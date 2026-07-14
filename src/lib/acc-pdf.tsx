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
import { insertThaiBreaks } from "./thai-segment";

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
    return insertThaiBreaks(node);
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
  return <Text style={style} wrap={wrap}>{thaify(children)}</Text>;
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
  companyBankName?: string;
  companyBankNameEn?: string;
  companyBankAccountNumber?: string;
  companyBankAccountName?: string;
  companyBankAccountNameEn?: string;
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

const GOLD   = "#1C1C1C";
const TEAL   = "#0D9488";
const PURPLE = "#7C3AED";
const BLACK  = "#1C1C1C";
const GRAY   = "#4A4A4A";
const GRAY2  = "#8A8A8A";
const RULE   = "#D8D8D8";   // thin separator lines

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
    let r = "";
    const cl = chunk.length;
    for (let i = 0; i < cl; i++) {
      const d = parseInt(chunk[i], 10);
      const p = cl - i - 1;
      if (d === 0) continue;
      if (p === 1 && d === 1) r += "สิบ";
      else if (p === 1 && d === 2) r += "ยี่สิบ";
      else if (p === 0 && d === 1 && cl > 1) r += "เอ็ด";
      else r += TH_DIGITS[d] + (places[p] || "");
    }
    return r;
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

function docLabels(t: AccDocType): { th: string; en: string; color: string } {
  if (t === "INVOICE")      return { th: "ใบแจ้งหนี้",      en: "Invoice",      color: GOLD };
  if (t === "BILLING_NOTE") return { th: "ใบวางบิล",        en: "Billing Note", color: GOLD };
  return                           { th: "ใบเสร็จรับเงิน", en: "Receipt",      color: GOLD };
}

function sigRoles(t: AccDocType) {
  if (t === "RECEIPT")      return { companyTh: "ผู้รับเงิน",        companyEn: "Receiver",  customerTh: "ผู้จ่ายเงิน",   customerEn: "Payer" };
  if (t === "BILLING_NOTE") return { companyTh: "ผู้ออกใบวางบิล",   companyEn: "Issuer",    customerTh: "ผู้รับบิล",     customerEn: "Recipient" };
  return                           { companyTh: "ผู้ออกใบแจ้งหนี้", companyEn: "Issuer",    customerTh: "ผู้รับเอกสาร", customerEn: "Recipient" };
}

const PAYMENT_OPTIONS = [
  { key: "CASH",     th: "เงินสด",      en: "Cash" },
  { key: "CHEQUE",   th: "เช็ค",        en: "Cheque" },
  { key: "TRANSFER", th: "โอนเงิน",     en: "Transfer" },
  { key: "CREDIT",   th: "บัตรเครดิต", en: "Credit Card" },
];

const s = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 9,
    paddingTop: 28,
    paddingBottom: 155,
    paddingHorizontal: 24,
    lineHeight: 1.5,
    color: BLACK,
  },

  // ── Header ─────────────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
  },
  logoImg: { width: 84, height: 84, objectFit: "contain" },
  logoPlaceholder: { width: 84 },

  // Company info sits between logo and title inside the header
  companyMeta: { flex: 1, paddingLeft: 8, paddingRight: 12, alignSelf: "center" },
  companyName: { fontSize: 10, fontWeight: "bold", marginBottom: 3 },
  companyText: { fontSize: 8, color: GRAY, lineHeight: 1.55 },

  titleBlock: { alignItems: "flex-end" },
  titleThWrap: { minHeight: 30, justifyContent: "flex-end", marginBottom: 8 },
  titleTh: { fontSize: 18, fontWeight: "bold", textAlign: "right" },
  titleEn: {
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "right",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  titleSub: { fontSize: 7.5, color: GRAY2, textAlign: "right", marginTop: 4 },

  // ── Customer + Doc info strip ───────────────────────────────
  customerStrip: { marginBottom: 10 },
  customerLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    letterSpacing: 0.4,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  infoStrip: { flexDirection: "row" },
  customerBlock: { flex: 1, paddingRight: 16 },
  customerName: { fontSize: 10, fontWeight: "bold", marginBottom: 2 },
  customerText: { fontSize: 8, color: GRAY, lineHeight: 1.55 },
  contactRow: { flexDirection: "row", marginBottom: 2.5, marginTop: 1 },
  contactKey: { fontSize: 7.5, color: GRAY2, width: 64 },
  contactVal: { flex: 1, fontSize: 8 },

  // Doc info — rows with thin rules
  docInfoWrap: { width: 188, paddingVertical: 2 },
  docInfoRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
  },
  docInfoRowLast: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8 },
  docInfoKey: { width: 60 },
  docInfoKeyTh: { fontSize: 8, fontWeight: "bold" },
  docInfoKeyEn: { fontSize: 6.5, color: GRAY2 },
  docInfoVal: { flex: 1, fontSize: 8.5, fontWeight: "bold" },

  // ── Items table ─────────────────────────────────────────────
  // Header row: bold text on thin top/bottom rules — no filled background
  tableHead: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 3,
    borderTopWidth: 0.8,
    borderTopColor: BLACK,
    borderBottomWidth: 0.8,
    borderBottomColor: BLACK,
    marginBottom: 1,
  },
  thTh: { fontSize: 7.5, fontWeight: "bold" },
  thEn: { fontSize: 6, color: GRAY2 },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 3,
    borderBottomWidth: 0.3,
    borderBottomColor: RULE,
  },
  tableRowAlt: { backgroundColor: "#FAFAFA" },
  td: { fontSize: 8.5 },

  colNo:     { width: 18 },
  colDesc:   { flex: 1, paddingRight: 4 },
  colQty:    { width: 36, textAlign: "right" },
  colPrice:  { width: 66, textAlign: "right" },
  colDisc:   { width: 44, textAlign: "right" },
  colAmt:    { width: 70, textAlign: "right" },

  // ── Totals ──────────────────────────────────────────────────
  totalsSection: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 10,
    gap: 12,
    alignItems: "flex-start",
  },
  bahtBox: { flex: 1, paddingTop: 2 },
  bahtLabel: { fontSize: 7.5, color: GRAY2, marginBottom: 3 },
  bahtVal: { fontSize: 8.5, fontWeight: "bold" },

  totalsWrap: { width: 224 },
  totalsRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.3,
    borderBottomColor: RULE,
  },
  totalsKey: { flex: 1 },
  totalsKeyTh: { fontSize: 8, color: GRAY },
  totalsKeyEn: { fontSize: 6.5, color: GRAY2 },
  totalsVal: { width: 70, textAlign: "right", fontSize: 8.5 },

  // Grand total — simple bold row, colored total
  grandRow: {
    flexDirection: "row",
    paddingVertical: 5,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: BLACK,
  },
  grandKey: { flex: 1 },
  grandKeyTh: { fontSize: 9, fontWeight: "bold" },
  grandKeyEn: { fontSize: 6.5, color: GRAY2 },
  grandVal: { width: 70, textAlign: "right", fontSize: 10, fontWeight: "bold" },

  // ── Note ───────────────────────────────────────────────────
  noteWrap: {
    marginBottom: 10,
    paddingLeft: 8,
    borderLeftWidth: 2.5,
    borderLeftColor: GOLD,
  },
  noteKey: { fontSize: 7.5, color: GRAY, fontWeight: "bold", marginBottom: 2 },
  noteVal: { fontSize: 8.5 },

  // ── Bank Info ───────────────────────────────────────────────
  bankWrap: { width: "58%", marginBottom: 8 },
  bankTitle: { fontSize: 7.5, fontWeight: "bold", color: GRAY, marginBottom: 4 },
  bankRow: { flexDirection: "row", gap: 10 },
  bankItem: { flex: 1 },
  bankKey: { fontSize: 6.5, color: GRAY2, marginBottom: 1.5 },
  bankVal: { fontSize: 8, fontWeight: "bold" },

  // ── Payment ─────────────────────────────────────────────────
  paymentWrap: { marginBottom: 14 },
  paymentKey: { fontSize: 8, fontWeight: "bold", color: GRAY, marginBottom: 5 },
  paymentRow: { flexDirection: "row", gap: 18 },
  paymentItem: { flexDirection: "row", alignItems: "center", gap: 3.5 },
  paymentBox: {
    width: 11, height: 11,
    borderWidth: 0.8, borderColor: BLACK, borderRadius: 1,
    alignItems: "center", justifyContent: "center",
  },
  paymentBoxOn: { backgroundColor: GOLD, borderColor: GOLD },
  paymentCheck: { fontSize: 7, color: "#FFF", fontWeight: "bold" },
  paymentTh: { fontSize: 8 },
  paymentEn: { fontSize: 6.5, color: GRAY2 },

  // ── Signature ───────────────────────────────────────────────
  sigBlock: {
    position: "absolute",
    bottom: 18,
    left: 38,
    right: 38,
  },
  sigSeparator: {
    borderTopWidth: 0.5,
    borderTopColor: RULE,
    marginBottom: 8,
  },
  sigRow: { flexDirection: "row", gap: 6 },
  sigCol: { flex: 1, alignItems: "center" },
  sigMid: { width: 90, alignItems: "center" },
  sigInName: { fontSize: 6.5, color: GRAY2, textAlign: "center", marginBottom: 1 },
  sigEntity: { fontSize: 7.5, fontWeight: "bold", textAlign: "center", marginBottom: 5 },
  sigImg: { width: 76, height: 30, objectFit: "contain", marginBottom: 2 },
  sigSpace: { height: 36 },
  sigLine: { borderBottomWidth: 0.8, borderBottomColor: BLACK, width: "88%", marginBottom: 3 },
  sigName: { fontSize: 7.5, textAlign: "center", color: GRAY },
  sigRole: { fontSize: 8, textAlign: "center", fontWeight: "bold" },
  sigRoleEn: { fontSize: 6.5, textAlign: "center", color: GRAY2 },
  sigDate: { fontSize: 7, textAlign: "center", color: GRAY2, marginTop: 2 },
  stampCircle: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1, borderColor: RULE,
    borderStyle: "dashed",
    alignItems: "center", justifyContent: "center",
    marginBottom: 3,
  },
  stampImg: { width: 48, height: 48, objectFit: "contain" },
  stampText: { fontSize: 6.5, color: GRAY2, textAlign: "center" },
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TH({ th, en, style }: { th: string; en: string; style: Style | Style[] }) {
  return (
    <View style={style}>
      <TText style={s.thTh}>{th}</TText>
      <Text style={s.thEn}>{en}</Text>
    </View>
  );
}

function DocRow({
  labelTh, labelEn, value, isLast, color,
}: { labelTh: string; labelEn: string; value: string; isLast?: boolean; color: string }) {
  return (
    <View style={isLast ? s.docInfoRowLast : s.docInfoRow}>
      <View style={s.docInfoKey}>
        <TText style={[s.docInfoKeyTh, { color }]}>{labelTh}</TText>
        <Text style={s.docInfoKeyEn}>{labelEn}</Text>
      </View>
      <TText style={s.docInfoVal}>{value}</TText>
    </View>
  );
}

export function AccPdf({ data }: { data: AccPdfData }) {
  const { th: titleTh, en: titleEn, color: C } = docLabels(data.docType);
  const roles = sigRoles(data.docType);
  const hasDiscount = data.items.some((it) => (it.discountPct ?? 0) > 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header: Logo | Company info | Title ── */}
        <View style={s.headerRow}>
          {data.companyLogoUrl
            ? <Image src={data.companyLogoUrl} style={s.logoImg} />
            : <View style={s.logoPlaceholder} />}

          <View style={s.companyMeta}>
            <Text style={s.companyName}>{data.companyName + "​"}</Text>
            {data.companyAddress && <TText style={s.companyText}>{data.companyAddress}</TText>}
            {data.companyTaxId && (
              <TText style={s.companyText}>{"เลขประจำตัวผู้เสียภาษี / Tax ID: " + data.companyTaxId}</TText>
            )}
            {data.companyPhone && (
              <TText style={s.companyText}>{"โทร / Tel: " + data.companyPhone}</TText>
            )}
          </View>

          <View style={s.titleBlock}>
            <View style={s.titleThWrap}>
              <TText style={[s.titleTh, { color: C }]}>{titleTh}</TText>
            </View>
            <Text style={[s.titleEn, { color: C }]}>{titleEn}</Text>
            <TText style={s.titleSub}>ต้นฉบับ / Original</TText>
          </View>
        </View>

        {/* ── Customer info + Doc info ── */}
        <View style={s.customerStrip}>
          <TText style={[s.customerLabel, { color: C }]}>ลูกค้า / CUSTOMER</TText>
          <View style={s.infoStrip}>
            <View style={s.customerBlock}>
              <Text style={s.customerName}>{data.customerName + "​"}</Text>
              {data.customerAddress && <TText style={s.customerText}>{data.customerAddress}</TText>}
              {data.customerTaxId && (
                <TText style={s.customerText}>{"เลขประจำตัวผู้เสียภาษี / Tax ID: " + data.customerTaxId}</TText>
              )}
              {data.customerContactName && (
                <View style={s.contactRow}>
                  <Text style={s.contactKey}>ผู้ติดต่อ</Text>
                  <TText style={s.contactVal}>{data.customerContactName}</TText>
                </View>
              )}
              {data.customerPhone && (
                <View style={s.contactRow}>
                  <Text style={s.contactKey}>{"โทร / Tel"}</Text>
                  <Text style={s.contactVal}>{data.customerPhone}</Text>
                </View>
              )}
              {data.customerEmail && (
                <View style={s.contactRow}>
                  <Text style={s.contactKey}>{"อีเมล / Email"}</Text>
                  <Text style={s.contactVal}>{data.customerEmail}</Text>
                </View>
              )}
            </View>

            <View style={s.docInfoWrap}>
              <DocRow labelTh="เลขที่"     labelEn="No."       value={data.docNumber} color={C} />
              <DocRow labelTh="วันที่"     labelEn="Date"      value={data.date}      color={C} />
              {data.dueDate && (
                <DocRow labelTh="ครบกำหนด" labelEn="Due Date"  value={data.dueDate}   color={C} />
              )}
              {data.refDocNumber
                ? <DocRow labelTh="อ้างถึง" labelEn="Reference" value={data.refDocNumber} color={C} isLast />
                : <DocRow labelTh="ผู้รับ"  labelEn="Attention" value={data.customerContactName || data.customerName} color={C} isLast />
              }
            </View>
          </View>
        </View>

        {/* ── Items Table ── */}
        <View style={s.tableHead}>
          <TH th="#" en="" style={s.colNo} />
          <TH th="รายละเอียด" en="Description" style={s.colDesc} />
          <TH th="จำนวน" en="Qty" style={[s.colQty, { textAlign: "right" }]} />
          <TH th="ราคาต่อหน่วย" en="Unit Price" style={[s.colPrice, { textAlign: "right" }]} />
          {hasDiscount && <TH th="ส่วนลด%" en="Disc%" style={[s.colDisc, { textAlign: "right" }]} />}
          <TH th="มูลค่า" en="Amount" style={[s.colAmt, { textAlign: "right" }]} />
        </View>
        {data.items.map((item, idx) => (
          <View key={idx} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
            <TText style={[s.td, s.colNo]}>{(idx + 1).toString()}</TText>
            <TText style={[s.td, s.colDesc]}>{item.description}</TText>
            <TText style={[s.td, s.colQty]}>{item.qty.toString()}</TText>
            <TText style={[s.td, s.colPrice]}>{fmt(item.unitPrice)}</TText>
            {hasDiscount && (
              <TText style={[s.td, s.colDisc]}>{item.discountPct ? item.discountPct + "%" : "—"}</TText>
            )}
            <TText style={[s.td, s.colAmt]}>{fmt(item.amount)}</TText>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={s.totalsSection}>
          <View style={s.bahtBox}>
            <TText style={s.bahtLabel}>จำนวนเงิน (ตัวอักษร) / Amount in Words</TText>
            <TText style={s.bahtVal}>{"(" + bahtText(data.totalAmount) + ")"}</TText>
          </View>
          <View style={s.totalsWrap}>
            <View style={s.totalsRow}>
              <View style={s.totalsKey}>
                <TText style={s.totalsKeyTh}>รวมเป็นเงิน</TText>
                <Text style={s.totalsKeyEn}>Subtotal</Text>
              </View>
              <Text style={s.totalsVal}>{fmt(data.subtotal)}</Text>
            </View>
            <View style={s.totalsRow}>
              <View style={s.totalsKey}>
                <TText style={s.totalsKeyTh}>{"ภาษีมูลค่าเพิ่ม " + data.vatRate + "%"}</TText>
                <Text style={s.totalsKeyEn}>{"VAT " + data.vatRate + "%"}</Text>
              </View>
              <Text style={s.totalsVal}>{fmt(data.vatAmount)}</Text>
            </View>
            <View style={s.grandRow}>
              <View style={s.grandKey}>
                <TText style={s.grandKeyTh}>จำนวนเงินรวมทั้งสิ้น</TText>
                <Text style={s.grandKeyEn}>Grand Total (THB)</Text>
              </View>
              <Text style={[s.grandVal, { color: C }]}>{fmt(data.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* ── Payment (Receipt) ── */}
        {data.docType === "RECEIPT" && (
          <View style={s.paymentWrap}>
            <TText style={s.paymentKey}>วิธีชำระเงิน / Payment Method</TText>
            <View style={s.paymentRow}>
              {PAYMENT_OPTIONS.map((m) => (
                <View key={m.key} style={s.paymentItem}>
                  <View style={[s.paymentBox, data.paymentMethod === m.key ? s.paymentBoxOn : {}]}>
                    {data.paymentMethod === m.key && <Text style={s.paymentCheck}>✓</Text>}
                  </View>
                  <View>
                    <TText style={s.paymentTh}>{m.th}</TText>
                    <Text style={s.paymentEn}>{m.en}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Note ── */}
        {data.note && (
          <View style={s.noteWrap}>
            <TText style={s.noteKey}>หมายเหตุ / Remark</TText>
            <TText style={s.noteVal}>{data.note}</TText>
          </View>
        )}

        {/* ── Signature ── */}
        <View fixed style={s.sigBlock}>
          {(data.docType === "INVOICE" || data.docType === "BILLING_NOTE") &&
           (data.companyBankName || data.companyBankAccountNumber) && (
            <View style={s.bankWrap}>
              <TText style={s.bankTitle}>ช่องทางการชำระเงิน / Payment Details</TText>
              <View style={s.bankRow}>
                <View style={s.bankItem}>
                  <Text style={s.bankKey}>ธนาคาร / Bank</Text>
                  <TText style={s.bankVal}>
                    {[data.companyBankName, data.companyBankNameEn].filter(Boolean).join(" / ")}
                  </TText>
                </View>
                <View style={s.bankItem}>
                  <Text style={s.bankKey}>ชื่อบัญชี / Account Name</Text>
                  <TText style={s.bankVal}>
                    {[data.companyBankAccountName, data.companyBankAccountNameEn].filter(Boolean).join(" / ")}
                  </TText>
                </View>
                <View style={s.bankItem}>
                  <Text style={s.bankKey}>เลขที่บัญชี / Account No.</Text>
                  <Text style={s.bankVal}>{data.companyBankAccountNumber ?? "-"}</Text>
                </View>
              </View>
            </View>
          )}
          <View style={s.sigSeparator} />
          <View style={s.sigRow}>
            {/* Company */}
            <View style={s.sigCol}>
              <Text style={s.sigInName}>ในนาม / On behalf of</Text>
              <Text style={s.sigEntity}>{data.companyName + "​"}</Text>
              {data.companySignatureUrl
                ? <Image src={data.companySignatureUrl} style={s.sigImg} />
                : <View style={s.sigSpace} />}
              <View style={s.sigLine} />
              {data.companyAuthorizedName && (
                <TText style={s.sigName}>{"(" + data.companyAuthorizedName + ")"}</TText>
              )}
              <TText style={s.sigRole}>{roles.companyTh}</TText>
              <Text style={s.sigRoleEn}>{roles.companyEn}</Text>
              <TText style={s.sigDate}>{"วันที่ / Date " + data.date}</TText>
            </View>

            {/* Stamp */}
            <View style={s.sigMid}>
              <View style={s.stampCircle}>
                {data.companyLogoUrl
                  ? <Image src={data.companyLogoUrl} style={s.stampImg} />
                  : <Text style={s.stampText}>{"ตราประทับ\nCompany Seal"}</Text>}
              </View>
            </View>

            {/* Customer */}
            <View style={s.sigCol}>
              <Text style={s.sigInName}>ในนาม / On behalf of</Text>
              <Text style={s.sigEntity}>{data.customerName + "​"}</Text>
              <View style={s.sigSpace} />
              <View style={s.sigLine} />
              <TText style={s.sigRole}>{roles.customerTh}</TText>
              <Text style={s.sigRoleEn}>{roles.customerEn}</Text>
              <TText style={s.sigDate}>{"วันที่ / Date " + data.date}</TText>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
}
