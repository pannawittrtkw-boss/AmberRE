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

  // Company — issuer/witness identity only, no logo
  companyName?: string | null;
  companyAddress?: string | null;
  companyTaxId?: string | null;
  companyPhone?: string | null;

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

const GOLD = "#C8A951";
const BLACK = "#1A1A1A";
const GRAY = "#777777";
const LIGHT = "#F8F8F8";
const BORDER = "#E2E2E2";

const s = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 10,
    paddingTop: 34,
    paddingBottom: 88,
    paddingHorizontal: 44,
    lineHeight: 1.35,
    color: BLACK,
  },
  // ── Header: small company block (issuer identity, no logo) | Title + meta ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 7,
    marginBottom: 9,
  },
  companyBlock: { maxWidth: 260 },
  companyName: { fontSize: 9.5, fontWeight: "bold", marginBottom: 1.5 },
  companyText: { fontSize: 7, color: GRAY, lineHeight: 1.4 },
  titleBlock: { alignItems: "flex-end" },
  titleTh: { fontSize: 15, fontWeight: "bold", textAlign: "right" },
  titleEn: { fontSize: 9, color: GRAY, textAlign: "right", marginTop: 1, letterSpacing: 0.5 },
  metaRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  metaLabel: { fontSize: 7, color: GRAY },
  metaVal: { fontSize: 9, fontWeight: "bold" },
  // ── Party box (owner / tenant) — side by side ──
  partyRow: { flexDirection: "row", gap: 8, marginBottom: 7 },
  partyBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    backgroundColor: LIGHT,
    padding: 7,
  },
  partyLabel: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: GOLD,
    letterSpacing: 0.4,
    marginBottom: 2.5,
  },
  partyName: { fontSize: 10, fontWeight: "bold", marginBottom: 1.5 },
  partyText: { fontSize: 7.5, color: "#444", lineHeight: 1.35 },
  // ── Property block ──
  propertyBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 7,
  },
  propertyLabel: { fontSize: 6.5, fontWeight: "bold", color: GRAY, letterSpacing: 0.4, marginBottom: 1.5 },
  propertyName: { fontSize: 10, fontWeight: "bold", marginBottom: 1 },
  propertyText: { fontSize: 7.5, color: "#444", lineHeight: 1.3 },
  // ── Amount box ──
  amountBox: {
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 7,
    backgroundColor: "#FFFCF0",
  },
  amountLabelTh: { fontSize: 8.5, color: BLACK, fontWeight: "bold", width: 115 },
  amountLabelEn: { fontSize: 7, color: GRAY, width: 115 },
  amountVal: { flex: 1, fontSize: 13, fontWeight: "bold", color: GOLD },
  amountWords: { fontSize: 7.5, color: GRAY, paddingLeft: 115, marginTop: 1 },
  // ── Field rows (deal terms) — 3 columns, combined bilingual label line ──
  fieldGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 7 },
  fieldCol: { width: "33.33%", marginBottom: 5, paddingRight: 6 },
  fieldLabel: { fontSize: 6.5, color: GRAY, marginBottom: 1.5 },
  fieldVal: {
    fontSize: 8.5,
    fontWeight: "bold",
    borderBottomWidth: 0.5,
    borderBottomColor: "#BBBBBB",
    paddingBottom: 1.5,
  },
  // ── Bank box — compact single row ──
  bankBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 7,
  },
  bankLabel: { fontSize: 6.5, fontWeight: "bold", color: GRAY, letterSpacing: 0.3, marginBottom: 3 },
  bankRow: { flexDirection: "row", gap: 14 },
  bankItem: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  bankKey: { fontSize: 7, color: GRAY },
  bankVal: { fontSize: 8.5, fontWeight: "bold" },
  // ── Terms ──
  termBar: {
    backgroundColor: BLACK,
    color: "#FFFFFF",
    paddingVertical: 3.5,
    paddingHorizontal: 10,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 8.5,
    marginBottom: 5,
  },
  clauseTitle: { fontWeight: "bold", fontSize: 7.5, marginBottom: 1.5 },
  bullet: { fontSize: 7, marginLeft: 12, marginBottom: 1.5, lineHeight: 1.3 },
  agree: { fontSize: 7, marginTop: 4, lineHeight: 1.3, color: GRAY },
  // ── Evidence ──
  evidenceSection: { marginTop: 14 },
  refHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  refHeaderText: { fontSize: 9, fontWeight: "bold", color: BLACK },
  evidenceSectionTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: GRAY,
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 7,
  },
  evidenceDivider: { borderBottomWidth: 0.5, borderBottomColor: BORDER, marginTop: 10, marginBottom: 10 },
  idRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  idBlock: { flex: 1, alignItems: "center" },
  idLabel: { fontSize: 7.5, color: GRAY, marginBottom: 4, textAlign: "center", lineHeight: 1.4 },
  idImage: { width: "100%", height: 130, borderWidth: 0.5, borderColor: BORDER, borderRadius: 2, objectFit: "contain" },
  idPlaceholder: {
    width: "100%", height: 130, borderWidth: 0.5, borderColor: BORDER, borderStyle: "dashed",
    borderRadius: 2, backgroundColor: "#F9F9F9", alignItems: "center", justifyContent: "center",
  },
  slipRow: { flexDirection: "row", justifyContent: "center", marginTop: 2 },
  slipBlock: { width: 200, alignItems: "center" },
  slipLabel: { fontSize: 7.5, color: GRAY, marginBottom: 4, textAlign: "center", lineHeight: 1.4 },
  slipImage: { width: 200, height: 260, borderWidth: 0.5, borderColor: BORDER, borderRadius: 2, objectFit: "contain" },
  // ── Fixed signature footer — 4 columns: Owner | Tenant | Issuer | Witness ──
  sigFooter: { position: "absolute", bottom: 22, left: 44, right: 44 },
  sigCol: { flex: 1, alignItems: "center" },
  sigLine: { borderBottomWidth: 0.8, borderBottomColor: BLACK, width: "85%", height: 26, marginBottom: 3 },
  sigSignatureImg: { width: "85%", height: 26, objectFit: "contain", marginBottom: 3 },
});

