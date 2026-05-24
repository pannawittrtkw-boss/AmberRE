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

export type BookingReceiptData = {
  docNumber: string;
  date: string;
  ownerName: string;
  ownerPhone: string;
  tenantName: string;
  tenantPhone: string;
  agentPhone: string;
  unitNumber: string;
  depositAmount: number;
  depositAmountText: string;
  moveInDate: string;
  // base64 data-URL or absolute https:// URL
  ownerIdImage?: string | null;
  tenantIdImage?: string | null;
  transferSlipImage?: string | null;
};

const GOLD = "#C8A951";
const BLACK = "#1A1A1A";
const GRAY = "#777777";
const LIGHT = "#F8F8F8";
const BORDER = "#E2E2E2";

const s = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 10,
    paddingTop: 42,
    // Reserve space for fixed signature footer at bottom: 24 (~66pt tall)
    // Same pattern as contract-pdf.tsx: paddingBottom > bottom + footer_height
    paddingBottom: 92,
    paddingHorizontal: 50,
    lineHeight: 1.6,
    color: BLACK,
  },
  // ── Header ──────────────────────────────────────────────────
  headerWrap: {
    borderBottomWidth: 2.5,
    borderBottomColor: GOLD,
    paddingBottom: 10,
    marginBottom: 14,
    alignItems: "center",
  },
  logoLine: {
    fontSize: 7,
    color: GOLD,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: "center",
  },
  titleTh: { fontSize: 15, fontWeight: "bold", textAlign: "center", lineHeight: 1.4 },
  titleEn: { fontSize: 11, textAlign: "center", color: GRAY, lineHeight: 1.4 },
  // ── Meta row (No / Date) ────────────────────────────────────
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaLabel: { fontSize: 9, color: GRAY },
  metaVal: {
    fontSize: 9.5,
    fontWeight: "bold",
    minWidth: 100,
    borderBottomWidth: 0.5,
    borderBottomColor: "#BBBBBB",
    paddingBottom: 1,
    paddingHorizontal: 2,
  },
  // ── Party box ────────────────────────────────────────────────
  partyBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    marginBottom: 12,
    backgroundColor: LIGHT,
    overflow: "hidden",
  },
  partyRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  partyRowLast: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  partyLabelCol: { width: 115, justifyContent: "center" },
  partyLabelTh: { fontSize: 9, color: BLACK, fontWeight: "bold", lineHeight: 1.4 },
  partyLabelEn: { fontSize: 8, color: GRAY, lineHeight: 1.4 },
  partyNameCol: { width: 200, justifyContent: "flex-end", paddingRight: 8 },
  partyName: {
    fontWeight: "bold",
    fontSize: 10.5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#BBBBBB",
    paddingBottom: 2,
  },
  telCol: { flex: 1, justifyContent: "flex-end", paddingLeft: 8 },
  telRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  telLabel: { fontSize: 8.5, color: GRAY, paddingBottom: 2 },
  telVal: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#BBBBBB",
    paddingBottom: 2,
  },
  // ── Field rows (move-in — side by side) ─────────────────────
  fieldRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
  fieldLabelCol: { width: 160, justifyContent: "flex-end" },
  fieldLabelTh: { fontSize: 9, color: BLACK, fontWeight: "bold", lineHeight: 1.4 },
  fieldLabelEn: { fontSize: 8, color: GRAY, lineHeight: 1.4 },
  fieldVal: {
    flex: 1,
    fontWeight: "bold",
    fontSize: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#BBBBBB",
    paddingBottom: 2,
    paddingLeft: 4,
  },
  // ── Unit field — stacked (label above, value below) ──────────
  unitWrap: { marginBottom: 10 },
  unitLabelTh: { fontSize: 9, color: BLACK, fontWeight: "bold", lineHeight: 1.4 },
  unitLabelEn: { fontSize: 8, color: GRAY, lineHeight: 1.4, marginBottom: 4 },
  unitVal: {
    fontWeight: "bold",
    fontSize: 11,
    borderBottomWidth: 0.5,
    borderBottomColor: "#BBBBBB",
    paddingBottom: 3,
  },
  // ── Fixed signature footer ───────────────────────────────────
  // Positioned inside the paddingBottom reserved area, exactly like
  // contract-pdf.tsx: bottom: 24, paddingBottom: 92 on the page.
  sigFooter: {
    position: "absolute",
    bottom: 24,
    left: 50,
    right: 50,
    paddingTop: 5,
  },
  // ── Amount box ───────────────────────────────────────────────
  amountBox: {
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    backgroundColor: "#FFFCF0",
  },
  amountRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  amountLabelTh: { fontSize: 9, color: BLACK, fontWeight: "bold", width: 130 },
  amountLabelEn: { fontSize: 8, color: GRAY, width: 130 },
  amountVal: { flex: 1, fontSize: 14, fontWeight: "bold", color: GOLD },
  amountWords: { fontSize: 9, color: GRAY, paddingLeft: 130, marginTop: 2 },
  // ── Terms ────────────────────────────────────────────────────
  termBar: {
    backgroundColor: BLACK,
    color: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 10,
    marginBottom: 9,
  },
  termIntro: { fontSize: 9, marginBottom: 8, lineHeight: 1.6, color: GRAY },
  clauseTitle: { fontWeight: "bold", fontSize: 9.5, marginBottom: 4 },
  bullet: { fontSize: 9, marginLeft: 14, marginBottom: 4, lineHeight: 1.6 },
  agree: { fontSize: 9, marginTop: 8, marginBottom: 2, lineHeight: 1.6 },
  // ── Signatures ───────────────────────────────────────────────
  sigRow: { flexDirection: "row", marginTop: 22, gap: 12 },
  sigBlock: { flex: 1, alignItems: "center" },
  sigLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: BLACK,
    width: "88%",
    height: 32,
    marginBottom: 4,
  },
  sigRole: { fontSize: 9.5, textAlign: "center", fontWeight: "bold" },
  sigName: { fontSize: 8.5, textAlign: "center", color: GRAY, marginTop: 2 },
  // ── Evidence section (ID cards + transfer slip) ──────────────
  evidenceSection: { marginTop: 16 },
  // Parent header bar
  refHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  refHeaderText: { fontSize: 9.5, fontWeight: "bold", color: BLACK },
  refHeaderSub: { fontSize: 8, color: GRAY, marginLeft: 6 },
  // Sub-section titles
  evidenceSectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: GRAY,
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  evidenceDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    marginTop: 12,
    marginBottom: 12,
  },
  idRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  idBlock: { flex: 1, alignItems: "center" },
  idLabel: { fontSize: 8, color: GRAY, marginBottom: 5, textAlign: "center", lineHeight: 1.4 },
  idImage: {
    width: "100%",
    height: 140,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 2,
    objectFit: "contain",
  },
  idPlaceholder: {
    width: "100%",
    height: 140,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderStyle: "dashed",
    borderRadius: 2,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
  },
  // transfer slip — centred, portrait-friendly
  slipRow: { flexDirection: "row", justifyContent: "center", marginTop: 2 },
  slipBlock: { width: 200, alignItems: "center" },
  slipLabel: { fontSize: 8, color: GRAY, marginBottom: 5, textAlign: "center", lineHeight: 1.4 },
  slipImage: {
    width: 200,
    height: 280,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 2,
    objectFit: "contain",
  },
  slipPlaceholder: {
    width: 200,
    height: 120,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderStyle: "dashed",
    borderRadius: 2,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    fontSize: 7.5,
    color: GRAY,
    textAlign: "center",
    marginTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 5,
  },
});

