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

// Owner <-> Tenant deposit booking form. Amber Real Estate never appears as
// a transacting party here — only as the document issuer (bottom-left
// signature) and a witness (bottom-right signature).
export interface BookingPdfData {
  docNumber: string;
  date: string; // pre-formatted display date

  // Company — only ever shown as the tiny doc-id line in the signature
  // footer, never a header/letterhead; no logo, address, or tax ID.
  companyName?: string | null;

  // Property
  projectName?: string | null;
  unitNumber?: string | null;
  propertyAddress?: string | null;

  // Owner
  ownerName: string;
  ownerIdCard?: string | null;
  ownerAddress?: string | null;
  ownerPhone?: string | null;
  ownerIdCardImage?: string | null;
  ownerBankName?: string | null;
  ownerBankAccountNumber?: string | null;
  ownerBankAccountName?: string | null;
  // Set once the owner has e-signed — drawn in place of the blank line
  ownerSignature?: string | null;
  signedAtText?: string | null;

  // Tenant
  tenantName: string;
  tenantIdCard?: string | null;
  tenantAddress?: string | null;
  tenantPhone?: string | null;
  tenantIdCardImage?: string | null;

  // Deal terms
  depositAmount: number;
  depositAmountText: string;
  monthlyRent?: number | null;
  leaseTermMonths?: number | null;
  depositDate?: string | null;
  appointmentDate?: string | null;
  moveInDate?: string | null;

  transferSlipImage?: string | null;

  issuerName?: string | null;
  witnessName?: string | null;
}

// Same monochrome palette as the accounting invoice (lib/acc-pdf.tsx) —
// black text, gray labels, thin hairline rules. No color fills/boxes, so
// the two documents read as one family.
const BLACK = "#1C1C1C";
const GRAY = "#4A4A4A";
const GRAY2 = "#8A8A8A";
const RULE = "#D8D8D8";