function fmtMoney(n: number): string {
  return n.toLocaleString("th-TH");
}

function PartyBox({
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
    <View style={s.partyBox}>
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
        {/* ── Header: company (issuer identity only) | Title ── */}
        <View style={s.headerRow}>
          <View style={s.companyBlock}>
            <TText style={s.companyName}>
              {data.companyName || "บริษัท แอมเบอร์ เรียล เอสเตท จำกัด"}
            </TText>
            {data.companyAddress && <TText style={s.companyText}>{data.companyAddress}</TText>}
            {data.companyTaxId && (
              <TText style={s.companyText}>{`เลขประจำตัวผู้เสียภาษี / Tax ID: ${data.companyTaxId}`}</TText>
            )}
            {data.companyPhone && <TText style={s.companyText}>{`โทร / Tel: ${data.companyPhone}`}</TText>}
          </View>
          <View style={s.titleBlock}>
            <TText style={s.titleTh}>ใบจอง</TText>
            <TText style={s.titleEn}>BOOKING FORM</TText>
            <View style={s.metaRow}>
              <View>
                <TText style={s.metaLabel}>เลขที่ / No.</TText>
                <TText style={s.metaVal}>{data.docNumber}</TText>
              </View>
              <View>
                <TText style={s.metaLabel}>วันที่ / Date</TText>
                <TText style={s.metaVal}>{data.date}</TText>
              </View>
            </View>
          </View>
        </View>

        {/* ── Parties — side by side ── */}
        <View style={s.partyRow}>
          <PartyBox
            labelTh="เจ้าของทรัพย์สิน (ผู้รับเงิน)"
            labelEn="PROPERTY OWNER"
            name={data.ownerName}
            idCard={data.ownerIdCard}
            address={data.ownerAddress}
            phone={data.ownerPhone}
          />
          <PartyBox
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
          <View style={s.propertyBox}>
            <TText style={s.propertyLabel}>ทรัพย์สินที่จอง / PROPERTY BOOKED</TText>
            {unitLine && <TText style={s.propertyName}>{unitLine}</TText>}
            {data.propertyAddress && <TText style={s.propertyText}>{data.propertyAddress}</TText>}
          </View>
        )}

        {/* ── Deposit amount ── */}
        <View style={s.amountBox}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 115 }}>
              <TText style={s.amountLabelTh}>เป็นจำนวนเงิน</TText>
              <TText style={s.amountLabelEn}>Deposit Amount</TText>
            </View>
            <TText style={[s.amountVal, { marginRight: 8 }]}>
              {`${fmtMoney(data.depositAmount)}  บาท / THB`}
            </TText>
          </View>
          <TText style={s.amountWords}>{`(${data.depositAmountText})`}</TText>
        </View>

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
          <View style={s.bankBox}>
            <TText style={s.bankLabel}>
              บัญชีธนาคารเจ้าของ (สำหรับรับเงินมัดจำ) / Owner&apos;s Bank Account
            </TText>
            <View style={s.bankRow}>
              {data.ownerBankName && (
                <View style={s.bankItem}>
                  <TText style={s.bankKey}>ธนาคาร:</TText>
                  <TText style={s.bankVal}>{data.ownerBankName}</TText>
                </View>
              )}
              {data.ownerBankAccountNumber && (
                <View style={s.bankItem}>
                  <TText style={s.bankKey}>เลขที่บัญชี:</TText>
                  <TText style={s.bankVal}>{data.ownerBankAccountNumber}</TText>
                </View>
              )}
              {data.ownerBankAccountName && (
                <View style={s.bankItem}>
                  <TText style={s.bankKey}>ชื่อบัญชี:</TText>
                  <TText style={s.bankVal}>{data.ownerBankAccountName}</TText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Terms & conditions ── */}
        <TText style={s.termBar}>เงื่อนไขและข้อตกลงร่วมกัน / Terms &amp; Conditions</TText>

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

        {/* ── Evidence: ID cards + transfer slip ── */}
        {hasEvidence && (
          <View style={s.evidenceSection}>
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
