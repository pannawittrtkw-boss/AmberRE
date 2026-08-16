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
    return fragments.map((frag, i) => <Text key={`thai-${i}`}>{frag}</Text>);
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

const D = ({ children }: { children: React.ReactNode }) => (
  <TText style={styles.boldHL}>{children}</TText>
);

const styles = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 10,
    padding: 40,
    lineHeight: 1.6,
  },
  header: { textAlign: "center", marginBottom: 14 },
  title: { fontSize: 13, fontWeight: "bold", lineHeight: 1.5 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 150 },
  value: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#666",
    paddingBottom: 1,
    fontWeight: "bold",
  },
  boldHL: { fontWeight: "bold" },
  sectionHeading: { fontWeight: "bold", marginTop: 12, marginBottom: 6 },
  partyHeading: { fontWeight: "bold", marginBottom: 3 },
  paragraph: { marginBottom: 4 },
  bullet: { marginLeft: 12, marginBottom: 3 },
  numbered: { marginLeft: 12, marginBottom: 3 },
  twoCol: { flexDirection: "row", gap: 30, marginTop: 40 },
  signatureBlock: { flex: 1, alignItems: "center" },
  signatureLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#000",
    width: "80%",
    height: 30,
    marginBottom: 4,
  },
  signatureImage: {
    width: "70%",
    height: 60,
    objectFit: "contain",
    objectPositionX: "50%",
    objectPositionY: "100%",
    marginBottom: 2,
  },
  small: { fontSize: 9, color: "#444" },
  idImagesRow: { flexDirection: "row", gap: 20, marginTop: 20, justifyContent: "center" },
  idImageBlock: { alignItems: "center", width: 220 },
  idImage: { width: 220, height: 140, objectFit: "contain", marginBottom: 4 },
});

export interface CommissionPdfData {
  contractDateTh: string;
  startDateTh: string;
  endDateTh: string;

  projectName: string;
  unitNumber: string;
  buildingName?: string | null;
  floorNumber?: string | null;
  propertyAddress: string;
  sizeSqm?: number | null;

  monthlyRentText: string; // e.g. "8,000"

  ownerName: string;
  ownerAddress?: string | null;
  ownerIdCard?: string | null;
  ownerPhone?: string | null;
  ownerIdImage?: string | null;
  ownerSignature?: string | null;

  agentName?: string | null;
  agentAddress?: string | null;
  agentIdCard?: string | null;
  agentPhone?: string | null;
  agentIdImage?: string | null;
  agentSignature?: string | null;
}

