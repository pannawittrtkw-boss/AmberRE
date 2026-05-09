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
import {
  ContractClause,
  applyPlaceholders,
  parseInlineFormatting,
} from "./contract-clauses";

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

// Disable hyphenation entirely — the default English-style behaviour
// inserts visible "-" characters at break points, which we don't want
// for Thai text. Wrapping happens at the U+200B markers we insert via
// insertThaiBreaks instead.
Font.registerHyphenationCallback((word) => [word]);

// Recursively walk a ReactNode tree and split Thai-string leaves into
// per-word <Text> runs at CLDR word boundaries. Each Thai fragment ends
// up as its own inline <Text>, so @react-pdf/renderer's line-breaker
// can wrap between runs without inserting any character — no orphan
// characters mid-word and no "-" hyphen marker at line ends.
function thaify(node: React.ReactNode): React.ReactNode {
  if (typeof node === "string") {
    const fragments = splitThai(node);
    if (fragments.length <= 1) return node;
    return fragments.map((frag, i) => (
      <Text key={`thai-${i}`}>{frag}</Text>
    ));
  }
  if (typeof node === "number" || node == null || typeof node === "boolean")
    return node;
  if (Array.isArray(node)) return node.map(thaify);
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (props.children !== undefined) {
      return React.cloneElement(
        node,
        {} as Record<string, never>,
        thaify(props.children)
      );
    }
    return node;
  }
  return node;
}

// Drop-in <TText> replacement that runs its children through thaify().
// Use TText anywhere a Thai or mixed Thai/English string lives in the
// PDF. Pure-English <TText> can stay as <TText> but TText is also safe
// for those (it short-circuits when no Thai chars are present).
type TTextProps = {
  children?: React.ReactNode;
  style?: Style | Style[];
  wrap?: boolean;
};
function TText({ children, style, wrap }: TTextProps) {
  return (
    <Text style={style} wrap={wrap}>
      {thaify(children)}
    </Text>
  );
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 10,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 50,
    // Thai script stacks tone marks and vowels above and below the
    // baseline; cramped line-height makes adjacent lines collide. 1.6
    // gives the marks enough breathing room without wasting the page.
    lineHeight: 1.6,
  },
  header: { textAlign: "center", marginBottom: 14 },
  title: { fontSize: 14, fontWeight: "bold", marginBottom: 4, lineHeight: 1.5 },
  subtitle: { fontSize: 13, fontWeight: "bold", lineHeight: 1.5 },
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
        <TText style={styles.appendixCaption}>
          {roleTh} / {roleEn}    {name}
        </TText>
        <TText style={styles.appendixSubCaption}>
          {isLessor ? "ใช้สำหรับปล่อยเช่าคอนโด" : "ใช้สำหรับเช่าคอนโด"}{" "}
          {projectName} ห้อง {unitNumber} เท่านั้น
        </TText>
      </View>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Clause renderer — turns a ContractClause + dynamic data dictionary into
// the corresponding PDF React tree based on the clause's type.
// ---------------------------------------------------------------------------

type ClauseDataMap = Record<string, string | number | null | undefined>;

function inlineRuns(text: string, data: ClauseDataMap): React.ReactNode {
  const substituted = applyPlaceholders(text, data);
  const runs = parseInlineFormatting(substituted);
  if (runs.length === 0) return null;
  if (runs.length === 1 && !runs[0].bold) return runs[0].text;
  return runs.map((run, i) =>
    run.bold ? <D key={i}>{run.text}</D> : <React.Fragment key={i}>{run.text}</React.Fragment>
  );
}

function renderClause(
  clause: ContractClause,
  data: ClauseDataMap,
  key: string | number
): React.ReactNode {
  const th = inlineRuns(clause.th, data);
  const en = inlineRuns(clause.en, data);

  switch (clause.type) {
    case "section_bar":
      return (
        <View key={key} style={styles.sectionBar} wrap={false}>
          <TText>
            {th} / {en}
          </TText>
        </View>
      );
    case "paragraph":
      return (
        <React.Fragment key={key}>
          <TText style={styles.paragraph}>{th}</TText>
          <TText style={styles.paragraph}>{en}</TText>
        </React.Fragment>
      );
    case "bullet":
      return (
        <Bullet key={key}>
          {th} / {en}
        </Bullet>
      );
    case "sub_bullet":
      return (
        <Bullet key={key} sub>
          {th} / {en}
        </Bullet>
      );
    case "small":
      return (
        <TText key={key} style={[styles.small, { marginTop: 4 }]}>
          {th} / {en}
        </TText>
      );
    default:
      return null;
  }
}

