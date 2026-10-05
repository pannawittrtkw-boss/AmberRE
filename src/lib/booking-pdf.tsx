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
    paddingTop: 40,
    paddingBottom: 92,
    paddingHorizontal: 50,
    lineHeight: 1.6,
    color: BLACK,
  },
  // ── Header: small company block (issuer identity, no logo) | Title ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 10,
    marginBottom: 16,
  },
  companyBlock: { maxWidth: 260 },
  companyName: { fontSize: 10, fontWeight: "bold", marginBottom: 2 },
  companyText: { fontSize: 7.5, color: GRAY, lineHeight: 1.5 },
  titleBlock: { alignItems: "flex-end" },
  titleTh: { fontSize: 17, fontWeight: "bold", textAlign: "right" },
  titleEn: { fontSize: 10.5, color: GRAY, textAlign: "right", marginTop: 2, letterSpacing: 0.5 },
  titleSub: { fontSize: 8, color: GRAY, textAlign: "right", marginTop: 4 },
  // ── Meta row (No / Date) ──
  metaRow: { flexDirection: "row", justifyContent: "flex-end", gap: 18, marginBottom: 14 },
  metaItem: { alignItems: "flex-end" },
  metaLabel: { fontSize: 8, color: GRAY },
  metaVal: { fontSize: 10, fontWeight: "bold" },
  // ── Party box (owner / tenant) ──
  partyBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    backgroundColor: LIGHT,
    padding: 10,
    marginBottom: 10,
  },
  partyLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: GOLD,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  partyName: { fontSize: 11, fontWeight: "bold", marginBottom: 2 },
  partyText: { fontSize: 8.5, color: "#444", lineHeight: 1.55 },
  // ── Property block ──
  propertyBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  propertyLabel: { fontSize: 7.5, fontWeight: "bold", color: GRAY, letterSpacing: 0.6, marginBottom: 3 },
  propertyName: { fontSize: 11, fontWeight: "bold", marginBottom: 2 },
  propertyText: { fontSize: 8.5, color: "#444", lineHeight: 1.5 },
  // ── Amount box ──
  amountBox: {
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "#FFFCF0",
  },
  amountLabelTh: { fontSize: 9, color: BLACK, fontWeight: "bold", width: 130 },
  amountLabelEn: { fontSize: 8, color: GRAY, width: 130 },
  amountVal: { flex: 1, fontSize: 14, fontWeight: "bold", color: GOLD },
  amountWords: { fontSize: 8.5, color: GRAY, paddingLeft: 130, marginTop: 3 },
  // ── Field rows (deal terms) ──
  fieldGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  fieldCol: { width: "50%", marginBottom: 8, paddingRight: 8 },
  fieldLabelTh: { fontSize: 8.5, color: GRAY, fontWeight: "bold" },
  fieldLabelEn: { fontSize: 7.5, color: GRAY, marginBottom: 2 },
  fieldVal: {
    fontSize: 9.5,
    fontWeight: "bold",
    borderBottomWidth: 0.5,
    borderBottomColor: "#BBBBBB",
    paddingBottom: 2,
  },
  // ── Bank box ──
  bankBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  bankLabel: { fontSize: 8, fontWeight: "bold", color: BLACK, marginBottom: 6 },
  bankRow: { flexDirection: "row", marginBottom: 3 },
  bankKey: { fontSize: 8, color: GRAY, width: 110 },
  bankVal: { flex: 1, fontSize: 9, fontWeight: "bold" },
  // ── Terms ──
  termBar: {
    backgroundColor: BLACK,
    color: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 10,
    marginBottom: 8,
  },
  termIntro: { fontSize: 8.5, marginBottom: 8, lineHeight: 1.6, color: GRAY },
  clauseTitle: { fontWeight: "bold", fontSize: 9, marginBottom: 4 },
  bullet: { fontSize: 8.5, marginLeft: 14, marginBottom: 4, lineHeight: 1.6 },
  agree: { fontSize: 8.5, marginTop: 6, marginBottom: 2, lineHeight: 1.6 },
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
  sigFooter: { position: "absolute", bottom: 24, left: 50, right: 50 },
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
      <TText style={s.fieldLabelTh}>{labelTh}</TText>
      <TText style={s.fieldLabelEn}>{labelEn}</TText>
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
            <TText style={s.titleSub}>ต้นฉบับ / Original</TText>
          </View>
        </View>

        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <TText style={s.metaLabel}>เลขที่ / No.</TText>
            <TText style={s.metaVal}>{data.docNumber}</TText>
          </View>
          <View style={s.metaItem}>
            <TText style={s.metaLabel}>วันที่ / Date</TText>
            <TText style={s.metaVal}>{data.date}</TText>
          </View>
        </View>

        {/* ── Parties ── */}
        <PartyBox
          labelTh="เจ้าของทรัพย์สิน (ผู้รับเงิน)"
          labelEn="PROPERTY OWNER (Receiver)"
          name={data.ownerName}
          idCard={data.ownerIdCard}
          address={data.ownerAddress}
          phone={data.ownerPhone}
        />
        <PartyBox
          labelTh="ผู้เช่า (ผู้จ่ายเงิน)"
          labelEn="TENANT (Payer)"
          name={data.tenantName}
          idCard={data.tenantIdCard}
          address={data.tenantAddress}
          phone={data.tenantPhone}
        />

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
            <View style={{ width: 130 }}>
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
            <FieldCol labelTh="วันที่นัดทำสัญญา" labelEn="Contract Appointment Date" value={data.appointmentDate} />
          )}
          {data.moveInDate && (
            <FieldCol labelTh="วันที่เข้าอยู่โดยประมาณ" labelEn="Est. Move-in Date" value={data.moveInDate} />
          )}
          {data.monthlyRent != null && (
            <FieldCol
              labelTh="ค่าเช่าต่อเดือน"
              labelEn="Monthly Rent"
              value={`${fmtMoney(data.monthlyRent)} บาท / เดือน`}
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
            {data.ownerBankName && (
              <View style={s.bankRow}>
                <TText style={s.bankKey}>ธนาคาร / Bank</TText>
                <TText style={s.bankVal}>{data.ownerBankName}</TText>
              </View>
            )}
            {data.ownerBankAccountNumber && (
              <View style={s.bankRow}>
                <TText style={s.bankKey}>เลขที่บัญชี / Account No.</TText>
                <TText style={s.bankVal}>{data.ownerBankAccountNumber}</TText>
              </View>
            )}
            {data.ownerBankAccountName && (
              <View style={s.bankRow}>
                <TText style={s.bankKey}>ชื่อบัญชี / Account Name</TText>
                <TText style={s.bankVal}>{data.ownerBankAccountName}</TText>
              </View>
            )}
          </View>
        )}

        {/* ── Terms & conditions ── */}
        <TText style={s.termBar}>เงื่อนไขและข้อตกลงร่วมกัน / Terms &amp; Conditions</TText>
        <TText style={s.termIntro}>
          {
            "เพื่อความเป็นธรรมและความมั่นใจของทุกฝ่าย คู่สัญญาตกลงปฏิบัติตามเงื่อนไขดังนี้:\nFor fairness and mutual commitment, all parties agree to the following terms:"
          }
        </TText>

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
          <TText style={{ fontSize: 8, color: GRAY, marginTop: 6 }}>
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