export function CommissionPdf({ data }: { data: CommissionPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <TText style={styles.title}>
            สัญญาแต่งตั้งและข้อตกลงตัวแทนอสังหาริมทรัพย์
          </TText>
        </View>

        <View style={styles.row}>
          <TText style={styles.label}>จัดทำ ณ</TText>
          <TText style={styles.value}><D>{data.projectName}</D></TText>
        </View>
        <View style={styles.row}>
          <TText style={styles.label}>วันที่</TText>
          <TText style={styles.value}><D>{data.contractDateTh}</D></TText>
        </View>
        <View style={styles.row}>
          <TText style={styles.label}>อายุสัญญา</TText>
          <TText style={styles.value}>
            <D>{data.startDateTh} – {data.endDateTh}</D>
          </TText>
        </View>

        <TText style={[styles.paragraph, { marginTop: 8 }]}>ระหว่าง</TText>

        <TText style={styles.partyHeading}>1. ผู้ว่าจ้าง (เจ้าของทรัพย์สิน)</TText>
        <View style={styles.row}>
          <TText style={styles.label}>ชื่อ</TText>
          <TText style={styles.value}><D>{data.ownerName}</D></TText>
        </View>
        {data.ownerAddress && (
          <View style={styles.row}>
            <TText style={styles.label}>ที่อยู่</TText>
            <TText style={styles.value}>{data.ownerAddress}</TText>
          </View>
        )}
        {data.ownerIdCard && (
          <View style={styles.row}>
            <TText style={styles.label}>เลขประจำตัวประชาชน</TText>
            <TText style={styles.value}>{data.ownerIdCard}</TText>
          </View>
        )}
        {data.ownerPhone && (
          <View style={styles.row}>
            <TText style={styles.label}>โทรศัพท์</TText>
            <TText style={styles.value}>{data.ownerPhone}</TText>
          </View>
        )}

        <TText style={[styles.partyHeading, { marginTop: 8 }]}>2. ผู้รับจ้าง (นายหน้า/เอเจ้นต์)</TText>
        <View style={styles.row}>
          <TText style={styles.label}>ชื่อ</TText>
          <TText style={styles.value}><D>{data.agentName || "-"}</D></TText>
        </View>
        {data.agentAddress && (
          <View style={styles.row}>
            <TText style={styles.label}>ที่อยู่</TText>
            <TText style={styles.value}>{data.agentAddress}</TText>
          </View>
        )}
        {data.agentIdCard && (
          <View style={styles.row}>
            <TText style={styles.label}>เลขประจำตัวประชาชน</TText>
            <TText style={styles.value}>{data.agentIdCard}</TText>
          </View>
        )}
        {data.agentPhone && (
          <View style={styles.row}>
            <TText style={styles.label}>โทรศัพท์</TText>
            <TText style={styles.value}>{data.agentPhone}</TText>
          </View>
        )}

        <TText style={styles.sectionHeading}>ข้อ 1: วัตถุประสงค์ของสัญญา</TText>
        <TText style={styles.paragraph}>
          ผู้ว่าจ้างมอบหมายให้ผู้รับจ้างเป็นตัวแทนในการหาผู้เช่าสำหรับห้องชุด:
        </TText>
        <TText style={[styles.paragraph, styles.boldHL]}>{data.projectName}</TText>
        <TText style={styles.paragraph}>ที่อยู่: {data.propertyAddress}</TText>
        <TText style={styles.paragraph}>
          ขนาด: <D>{data.sizeSqm != null ? data.sizeSqm : "-"}</D> ตร.ม. ห้อง <D>{data.unitNumber}</D>
          {data.floorNumber ? <> ชั้น <D>{data.floorNumber}</D></> : null}
          {data.buildingName ? <> อาคาร <D>{data.buildingName}</D></> : null}
        </TText>

        <TText style={styles.sectionHeading}>ข้อ 2: ค่าคอมมิชชั่น</TText>
        <TText style={styles.bullet}>
          • ค่าคอมมิชชั่นคือ 1 เดือนของค่าเช่า = <D>{data.monthlyRentText}</D> บาท
        </TText>
        <TText style={styles.bullet}>
          • หากต่อสัญญาในปีที่ 2 หรือ 3 ผู้รับจ้างจะได้รับค่าคอมมิชชั่น 0.5 เดือน
        </TText>
        <TText style={styles.bullet}>
          • ผู้ว่าจ้างจะชำระค่าคอมมิชชั่นภายใน 1 วัน หลังผู้เช่าลงนามในสัญญาและชำระเงินค่าเช่า
        </TText>

        <TText style={styles.sectionHeading}>ข้อ 3: หน้าที่ของผู้รับจ้าง (นายหน้า)</TText>
        <TText style={styles.numbered}>1. หาผู้เช่าที่เหมาะสม พร้อมคัดกรองเบื้องต้น</TText>
        <TText style={styles.numbered}>2. ดำเนินการจัดทำสัญญา/ร่างสัญญาเช่า</TText>
        <TText style={styles.numbered}>
          3. พาผู้เช่าลงทะเบียนที่นิติบุคคล/คำนวณค่าน้ำ ค่าไฟ ในรอบบิลแรกและรอบบิลย้ายออก
        </TText>
        <TText style={styles.numbered}>4. รายงานสถานะการชำระค่าเช่า (ในไลน์กลุ่ม)</TText>
        <TText style={styles.numbered}>5. ตรวจสอบทรัพย์สินห้องเมื่อผู้เช่าย้ายออกและจัดทำรายงานสรุป</TText>
        <TText style={styles.numbered}>6. ช่วยดำเนินการหากผู้เช่าขอยกเลิกสัญญา</TText>
        <TText style={styles.numbered}>7. ดูแลประสานงานปัญหาตลอดอายุสัญญา</TText>
        <TText style={styles.numbered}>
          8. รับผิดชอบลงทะเบียน TM30 กรณีผู้เช่าเป็นชาวต่างชาติโดยเจ้าของต้องจัดเตรียมเอกสารให้
        </TText>

        <TText style={styles.sectionHeading}>ข้อ 4: ข้อกำหนดกรณีพิเศษ</TText>
        <TText style={styles.bullet}>• หากผู้ว่าจ้างหาผู้เช่าเอง ผู้รับจ้างไม่มีสิทธิ์เรียกค่าคอมมิชชั่น</TText>
        <TText style={styles.bullet}>
          • หากผู้เช่าได้ทำการเงินจองเรียบร้อยแล้ว แต่ไม่ทำสัญญาตามตกลง
          ผู้ให้เช่าจะต้องชำระค่าตอบแทนให้กับผู้รับจ้างเป็นมูลค่าเท่ากับ &quot;ครึ่งหนึ่งของมูลค่าเงินจอง&quot; ที่ผู้เช่าได้ชำระไว้
        </TText>
        <TText style={styles.bullet}>• หากผู้เช่าอยู่ไม่ครบตามสัญญา ผู้รับจ้างไม่ต้องคืนค่าคอมมิชชั่น</TText>
        <TText style={styles.bullet}>
          • หากผู้เช่าย้ายออกก่อนครบกำหนด ถือว่าสัญญานี้สิ้นสุด และต้องทำสัญญาใหม่ในรอบถัดไป
        </TText>
        <TText style={styles.bullet}>
          • หากผู้ว่าจ้างให้ผู้รับจ้างหาผู้เช่าภายใน 1 เดือนหลังผู้เช่าคนก่อนย้ายออก
          ผู้รับจ้างจะรับผิดชอบการทำความสะอาดห้อง และล้างแอร์โดยไม่คิดค่าใช้จ่าย
        </TText>

        <TText style={styles.sectionHeading}>ข้อ 5: การบอกเลิกสัญญา</TText>
        <TText style={styles.paragraph}>
          หากฝ่ายใดต้องการยกเลิก ต้องแจ้งล่วงหน้าเป็นลายลักษณ์อักษรอย่างน้อย 2-3 วัน
          และหากมีค่าใช้จ่ายที่เกิดขึ้นก่อนการยกเลิก ฝ่ายที่ยกเลิกต้องรับผิดชอบค่าใช้จ่ายนั้น
          ซึ่งไม่เกี่ยวข้องกับผู้รับจ้าง
        </TText>

        <TText style={styles.sectionHeading}>ข้อ 6: การระงับข้อพิพาท</TText>
        <TText style={styles.paragraph}>
          หากเกิดข้อพิพาท ทั้งสองฝ่ายจะพยายามเจรจาเพื่อหาทางออก หากตกลงกันไม่ได้
          ให้ยื่นเรื่องต่อศาลที่มีเขตอำนาจ
        </TText>

        {(data.ownerIdImage || data.agentIdImage) && (
          <View style={styles.idImagesRow} wrap={false}>
            {data.ownerIdImage && (
              <View style={styles.idImageBlock}>
                <Image src={data.ownerIdImage} style={styles.idImage} />
                <TText style={styles.small}>บัตรประชาชนผู้ว่าจ้าง</TText>
              </View>
            )}
            {data.agentIdImage && (
              <View style={styles.idImageBlock}>
                <Image src={data.agentIdImage} style={styles.idImage} />
                <TText style={styles.small}>บัตรประชาชนผู้รับจ้าง</TText>
              </View>
            )}
          </View>
        )}

        <View style={styles.twoCol} wrap={false}>
          <View style={styles.signatureBlock}>
            {data.ownerSignature ? (
              <Image src={data.ownerSignature} style={styles.signatureImage} />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <TText style={styles.small}>(ลงชื่อ) ผู้ว่าจ้าง (เจ้าของทรัพย์สิน)</TText>
            <TText style={styles.boldHL}>({data.ownerName})</TText>
          </View>
          <View style={styles.signatureBlock}>
            {data.agentSignature ? (
              <Image src={data.agentSignature} style={styles.signatureImage} />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <TText style={styles.small}>(ลงชื่อ) ผู้รับจ้าง (นายหน้า/เอเจ้นต์)</TText>
            <TText style={styles.boldHL}>({data.agentName || "-"})</TText>
          </View>
        </View>
      </Page>
    </Document>
  );
}
