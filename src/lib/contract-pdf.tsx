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
import { segmentForHyphenation } from "./thai-segment";

// Register Sarabun (Thai + Latin) font from Google's GitHub mirror via
// jsDelivr. The @main suffix is required — without it the CDN returns 404.
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

// Tell @react-pdf/renderer how to break Thai "words" into wrappable
// fragments. Without this, Thai paragraphs (which have no inter-word
// spaces) get cut at arbitrary character boundaries — orphaning the
// last character on a new line. With Intl.Segmenter we hand the engine
// real Thai word boundaries from CLDR data.
Font.registerHyphenationCallback(segmentForHyphenation);

const styles = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 10,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 50,
    lineHeight: 1.45,
  },
  header: { textAlign: "center", marginBottom: 14 },
  title: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  subtitle: { fontSize: 13, fontWeight: "bold" },
  sectionBar: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 4,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  paragraph: { marginBottom: 4 },
  small: { fontSize: 9, color: "#444" },
  row: { flexDirection: "row", marginBottom: 3 },
  // Fixed-width label column needs to fit the longest Thai label
  // "สัญญาฉบับนี้ทำขึ้นวันที่" (~22 Thai chars) at 10pt without clipping
  label: { width: 170 },
  value: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#666",
    paddingBottom: 1,
    fontWeight: "bold",
  },
  boldHL: { fontWeight: "bold" },
  twoCol: { flexDirection: "row", gap: 30, marginTop: 30 },
  signatureBlock: { flex: 1, alignItems: "center" },
  signatureLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#000",
    width: "80%",
    height: 30,
    marginBottom: 4,
  },
  bullet: { marginLeft: 10, marginBottom: 3 },
  subBullet: { marginLeft: 24, marginBottom: 3 },
  bankBox: {
    marginLeft: 16,
    marginTop: 4,
    marginBottom: 6,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#C8A951",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: 10,
    marginBottom: 3,
  },
  checkBox: {
    width: 10,
    height: 10,
    borderWidth: 0.8,
    borderColor: "#000",
    marginRight: 5,
    marginTop: 2,
    padding: 1.5,
  },
  checkInner: {
    flex: 1,
    backgroundColor: "#000",
  },
  checkText: { flex: 1 },
  appendixWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  appendixImage: {
    maxWidth: "85%",
    maxHeight: 380,
    objectFit: "contain",
    marginBottom: 24,
  },
  appendixCaption: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 6,
  },
  appendixSubCaption: {
    textAlign: "center",
  },
});

interface IdAppendixProps {
  imageUrl: string;
  roleTh: string;
  roleEn: string;
  name: string;
  projectName: string;
  unitNumber: string;
  isLessor: boolean;
}

function IdAppendix({
  imageUrl,
  roleTh,
  roleEn,
  name,
  projectName,
  unitNumber,
  isLessor,
}: IdAppendixProps) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.appendixWrap}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={imageUrl} style={styles.appendixImage} />
        <Text style={styles.appendixCaption}>
          {roleTh} / {roleEn}    {name}
        </Text>
        <Text style={styles.appendixSubCaption}>
          {isLessor ? "ใช้สำหรับปล่อยเช่าคอนโด" : "ใช้สำหรับเช่าคอนโด"}{" "}
          {projectName} ห้อง {unitNumber} เท่านั้น
        </Text>
      </View>
    </Page>
  );
}

function ChecklistRow({ item, num }: { item: PdfChecklistItem; num: number }) {
  return (
    <View style={styles.checkRow} wrap={false}>
      <View style={styles.checkBox}>
        {item.checked && <View style={styles.checkInner} />}
      </View>
      <Text style={styles.checkText}>
        {num}) {item.th} ({item.en})
        {item.checked && item.qty ? ` × ${item.qty}` : ""}
      </Text>
    </View>
  );
}

export interface PdfChecklistItem {
  th: string;
  en: string;
  checked: boolean;
  qty?: number;
}

export interface ContractPdfData {
  contractNumber: string;
  contractDateTh: string;
  contractDateEn: string;
  startDateTh: string;
  startDateEn: string;
  endDateTh: string;
  endDateEn: string;
  termMonths: number;

  lessorName: string;
  lessorNationality?: string | null;
  lessorIdCard?: string | null;
  lessorAddress?: string | null;
  lessorPhone?: string | null;

  lesseeName: string;
  lesseeNationality?: string | null;
  lesseeIdCard?: string | null;
  lesseeAddress?: string | null;
  lesseePhone?: string | null;

  jointLesseeName?: string | null;
  jointLesseeNationality?: string | null;
  jointLesseeIdCard?: string | null;
  jointLesseeAddress?: string | null;
  jointLesseePhone?: string | null;

  projectName: string;
  unitNumber: string;
  buildingName?: string | null;
  floorNumber?: string | null;
  propertyAddress: string;
  sizeSqm?: number | null;

  monthlyRent: number;
  monthlyRentText: string;
  paymentDay: number;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  latePaymentFee: number;
  latePaymentFeeText: string;

  securityDeposit: number;
  securityDepositText: string;

  furnitureList: PdfChecklistItem[];
  applianceList: PdfChecklistItem[];
  otherItems: PdfChecklistItem[];

  lessorIdImage?: string | null;
  lesseeIdImage?: string | null;
  jointLesseeIdImage?: string | null;
}