// ── Party row component ──────────────────────────────────────────
function PartyRow({
  labelTh,
  labelEn,
  name,
  phone,
  last,
}: {
  labelTh: string;
  labelEn: string;
  name: string;
  phone: string;
  last?: boolean;
}) {
  return (
    <View style={last ? s.partyRowLast : s.partyRow}>
      <View style={s.partyLabelCol}>
        <TText style={s.partyLabelTh}>{labelTh}</TText>
        <TText style={s.partyLabelEn}>{labelEn}</TText>
      </View>
      <View style={s.partyNameCol}>
        <TText style={s.partyName}>{name || " "}</TText>
      </View>
      <View style={s.telCol}>
        <View style={s.telRow}>
          <TText style={s.telLabel}>{"โทร / Tel:"}</TText>
          <TText style={s.telVal}>{phone || " "}</TText>
        </View>
      </View>
    </View>
  );
}

// ── Side-by-side field row (move-in date etc.) ───────────────────
function FieldRow({
  labelTh,
  labelEn,
  value,
}: {
  labelTh: string;
  labelEn: string;
  value: string;
}) {
  return (
    <View style={s.fieldRow}>
      <View style={s.fieldLabelCol}>
        <TText style={s.fieldLabelTh}>{labelTh}</TText>
        <TText style={s.fieldLabelEn}>{labelEn}</TText>
      </View>
      <TText style={s.fieldVal}>{value || " "}</TText>
    </View>
  );
}

