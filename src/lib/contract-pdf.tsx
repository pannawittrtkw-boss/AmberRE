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
    // Bottom padding leaves room for the per-page signature footer (see
    // styles.pageFooter) which is positioned absolutely at the bottom of
    // every page so both parties can initial each page individually.
    paddingBottom: 80,
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
  // Per-page initial-signature footer. Rendered with `fixed` so it
  // appears on every page of the parent <Page>. Positioned absolutely
  // inside the page's bottom padding (paddingBottom: 80) so document
  // content doesn't overlap.
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 50,
    right: 50,
    flexDirection: "row",
    gap: 30,
  },
  pageFooterBlock: { flex: 1, alignItems: "center" },
  pageFooterLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#000",
    width: "85%",
    height: 18,
    marginBottom: 2,
  },
  pageFooterLabel: { fontSize: 8, color: "#555" },
  pageFooterName: { fontSize: 8, color: "#222", fontWeight: "bold" },
  // Single centered signature block at the bottom of an ID-card appendix
  // page. Width keeps the line short enough to look intentional; the top
  // margin gives physical room to actually sign.
  appendixSignature: {
    marginTop: 60,
    alignItems: "center",
    width: 260,
  },
  // Items table (sections 10.1 / 10.2 / 10.3) — Listing | Qty.
  itemTable: {
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#666",
  },
  itemTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    borderBottomWidth: 0.5,
    borderBottomColor: "#666",
  },
  itemTableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.3,
    borderBottomColor: "#ccc",
  },
  itemTableCellNo: {
    width: 36,
    paddingVertical: 3,
    paddingHorizontal: 4,
    textAlign: "center",
    borderRightWidth: 0.3,
    borderRightColor: "#ccc",
  },
  itemTableCellListing: {
    flex: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRightWidth: 0.3,
    borderRightColor: "#ccc",
  },
  itemTableCellQty: {
    width: 60,
    paddingVertical: 3,
    paddingHorizontal: 6,
    textAlign: "center",
  },
  itemTableHeaderText: {
    fontWeight: "bold",
    fontSize: 9,
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

        {/* Signature for THIS party only — centered below the caption with
            breathing room above the line so it can actually be signed. */}
        <View style={styles.appendixSignature}>
          <View style={styles.signatureLine} />
          <TText style={styles.small}>
            {roleTh} / {roleEn}
          </TText>
          <TText style={styles.boldHL}>({name})</TText>
        </View>
      </View>
    </Page>
  );
}

// Per-page initial-signature footer. Pure static — repeats on every page
// via `fixed` and pins to the bottom via `position: absolute` (driven by
// `styles.pageFooter`). DO NOT add a `render` prop to this View or to its
// children: combining `fixed` + `position: absolute` + `render` in
// react-pdf v4 causes the footer to drop into flow on body pages and
// land at the TOP of the NEXT page instead of the current page's bottom.
// The "hide on formal-signature page" requirement is achieved instead by
// the FooterCover below, which paints a white block over the footer on
// the very last sub-page.
function PageFooter({
  lessorName,
  lesseeName,
}: {
  lessorName: string;
  lesseeName: string;
}) {
  return (
    <View style={styles.pageFooter} fixed>
      <View style={styles.pageFooterBlock}>
        <View style={styles.pageFooterLine} />
        <TText style={styles.pageFooterLabel}>ผู้ให้เช่า / Lessor</TText>
        <TText style={styles.pageFooterName}>({lessorName})</TText>
      </View>
      <View style={styles.pageFooterBlock}>
        <View style={styles.pageFooterLine} />
        <TText style={styles.pageFooterLabel}>ผู้เช่า / Lessee</TText>
        <TText style={styles.pageFooterName}>({lesseeName})</TText>
      </View>
    </View>
  );
}