function ChecklistRow({ item, num }: { item: PdfChecklistItem; num: number }) {
  return (
    <View style={styles.checkRow} wrap={false}>
      <View style={styles.checkBox}>
        {item.checked && <View style={styles.checkInner} />}
      </View>
      <TText style={styles.checkText}>
        {num}) {item.th} ({item.en})
        {item.checked && item.qty ? ` × ${item.qty}` : ""}
      </TText>
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

  // Optional per-contract custom clauses appended after section 11.6.
  // Each clause is rendered as a numbered bullet (11.7, 11.8, ...).
  customClauses?: Array<{ th: string; en: string }>;

  // Effective clause list to render in the body of the agreement
  // (sections 2-11 text). The PDF route is responsible for merging the
  // standard clauses + global template overrides + per-contract overrides
  // and passing the resolved list here.
  clauses?: ContractClause[];

  lessorIdImage?: string | null;
  lesseeIdImage?: string | null;
  jointLesseeIdImage?: string | null;
}

const formatNum = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(n);

const D = ({ children }: { children: React.ReactNode }) => (
  <TText style={styles.boldHL}>{children}</TText>
);

const Bullet = ({ children, sub }: { children: React.ReactNode; sub?: boolean }) => (
  <TText style={[styles.paragraph, sub ? styles.subBullet : styles.bullet]}>
    {children}
  </TText>
);

