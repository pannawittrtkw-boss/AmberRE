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
const GRAY = "#777777";
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

function docLabel(docType: AccDocType): { th: string; color: string } {
  if (docType === "INVOICE") return { th: "ใบแจ้งหนี้", color: GOLD };
  if (docType === "BILLING_NOTE") return { th: "ใบวางบิล", color: TEAL };
  return { th: "ใบเสร็จรับเงิน", color: GOLD };
}

function paymentMethodLabel(m: string | undefined): string {
  if (!m) return "เงินสด";
  const map: Record<string, string> = {
    CASH: "เงินสด",
    CHEQUE: "เช็ค",
    TRANSFER: "โอนเงิน",
    CREDIT: "บัตรเครดิต",
  };
  return map[m] || m;
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 9.5,
    paddingTop: 36,
    paddingBottom: 80,
    paddingHorizontal: 40,
    lineHeight: 1.5,
    color: BLACK,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
  },
  logoImg: { width: 80, height: 50, objectFit: "contain" },
  logoPlaceholder: { width: 80 },
  docTitleBlock: { alignItems: "flex-end" },
  docTitle: { fontSize: 22, fontWeight: "bold" },
  docOriginal: { fontSize: 9, color: GRAY, marginTop: 2 },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  companyBlock: { flex: 1, paddingRight: 12 },
  companyName: { fontSize: 11, fontWeight: "bold", marginBottom: 2 },
  companyDetail: { fontSize: 8.5, color: GRAY, lineHeight: 1.5 },
  docInfoBlock: { width: 180 },
  docInfoRow: { flexDirection: "row", marginBottom: 3 },
  docInfoLabel: { width: 70, fontSize: 8.5, color: GRAY },
  docInfoVal: { flex: 1, fontSize: 8.5, fontWeight: "bold" },
  customerBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    backgroundColor: LIGHT,
    padding: 10,
    marginBottom: 14,
  },
  customerLabel: { fontSize: 8, color: GRAY, fontWeight: "bold", marginBottom: 3, letterSpacing: 0.5 },
  customerName: { fontSize: 10.5, fontWeight: "bold", marginBottom: 2 },
  customerDetail: { fontSize: 8.5, color: GRAY },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BLACK,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderText: { fontSize: 8, color: "#FFFFFF", fontWeight: "bold" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowAlt: { backgroundColor: "#FAFAFA" },
  tableCell: { fontSize: 8.5 },
  colNo: { width: 22 },
  colDesc: { flex: 1, paddingRight: 4 },
  colQty: { width: 40, textAlign: "right" },
  colPrice: { width: 70, textAlign: "right" },
  colDisc: { width: 50, textAlign: "right" },
  colAmount: { width: 72, textAlign: "right" },
  totalsBlock: {
    alignItems: "flex-end",
    marginTop: 10,
    marginBottom: 12,
  },
  totalsRow: {
    flexDirection: "row",
    width: 240,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  totalsLabel: { flex: 1, fontSize: 8.5, color: GRAY },
  totalsVal: { width: 80, textAlign: "right", fontSize: 8.5 },
  totalsFinalRow: {
    flexDirection: "row",
    width: 240,
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: BLACK,
    borderRadius: 3,
    marginTop: 2,
  },
  totalsFinalLabel: { flex: 1, fontSize: 9.5, color: "#FFFFFF", fontWeight: "bold" },
  totalsFinalVal: { width: 80, textAlign: "right", fontSize: 9.5, color: GOLD, fontWeight: "bold" },
  bahtTextRow: {
    flexDirection: "row",
    width: 240,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  bahtTextLabel: { fontSize: 7.5, color: GRAY, flex: 1 },
  bahtTextVal: { width: 80, textAlign: "right", fontSize: 7.5, color: GRAY },
  noteBox: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: LIGHT,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    borderRadius: 2,
  },
  noteLabel: { fontSize: 8, color: GRAY, fontWeight: "bold", marginBottom: 2 },
  noteText: { fontSize: 8.5, color: BLACK },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  paymentLabel: { fontSize: 8.5, color: GRAY, marginRight: 4 },
  paymentItem: { flexDirection: "row", alignItems: "center", gap: 4, marginRight: 12 },
  paymentBox: {
    width: 11,
    height: 11,
    borderWidth: 0.8,
    borderColor: BLACK,
    borderRadius: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentBoxChecked: { backgroundColor: GOLD, borderColor: GOLD },
  paymentCheckMark: { fontSize: 7, color: "#FFFFFF", fontWeight: "bold" },
  paymentText: { fontSize: 8.5 },
  sigBlock: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    gap: 20,
  },
  sigCol: { flex: 1, alignItems: "center" },
  sigLabel: { fontSize: 8, color: GRAY, textAlign: "center", marginBottom: 4 },
  sigImg: { width: 80, height: 35, objectFit: "contain", marginBottom: 2 },
  sigImgPlaceholder: { height: 35 },
  sigLine: { borderBottomWidth: 0.8, borderBottomColor: BLACK, width: "90%", marginBottom: 3 },
  sigName: { fontSize: 8, textAlign: "center", color: GRAY },
  sigDate: { fontSize: 7.5, textAlign: "center", color: GRAY, marginTop: 2 },
  sigRole: { fontSize: 8.5, textAlign: "center", fontWeight: "bold" },
});

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AccPdf({ data }: { data: AccPdfData }) {
  const { th: titleTh, color: titleColor } = docLabel(data.docType);
  const hasDiscount = data.items.some((it) => (it.discountPct ?? 0) > 0);
  const paymentMethods = ["CASH", "CHEQUE", "TRANSFER", "CREDIT"];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            {data.companyLogoUrl ? (
              <Image src={data.companyLogoUrl} style={s.logoImg} />
            ) : (
              <View style={s.logoPlaceholder} />
            )}
          </View>
          <View style={s.docTitleBlock}>
            <TText style={[s.docTitle, { color: titleColor }]}>{titleTh}</TText>
            <TText style={s.docOriginal}>ต้นฉบับ</TText>
          </View>
        </View>

        {/* Company info + Doc info */}
        <View style={s.twoCol}>
          <View style={s.companyBlock}>
            <TText style={s.companyName}>{data.companyName}</TText>
            {data.companyAddress && (
              <TText style={s.companyDetail}>{data.companyAddress}</TText>
            )}
            {data.companyTaxId && (
              <TText style={s.companyDetail}>{"เลขประจำตัวผู้เสียภาษี: " + data.companyTaxId}</TText>
            )}
            {data.companyPhone && (
              <TText style={s.companyDetail}>{"โทร: " + data.companyPhone}</TText>
            )}
          </View>
          <View style={s.docInfoBlock}>
            <View style={s.docInfoRow}>
              <TText style={s.docInfoLabel}>เลขที่:</TText>
              <TText style={s.docInfoVal}>{data.docNumber}</TText>
            </View>
            <View style={s.docInfoRow}>
              <TText style={s.docInfoLabel}>วันที่:</TText>
              <TText style={s.docInfoVal}>{data.date}</TText>
            </View>
            {data.dueDate && (
              <View style={s.docInfoRow}>
                <TText style={s.docInfoLabel}>ครบกำหนด:</TText>
                <TText style={s.docInfoVal}>{data.dueDate}</TText>
              </View>
            )}
            {data.refDocNumber && (
              <View style={s.docInfoRow}>
                <TText style={s.docInfoLabel}>อ้างถึง:</TText>
                <TText style={s.docInfoVal}>{data.refDocNumber}</TText>
              </View>
            )}
          </View>
        </View>

        {/* Customer */}
        <View style={s.customerBox}>
          <TText style={s.customerLabel}>ลูกค้า / CUSTOMER</TText>
          <TText style={s.customerName}>{data.customerName}</TText>
          {data.customerContactName && (
            <TText style={s.customerDetail}>{"ผู้ติดต่อ: " + data.customerContactName}</TText>
          )}
          {data.customerAddress && (
            <TText style={s.customerDetail}>{data.customerAddress}</TText>
          )}
          {data.customerTaxId && (
            <TText style={s.customerDetail}>{"เลขผู้เสียภาษี: " + data.customerTaxId}</TText>
          )}
          {data.customerPhone && (
            <TText style={s.customerDetail}>{"โทร: " + data.customerPhone}</TText>
          )}
          {data.customerEmail && (
            <TText style={s.customerDetail}>{"อีเมล: " + data.customerEmail}</TText>
          )}
        </View>

        {/* Items table */}
        <View style={s.tableHeader}>
          <TText style={[s.tableHeaderText, s.colNo]}>#</TText>
          <TText style={[s.tableHeaderText, s.colDesc]}>รายละเอียด</TText>
          <TText style={[s.tableHeaderText, s.colQty, { textAlign: "right" }]}>จำนวน</TText>
          <TText style={[s.tableHeaderText, s.colPrice, { textAlign: "right" }]}>ราคาต่อหน่วย</TText>
          {hasDiscount && (
            <TText style={[s.tableHeaderText, s.colDisc, { textAlign: "right" }]}>ส่วนลด%</TText>
          )}
          <TText style={[s.tableHeaderText, s.colAmount, { textAlign: "right" }]}>มูลค่า</TText>
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

        {/* Totals */}
        <View style={s.totalsBlock}>
          <View style={s.totalsRow}>
            <TText style={s.totalsLabel}>รวมเป็นเงิน</TText>
            <TText style={s.totalsVal}>{fmt(data.subtotal)}</TText>
          </View>
          <View style={s.totalsRow}>
            <TText style={s.totalsLabel}>{"ภาษีมูลค่าเพิ่ม " + data.vatRate + "%"}</TText>
            <TText style={s.totalsVal}>{fmt(data.vatAmount)}</TText>
          </View>
          <View style={s.totalsFinalRow}>
            <TText style={s.totalsFinalLabel}>รวมทั้งสิ้น</TText>
            <TText style={s.totalsFinalVal}>{fmt(data.totalAmount)}</TText>
          </View>
          <View style={s.bahtTextRow}>
            <TText style={s.bahtTextLabel}>{"(" + bahtText(data.totalAmount) + ")"}</TText>
          </View>
        </View>

        {/* Payment method (receipt only) */}
        {data.docType === "RECEIPT" && (
          <View style={s.paymentRow}>
            <TText style={s.paymentLabel}>วิธีชำระเงิน:</TText>
            {paymentMethods.map((m) => (
              <View key={m} style={s.paymentItem}>
                <View style={[s.paymentBox, data.paymentMethod === m ? s.paymentBoxChecked : {}]}>
                  {data.paymentMethod === m && (
                    <Text style={s.paymentCheckMark}>✓</Text>
                  )}
                </View>
                <TText style={s.paymentText}>{paymentMethodLabel(m)}</TText>
              </View>
            ))}
          </View>
        )}

        {/* Note */}
        {data.note && (
          <View style={s.noteBox}>
            <TText style={s.noteLabel}>หมายเหตุ</TText>
            <TText style={s.noteText}>{data.note}</TText>
          </View>
        )}

        {/* Signature block */}
        <View fixed style={s.sigBlock}>
          <View style={s.sigCol}>
            <TText style={s.sigLabel}>{"ในนาม " + data.companyName}</TText>
            {data.docType === "RECEIPT" ? (
              <TText style={[s.sigRole]}>ผู้รับเงิน</TText>
            ) : (
              <TText style={s.sigRole}>ผู้ออกเอกสาร</TText>
            )}
            {data.companySignatureUrl ? (
              <Image src={data.companySignatureUrl} style={s.sigImg} />
            ) : (
              <View style={s.sigImgPlaceholder} />
            )}
            <View style={s.sigLine} />
            {data.companyAuthorizedName && (
              <TText style={s.sigName}>{"(" + data.companyAuthorizedName + ")"}</TText>
            )}
            <TText style={s.sigDate}>วันที่ ............................................</TText>
          </View>
          <View style={s.sigCol}>
            <TText style={s.sigLabel}>{"ในนาม " + data.customerName}</TText>
            {data.docType === "RECEIPT" ? (
              <TText style={s.sigRole}>ผู้จ่ายเงิน</TText>
            ) : data.docType === "BILLING_NOTE" ? (
              <TText style={s.sigRole}>ผู้รับบิล</TText>
            ) : (
              <TText style={s.sigRole}>ผู้รับเอกสาร</TText>
            )}
            <View style={s.sigImgPlaceholder} />
            <View style={s.sigLine} />
            <TText style={s.sigDate}>วันที่ ............................................</TText>
          </View>
        </View>
      </Page>
    </Document>
  );
}