// Whitewashes the footer area on the LAST sub-page of the main agreement
// (the page that carries the formal Lessor/Lessee/Witness block). The
// cover always renders; its inner `View` becomes opaque white only on
// the final sub-page, hiding the static PageFooter underneath. Returning
// JSX (never `null`) from `render` keeps react-pdf's pagination stable
// — the same fragility that prevents us from hiding PageFooter directly.
function FooterCover() {
  const finalSubPage = (p: unknown): boolean => {
    const r = p as { subPageNumber?: number; subPageTotalPages?: number };
    return (
      typeof r.subPageNumber === "number" &&
      typeof r.subPageTotalPages === "number" &&
      r.subPageNumber === r.subPageTotalPages
    );
  };
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
      }}
      render={(p) => (
        <View
          style={{
            flex: 1,
            backgroundColor: "white",
            opacity: finalSubPage(p) ? 1 : 0,
          }}
        />
      )}
    />
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
        <View key={key} style={{ marginBottom: 3 }} wrap={false}>
          <TText style={[styles.paragraph, styles.bullet, { marginBottom: 0 }]}>
            {th}
          </TText>
          <TText style={[styles.paragraph, styles.bullet, { marginBottom: 0 }]}>
            {en}
          </TText>
        </View>
      );
    case "sub_bullet":
      return (
        <View key={key} style={{ marginBottom: 3 }} wrap={false}>
          <TText style={[styles.paragraph, styles.subBullet, { marginBottom: 0 }]}>
            {th}
          </TText>
          <TText style={[styles.paragraph, styles.subBullet, { marginBottom: 0 }]}>
            {en}
          </TText>
        </View>
      );
    case "small":
      return (
        <View key={key} style={{ marginTop: 4 }} wrap={false}>
          <TText style={[styles.small, { marginBottom: 0 }]}>{th}</TText>
          <TText style={styles.small}>{en}</TText>
        </View>
      );
    default:
      return null;
  }
}