export function ContractPdf({ data }: { data: ContractPdfData }) {
  return (
    <Document>
      {/* Main agreement — single Page; react-pdf wraps content automatically */}
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <TText style={styles.title}>สัญญาเช่า / Agreement</TText>
          <TText style={styles.subtitle}>{data.projectName}</TText>
        </View>

        <View style={styles.row}>
          <TText style={styles.label}>สัญญาฉบับนี้ทำขึ้นวันที่</TText>
          <TText style={styles.value}><D>{data.contractDateTh}</D></TText>
        </View>
        <View style={styles.row}>
          <TText style={styles.label}>Agreement is made on</TText>
          <TText style={styles.value}><D>{data.contractDateEn}</D></TText>
        </View>

        {/* Lessor */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <TText style={styles.label}>ผู้ให้เช่า / Lessor</TText>
          <TText style={styles.value}><D>{data.lessorName}</D></TText>
        </View>
        {data.lessorNationality && (
          <View style={styles.row}>
            <TText style={styles.label}>สัญชาติ / Nationality</TText>
            <TText style={styles.value}>{data.lessorNationality}</TText>
          </View>
        )}
        {data.lessorIdCard && (
          <View style={styles.row}>
            <TText style={styles.label}>หมายเลข ID</TText>
            <TText style={styles.value}><D>{data.lessorIdCard}</D></TText>
          </View>
        )}
        {data.lessorAddress && (
          <View style={styles.row}>
            <TText style={styles.label}>ที่อยู่ / Address</TText>
            <TText style={styles.value}>{data.lessorAddress}</TText>
          </View>
        )}
        {data.lessorPhone && (
          <View style={styles.row}>
            <TText style={styles.label}>โทรศัพท์ / Tel</TText>
            <TText style={styles.value}>{data.lessorPhone}</TText>
          </View>
        )}

        {/* Lessee */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <TText style={styles.label}>ผู้เช่า / Lessee</TText>
          <TText style={styles.value}><D>{data.lesseeName}</D></TText>
        </View>
        {data.lesseeNationality && (
          <View style={styles.row}>
            <TText style={styles.label}>สัญชาติ / Nationality</TText>
            <TText style={styles.value}>{data.lesseeNationality}</TText>
          </View>
        )}
        {data.lesseeIdCard && (
          <View style={styles.row}>
            <TText style={styles.label}>ID/Passport No.</TText>
            <TText style={styles.value}><D>{data.lesseeIdCard}</D></TText>
          </View>
        )}
        {data.lesseeAddress && (
          <View style={styles.row}>
            <TText style={styles.label}>ที่อยู่ / Address</TText>
            <TText style={styles.value}>{data.lesseeAddress}</TText>
          </View>
        )}
        {data.lesseePhone && (
          <View style={styles.row}>
            <TText style={styles.label}>โทรศัพท์ / Tel</TText>
            <TText style={styles.value}>{data.lesseePhone}</TText>
          </View>
        )}

        {/* Property description */}
        <TText style={[styles.paragraph, { marginTop: 10 }]}>
          โดยผู้ให้เช่าเป็นเจ้าของ <D>{data.projectName}</D> ห้องชุดเลขที่{" "}
          <D>{data.unitNumber}</D>
          {data.buildingName ? <>{" "}อาคาร <D>{data.buildingName}</D></> : null}
          {data.floorNumber ? <>{" "}ชั้น <D>{data.floorNumber}</D></> : null}
          {" "}ที่ตั้ง <D>{data.propertyAddress}</D>
          {data.sizeSqm != null ? <>{" "}ขนาดห้อง <D>{data.sizeSqm}</D> ตารางเมตร</> : null}
          {" "}ซึ่งรวมถึงอุปกรณ์ตกแต่งและเฟอร์นิเจอร์ ซึ่งต่อไปนี้เรียกว่า "ทรัพย์สิน"
        </TText>

        <TText style={styles.paragraph}>
          Whereas, Lessor is the owner of <D>{data.projectName}</D>, Unit number{" "}
          <D>{data.unitNumber}</D>
          {data.buildingName ? <>, Building <D>{data.buildingName}</D></> : null}
          {data.floorNumber ? <>, Floor <D>{data.floorNumber}</D></> : null},
          located at <D>{data.propertyAddress}</D>
          {data.sizeSqm != null ? <>, approximate area <D>{data.sizeSqm}</D> sqm.</> : null}{" "}
          and all premises including all fixtures and fittings hereinafter
          referred to as the "Premises".
        </TText>

        {/* Lessor desires + Lessee agrees */}
        <TText style={styles.paragraph}>
          ซึ่งผู้ให้เช่าต้องการให้เช่าและผู้เช่าตกลงจะเช่าทรัพย์สิน
          โดยทั้ง 2 ฝ่ายตกลงกันตามเงื่อนไขที่ระบุในสัญญานี้ดังต่อไปนี้
        </TText>
        <TText style={styles.paragraph}>
          Whereas the Lessor desires to let and the Lessee desires to rent the
          Premises under the terms and conditions set forth in this Agreement as
          follows:
        </TText>

        {/* Joint Lessee */}
        {data.jointLesseeName && (
          <>
            <View style={styles.sectionBar} wrap={false}>
              <TText>1. ผู้เช่าร่วม / Joint Lessee</TText>
            </View>
            <View style={styles.row}>
              <TText style={styles.label}>ชื่อ / Name</TText>
              <TText style={styles.value}><D>{data.jointLesseeName}</D></TText>
            </View>
            {data.jointLesseeNationality && (
              <View style={styles.row}>
                <TText style={styles.label}>สัญชาติ / Nationality</TText>
                <TText style={styles.value}>{data.jointLesseeNationality}</TText>
              </View>
            )}
            {data.jointLesseeIdCard && (
              <View style={styles.row}>
                <TText style={styles.label}>ID/Passport No.</TText>
                <TText style={styles.value}>{data.jointLesseeIdCard}</TText>
              </View>
            )}
            {data.jointLesseeAddress && (
              <View style={styles.row}>
                <TText style={styles.label}>ที่อยู่ / Address</TText>
                <TText style={styles.value}>{data.jointLesseeAddress}</TText>
              </View>
            )}
            {data.jointLesseePhone && (
              <View style={styles.row}>
                <TText style={styles.label}>โทรศัพท์ / Tel</TText>
                <TText style={styles.value}>{data.jointLesseePhone}</TText>
              </View>
            )}
          </>
        )}

        {/* Sections 2-11 — body text rendered from clause list (overrideable
            both globally via SiteSetting and per-contract via clauseOverrides).
            Inline structural blocks (bank account box, furniture/appliance/
            other-item checklists) are inserted after their anchor clauses. */}
        {(() => {
          const clauseDataMap: ClauseDataMap = {
            termMonths: data.termMonths,
            startDateTh: data.startDateTh,
            startDateEn: data.startDateEn,
            endDateTh: data.endDateTh,
            endDateEn: data.endDateEn,
            monthlyRent: formatNum(data.monthlyRent),
            monthlyRentText: data.monthlyRentText,
            paymentDay: data.paymentDay,
            latePaymentFee: formatNum(data.latePaymentFee),
            latePaymentFeeText: data.latePaymentFeeText,
            securityDeposit: formatNum(data.securityDeposit),
            securityDepositText: data.securityDepositText,
          };

          const hasBank =
            !!(
              data.bankName ||
              data.bankBranch ||
              data.bankAccountName ||
              data.bankAccountNumber
            );

          // Stacked bilingual rows — Thai label/value on top, English
          // label/value below. Matches the customer's reference layout
          // even when the form only stores a single value per field
          // (the value is shown in both rows).
          const bankBox = hasBank ? (
            <View style={styles.bankBox} wrap={false}>
              {data.bankName && (
                <>
                  <View style={styles.row}>
                    <TText style={styles.label}>ธนาคาร</TText>
                    <TText style={styles.value}>{data.bankName}</TText>
                  </View>
                  <View style={styles.row}>
                    <TText style={styles.label}>Bank</TText>
                    <TText style={styles.value}>{data.bankName}</TText>
                  </View>
                </>
              )}
              {data.bankBranch && (
                <>
                  <View style={styles.row}>
                    <TText style={styles.label}>สาขา</TText>
                    <TText style={styles.value}>{data.bankBranch}</TText>
                  </View>
                  <View style={styles.row}>
                    <TText style={styles.label}>Branch</TText>
                    <TText style={styles.value}>{data.bankBranch}</TText>
                  </View>
                </>
              )}
              {data.bankAccountName && (
                <>
                  <View style={styles.row}>
                    <TText style={styles.label}>ชื่อบัญชี</TText>
                    <TText style={styles.value}>{data.bankAccountName}</TText>
                  </View>
                  <View style={styles.row}>
                    <TText style={styles.label}>Account Name</TText>
                    <TText style={styles.value}>{data.bankAccountName}</TText>
                  </View>
                </>
              )}
              {data.bankAccountNumber && (
                <>
                  <View style={styles.row}>
                    <TText style={styles.label}>เลขที่บัญชี</TText>
                    <TText style={styles.value}>
                      <D>{data.bankAccountNumber}</D>
                    </TText>
                  </View>
                  <View style={styles.row}>
                    <TText style={styles.label}>Account Number</TText>
                    <TText style={styles.value}>
                      <D>{data.bankAccountNumber}</D>
                    </TText>
                  </View>
                </>
              )}
            </View>
          ) : null;

          const checklists = (
            <>
              {data.furnitureList.length > 0 && (
                <>
                  <TText style={[styles.boldHL, { marginTop: 6, marginBottom: 4 }]}>
                    10.1 เฟอร์นิเจอร์ / Furniture
                  </TText>
                  {data.furnitureList.map((item, i) => (
                    <ChecklistRow key={`f-${i}`} item={item} num={i + 1} />
                  ))}
                </>
              )}
              {data.applianceList.length > 0 && (
                <>
                  <TText style={[styles.boldHL, { marginTop: 6, marginBottom: 4 }]}>
                    10.2 เครื่องใช้ไฟฟ้า / Electrical Appliances
                  </TText>
                  {data.applianceList.map((item, i) => (
                    <ChecklistRow key={`a-${i}`} item={item} num={i + 1} />
                  ))}
                </>
              )}
              {data.otherItems.length > 0 && (
                <>
                  <TText style={[styles.boldHL, { marginTop: 6, marginBottom: 4 }]}>
                    10.3 รายการอื่นๆ / Other Items
                  </TText>
                  {data.otherItems.map((item, i) => (
                    <ChecklistRow key={`o-${i}`} item={item} num={i + 1} />
                  ))}
                </>
              )}
            </>
          );

          return (data.clauses || []).map((clause) => {
            const node = renderClause(clause, clauseDataMap, clause.key);
            if (clause.key === "3.1" && bankBox) {
              return (
                <React.Fragment key={clause.key}>
                  {node}
                  {bankBox}
                </React.Fragment>
              );
            }
            if (clause.key === "10.intro") {
              return (
                <React.Fragment key={clause.key}>
                  {node}
                  {checklists}
                </React.Fragment>
              );
            }
            return <React.Fragment key={clause.key}>{node}</React.Fragment>;
          });
        })()}

        {/* Per-contract custom clauses, numbered 11.7, 11.8, ... */}
        {data.customClauses?.map((c, i) => {
          const num = `11.${i + 7}`;
          const th = c.th?.trim();
          const en = c.en?.trim();
          if (!th && !en) return null;
          const body = th && en ? `${th} / ${en}` : th || en;
          return <Bullet key={`cc-${i}`}>{`${num} ${body}`}</Bullet>;
        })}

        {/* Closing + Signatures — wrap together so signatures never split off */}
        <View wrap={false} style={{ marginTop: 12 }}>
          <TText style={[styles.paragraph, { fontSize: 9 }]}>
            สัญญาฉบับนี้ทำขึ้น 2 ฉบับ มีข้อความตรงกัน ผู้ให้เช่าและผู้เช่าถือไว้คนละฉบับ
            ทั้งสองฝ่ายได้อ่านและเห็นว่าถูกต้องตามวัตถุประสงค์ของทั้ง 2 ฝ่าย
            จึงลงลายมือชื่อไว้ต่อหน้าพยาน /
            This Agreement is made in duplicates with identical contents, one
            copy held by each party. Both parties have read and agree, signing
            in the presence of witnesses.
          </TText>

          <View style={styles.twoCol}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <TText style={styles.small}>ผู้ให้เช่า / Lessor</TText>
              <TText style={styles.boldHL}>({data.lessorName})</TText>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <TText style={styles.small}>ผู้เช่า / Lessee</TText>
              <TText style={styles.boldHL}>({data.lesseeName})</TText>
            </View>
          </View>

          <View style={[styles.twoCol, { marginTop: 36 }]}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <TText style={styles.small}>พยาน / Witness</TText>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <TText style={styles.small}>พยาน / Witness</TText>
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