const formatNum = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(n);

const D = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.boldHL}>{children}</Text>
);

const Bullet = ({ children, sub }: { children: React.ReactNode; sub?: boolean }) => (
  <Text style={[styles.paragraph, sub ? styles.subBullet : styles.bullet]}>
    {children}
  </Text>
);

export function ContractPdf({ data }: { data: ContractPdfData }) {
  return (
    <Document>
      {/* Main agreement — single Page; react-pdf wraps content automatically */}
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.title}>สัญญาเช่า / Agreement</Text>
          <Text style={styles.subtitle}>{data.projectName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>สัญญาฉบับนี้ทำขึ้นวันที่</Text>
          <Text style={styles.value}><D>{data.contractDateTh}</D></Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Agreement is made on</Text>
          <Text style={styles.value}><D>{data.contractDateEn}</D></Text>
        </View>

        {/* Lessor */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <Text style={styles.label}>ผู้ให้เช่า / Lessor</Text>
          <Text style={styles.value}><D>{data.lessorName}</D></Text>
        </View>
        {data.lessorNationality && (
          <View style={styles.row}>
            <Text style={styles.label}>สัญชาติ / Nationality</Text>
            <Text style={styles.value}>{data.lessorNationality}</Text>
          </View>
        )}
        {data.lessorIdCard && (
          <View style={styles.row}>
            <Text style={styles.label}>หมายเลข ID</Text>
            <Text style={styles.value}><D>{data.lessorIdCard}</D></Text>
          </View>
        )}
        {data.lessorAddress && (
          <View style={styles.row}>
            <Text style={styles.label}>ที่อยู่ / Address</Text>
            <Text style={styles.value}>{data.lessorAddress}</Text>
          </View>
        )}
        {data.lessorPhone && (
          <View style={styles.row}>
            <Text style={styles.label}>โทรศัพท์ / Tel</Text>
            <Text style={styles.value}>{data.lessorPhone}</Text>
          </View>
        )}

        {/* Lessee */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <Text style={styles.label}>ผู้เช่า / Lessee</Text>
          <Text style={styles.value}><D>{data.lesseeName}</D></Text>
        </View>
        {data.lesseeNationality && (
          <View style={styles.row}>
            <Text style={styles.label}>สัญชาติ / Nationality</Text>
            <Text style={styles.value}>{data.lesseeNationality}</Text>
          </View>
        )}
        {data.lesseeIdCard && (
          <View style={styles.row}>
            <Text style={styles.label}>ID/Passport No.</Text>
            <Text style={styles.value}><D>{data.lesseeIdCard}</D></Text>
          </View>
        )}
        {data.lesseeAddress && (
          <View style={styles.row}>
            <Text style={styles.label}>ที่อยู่ / Address</Text>
            <Text style={styles.value}>{data.lesseeAddress}</Text>
          </View>
        )}
        {data.lesseePhone && (
          <View style={styles.row}>
            <Text style={styles.label}>โทรศัพท์ / Tel</Text>
            <Text style={styles.value}>{data.lesseePhone}</Text>
          </View>
        )}

        {/* Property description */}
        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          โดยผู้ให้เช่าเป็นเจ้าของ <D>{data.projectName}</D> ห้องชุดเลขที่{" "}
          <D>{data.unitNumber}</D>
          {data.buildingName ? <>{" "}อาคาร <D>{data.buildingName}</D></> : null}
          {data.floorNumber ? <>{" "}ชั้น <D>{data.floorNumber}</D></> : null}
          {" "}ที่ตั้ง <D>{data.propertyAddress}</D>
          {data.sizeSqm != null ? <>{" "}ขนาดห้อง <D>{data.sizeSqm}</D> ตารางเมตร</> : null}
          {" "}ซึ่งรวมถึงอุปกรณ์ตกแต่งและเฟอร์นิเจอร์ ซึ่งต่อไปนี้เรียกว่า "ทรัพย์สิน"
        </Text>

        <Text style={styles.paragraph}>
          Whereas, Lessor is the owner of <D>{data.projectName}</D>, Unit number{" "}
          <D>{data.unitNumber}</D>
          {data.buildingName ? <>, Building <D>{data.buildingName}</D></> : null}
          {data.floorNumber ? <>, Floor <D>{data.floorNumber}</D></> : null},
          located at <D>{data.propertyAddress}</D>
          {data.sizeSqm != null ? <>, approximate area <D>{data.sizeSqm}</D> sqm.</> : null}{" "}
          and all premises including all fixtures and fittings hereinafter
          referred to as the "Premises".
        </Text>

        {/* Lessor desires + Lessee agrees */}
        <Text style={styles.paragraph}>
          ซึ่งผู้ให้เช่าต้องการให้เช่าและผู้เช่าตกลงจะเช่าทรัพย์สิน
          โดยทั้ง 2 ฝ่ายตกลงกันตามเงื่อนไขที่ระบุในสัญญานี้ดังต่อไปนี้
        </Text>
        <Text style={styles.paragraph}>
          Whereas the Lessor desires to let and the Lessee desires to rent the
          Premises under the terms and conditions set forth in this Agreement as
          follows:
        </Text>

        {/* Joint Lessee */}
        {data.jointLesseeName && (
          <>
            <View style={styles.sectionBar} wrap={false}>
              <Text>1. ผู้เช่าร่วม / Joint Lessee</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>ชื่อ / Name</Text>
              <Text style={styles.value}><D>{data.jointLesseeName}</D></Text>
            </View>
            {data.jointLesseeNationality && (
              <View style={styles.row}>
                <Text style={styles.label}>สัญชาติ / Nationality</Text>
                <Text style={styles.value}>{data.jointLesseeNationality}</Text>
              </View>
            )}
            {data.jointLesseeIdCard && (
              <View style={styles.row}>
                <Text style={styles.label}>ID/Passport No.</Text>
                <Text style={styles.value}>{data.jointLesseeIdCard}</Text>
              </View>
            )}
            {data.jointLesseeAddress && (
              <View style={styles.row}>
                <Text style={styles.label}>ที่อยู่ / Address</Text>
                <Text style={styles.value}>{data.jointLesseeAddress}</Text>
              </View>
            )}
            {data.jointLesseePhone && (
              <View style={styles.row}>
                <Text style={styles.label}>โทรศัพท์ / Tel</Text>
                <Text style={styles.value}>{data.jointLesseePhone}</Text>
              </View>
            )}
          </>
        )}

        {/* Section 2: Lease Term */}
        <View style={styles.sectionBar} wrap={false}>
          <Text>2. ระยะเวลาเช่า / LEASE TERM</Text>
        </View>
        <Text style={styles.paragraph}>
          ระยะเวลาเช่ากำหนดไว้เป็นเวลา <D>{data.termMonths}</D> เดือน
          โดยเริ่มสัญญาวันที่ <D>{data.startDateTh}</D>
        </Text>
        <Text style={styles.paragraph}>
          สิ้นสุดวันที่ <D>{data.endDateTh}</D>
        </Text>
        <Text style={styles.paragraph}>
          The term of this Agreement shall be for a period of <D>{data.termMonths}</D>{" "}
          months, commencing from <D>{data.startDateEn}</D>
        </Text>
        <Text style={styles.paragraph}>
          and expiring on <D>{data.endDateEn}</D>.
        </Text>

        {/* Section 3: Rental */}
        <View style={styles.sectionBar} wrap={false}>
          <Text>3. ค่าเช่าและค่าส่วนกลาง / RENTAL AND COMMON PROPERTIES FEES</Text>
        </View>
        <Text style={styles.paragraph}>
          3.1 ค่าเช่าคิดเป็นจำนวนเงินเดือนละ <D>{formatNum(data.monthlyRent)}</D> บาท{" "}
          <D>({data.monthlyRentText})</D> และชำระล่วงหน้าหรือไม่เกินวันที่{" "}
          <D>{data.paymentDay}</D> ของทุกเดือน ชำระโดยโอนเงินเข้าบัญชีธนาคารผู้ให้เช่า
          ตามรายละเอียดดังนี้:
        </Text>
        <Text style={styles.paragraph}>
          3.1 The rent shall be <D>{formatNum(data.monthlyRent)}</D> Baht per
          month and shall be paid in advance or within day{" "}
          <D>{data.paymentDay}</D> of each calendar month by wiring such money
          to the lessor's bank account as follows:
        </Text>

        {(data.bankName ||
          data.bankBranch ||
          data.bankAccountName ||
          data.bankAccountNumber) && (
          <View style={styles.bankBox}>
            {data.bankName && (
              <View style={styles.row}>
                <Text style={styles.label}>ธนาคาร / Bank</Text>
                <Text style={styles.value}>{data.bankName}</Text>
              </View>
            )}
            {data.bankBranch && (
              <View style={styles.row}>
                <Text style={styles.label}>สาขา / Branch</Text>
                <Text style={styles.value}>{data.bankBranch}</Text>
              </View>
            )}
            {data.bankAccountName && (
              <View style={styles.row}>
                <Text style={styles.label}>ชื่อบัญชี / Account Name</Text>
                <Text style={styles.value}>{data.bankAccountName}</Text>
              </View>
            )}
            {data.bankAccountNumber && (
              <View style={styles.row}>
                <Text style={styles.label}>เลขที่บัญชี / Acc. No.</Text>
                <Text style={styles.value}><D>{data.bankAccountNumber}</D></Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.paragraph}>
          3.2 ผู้เช่าได้ชำระค่าเช่าสำหรับเดือนแรกของสัญญาเรียบร้อยแล้วในวันทำสัญญาฉบับนี้ /
          The first payment of the rent is paid on the execution of this
          Agreement.
        </Text>
        <Text style={styles.paragraph}>
          3.3 ผู้ให้เช่าเป็นผู้ชำระค่าส่วนกลางที่เรียกเก็บโดยนิติบุคคลของโครงการคอนโด /
          The lessor pays the common fees collected by the project's juristic
          person.
        </Text>
        <Text style={styles.paragraph}>
          3.4 กรณีผู้เช่าชำระค่าเช่าเกินกำหนด ผู้ให้เช่ามีสิทธิ์เรียกค่าเบี้ยปรับเป็นเงินวันละ{" "}
          <D>{formatNum(data.latePaymentFee)}</D> บาท ({data.latePaymentFeeText})
          โดยผู้เช่าต้องชำระพร้อมค่าเช่าที่ติดค้างให้แก่ผู้ให้เช่า /
          If Lessee delays the rental payment, Lessee will be charged at{" "}
          <D>{formatNum(data.latePaymentFee)}</D> Baht per day overdue, payable
          together with the outstanding rent.
        </Text>
        <Text style={styles.paragraph}>
          3.5 หลังจากโอนเงินค่าเช่ารายเดือนแล้ว กรุณาส่งข้อความให้ผู้ให้เช่ารับทราบด้วย /
          After transferring the monthly rent, please notify the lessor.
        </Text>

        {/* Section 4: Security Deposit — pin header to 4.1 to prevent split */}
        <View wrap={false}>
          <View style={styles.sectionBar}>
            <Text>4. เงินประกันสัญญา / SECURITY DEPOSIT</Text>
          </View>
          <Text style={styles.paragraph}>
            4.1 ในวันที่ลงนามในสัญญาฉบับนี้ ผู้เช่าได้ชำระเงินประกันให้แก่ผู้ให้เช่าเป็นจำนวน{" "}
            <D>{formatNum(data.securityDeposit)}</D> บาท ({data.securityDepositText})
            ซึ่งต่อไปนี้เรียกว่า "เงินประกันสัญญา" ซึ่งเงินจำนวนดังกล่าวผู้ให้เช่าจะเก็บไว้ตลอด
            อายุของสัญญาโดยไม่มีดอกเบี้ยใดๆ
            เพื่อเป็นประกันความเสียหายที่อาจเกิดขึ้นในกรณีที่ผู้เช่าละเมิดข้อตกลงที่ระบุไว้ในสัญญาฉบับนี้
          </Text>
        </View>
        <Text style={styles.paragraph}>
          4.1 Upon the execution of this Agreement, the Lessee deposits with
          the Lessor <D>{formatNum(data.securityDeposit)}</D> Baht as Security
          Deposit, held by the Lessor without interest as security for breaches
          and damages that may occur if the Lessee breaches this Agreement.
        </Text>
        <Text style={styles.paragraph}>
          4.2 ผู้ให้เช่าจะชำระคืนเงินประกันสัญญาให้แก่ผู้เช่าโดยไม่มีดอกเบี้ย ภายใน 30 วัน
          นับจากวันสิ้นสุดสัญญา หลังจากได้หักหนี้ค่าเช่าค้างชำระ ค่าเสียหาย
          หรือค่าความสูญเสียใดๆ ที่เกิดแก่ผู้ให้เช่าอันเนื่องมาจากผู้เช่าผิดสัญญา /
          The Security Deposit shall be returned to the Lessee without interest
          within 30 days upon termination after deduction of any outstanding
          rent, damages, or losses caused by the Lessee's breach.
        </Text>
        <Text style={styles.paragraph}>
          4.3 ผู้ให้เช่าได้รับเงินประกันสัญญาจากผู้เช่าไว้แล้วในที่นี้ /
          The Lessor hereby acknowledges receipt of the Security Deposit.
        </Text>
        <Text style={styles.paragraph}>
          4.4 เงินประกันสัญญาไม่สามารถนำมาชำระแทนค่าเช่า
          หรือถือว่าเป็นค่าเช่าล่วงหน้า
          และผู้เช่าไม่สามารถนำมาเป็นข้ออ้างในการไม่ชำระค่าเช่าตามสัญญานี้ได้ /
          The Security Deposit shall not be considered as rent or prepayment
          of any rent, nor used as an excuse to withhold rent.
        </Text>
        <Text style={styles.paragraph}>
          4.5 สัญญาฉบับนี้จะสมบูรณ์ต่อเมื่อผู้ให้เช่าได้รับเงินค่าเช่าเดือนแรกตามข้อ 3.2
          และเงินประกันสัญญาตามข้อ 4.1 จากผู้เช่าอย่างครบถ้วนเรียบร้อยแล้ว /
          This Agreement shall be legally valid only when the Lessor has
          received the first month's rent (Clause 3.2) and the Security Deposit
          (Clause 4.1) in full.
        </Text>
        <Text style={styles.paragraph}>
          4.6 กรณีผู้เช่าอยู่ไม่ครบอายุสัญญาเช่าตามกำหนด ทางผู้ให้เช่าขอสงวนสิทธิ์ในการคืนเงินประกัน
          สัญญาให้แก่ผู้เช่า /
          If the Lessee does not complete the lease term, the Lessor reserves
          the right to forfeit the Security Deposit.
        </Text>

        {/* Section 5: Lessee covenants */}
        <View style={styles.sectionBar} wrap={false}>
          <Text>5. ข้อตกลงของผู้เช่า / LESSEE'S COVENANTS</Text>
        </View>
        <Bullet>5.1 ชำระค่าเช่าและเงินอื่นๆ ตามที่ระบุไว้ในสัญญานี้อย่างครบถ้วนตามเวลาที่ระบุไว้ตลอดอายุสัญญา / To punctually pay the rents and other sums during the entire lease term.</Bullet>
        <Bullet>5.2 ปฏิบัติตามข้อตกลงในสัญญาฉบับนี้และข้อกำหนดของนิติบุคคลของโครงการอย่างเคร่งครัด / Strictly comply with this Agreement and the Juristic Person's rules.</Bullet>
        <Bullet>5.3 ใช้ทรัพย์สินเพื่อการอยู่อาศัยเท่านั้น ห้ามเจาะ ตอก ติด ตรึง สิ่งของใดกับผนังห้อง หากละเมิดปรับจุดละ 1,000 บาท / Residential use only. No drilling, nailing, or attaching items to walls. Fine: 1,000 THB per violation.</Bullet>
        <Bullet>5.4 ดูแลและบำรุงรักษาเครื่องใช้ไฟฟ้าและทรัพย์สินทุกชนิดด้วยค่าใช้จ่ายของผู้เช่าเอง โดยรับผิดชอบงานเล็กน้อย (ค่าใช้จ่ายไม่เกิน 600 บาท/เดือน) เช่น เปลี่ยนหลอดไฟ ทำความสะอาดทั่วไป / Tenant is responsible for minor repairs not exceeding 600 THB/month (e.g., light bulbs, general cleaning).</Bullet>
        <Bullet>5.5 ชำระค่าสาธารณูปโภค ไฟฟ้า น้ำประปา โทรศัพท์ อินเตอร์เน็ต และค่าสาธารณูปโภคอื่นๆ ตลอดอายุสัญญา หากละเลยถือเป็นการผิดสัญญา / Pay all utilities (electricity, water, telephone, internet) on time. Failure to do so is a breach.</Bullet>
        <Bullet>5.6 ไม่ต่อเติม ดัดแปลง หรือเปลี่ยนแปลงทรัพย์สินโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร และต้องคืนสภาพเดิมหากผู้ให้เช่าเรียกร้อง / No modifications without prior written consent; restore on Lessor's request.</Bullet>
        <Bullet>5.7 สิ่งที่ต่อเติมยึดติดกับทรัพย์สินถือเป็นกรรมสิทธิ์ของผู้ให้เช่าเมื่อสัญญาสิ้นสุด / Fixtures become Lessor's property upon expiration.</Bullet>
        <Bullet>5.8 ไม่ใช้ทรัพย์สินเพื่อวัตถุประสงค์ที่ผิดศีลธรรมหรือผิดกฎหมาย / No illegal or immoral activities.</Bullet>
        <Bullet>5.9 ไม่ปล่อยเช่าช่วงทรัพย์สินหรือถ่ายโอนสิทธิตามสัญญานี้ให้ผู้อื่นโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร / No subletting or assignment without prior written consent.</Bullet>
        <Bullet>5.10 ไม่กระทำการอันใดที่ก่อให้เกิดความรำคาญหรือล่วงละเมิดผู้เช่าอื่นในอาคารและผู้พักอาศัยใกล้เคียง / No nuisance or interference with neighbors.</Bullet>
        <Bullet>5.11 แจ้งความเสียหายหรือความบกพร่องที่เกิดกับทรัพย์สินภายใน 7 วันนับจากวันที่พบ / Notify Lessor of damages within 7 days of occurrence.</Bullet>
        <Bullet>5.12 รับผิดชอบความเสียหายที่เกิดจากผู้เช่าหรือบริวาร ลูกจ้าง ผู้รับเหมา ครอบครัวของผู้เช่า ด้วยค่าใช้จ่ายของผู้เช่าทั้งสิ้น / Responsible for damages caused by self, family, servants, or contractors at own cost.</Bullet>
        <Bullet>5.13 ไม่ติด แขวน แสดง หรือปิดป้ายหรือสิ่งใดทั้งภายในและภายนอกทรัพย์สินหรืออาคารหรือผ่านทางหน้าต่าง / No signs/posters anywhere on or through the windows of the Premises.</Bullet>
        <Bullet>5.14 ไม่นำวัสดุไวไฟ แก๊สหุงต้ม ระเบิด กรด อัลคาไลน์ วัตถุอันตราย สิ่งผิดกฎหมาย หรือวัสดุที่มีน้ำหนักเกิน 200 กก./ตร.ม. เข้ามาเก็บในทรัพย์สิน / No flammables, gas, explosives, hazardous chemicals, illegal goods, or items over 200 kg/sqm load.</Bullet>
        <Bullet>5.15 ส่งมอบกุญแจทั้งหมดที่เกี่ยวข้องกับทรัพย์สินให้แก่ผู้ให้เช่าในวันที่สัญญาเช่าสิ้นสุด / Return all keys to the Lessor on the expiry/termination date.</Bullet>
        <Bullet>5.16 ไม่นำสัตว์เลี้ยงไว้ในทรัพย์สิน และไม่สูบบุหรี่ในห้องหรือบนระเบียง / No pets in the Premises; no smoking inside the room or on the balcony.</Bullet>
        <Bullet>5.17 ก่อนย้ายออกผู้เช่าต้องทำความสะอาดห้องพักและส่งมอบห้องในสภาพเรียบร้อยตามสภาพปกติให้แก่ผู้ให้เช่า / Before moving out, clean and return the unit in good condition (subject to normal wear and tear).</Bullet>

        {/* Section 6: Lessor covenants */}
        <View style={styles.sectionBar} wrap={false}>
          <Text>6. ข้อตกลงของผู้ให้เช่า / LESSOR'S COVENANTS</Text>
        </View>
        <Bullet>6.1 ผู้ให้เช่ารับรองและรับประกันว่าเป็นผู้มีอำนาจปล่อยเช่าทรัพย์สินโดยถูกต้องภายใต้กฎหมายและข้อบังคับทั้งหลาย / The Lessor warrants the absolute right to lease the Premises under applicable laws.</Bullet>
        <Bullet>6.2 หากผู้เช่าชำระค่าเช่าและปฏิบัติตามข้อตกลงครบถ้วน ผู้เช่าจะสามารถครอบครองและใช้ทรัพย์สินได้อย่างสงบสุขโดยไม่มีการรบกวนจากผู้ให้เช่าหรือตัวแทนตลอดอายุสัญญาและเวลาที่ขยายออกไป / The Lessee, paying rent and observing covenants, shall peacefully hold and enjoy the Premises during the term and any extension.</Bullet>
        <Bullet>6.3 ผู้ให้เช่าต้องบำรุงรักษาทรัพย์สินด้วยค่าใช้จ่ายของผู้ให้เช่าเองให้อยู่ในสภาพพักอาศัยและใช้งานได้ตามปกติ และต้องดูแลซ่อมแซมส่วนที่เสียหายในงานหลัก เช่น โครงสร้าง ระบบไฟฟ้า ประปา สายไฟและเคเบิ้ล สี ระบบน้ำเสีย ท่อน้ำทิ้ง บ่อพักน้ำ ท่อระบายน้ำ และระบบเครื่องปรับอากาศ / The Lessor shall, at own cost, maintain the Premises in habitable and usable condition and promptly make all major repairs (structure, electrical, plumbing, drainage, A/C system).</Bullet>

        {/* Section 7: Termination */}
        <View style={styles.sectionBar} wrap={false}>
          <Text>7. การบอกเลิกสัญญา / TERMINATION OF AGREEMENT</Text>
        </View>
        <Bullet>
          7.1 ผู้ให้เช่าสามารถบอกเลิกสัญญาฉบับนี้ได้เมื่อผู้เช่าผิดสัญญาในกรณีดังต่อไปนี้ /
          The Lessor may terminate this Agreement upon any of the following events:
        </Bullet>
        <Bullet sub>I. ผู้เช่าไม่ชำระค่าเช่าหรือค่าใช้จ่ายอื่นๆ ให้ครบตรงตามเวลาที่ระบุไว้ในสัญญานี้ / The Lessee defaults in any payments required hereunder.</Bullet>
        <Bullet sub>II. ผู้เช่าฝ่าฝืนหรือไม่ปฏิบัติตามข้อตกลงข้อหนึ่งข้อใดที่ระบุไว้ในสัญญานี้ / The Lessee violates any term or condition of this Agreement.</Bullet>
        <Bullet sub>III. ผู้เช่าเป็นบุคคลล้มละลายตามกฎหมาย / The Lessee is adjudicated bankrupt.</Bullet>
        <Bullet sub>IV. หากส่วนหนึ่งส่วนใดของทรัพย์สินไม่สามารถใช้พักอาศัยได้ อันเนื่องมาจากอัคคีภัย ข้อห้ามตามกฎหมาย ข้อกำหนดผังเมือง การเวนคืน หรือคำสั่งของหน่วยงานรัฐ / All or part of the Premises is condemned, damaged by fire, or subject to legal restriction or expropriation.</Bullet>
        <Bullet>7.2 ผู้ให้เช่าสามารถบอกเลิกสัญญาโดยแจ้งเป็นลายลักษณ์อักษรล่วงหน้าไม่น้อยกว่า 15 วัน / 15-day written notice required.</Bullet>
        <Bullet>7.3 หากการบอกเลิกเกิดจาก 7.1 (I), (II) หรือ (III) ผู้ให้เช่ามีสิทธิ์ริบเงินประกันสัญญาและเรียกร้องค่าเสียหายเพิ่มเติม / Termination under 7.1(I)–(III) — Lessor may forfeit deposit and claim damages.</Bullet>
        <Bullet>7.4 หากการบอกเลิกเกิดจาก 7.1 (IV) ทั้งสองฝ่ายไม่มีสิทธิ์เรียกร้องค่าเสียหาย และผู้ให้เช่าต้องคืนเงินประกันภายใน 30 วัน / Termination under 7.1(IV) — neither party may claim damages; deposit returned within 30 days.</Bullet>
        <Bullet>7.5 หากผู้เช่าต้องการต่อสัญญา ต้องแจ้งเป็นลายลักษณ์อักษรล่วงหน้าไม่น้อยกว่า 30 วัน ก่อนวันสิ้นสุดสัญญา / Lessee must notify 30 days in advance to renew.</Bullet>
        <Bullet>7.6 ผู้เช่ายินยอมให้ผู้ให้เช่านำผู้จะเช่าหรือผู้จะซื้อเข้าชมทรัพย์สินได้ในช่วง 30 วันก่อนสัญญาสิ้นสุด โดยแจ้งล่วงหน้าและต้องเป็นวันที่ผู้เช่าเห็นควร / Lessee allows showings within 30 days before expiry, with prior notice.</Bullet>
        <Bullet>7.7 หากผู้เช่าบอกเลิกสัญญาก่อนครบกำหนด ต้องแจ้งล่วงหน้าไม่น้อยกว่า 60 วัน และผู้ให้เช่ามีสิทธิ์ริบเงินประกัน / Early termination by Lessee — 60 days notice; deposit forfeited.</Bullet>
        <Bullet>7.8 เมื่อสัญญาสิ้นสุด ผู้เช่ายินยอมให้ผู้ให้เช่าเข้าครอบครองทรัพย์สิน เคลื่อนย้ายหรือทำให้กลับสู่สภาพเดิมได้ ด้วยค่าใช้จ่ายของผู้เช่า / Upon expiry, Lessor may re-enter and restore the Premises at Lessee's cost.</Bullet>
        <Bullet>7.9 หากสัญญานี้ยกเลิก สัญญาบริการและสัญญาเช่าเฟอร์นิเจอร์ระหว่างคู่สัญญา (ถ้ามี) จะถูกยกเลิกไปด้วยโดยปริยาย / Service and Furniture agreements (if any) terminate together with this Agreement.</Bullet>

        {/* Section 8: Vacating */}
        <View style={styles.sectionBar} wrap={false}>
          <Text>8. การย้ายออก / VACATING THE PREMISES</Text>
        </View>
        <Bullet>8.1 ในวันที่ครบกำหนดสัญญา ผู้เช่าต้องย้ายและขนย้ายทรัพย์สินของตนออก และส่งมอบทรัพย์สินคืนในสภาพเดิม สะอาด และสามารถนำออกให้เช่าได้ ยกเว้นความเสื่อมโทรมตามปกติ / On expiry, vacate and deliver the Premises in clean, original, tenantable condition (subject to normal wear and tear).</Bullet>
        <Bullet>8.2 หากผู้เช่าไม่ทำตาม 8.1: (a) ทรัพย์สินที่ค้างอยู่ตกเป็นกรรมสิทธิ์ของผู้ให้เช่า (b) ผู้เช่าต้องชำระค่าเช่าครึ่งเดือนหากค้างไม่เกิน 15 วัน หรือ 1 เดือนหากค้าง 15-30 วัน บวกค่าปรับวันละ 500 บาท นับจากวันสิ้นสุดสัญญา / If 8.1 is not met: (a) leftover property transfers to Lessor; (b) ½ month rent if delayed ≤15 days, full month if 15–30 days, plus 500 THB/day penalty.</Bullet>

        {/* Section 9: Applicable Law */}
        <View style={styles.sectionBar} wrap={false}>
          <Text>9. การบังคับใช้ / APPLICABLE LAW</Text>
        </View>
        <Text style={styles.paragraph}>
          สัญญาฉบับนี้อยู่ภายใต้กฎหมายของรัฐบาลไทย / This Agreement shall be
          governed by the laws of Thailand.
        </Text>

        {/* Section 10: Furniture / Appliances / Other Items — always shown
            in full so the printed copy can be ticked or amended by hand. */}
        <View style={styles.sectionBar} wrap={false}>
          <Text>
            10. รายการเฟอร์นิเจอร์และอุปกรณ์ภายในห้องชุด / FURNITURE &amp;
            EQUIPMENT
          </Text>
        </View>
        <Text style={styles.paragraph}>
          ผู้ให้เช่าส่งมอบและผู้เช่าได้รับเฟอร์นิเจอร์และอุปกรณ์ดังต่อไปนี้
          ภายในห้องชุดในสภาพที่พร้อมใช้งาน — รายการที่ติ๊กถูกจะระบุจำนวนต่อท้าย /
          The Lessor delivers and the Lessee receives the following furniture
          and equipment. Ticked rows show the agreed quantity.
        </Text>

        {data.furnitureList.length > 0 && (
          <>
            <Text style={[styles.boldHL, { marginTop: 6, marginBottom: 4 }]}>
              10.1 เฟอร์นิเจอร์ / Furniture
            </Text>
            {data.furnitureList.map((item, i) => (
              <ChecklistRow key={`f-${i}`} item={item} num={i + 1} />
            ))}
          </>
        )}

        {data.applianceList.length > 0 && (
          <>
            <Text style={[styles.boldHL, { marginTop: 6, marginBottom: 4 }]}>
              10.2 เครื่องใช้ไฟฟ้า / Electrical Appliances
            </Text>
            {data.applianceList.map((item, i) => (
              <ChecklistRow key={`a-${i}`} item={item} num={i + 1} />
            ))}
          </>
        )}

        {data.otherItems.length > 0 && (
          <>
            <Text style={[styles.boldHL, { marginTop: 6, marginBottom: 4 }]}>
              10.3 รายการอื่นๆ / Other Items
            </Text>
            {data.otherItems.map((item, i) => (
              <ChecklistRow key={`o-${i}`} item={item} num={i + 1} />
            ))}
          </>
        )}

        <Text style={[styles.small, { marginTop: 8 }]}>
          หากผู้เช่าทำคีย์การ์ดเข้าออกอาคาร กุญแจห้องชุด หรือกุญแจกล่องจดหมาย
          ชำรุดหรือสูญหาย ผู้เช่าต้องรับผิดชอบค่าใช้จ่ายในการออกใหม่ทั้งหมด /
          If the tenant damages or loses key cards or keys, they shall be
          responsible for the full replacement cost.
        </Text>
        <Text style={[styles.small, { marginTop: 4 }]}>
          กรณีย้ายออก ผู้ให้เช่าจะหักค่าทำความสะอาดห้อง 1,000 บาท
          (กรณีสกปรกมาก 1,800 บาท) ค่าล้างแอร์ 1,400 บาท ค่าซักโซฟา 1,500 บาท
          จากเงินประกัน / Cleaning fees deducted from deposit upon move-out.
        </Text>

        {/* Section 11: Misc (was 10) */}
        <View style={styles.sectionBar} wrap={false}>
          <Text>11. อื่นๆ / MISCELLANEOUS</Text>
        </View>
        <Bullet>11.1 การที่ผู้ให้เช่ารับชำระค่าเช่าจะไม่ถือเป็นข้อยกเว้นไม่ให้ผู้ให้เช่าดำเนินการใดๆ กับผู้เช่า หากมีการละเมิดข้อตกลงข้อหนึ่งข้อใดที่ระบุไว้ในสัญญาฉบับนี้ / Acceptance of rent shall not waive the Lessor's right to act against any breach by the Lessee.</Bullet>
        <Bullet>11.2 หากข้อหนึ่งข้อใดของสัญญาฉบับนี้ไม่สามารถใช้บังคับได้ทางกฎหมายหรือมีเหตุต้องยกเลิก ให้ถือว่าข้อตกลงที่เหลืออยู่ยังคงมีผลบังคับใช้ต่อไปจนครบอายุสัญญา / If any term becomes void or unenforceable, the remaining terms shall remain in full force.</Bullet>
        <Bullet>11.3 หากผู้เช่าขาดการติดต่อกับผู้ให้เช่าเกิน 5 วัน หรือไม่ชำระค่าเช่าและล่าช้าเกิน 10 วันโดยไม่แจ้งเหตุ ถือว่าผิดสัญญาอย่างมีนัยสำคัญ ผู้ให้เช่ามีสิทธิ์เข้าตรวจสอบ บอกเลิกสัญญา และยึดเงินประกันได้ทันที / Loss of contact over 5 days or rent delay over 10 days = material breach; Lessor may enter, terminate, and forfeit deposit immediately.</Bullet>
        <Bullet>11.4 ไม่อนุญาตให้บุคคลอื่นที่ไม่มีรายชื่อในสัญญาเข้าพักอาศัยในห้องโดยเด็ดขาด / No unauthorized occupants are permitted in the Premises.</Bullet>
        <Bullet>11.5 เมื่อผู้เช่าพักอาศัยครบ 6 เดือน ต้องดำเนินการล้างเครื่องปรับอากาศ 1 เครื่องและรับผิดชอบค่าใช้จ่ายเอง / After 6 months of tenancy, the tenant must clean 1 air conditioner at own expense.</Bullet>
        <Bullet>11.6 เมื่อพักครบ 6 เดือน ผู้เช่ายินยอมให้เจ้าของหรือเอเจ้นท์เข้าตรวจสอบสภาพห้องโดยแจ้งล่วงหน้า 1-3 วัน หากไม่สะดวกผู้เช่าต้องส่งคลิปวิดีโอและภาพถ่ายระบุวันที่ / After 6 months, allow inspection with 1-3 days notice; if unavailable, provide dated video/photos.</Bullet>

        {/* Closing + Signatures — wrap together so signatures never split off */}
        <View wrap={false} style={{ marginTop: 12 }}>
          <Text style={[styles.paragraph, { fontSize: 9 }]}>
            สัญญาฉบับนี้ทำขึ้น 2 ฉบับ มีข้อความตรงกัน ผู้ให้เช่าและผู้เช่าถือไว้คนละฉบับ
            ทั้งสองฝ่ายได้อ่านและเห็นว่าถูกต้องตามวัตถุประสงค์ของทั้ง 2 ฝ่าย
            จึงลงลายมือชื่อไว้ต่อหน้าพยาน /
            This Agreement is made in duplicates with identical contents, one
            copy held by each party. Both parties have read and agree, signing
            in the presence of witnesses.
          </Text>

          <View style={styles.twoCol}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.small}>ผู้ให้เช่า / Lessor</Text>
              <Text style={styles.boldHL}>({data.lessorName})</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.small}>ผู้เช่า / Lessee</Text>
              <Text style={styles.boldHL}>({data.lesseeName})</Text>
            </View>
          </View>

          <View style={[styles.twoCol, { marginTop: 36 }]}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.small}>พยาน / Witness</Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.small}>พยาน / Witness</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* Appendix: ID card / passport images, one page per party. Rendered
          only if an image was uploaded — otherwise the contract ends at the
          signature page. */}
      {data.lessorIdImage && (
        <IdAppendix
          imageUrl={data.lessorIdImage}
          roleTh="ผู้ให้เช่า"
          roleEn="Lessor"
          name={data.lessorName}
          projectName={data.projectName}
          unitNumber={data.unitNumber}
          isLessor
        />
      )}
      {data.lesseeIdImage && (
        <IdAppendix
          imageUrl={data.lesseeIdImage}
          roleTh="ผู้เช่า"
          roleEn="Lessee"
          name={data.lesseeName}
          projectName={data.projectName}
          unitNumber={data.unitNumber}
          isLessor={false}
        />
      )}
      {data.jointLesseeName && data.jointLesseeIdImage && (
        <IdAppendix
          imageUrl={data.jointLesseeIdImage}
          roleTh="ผู้เช่าร่วม"
          roleEn="Joint Lessee"
          name={data.jointLesseeName}
          projectName={data.projectName}
          unitNumber={data.unitNumber}
          isLessor={false}
        />
      )}
    </Document>
  );
}