// ── Stacked field row for long unit-no label ─────────────────────
// Label wraps naturally full-width; underlined value on its own line
function UnitFieldRow({ value }: { value: string }) {
  return (
    <View style={s.unitWrap}>
      <TText style={s.unitLabelTh}>
        {"ผู้รับเงินได้รับเงินมัดจำเพื่อจองห้องชุดเลขที่"}
      </TText>
      <TText style={s.unitLabelEn}>
        {"Received booking deposit for Unit No.:"}
      </TText>
      <TText style={s.unitVal}>{value || " "}</TText>
    </View>
  );
}

// ── Signature block (shared between footer and content) ───────────
function SigBlock({
  role,
  roleSub,
  name,
}: {
  role: string;
  roleSub: string;
  name: string;
}) {
  return (
    <View style={s.sigBlock}>
      <View style={s.sigLine} />
      <TText style={s.sigRole}>{"ลงชื่อ / Signature"}</TText>
      <TText style={{ fontSize: 9.5, textAlign: "center", marginTop: 2 }}>{role}</TText>
      <TText style={{ fontSize: 9, textAlign: "center", marginTop: 1 }}>{roleSub}</TText>
      <TText style={s.sigName}>{"(" + (name || "…………………………") + ")"}</TText>
    </View>
  );
}

