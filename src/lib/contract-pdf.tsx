/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register Sarabun (Thai + Latin) font from Google's GitHub mirror.
// Bundling locally would be cleaner, but this CDN URL is stable and avoids
// shipping ~700KB of fonts in the repo.
Font.register({
  family: "Sarabun",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/gh/google/fonts/main/ofl/sarabun/Sarabun-Regular.ttf",
    },
    {
      src: "https://cdn.jsdelivr.net/gh/google/fonts/main/ofl/sarabun/Sarabun-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 10,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 50,
    lineHeight: 1.45,
  },
  header: {
    textAlign: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "bold",
  },
  sectionBar: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 4,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 4,
  },
  small: {
    fontSize: 9,
    color: "#444",
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  label: {
    width: 120,
  },
  value: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#666",
    paddingBottom: 1,
    fontWeight: "bold",
  },
  boldHL: {
    fontWeight: "bold",
  },
  twoCol: {
    flexDirection: "row",
    gap: 30,
    marginTop: 30,
  },
  signatureBlock: {
    flex: 1,
    alignItems: "center",
  },
  signatureLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#000",
    width: "80%",
    height: 30,
    marginBottom: 4,
  },
  bullet: {
    marginLeft: 10,
    marginBottom: 3,
  },
});

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
  monthlyRentText: string; // "เจ็ดพันห้าร้อยบาทถ้วน"
  paymentDay: number;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  latePaymentFee: number;
  latePaymentFeeText: string;

  securityDeposit: number;
  securityDepositText: string;

  furnitureList: string[];
  applianceList: string[];
  otherItems: string[];
}

const formatNum = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(n);

const D = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.boldHL}>{children}</Text>
);