// Tabular renderer for sections 10.1 / 10.2 / 10.3. Every catalog row is
// kept so the table doubles as a checklist of what's NOT included; the
// Qty column shows the agreed count for ticked items and "-" for the
// rest. Header row is bilingual (TH / EN); rows are numbered
// sequentially in the leading "No." column.
//
// Pagination: the outer table wraps freely so as much of the list as
// possible stays on the same page as its section heading. Individual
// rows are `wrap={false}` so a single row never splits across pages.
// react-pdf v4 has no native "repeat header on continuation" feature —
// the header is printed once at the top; on a page break the rows just
// continue without a repeated header. We tried chunked render-with-
// own-header (each chunk wrap={false}) but it pushed the whole first
// chunk to the next page when the section heading sat near the bottom
// of the previous page, leaving the heading orphaned with empty space
// underneath — which the user explicitly rejected.
function ItemTable({ items }: { items: PdfChecklistItem[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.itemTable}>
      <View style={styles.itemTableHeader} wrap={false}>
        <View style={styles.itemTableCellNo}>
          <TText style={[styles.itemTableHeaderText, { textAlign: "center" }]}>
            No.
          </TText>
        </View>
        <View style={styles.itemTableCellListing}>
          <TText style={styles.itemTableHeaderText}>รายการ / Listing</TText>
        </View>
        <View style={styles.itemTableCellQty}>
          <TText style={[styles.itemTableHeaderText, { textAlign: "center" }]}>
            จำนวน / Qty
          </TText>
        </View>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.itemTableRow} wrap={false}>
          <View style={styles.itemTableCellNo}>
            <TText style={{ textAlign: "center" }}>{i + 1}</TText>
          </View>
          <View style={styles.itemTableCellListing}>
            <TText>
              {item.th} / {item.en}
            </TText>
          </View>
          <View style={styles.itemTableCellQty}>
            <TText style={{ textAlign: "center" }}>
              {item.checked && item.qty ? item.qty : "-"}
            </TText>
          </View>
        </View>
      ))}
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
  lessorNameEn?: string | null;
  lessorNationality?: string | null;
  lessorIdCard?: string | null;
  lessorAddress?: string | null;
  lessorAddressEn?: string | null;
  lessorPhone?: string | null;

  lesseeName: string;
  lesseeNameEn?: string | null;
  lesseeNationality?: string | null;
  lesseeIdCard?: string | null;
  lesseeAddress?: string | null;
  lesseeAddressEn?: string | null;
  lesseePhone?: string | null;

  jointLesseeName?: string | null;
  jointLesseeNameEn?: string | null;
  jointLesseeNationality?: string | null;
  jointLesseeIdCard?: string | null;
  jointLesseeAddress?: string | null;
  jointLesseeAddressEn?: string | null;
  jointLesseePhone?: string | null;

  projectName: string;
  unitNumber: string;
  buildingName?: string | null;
  floorNumber?: string | null;
  propertyAddress: string;
  propertyAddressEn?: string | null;
  sizeSqm?: number | null;

  monthlyRent: number;
  monthlyRentText: string;
  paymentDay: number;
  bankName?: string | null;
  bankBranch?: string | null;
  bankBranchEn?: string | null;
  bankAccountName?: string | null;
  bankAccountNameEn?: string | null;
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

        {/* Lessor — TH and EN stacked. EN value falls back to TH when no
            English version was entered, so the contract still renders. */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <TText style={styles.label}>ผู้ให้เช่า</TText>
          <TText style={styles.value}><D>{data.lessorName}</D></TText>
        </View>
        <View style={styles.row}>
          <TText style={styles.label}>Lessor</TText>
          <TText style={styles.value}>
            <D>{data.lessorNameEn || data.lessorName}</D>
          </TText>
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
            <TText style={styles.label}>ที่อยู่</TText>
            <TText style={styles.value}>{data.lessorAddress}</TText>
          </View>
        )}
        {(data.lessorAddressEn || data.lessorAddress) && (
          <View style={styles.row}>
            <TText style={styles.label}>Address</TText>
            <TText style={styles.value}>
              {data.lessorAddressEn || data.lessorAddress}
            </TText>
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
          <TText style={styles.label}>ผู้เช่า</TText>
          <TText style={styles.value}><D>{data.lesseeName}</D></TText>
        </View>
        <View style={styles.row}>
          <TText style={styles.label}>Lessee</TText>
          <TText style={styles.value}>
            <D>{data.lesseeNameEn || data.lesseeName}</D>
          </TText>
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
            <TText style={styles.label}>ที่อยู่</TText>
            <TText style={styles.value}>{data.lesseeAddress}</TText>
          </View>
        )}
        {(data.lesseeAddressEn || data.lesseeAddress) && (
          <View style={styles.row}>
            <TText style={styles.label}>Address</TText>
            <TText style={styles.value}>
              {data.lesseeAddressEn || data.lesseeAddress}
            </TText>
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
          located at <D>{data.propertyAddressEn || data.propertyAddress}</D>
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
              <TText style={styles.label}>ชื่อ</TText>
              <TText style={styles.value}><D>{data.jointLesseeName}</D></TText>
            </View>
            <View style={styles.row}>
              <TText style={styles.label}>Name</TText>
              <TText style={styles.value}>
                <D>{data.jointLesseeNameEn || data.jointLesseeName}</D>
              </TText>
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
                <TText style={styles.label}>ที่อยู่</TText>
                <TText style={styles.value}>{data.jointLesseeAddress}</TText>
              </View>
            )}
            {(data.jointLesseeAddressEn || data.jointLesseeAddress) && (
              <View style={styles.row}>
                <TText style={styles.label}>Address</TText>
                <TText style={styles.value}>
                  {data.jointLesseeAddressEn || data.jointLesseeAddress}
                </TText>
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
                    <TText style={styles.value}>
                      {data.bankBranchEn || data.bankBranch}
                    </TText>
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
                    <TText style={styles.value}>
                      {data.bankAccountNameEn || data.bankAccountName}
                    </TText>
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
                  <ItemTable items={data.furnitureList} />
                </>
              )}
              {data.applianceList.length > 0 && (
                <>
                  <TText style={[styles.boldHL, { marginTop: 6, marginBottom: 4 }]}>
                    10.2 เครื่องใช้ไฟฟ้า / Electrical Appliances
                  </TText>
                  <ItemTable items={data.applianceList} />
                </>
              )}
              {data.otherItems.length > 0 && (
                <>
                  <TText style={[styles.boldHL, { marginTop: 6, marginBottom: 4 }]}>
                    10.3 รายการอื่นๆ / Other Items
                  </TText>
                  <ItemTable items={data.otherItems} />
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
          // Stack TH then EN like the standard bullets so the bilingual
          // pairing reads consistently across all sections.
          return (
            <View key={`cc-${i}`} style={{ marginBottom: 3 }} wrap={false}>
              {th && (
                <TText style={[styles.paragraph, styles.bullet, { marginBottom: 0 }]}>
                  {`${num} ${th}`}
                </TText>
              )}
              {en && (
                <TText style={[styles.paragraph, styles.bullet, { marginBottom: 0 }]}>
                  {`${num} ${en}`}
                </TText>
              )}
            </View>
          );
        })}

        {/* Closing + formal signatures — wrap together so the signature
            block never splits across pages. Lives in the main Page wrap so
            it stays on the same page as the tail of section 11. */}
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

        <PageFooter
          lessorName={data.lessorName}
          lesseeName={data.lesseeName}
        />
        {/* Hides the footer on the formal-signature sub-page only. */}
        <FooterCover />
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