const s = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 9,
    paddingTop: 30,
    paddingBottom: 72,
    paddingHorizontal: 40,
    lineHeight: 1.4,
    color: BLACK,
  },
  // ── Header: title only, right-aligned — no company name/address/logo ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: BLACK,
    paddingBottom: 9,
    marginBottom: 12,
  },
  titleBlock: { alignItems: "flex-end" },
  titleTh: { fontSize: 17, fontWeight: "bold", textAlign: "right", lineHeight: 1.3 },
  titleEn: { fontSize: 11, fontWeight: "bold", color: BLACK, textAlign: "right", marginTop: 6, letterSpacing: 0.6 },
  titleSub: { fontSize: 7, color: GRAY2, textAlign: "right", marginTop: 3 },
  // ── Doc meta — hairline key/value rows, like the invoice's docInfoRow ──
  metaWrap: { width: 150, marginTop: 8 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
  },
  metaLabel: { fontSize: 7, color: GRAY2 },
  metaVal: { fontSize: 8.5, fontWeight: "bold" },
  // ── Party strip (owner / tenant) — side by side, hairline label rule ──
  partyRow: { flexDirection: "row", marginBottom: 10 },
  partyBlock: { flex: 1, paddingRight: 14 },
  partyLabel: {
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 0.4,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  partyName: { fontSize: 10, fontWeight: "bold", marginBottom: 2 },
  partyText: { fontSize: 7.5, color: GRAY, lineHeight: 1.5 },
  // ── Property strip ──
  propertyWrap: { marginBottom: 10 },
  propertyLabel: {
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 0.4,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  propertyName: { fontSize: 10, fontWeight: "bold", marginBottom: 1.5 },
  propertyText: { fontSize: 7.5, color: GRAY, lineHeight: 1.4 },
  // ── Deposit amount — bold row with a top rule, like the invoice's grand total ──
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: BLACK,
    borderBottomWidth: 1,
    borderBottomColor: BLACK,
    marginBottom: 2,
  },
  amountLabelTh: { fontSize: 9, fontWeight: "bold" },
  amountLabelEn: { fontSize: 7, color: GRAY2 },
  amountVal: { fontSize: 13, fontWeight: "bold" },
  amountWords: { fontSize: 7.5, color: GRAY2, marginBottom: 10 },
  // ── Field rows (deal terms) — 3 columns, combined bilingual label line ──
  fieldGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  fieldCol: { width: "33.33%", marginBottom: 6, paddingRight: 8 },
  fieldLabel: { fontSize: 6.5, color: GRAY2, marginBottom: 2 },
  fieldVal: {
    fontSize: 8.5,
    fontWeight: "bold",
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
  },
  // ── Bank info — plain key/value grid, like the invoice's Payment Details ──
  bankWrap: { marginBottom: 10 },
  bankLabel: { fontSize: 7.5, fontWeight: "bold", color: GRAY, marginBottom: 5 },
  bankRow: { flexDirection: "row", gap: 20 },
  bankItem: { flex: 1 },
  bankKey: { fontSize: 6.5, color: GRAY2, marginBottom: 1.5 },
  bankVal: { fontSize: 8.5, fontWeight: "bold" },
  // ── Terms — bold label + hairline rule, same as the party/property labels ──
  termLabel: {
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 0.4,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  clauseTitle: { fontWeight: "bold", fontSize: 7.5, marginBottom: 2 },
  bullet: { fontSize: 7, marginLeft: 12, marginBottom: 2, lineHeight: 1.35, color: GRAY },
  agree: { fontSize: 7, marginTop: 5, lineHeight: 1.35, color: GRAY2 },
  // ── Evidence ──
  evidenceSection: { marginTop: 16 },
  refHeader: {
    paddingBottom: 4,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  refHeaderText: { fontSize: 8.5, fontWeight: "bold" },
  evidenceSectionTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: GRAY2,
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 7,
  },
  evidenceDivider: { borderBottomWidth: 0.5, borderBottomColor: RULE, marginTop: 10, marginBottom: 10 },
  idRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  idBlock: { flex: 1, alignItems: "center" },
  idLabel: { fontSize: 7.5, color: GRAY, marginBottom: 4, textAlign: "center", lineHeight: 1.4 },
  idImage: { width: "100%", height: 130, borderWidth: 0.5, borderColor: RULE, objectFit: "contain" },
  idPlaceholder: {
    width: "100%", height: 130, borderWidth: 0.5, borderColor: RULE, borderStyle: "dashed",
    backgroundColor: "#FAFAFA", alignItems: "center", justifyContent: "center",
  },
  slipRow: { flexDirection: "row", justifyContent: "center", marginTop: 2 },
  slipBlock: { width: 200, alignItems: "center" },
  slipLabel: { fontSize: 7.5, color: GRAY, marginBottom: 4, textAlign: "center", lineHeight: 1.4 },
  slipImage: { width: 200, height: 260, borderWidth: 0.5, borderColor: RULE, objectFit: "contain" },
  // ── Fixed signature footer — 4 columns: Owner | Tenant | Issuer | Witness ──
  sigFooter: { position: "absolute", bottom: 20, left: 40, right: 40 },
  sigSeparator: { borderTopWidth: 0.5, borderTopColor: RULE, marginBottom: 8 },
  sigCol: { flex: 1, alignItems: "center" },
  sigLine: { borderBottomWidth: 0.8, borderBottomColor: BLACK, width: "85%", height: 26, marginBottom: 3 },
  sigSignatureImg: { width: "85%", height: 26, objectFit: "contain", marginBottom: 3 },
});

function fmtMoney(n: number): string {
  return n.toLocaleString("th-TH");
}

function PartyBlock({
  labelTh,
  labelEn,
  name,
  idCard,
  address,
  phone,
}: {
  labelTh: string;
  labelEn: string;
  name: string;
  idCard?: string | null;
  address?: string | null;
  phone?: string | null;
}) {
  return (
    <View style={s.partyBlock}>
      <TText style={s.partyLabel}>{`${labelTh} / ${labelEn}`}</TText>
      <TText style={s.partyName}>{name || " "}</TText>
      {idCard && <TText style={s.partyText}>{`เลขบัตรประชาชน / ID Card: ${idCard}`}</TText>}
      {address && <TText style={s.partyText}>{`ที่อยู่ / Address: ${address}`}</TText>}
      {phone && <TText style={s.partyText}>{`โทร / Tel: ${phone}`}</TText>}
    </View>
  );
}

function FieldCol({ labelTh, labelEn, value }: { labelTh: string; labelEn: string; value: string }) {
  return (
    <View style={s.fieldCol}>
      <TText style={s.fieldLabel}>{`${labelTh} / ${labelEn}`}</TText>
      <TText style={s.fieldVal}>{value || " "}</TText>
    </View>
  );
}