export function ContractPdf({ data }: { data: ContractPdfData }) {
  return (
    <Document>
      {/* PAGE 1 — Header + Parties + Property */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>สัญญาเช่า / Agreement</Text>
          <Text style={styles.subtitle}>{data.projectName}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>สัญญาฉบับนี้ทำขึ้นวันที่</Text>
          <Text style={styles.value}>
            <D>{data.contractDateTh}</D>
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>THIS Agreement is made on</Text>
          <Text style={styles.value}>
            <D>{data.contractDateEn}</D>
          </Text>
        </View>

        {/* Lessor */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <Text style={styles.label}>ผู้ให้เช่า / Lessor</Text>
          <Text style={styles.value}>
            <D>{data.lessorName}</D>
          </Text>
        </View>
        {data.lessorIdCard && (
          <View style={styles.row}>
            <Text style={styles.label}>หมายเลข ID / ID Number</Text>
            <Text style={styles.value}>
              <D>{data.lessorIdCard}</D>
            </Text>
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
          <Text style={styles.value}>
            <D>{data.lesseeName}</D>
          </Text>
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
            <Text style={styles.value}>
              <D>{data.lesseeIdCard}</D>
            </Text>
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

        {/* Property */}
        <Text style={[styles.paragraph, { marginTop: 10 }]}>
          โดยผู้ให้เช่าเป็นเจ้าของ <D>{data.projectName}</D> ห้องชุดเลขที่{" "}
          <D>{data.unitNumber}</D>
          {data.buildingName ? (
            <>
              {" "}อาคาร <D>{data.buildingName}</D>
            </>
          ) : null}
          {data.floorNumber ? (
            <>
              {" "}ชั้น <D>{data.floorNumber}</D>
            </>
          ) : null}
          {" "}ที่ตั้ง <D>{data.propertyAddress}</D>
          {data.sizeSqm != null ? (
            <>
              {" "}ขนาดห้อง <D>{data.sizeSqm}</D> ตารางเมตร
            </>
          ) : null}
          {" "}ซึ่งรวมถึงอุปกรณ์ตกแต่งและเฟอร์นิเจอร์ ซึ่งต่อไปนี้เรียกว่า "ทรัพย์สิน"
        </Text>

        <Text style={styles.paragraph}>
          Whereas, Lessor is the owner of <D>{data.projectName}</D>, Unit number{" "}
          <D>{data.unitNumber}</D>
          {data.buildingName ? <>, Building <D>{data.buildingName}</D></> : null}
          {data.floorNumber ? <>, floor <D>{data.floorNumber}</D></> : null},
          Located at <D>{data.propertyAddress}</D>
          {data.sizeSqm != null ? <>, approximate area <D>{data.sizeSqm}</D> sqm.</> : null}{" "}
          and all premises including all fixtures and fittings hereinafter
          referred to as the "Premises".
        </Text>

        {/* Joint Lessee (optional) */}
        {data.jointLesseeName && (
          <>
            <View style={styles.sectionBar}>
              <Text>1. ผู้เช่าร่วม / Joint Lessee</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>ชื่อ / Name</Text>
              <Text style={styles.value}>
                <D>{data.jointLesseeName}</D>
              </Text>
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
      </Page>

      {/* PAGE 2 — Term + Rental + Deposit */}
      <Page size="A4" style={styles.page}>
        <View style={styles.sectionBar}>
          <Text>2. ระยะเวลาเช่า / LEASE TERM</Text>
        </View>
        <Text style={styles.paragraph}>
          ระยะเวลาเช่ากำหนดไว้เป็นเวลา <D>{data.termMonths}</D> เดือน
          โดยเริ่มสัญญาวันที่ <D>{data.startDateTh}</D> สิ้นสุดวันที่ <D>{data.endDateTh}</D>
        </Text>
        <Text style={styles.paragraph}>
          The term of this Agreement shall be for a period of <D>{data.termMonths}</D>{" "}
          months. Commencing from <D>{data.startDateEn}</D> and expired on{" "}
          <D>{data.endDateEn}</D>
        </Text>

        <View style={styles.sectionBar}>
          <Text>3. ค่าเช่าและค่าส่วนกลาง / RENTAL AND COMMON PROPERTIES FEES</Text>
        </View>
        <Text style={styles.paragraph}>
          3.1 ค่าเช่าคิดเป็นจำนวนเงินเดือนละ <D>{formatNum(data.monthlyRent)}</D> บาท{" "}
          <D>({data.monthlyRentText})</D> และชำระล่วงหน้าหรือไม่เกินวันที่{" "}
          <D>{data.paymentDay}</D> ของทุกเดือน ชำระโดยโอนเงินเข้าบัญชีธนาคารผู้ให้เช่า
        </Text>
        <Text style={styles.paragraph}>
          3.1 The rent shall be <D>{formatNum(data.monthlyRent)}</D> Baht per
          month and shall be paid in advance or within the day{" "}
          <D>{data.paymentDay}</D> of each calendar month by wiring such money
          to the lessor's account bank directly.
        </Text>

        {(data.bankName || data.bankAccountNumber) && (
          <View style={{ marginLeft: 16, marginTop: 4, marginBottom: 6 }}>
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
                <Text style={styles.value}>
                  <D>{data.bankAccountNumber}</D>
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.paragraph}>
          3.2 ผู้เช่าได้ชำระค่าเช่าสำหรับเดือนแรกของสัญญาเรียบร้อยแล้วในวันทำสัญญาฉบับนี้ /
          The first payment of the rent is paid on the execution of this Agreement.
        </Text>
        <Text style={styles.paragraph}>
          3.3 ผู้ให้เช่าเป็นผู้ชำระค่าส่วนกลางที่เรียกเก็บโดยนิติบุคคลของโครงการคอนโด /
          The lessor pays the common fees collected by the project's juristic person.
        </Text>
        <Text style={styles.paragraph}>
          3.4 กรณีผู้เช่าชำระค่าเช่าเกินกำหนด ผู้ให้เช่ามีสิทธิ์เรียกค่าเบี้ยปรับเป็นเงินวันละ{" "}
          <D>{formatNum(data.latePaymentFee)}</D> บาท ({data.latePaymentFeeText}) /
          If Lessee delays the rental payment, Lessee will be charged at{" "}
          <D>{formatNum(data.latePaymentFee)}</D> Baht per day overdue.
        </Text>
        <Text style={styles.paragraph}>
          3.5 หลังจากโอนเงินค่าเช่ารายเดือนแล้ว กรุณาส่งข้อความให้ผู้ให้เช่ารับทราบด้วย /
          After transferring rental, please notify the lessor.
        </Text>

        <View style={styles.sectionBar}>
          <Text>4. เงินประกันสัญญา / SECURITY DEPOSIT</Text>
        </View>
        <Text style={styles.paragraph}>
          4.1 ในวันที่ลงนามในสัญญาฉบับนี้ ผู้เช่าได้ชำระเงินประกันให้แก่ผู้ให้เช่าเป็นจำนวน{" "}
          <D>{formatNum(data.securityDeposit)}</D> บาท ({data.securityDepositText})
          ซึ่งผู้ให้เช่าจะเก็บไว้ตลอดอายุสัญญาโดยไม่มีดอกเบี้ย
          เพื่อเป็นประกันความเสียหายที่อาจเกิดขึ้นในกรณีที่ผู้เช่าละเมิดข้อตกลงที่ระบุไว้ในสัญญาฉบับนี้
        </Text>
        <Text style={styles.paragraph}>
          4.1 Upon the execution of this Agreement, the Lessee deposits with the
          Lessor <D>{formatNum(data.securityDeposit)}</D> Baht as Security
          Deposit, held by the Lessor without interest as security for breaches
          and damages.
        </Text>
        <Text style={styles.paragraph}>
          4.2 ผู้ให้เช่าจะคืนเงินประกันให้ผู้เช่าโดยไม่มีดอกเบี้ย ภายใน 30 วันนับจากวันสิ้นสุดสัญญา
          หลังจากหักค่าเช่าค้างชำระและค่าเสียหายใดๆ /
          The Security Deposit shall be returned to the Lessee within 30 days
          upon termination after deduction of any outstanding rent or damages.
        </Text>
        <Text style={styles.paragraph}>
          4.6 กรณีผู้เช่าอยู่ไม่ครบอายุสัญญาเช่าตามกำหนด ผู้ให้เช่าขอสงวนสิทธิ์ในการคืนเงินประกัน /
          If the Lessee does not complete the lease term, the Lessor reserves
          the right to forfeit the security deposit.
        </Text>
      </Page>

      {/* PAGE 3 — Lessee covenants */}
      <Page size="A4" style={styles.page}>
        <View style={styles.sectionBar}>
          <Text>5. ข้อตกลงของผู้เช่า / LESSEE'S COVENANTS</Text>
        </View>
        {[
          "5.1 ชำระค่าเช่าและเงินอื่นๆตามที่ระบุไว้ในสัญญานี้อย่างครบถ้วนและตามเวลาที่ระบุ ตลอดอายุสัญญา / To punctually pay the rents and other sums during the entire lease term.",
          "5.2 ปฏิบัติตามข้อตกลงในสัญญาฉบับนี้และข้อกำหนดของนิติบุคคลของโครงการอย่างเคร่งครัด / Strictly comply with all rules of this Agreement and the Juristic Person.",
          "5.3 ใช้ทรัพย์สินเพื่อการอยู่อาศัยเท่านั้น ห้ามเจาะ ตอก ติด ตรึง สิ่งของใดกับผนังห้อง หากละเมิดปรับจุดละ 1,000 บาท / Residential use only. No drilling, nailing, or attaching items to walls. Fine: 1,000 THB per violation.",
          "5.4 ดูแลและบำรุงรักษาเครื่องใช้ไฟฟ้าและทรัพย์สินทุกชนิดด้วยค่าใช้จ่ายของผู้เช่าเอง โดยรับผิดชอบงานเล็กน้อย (ค่าใช้จ่ายไม่เกิน 600 บาทต่อเดือน) / Tenant is responsible for minor repairs not exceeding 600 THB/month.",
          "5.5 ชำระค่าสาธารณูปโภค ไฟฟ้า น้ำประปา โทรศัพท์ อินเตอร์เน็ต ตลอดอายุสัญญา / Pay all utilities (electricity, water, telephone, internet) on time.",
          "5.6 ไม่ต่อเติม ดัดแปลง หรือเปลี่ยนแปลงทรัพย์สินโดยไม่ได้รับอนุญาต / No modifications without written consent.",
          "5.7 สิ่งที่ต่อเติมยึดติดกับทรัพย์สินถือเป็นกรรมสิทธิ์ของผู้ให้เช่าเมื่อสัญญาสิ้นสุด / Fixtures become Lessor's property upon expiration.",
          "5.8 ไม่ใช้ทรัพย์สินเพื่อวัตถุประสงค์ผิดกฎหมาย / No illegal/immoral activities.",
          "5.9 ไม่ปล่อยเช่าช่วงหรือถ่ายโอนสิทธิโดยไม่ได้รับอนุญาต / No subletting without consent.",
          "5.10 ไม่ก่อความรำคาญต่อผู้พักอาศัยใกล้เคียง / No nuisance to neighbors.",
          "5.11 แจ้งความเสียหายภายใน 7 วันเมื่อพบ / Notify Lessor of damages within 7 days.",
          "5.12 รับผิดชอบความเสียหายที่เกิดจากผู้เช่าหรือบริวาร / Lessee responsible for damages caused by self/family.",
          "5.13 ไม่ติด แขวน ป้ายหรือสิ่งของใดทั้งภายในและภายนอก / No signs/posters on premises.",
          "5.14 ไม่นำวัสดุไวไฟ แก๊สหุงต้ม หรือวัตถุอันตรายเข้าทรัพย์สิน / No flammable/hazardous materials.",
          "5.15 ส่งมอบกุญแจทั้งหมดในวันสิ้นสุดสัญญา / Return all keys at termination.",
          "5.16 ไม่นำสัตว์เลี้ยงไว้ในทรัพย์สิน และไม่สูบบุหรี่ในห้องหรือระเบียง / No pets, no smoking inside.",
          "5.17 ก่อนย้ายออก ผู้เช่าต้องทำความสะอาดห้องและส่งมอบในสภาพเรียบร้อย / Before moving out, clean the premises.",
        ].map((line, i) => (
          <Text key={i} style={[styles.paragraph, styles.bullet]}>
            {line}
          </Text>
        ))}
      </Page>

      {/* PAGE 4 — Lessor covenants + Termination */}
      <Page size="A4" style={styles.page}>
        <View style={styles.sectionBar}>
          <Text>6. ข้อตกลงของผู้ให้เช่า / LESSOR'S COVENANTS</Text>
        </View>
        {[
          "6.1 ผู้ให้เช่ารับรองว่าเป็นผู้มีอำนาจปล่อยเช่าโดยถูกต้องตามกฎหมาย / Lessor warrants the right to lease the Premises.",
          "6.2 ผู้เช่าจะครอบครองและใช้ทรัพย์สินได้อย่างสงบสุขตลอดอายุสัญญา / Lessee may peacefully hold and enjoy the Premises.",
          "6.3 ผู้ให้เช่ารับผิดชอบงานหลัก เช่น โครงสร้าง ระบบไฟ ประปา ระบบเครื่องปรับอากาศ / Lessor responsible for major repairs (structure, water, electrical, HVAC).",
        ].map((line, i) => (
          <Text key={i} style={[styles.paragraph, styles.bullet]}>
            {line}
          </Text>
        ))}

        <View style={styles.sectionBar}>
          <Text>7. การบอกเลิกสัญญา / TERMINATION</Text>
        </View>
        {[
          "7.1 ผู้ให้เช่าสามารถบอกเลิกสัญญาได้เมื่อผู้เช่าผิดสัญญา / Lessor may terminate upon Lessee's breach.",
          "7.2 บอกเลิกสัญญาด้วยการแจ้งเป็นลายลักษณ์อักษรล่วงหน้า 15 วัน / 15-day written notice required.",
          "7.3 หากผู้เช่าผิดสัญญา ผู้ให้เช่ามีสิทธิริบเงินประกัน / Lessor may forfeit the Security Deposit.",
          "7.5 หากผู้เช่าต้องการต่อสัญญา ต้องแจ้งล่วงหน้า 30 วัน / Lessee must notify 30 days in advance to renew.",
          "7.7 หากผู้เช่าบอกเลิกสัญญาก่อนครบกำหนด ต้องแจ้งล่วงหน้า 60 วัน และผู้ให้เช่ามีสิทธิริบเงินประกัน / Lessee terminating early must give 60 days notice; deposit forfeited.",
        ].map((line, i) => (
          <Text key={i} style={[styles.paragraph, styles.bullet]}>
            {line}
          </Text>
        ))}

        <View style={styles.sectionBar}>
          <Text>8. การย้ายออกจากทรัพย์สิน / VACATING</Text>
        </View>
        <Text style={[styles.paragraph, styles.bullet]}>
          8.1 ในวันที่ครบกำหนดสัญญา ผู้เช่าต้องส่งมอบทรัพย์สินคืนในสภาพเดิม สะอาด พร้อมวัสดุอุปกรณ์ทั้งหมด /
          On the expiry date, deliver the Premises in original condition.
        </Text>
        <Text style={[styles.paragraph, styles.bullet]}>
          8.2 หากผู้เช่าไม่ย้ายออกตามกำหนด ผู้ให้เช่าคิดค่าปรับวันละ 500 บาท /
          Penalty 500 THB per day for overstay.
        </Text>

        <View style={styles.sectionBar}>
          <Text>9. การบังคับใช้ / APPLICABLE LAW</Text>
        </View>
        <Text style={styles.paragraph}>
          สัญญาฉบับนี้อยู่ภายใต้กฎหมายของรัฐบาลไทย / This Agreement shall be
          governed by the laws of Thailand.
        </Text>

        <View style={styles.sectionBar}>
          <Text>10. อื่นๆ / MISCELLANEOUS</Text>
        </View>
        {[
          "10.3 หากผู้เช่าขาดการติดต่อเกิน 5 วัน หรือไม่ชำระค่าเช่าเกิน 10 วัน ถือว่าผิดสัญญา / Lost contact 5+ days or 10+ days late payment = material breach.",
          "10.4 ไม่อนุญาตให้บุคคลอื่นที่ไม่มีรายชื่อในสัญญาเข้าพักอาศัย / No unauthorized occupants.",
          "10.5 เมื่อพักอาศัยครบ 6 เดือน ผู้เช่าต้องล้างเครื่องปรับอากาศ 1 เครื่อง / Tenant cleans A/C every 6 months at own cost.",
          "10.6 ผู้ให้เช่าหรือเอเจ้นท์เข้าตรวจสอบห้องได้ทุก 6 เดือน โดยแจ้งล่วงหน้า 1-3 วัน / Owner/agent inspects every 6 months with 1-3 days notice.",
        ].map((line, i) => (
          <Text key={i} style={[styles.paragraph, styles.bullet]}>
            {line}
          </Text>
        ))}

        <Text style={[styles.paragraph, { marginTop: 12, fontSize: 9 }]}>
          สัญญาฉบับนี้ทำขึ้น 2 ฉบับ มีข้อความตรงกัน ผู้ให้เช่าและผู้เช่าถือไว้คนละฉบับ
          ทั้งสองฝ่ายได้อ่านและเห็นว่าถูกต้อง จึงลงลายมือชื่อไว้ต่อหน้าพยาน /
          This Agreement is made in duplicates with identical contents.
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
      </Page>

      {/* PAGE 5 — Furniture Attachment */}
      {(data.furnitureList.length > 0 ||
        data.applianceList.length > 0 ||
        data.otherItems.length > 0) && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>
              แนบท้ายรายการเฟอร์นิเจอร์และอุปกรณ์อื่นใดภายในห้องชุด
            </Text>
            <Text style={styles.subtitle}>
              Attached: List of furniture and equipment within the suite
            </Text>
          </View>

          <Text style={styles.paragraph}>
            สัญญาฉบับนี้ทำขึ้นวันที่ <D>{data.contractDateTh}</D> /
            THIS Agreement is made on <D>{data.contractDateEn}</D>
          </Text>

          <Text style={styles.paragraph}>
            ระหว่าง <D>{data.lessorName}</D> ในฐานะ "ผู้ให้เช่า" และ{" "}
            <D>{data.lesseeName}</D> ในฐานะ "ผู้เช่า"
          </Text>

          <Text style={styles.paragraph}>
            โดยรายละเอียดของเฟอร์นิเจอร์และอุปกรณ์อื่นใด ภายในห้องชุด{" "}
            <D>{data.projectName}</D> ห้องเลขที่ <D>{data.unitNumber}</D>
          </Text>

          {data.furnitureList.length > 0 && (
            <>
              <Text style={[styles.boldHL, { marginTop: 8, marginBottom: 4 }]}>
                รายละเอียดเฟอร์นิเจอร์ / Detail of furniture:
              </Text>
              {data.furnitureList.map((item, i) => (
                <Text key={i} style={[styles.paragraph, styles.bullet]}>
                  {i + 1}) {item}
                </Text>
              ))}
            </>
          )}

          {data.applianceList.length > 0 && (
            <>
              <Text style={[styles.boldHL, { marginTop: 8, marginBottom: 4 }]}>
                รายการเครื่องใช้ไฟฟ้า / Detail of appliances:
              </Text>
              {data.applianceList.map((item, i) => (
                <Text key={i} style={[styles.paragraph, styles.bullet]}>
                  {i + 1}) {item}
                </Text>
              ))}
            </>
          )}

          {data.otherItems.length > 0 && (
            <>
              <Text style={[styles.boldHL, { marginTop: 8, marginBottom: 4 }]}>
                รายการอื่นๆ / Other items:
              </Text>
              {data.otherItems.map((item, i) => (
                <Text key={i} style={[styles.paragraph, styles.bullet]}>
                  - {item}
                </Text>
              ))}
            </>
          )}

          <Text style={[styles.small, { marginTop: 12 }]}>
            หากผู้เช่าทำคีย์การ์ด กุญแจห้องชุด หรือกุญแจกล่องจดหมายชำรุดหรือสูญหาย
            ผู้เช่าต้องรับผิดชอบค่าใช้จ่ายในการออกใหม่ทั้งหมด /
            If the tenant damages or loses key cards or keys, they shall be
            responsible for the full replacement cost.
          </Text>

          <Text style={[styles.small, { marginTop: 8 }]}>
            กรณีย้ายออก ผู้ให้เช่าจะหักค่าทำความสะอาดห้อง 1,000 บาท
            (กรณีสกปรกมาก 1,800 บาท) ค่าล้างแอร์ 1,400 บาท ค่าซักโซฟา 1,500 บาท
            จากเงินประกัน / Cleaning fees deducted from deposit upon move-out.
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
        </Page>
      )}
    </Document>
  );
}