// ── Main PDF component ────────────────────────────────────────────
export function BookingReceiptPdf({ data }: { data: BookingReceiptData }) {
  const hasEvidence = data.ownerIdImage || data.tenantIdImage || data.transferSlipImage;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.headerWrap}>
          <TText style={s.logoLine}>AMBER REAL ESTATE</TText>
          <TText style={s.titleTh}>ใบรับเงินมัดจำการจองห้องชุด</TText>
          <TText style={s.titleEn}>BOOKING RECEIPT & CONDITIONS</TText>
        </View>

        {/* ── Doc No / Date ── */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <TText style={s.metaLabel}>เลขที่เอกสาร / No.:</TText>
            <TText style={s.metaVal}>{data.docNumber}</TText>
          </View>
          <View style={s.metaItem}>
            <TText style={s.metaLabel}>วันที่ / Date:</TText>
            <TText style={s.metaVal}>{data.date}</TText>
          </View>
        </View>

        {/* ── Parties ── */}
        <View style={s.partyBox}>
          <PartyRow
            labelTh="ผู้รับเงิน (เจ้าของห้อง)"
            labelEn="Receiver (Owner):"
            name={data.ownerName}
            phone={data.ownerPhone}
          />
          <PartyRow
            labelTh="ผู้จ่ายเงิน (ผู้เช่า)"
            labelEn="Payer (Tenant):"
            name={data.tenantName}
            phone={data.tenantPhone}
          />
          <PartyRow
            labelTh="ผู้ดูแลการเช่า (นายหน้า)"
            labelEn="Agent:"
            name={"Amber Real Estate"}
            phone={data.agentPhone}
            last
          />
        </View>

        {/* ── Unit No (stacked layout — label too long for side-by-side) ── */}
        <UnitFieldRow value={data.unitNumber} />

        {/* ── Amount ── */}
        <View style={s.amountBox}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 130 }}>
              <TText style={s.amountLabelTh}>{"เป็นจำนวนเงิน"}</TText>
              <TText style={s.amountLabelEn}>{"Amount:"}</TText>
            </View>
            <TText style={[s.amountVal, { marginRight: 8 }]}>
              {data.depositAmount.toLocaleString("th-TH") + "  บาท / THB"}
            </TText>
            <TText style={{ fontSize: 9, color: GRAY, flex: 1 }}>
              {"(" + data.depositAmountText + ")"}
            </TText>
          </View>
        </View>

        {/* ── Move-in Date ── */}
        <FieldRow
          labelTh="กำหนดทำสัญญาและเข้าอยู่"
          labelEn="Contract & Move-in Date:"
          value={data.moveInDate}
        />

        {/* ── Terms & Conditions ── */}
        <TText style={s.termBar}>
          {"เงื่อนไขและข้อตกลงร่วมกัน / Terms & Conditions"}
        </TText>

        <TText style={s.termIntro}>
          {
            "เพื่อความเป็นธรรมและความมั่นใจของทุกฝ่าย คู่สัญญาตกลงปฏิบัติตามเงื่อนไขดังนี้:\nFor fairness and mutual commitment, all parties agree to the following terms:"
          }
        </TText>

        <View style={{ marginBottom: 6 }}>
          <TText style={s.clauseTitle}>
            {"1. กรณีผู้เช่ายกเลิก / If Tenant Cancels:"}
          </TText>
          <TText style={s.bullet}>
            {"• เงินมัดจำตกเป็นของเจ้าของห้อง 100%\n  The deposit is 100% forfeited to the Owner."}
          </TText>
          <TText style={s.bullet}>
            {
              "• เจ้าของห้องให้สิทธิ์ Amber Real Estate จัดหาผู้เช่าใหม่มาแทนแต่เพียงผู้เดียวเป็นเวลา 15 วัน หลังจากนั้นถึงจะมีสิทธิ์ปล่อยเช่าเอง หรือ ให้นายหน้าอื่นหาผู้เช่าได้\n  The Owner grants Amber Real Estate the exclusive right to find a replacement tenant for 15 days; after which the Owner may rent it out independently or engage another agent."
            }
          </TText>
        </View>

        <View style={{ marginBottom: 4 }}>
          <TText style={s.clauseTitle}>
            {
              "2. กรณีเจ้าของห้องยกเลิกหรือห้องไม่พร้อม / If Owner Cancels or Room Not Ready:"
            }
          </TText>
          <TText style={s.bullet}>
            {
              "• แจ้งล่วงหน้า ≥ 10 วันก่อนวันเข้าพัก: คืนมัดจำเต็มจำนวน ไม่มีค่าปรับ\n  Notice given ≥ 10 days before move-in: Full refund, no penalty."
            }
          </TText>
          <TText style={s.bullet}>
            {
              "• แจ้งล่วงหน้า < 10 วันก่อนวันเข้าพัก: คืนมัดจำเต็มจำนวน + ชดเชยค่าเสียเวลาหาที่พักใหม่ 2,000 บาท\n  Notice given < 10 days before move-in: Full refund + 2,000 THB compensation for urgent relocation."
            }
          </TText>
          <TText style={s.bullet}>
            {
              "• หากขอเลื่อนวันเข้าพัก: เจ้าของห้องสนับสนุนค่าที่พักชั่วคราววันละ 600 บาท จนกว่าจะเข้าพักได้\n  If move-in is delayed: Owner covers temporary accommodation at 600 THB/day until move-in."
            }
          </TText>
        </View>

        <TText style={s.agree}>
          {
            "คู่สัญญารับทราบและยินยอมผูกพันตามเงื่อนไขข้างต้น / All parties have read and agreed to these terms."
          }
        </TText>

        {/* ── Evidence: ID cards + transfer slip ── */}
        {hasEvidence && (
          <View style={s.evidenceSection}>
            {/* Parent header */}
            <View style={s.refHeader}>
              <TText style={s.refHeaderText}>{"เอกสารอ้างอิง / REFERENCE DOCUMENTS"}</TText>
              <TText style={s.refHeaderSub}>{"— แนบท้ายใบรับเงินมัดจำ / Attached to Booking Receipt"}</TText>
            </View>

            {/* ID cards row */}
            {(data.ownerIdImage || data.tenantIdImage) && (
              <>
                <TText style={s.evidenceSectionTitle}>
                  {"สำเนาบัตรประชาชน / PASSPORT — สำหรับยืนยันตัวตน / IDENTITY VERIFICATION"}
                </TText>
                <View style={s.idRow}>
                  <View style={s.idBlock}>
                    <TText style={s.idLabel}>
                      {"เจ้าของห้อง / Owner\n" + (data.ownerName || "")}
                    </TText>
                    {data.ownerIdImage ? (
                      <Image src={data.ownerIdImage} style={s.idImage} />
                    ) : (
                      <View style={s.idPlaceholder}>
                        <TText style={{ fontSize: 8, color: GRAY }}>ไม่มีรูปถ่าย</TText>
                      </View>
                    )}
                  </View>
                  <View style={s.idBlock}>
                    <TText style={s.idLabel}>
                      {"ผู้เช่า / Tenant\n" + (data.tenantName || "")}
                    </TText>
                    {data.tenantIdImage ? (
                      <Image src={data.tenantIdImage} style={s.idImage} />
                    ) : (
                      <View style={s.idPlaceholder}>
                        <TText style={{ fontSize: 8, color: GRAY }}>ไม่มีรูปถ่าย</TText>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}

            {/* Transfer slip */}
            {data.transferSlipImage && (
              <>
                <View style={s.evidenceDivider} />
                <TText style={s.evidenceSectionTitle}>
                  {"หลักฐานการโอนเงินมัดจำ / TRANSFER SLIP"}
                </TText>
                <View style={s.slipRow}>
                  <View style={s.slipBlock}>
                    <TText style={s.slipLabel}>
                      {"จำนวน " + data.depositAmount.toLocaleString("th-TH") + " บาท / THB\n" + data.date}
                    </TText>
                    <Image src={data.transferSlipImage} style={s.slipImage} />
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Fixed signature footer — appears on every page ── */}
        {/* Total height ~66pt — fits inside paddingBottom:92 above bottom:24 */}
        <View fixed style={s.sigFooter}>
          {/* 3 compact signature blocks (line + 2 text rows each ≈ 45pt) */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            {[
              { role: "ผู้รับเงิน / Owner", name: data.ownerName },
              { role: "ผู้จ่ายเงิน / Tenant", name: data.tenantName },
              { role: "ผู้ดูแลการเช่า / Agent", name: "Amber Real Estate" },
            ].map(({ role, name }) => (
              <View key={role} style={{ flex: 1, alignItems: "center" }}>
                <View
                  style={{
                    borderBottomWidth: 0.5,
                    borderBottomColor: BLACK,
                    width: "85%",
                    height: 18,
                    marginBottom: 3,
                  }}
                />
                <TText style={{ fontSize: 8, textAlign: "center", fontWeight: "bold" }}>
                  {"ลงชื่อ / Signature"}
                </TText>
                <TText style={{ fontSize: 7.5, textAlign: "center", color: GRAY }}>
                  {role + "  (" + (name || "……………………") + ")"}
                </TText>
              </View>
            ))}
          </View>
          {/* Doc info line at very bottom ≈ 14pt */}
          <TText
            style={{ fontSize: 6.5, color: GRAY, textAlign: "center", marginTop: 5 }}
          >
            {"Amber Real Estate  |  ใบรับเงินมัดจำ / Booking Deposit Receipt  |  " +
              data.docNumber}
          </TText>
        </View>
      </Page>
    </Document>
  );
}