export function BookingPdf({ data }: { data: BookingPdfData }) {
  const hasEvidence = data.ownerIdCardImage || data.tenantIdCardImage || data.transferSlipImage;
  const unitLine = [data.projectName, data.unitNumber].filter(Boolean).join("  ห้อง ");

  return (
    <Document>
      <Page size="A4" style={s.page} wrap>
        {/* ── Header: title only, right-aligned — no company name/address ── */}
        <View style={s.headerRow}>
          <View style={s.titleBlock}>
            <TText style={s.titleTh}>ใบจอง</TText>
            <TText style={s.titleEn}>BOOKING FORM</TText>
            <TText style={s.titleSub}>ต้นฉบับ / Original</TText>
            <View style={s.metaWrap}>
              <View style={s.metaRow}>
                <TText style={s.metaLabel}>เลขที่ / No.</TText>
                <TText style={s.metaVal}>{data.docNumber}</TText>
              </View>
              <View style={[s.metaRow, { borderBottomWidth: 0 }]}>
                <TText style={s.metaLabel}>วันที่ / Date</TText>
                <TText style={s.metaVal}>{data.date}</TText>
              </View>
            </View>
          </View>
        </View>

        {/* ── Parties — side by side ── */}
        <View style={s.partyRow}>
          <PartyBlock
            labelTh="เจ้าของทรัพย์สิน (ผู้รับเงิน)"
            labelEn="PROPERTY OWNER"
            name={data.ownerName}
            idCard={data.ownerIdCard}
            address={data.ownerAddress}
            phone={data.ownerPhone}
          />
          <PartyBlock
            labelTh="ผู้เช่า (ผู้จ่ายเงิน)"
            labelEn="TENANT"
            name={data.tenantName}
            idCard={data.tenantIdCard}
            address={data.tenantAddress}
            phone={data.tenantPhone}
          />
        </View>

        {/* ── Property ── */}
        {(unitLine || data.propertyAddress) && (
          <View style={s.propertyWrap}>
            <TText style={s.propertyLabel}>ทรัพย์สินที่จอง / PROPERTY BOOKED</TText>
            {unitLine && <TText style={s.propertyName}>{unitLine}</TText>}
            {data.propertyAddress && <TText style={s.propertyText}>{data.propertyAddress}</TText>}
          </View>
        )}

        {/* ── Deposit amount ── */}
        <View style={s.amountRow}>
          <View style={{ width: 115 }}>
            <TText style={s.amountLabelTh}>เป็นจำนวนเงิน</TText>
            <TText style={s.amountLabelEn}>Deposit Amount</TText>
          </View>
          <TText style={[s.amountVal, { flex: 1 }]}>{`${fmtMoney(data.depositAmount)} บาท / THB`}</TText>
        </View>
        <TText style={s.amountWords}>{`(${data.depositAmountText})`}</TText>

        {/* ── Deal terms ── */}
        <View style={s.fieldGrid}>
          {data.depositDate && (
            <FieldCol labelTh="วันที่วางเงินจอง" labelEn="Deposit Date" value={data.depositDate} />
          )}
          {data.appointmentDate && (
            <FieldCol labelTh="วันที่นัดทำสัญญา" labelEn="Appointment Date" value={data.appointmentDate} />
          )}
          {data.moveInDate && (
            <FieldCol labelTh="วันที่เข้าอยู่โดยประมาณ" labelEn="Est. Move-in" value={data.moveInDate} />
          )}
          {data.monthlyRent != null && (
            <FieldCol
              labelTh="ค่าเช่าต่อเดือน"
              labelEn="Monthly Rent"
              value={`${fmtMoney(data.monthlyRent)} บาท`}
            />
          )}
          {data.leaseTermMonths != null && (
            <FieldCol labelTh="ระยะเวลาเช่า" labelEn="Lease Term" value={`${data.leaseTermMonths} เดือน`} />
          )}
        </View>

        {/* ── Owner's bank account (for receiving the deposit) ── */}
        {(data.ownerBankName || data.ownerBankAccountNumber) && (
          <View style={s.bankWrap}>
            <TText style={s.bankLabel}>
              บัญชีธนาคารเจ้าของ (สำหรับรับเงินมัดจำ) / Owner&apos;s Bank Account
            </TText>
            <View style={s.bankRow}>
              {data.ownerBankName && (
                <View style={s.bankItem}>
                  <TText style={s.bankKey}>ธนาคาร / Bank</TText>
                  <TText style={s.bankVal}>{data.ownerBankName}</TText>
                </View>
              )}
              {data.ownerBankAccountNumber && (
                <View style={s.bankItem}>
                  <TText style={s.bankKey}>เลขที่บัญชี / Account No.</TText>
                  <TText style={s.bankVal}>{data.ownerBankAccountNumber}</TText>
                </View>
              )}
              {data.ownerBankAccountName && (
                <View style={s.bankItem}>
                  <TText style={s.bankKey}>ชื่อบัญชี / Account Name</TText>
                  <TText style={s.bankVal}>{data.ownerBankAccountName}</TText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Terms & conditions ── */}
        <TText style={s.termLabel}>เงื่อนไขและข้อตกลงร่วมกัน / TERMS &amp; CONDITIONS</TText>

        <View style={{ marginBottom: 6 }}>
          <TText style={s.clauseTitle}>1. กรณีผู้เช่ายกเลิก / If Tenant Cancels:</TText>
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
            2. กรณีเจ้าของห้องยกเลิกหรือห้องไม่พร้อม / If Owner Cancels or Room Not Ready:
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
          คู่สัญญารับทราบและยินยอมผูกพันตามเงื่อนไขข้างต้น / All parties have read and agreed to these terms.
        </TText>

        {data.signedAtText && (
          <TText style={{ fontSize: 7, color: GRAY, marginTop: 3 }}>
            {`เจ้าของลงนามออนไลน์เมื่อ / Owner e-signed on: ${data.signedAtText}`}
          </TText>
        )}

        {/* ── Evidence: ID cards + transfer slip — always starts on a fresh
            page so it never collides with the fixed signature footer ── */}
        {hasEvidence && (
          <View style={s.evidenceSection} break>
            <View style={s.refHeader}>
              <TText style={s.refHeaderText}>เอกสารอ้างอิง / REFERENCE DOCUMENTS</TText>
            </View>

            {(data.ownerIdCardImage || data.tenantIdCardImage) && (
              <>
                <TText style={s.evidenceSectionTitle}>
                  สำเนาบัตรประชาชน / ID CARD — สำหรับยืนยันตัวตน / IDENTITY VERIFICATION
                </TText>
                <View style={s.idRow}>
                  <View style={s.idBlock}>
                    <TText style={s.idLabel}>{`เจ้าของ / Owner\n${data.ownerName || ""}`}</TText>
                    {data.ownerIdCardImage ? (
                      <Image src={data.ownerIdCardImage} style={s.idImage} />
                    ) : (
                      <View style={s.idPlaceholder}>
                        <TText style={{ fontSize: 8, color: GRAY }}>ไม่มีรูปถ่าย</TText>
                      </View>
                    )}
                  </View>
                  <View style={s.idBlock}>
                    <TText style={s.idLabel}>{`ผู้เช่า / Tenant\n${data.tenantName || ""}`}</TText>
                    {data.tenantIdCardImage ? (
                      <Image src={data.tenantIdCardImage} style={s.idImage} />
                    ) : (
                      <View style={s.idPlaceholder}>
                        <TText style={{ fontSize: 8, color: GRAY }}>ไม่มีรูปถ่าย</TText>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}

            {data.transferSlipImage && (
              <>
                <View style={s.evidenceDivider} />
                <TText style={s.evidenceSectionTitle}>หลักฐานการโอนเงินมัดจำ / TRANSFER SLIP</TText>
                <View style={s.slipRow}>
                  <View style={s.slipBlock}>
                    <TText style={s.slipLabel}>{`จำนวน ${fmtMoney(data.depositAmount)} บาท / THB\n${data.date}`}</TText>
                    <Image src={data.transferSlipImage} style={s.slipImage} />
                  </View>
                </View>
              </>
            )}
          </View>
        )}

        {/* ── Fixed signature footer — 4 columns, every page ── */}
        <View fixed style={s.sigFooter}>
          <View style={s.sigSeparator} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              {
                role: "เจ้าของ / Owner",
                name: data.ownerName,
                signature: data.ownerSignature,
              },
              { role: "ผู้เช่า / Tenant", name: data.tenantName, signature: null },
              {
                role: "ผู้ออกเอกสาร / Issuer",
                name: data.issuerName,
                signature: null,
              },
              { role: "พยาน / Witness", name: data.witnessName, signature: null },
            ].map(({ role, name, signature }) => (
              <View key={role} style={s.sigCol}>
                {signature ? (
                  <Image src={signature} style={s.sigSignatureImg} />
                ) : (
                  <View style={s.sigLine} />
                )}
                <TText style={{ fontSize: 7.5, textAlign: "center", fontWeight: "bold" }}>
                  ลงชื่อ / Signature
                </TText>
                <TText style={{ fontSize: 7, textAlign: "center", color: GRAY }}>
                  {`${role}\n(${name || "……………………"})`}
                </TText>
              </View>
            ))}
          </View>
          <TText style={{ fontSize: 6.5, color: GRAY, textAlign: "center", marginTop: 5 }}>
            {`${data.companyName || "Amber Real Estate"}  |  ใบจอง / Booking Form  |  ${data.docNumber}`}
          </TText>
        </View>
      </Page>
    </Document>
  );
}
