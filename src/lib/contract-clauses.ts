// Editable clauses of the standard rental contract.
//
// Structure
// ---------
// The PDF contract is a mix of two layers:
//
//   1. **Layout structure** — section bars, the lessor/lessee row tables,
//      the bank account box, the furniture/appliance/other-item checklists,
//      the signature blocks, and the ID-card appendix. These stay
//      hard-coded inside `contract-pdf.tsx` because they are layout, not
//      copy.
//
//   2. **Editable copy** — the bullets and paragraphs inside sections 4-11
//      plus the section bar titles and the assorted small-print notes. All
//      of these live here as a flat clause list. Each clause carries:
//        - a stable `key` (e.g. "5.1") used for overrides
//        - a `type` controlling render style (bullet / paragraph / etc.)
//        - bilingual `th` / `en` text with optional `{{placeholder}}` and
//          `**bold**` markup
//
// Storage
// -------
// The full STANDARD_CLAUSES list is the source of truth. Per-contract and
// per-site overrides are stored as JSON maps `{ key: { th?, en? } }`.
// Renderers merge: STANDARD_CLAUSES → site template overrides →
// contract overrides. Each layer wins over the layer above when present.

export type ClauseType =
  | "section_bar" // the black bar with section title (e.g. "5. ข้อตกลง...")
  | "paragraph" // full-width body paragraph
  | "bullet" // numbered item, indented
  | "sub_bullet" // more deeply indented (e.g. 7.1 I., II., III.)
  | "small"; // smaller-font note paragraph

export interface ContractClause {
  key: string;
  type: ClauseType;
  th: string;
  en: string;
}

// Per-clause override: optionally override Thai or English text only.
// Empty/missing fields fall through to the layer below.
export interface ClauseOverride {
  th?: string;
  en?: string;
}

export type ClauseOverrideMap = Record<string, ClauseOverride>;

export const DEFAULT_CLAUSES_SETTING_KEY = "contract_default_clauses";
export const CLAUSE_OVERRIDES_SETTING_KEY = "contract_clause_overrides";

// ---------------------------------------------------------------------------
// Standard clause text (matches the original hard-coded copy verbatim).
// Placeholders supported in `th` / `en`:
//   {{termMonths}}, {{startDateTh}}, {{startDateEn}}, {{endDateTh}}, {{endDateEn}},
//   {{monthlyRent}}, {{monthlyRentText}}, {{paymentDay}},
//   {{latePaymentFee}}, {{latePaymentFeeText}},
//   {{securityDeposit}}, {{securityDepositText}}
// Bold runs are wrapped in **double asterisks**.
// ---------------------------------------------------------------------------

export const STANDARD_CLAUSES: ContractClause[] = [
  // Section 2 — Lease Term
  {
    key: "section.2",
    type: "section_bar",
    th: "2. ระยะเวลาเช่า",
    en: "LEASE TERM",
  },
  {
    key: "2.1.th",
    type: "paragraph",
    th: "ระยะเวลาเช่ากำหนดไว้เป็นเวลา **{{termMonths}}** เดือน โดยเริ่มสัญญาวันที่ **{{startDateTh}}** สิ้นสุดวันที่ **{{endDateTh}}**",
    en: "The term of this Agreement shall be for a period of **{{termMonths}}** months, commencing from **{{startDateEn}}** and expiring on **{{endDateEn}}**.",
  },

  // Section 3 — Rental
  {
    key: "section.3",
    type: "section_bar",
    th: "3. ค่าเช่าและค่าส่วนกลาง",
    en: "RENTAL AND COMMON PROPERTIES FEES",
  },
  {
    key: "3.1",
    type: "paragraph",
    th: "3.1 ค่าเช่าคิดเป็นจำนวนเงินเดือนละ **{{monthlyRent}}** บาท **({{monthlyRentText}})** และชำระล่วงหน้าหรือไม่เกินวันที่ **{{paymentDay}}** ของทุกเดือน ชำระโดยโอนเงินเข้าบัญชีธนาคารผู้ให้เช่า ตามรายละเอียดดังนี้:",
    en: "3.1 The rent shall be **{{monthlyRent}}** Baht per month and shall be paid in advance or within day **{{paymentDay}}** of each calendar month by wiring such money to the lessor's bank account as follows:",
  },
  {
    key: "3.2",
    type: "paragraph",
    th: "3.2 ผู้เช่าได้ชำระค่าเช่าสำหรับเดือนแรกของสัญญาเรียบร้อยแล้วในวันทำสัญญาฉบับนี้",
    en: "3.2 The first payment of the rent is paid on the execution of this Agreement.",
  },
  {
    key: "3.3",
    type: "paragraph",
    th: "3.3 ผู้ให้เช่าเป็นผู้ชำระค่าส่วนกลางที่เรียกเก็บโดยนิติบุคคลของโครงการคอนโด",
    en: "3.3 The lessor pays the common fees collected by the project's juristic person.",
  },
  {
    key: "3.4",
    type: "paragraph",
    th: "3.4 กรณีผู้เช่าชำระค่าเช่าเกินกำหนด ผู้ให้เช่ามีสิทธิ์เรียกค่าเบี้ยปรับเป็นเงินวันละ **{{latePaymentFee}}** บาท ({{latePaymentFeeText}}) โดยผู้เช่าต้องชำระพร้อมค่าเช่าที่ติดค้างให้แก่ผู้ให้เช่า",
    en: "3.4 If Lessee delays the rental payment, Lessee will be charged at **{{latePaymentFee}}** Baht per day overdue, payable together with the outstanding rent.",
  },
  {
    key: "3.5",
    type: "paragraph",
    th: "3.5 หลังจากโอนเงินค่าเช่ารายเดือนแล้ว กรุณาส่งข้อความให้ผู้ให้เช่ารับทราบด้วย",
    en: "3.5 After transferring the monthly rent, please notify the lessor.",
  },

  // Section 4 — Security Deposit
  {
    key: "section.4",
    type: "section_bar",
    th: "4. เงินประกันสัญญา",
    en: "SECURITY DEPOSIT",
  },
  {
    key: "4.1",
    type: "paragraph",
    th: "4.1 ในวันที่ลงนามในสัญญาฉบับนี้ ผู้เช่าได้ชำระเงินประกันให้แก่ผู้ให้เช่าเป็นจำนวน **{{securityDeposit}}** บาท ({{securityDepositText}}) ซึ่งต่อไปนี้เรียกว่า \"เงินประกันสัญญา\" ซึ่งเงินจำนวนดังกล่าวผู้ให้เช่าจะเก็บไว้ตลอดอายุของสัญญาโดยไม่มีดอกเบี้ยใดๆ เพื่อเป็นประกันความเสียหายที่อาจเกิดขึ้นในกรณีที่ผู้เช่าละเมิดข้อตกลงที่ระบุไว้ในสัญญาฉบับนี้",
    en: "4.1 Upon the execution of this Agreement, the Lessee deposits with the Lessor **{{securityDeposit}}** Baht as Security Deposit, held by the Lessor without interest as security for breaches and damages that may occur if the Lessee breaches this Agreement.",
  },
  {
    key: "4.2",
    type: "paragraph",
    th: "4.2 ผู้ให้เช่าจะชำระคืนเงินประกันสัญญาให้แก่ผู้เช่าโดยไม่มีดอกเบี้ย ภายใน 30 วัน นับจากวันสิ้นสุดสัญญา หลังจากได้หักหนี้ค่าเช่าค้างชำระ ค่าเสียหาย หรือค่าความสูญเสียใดๆ ที่เกิดแก่ผู้ให้เช่าอันเนื่องมาจากผู้เช่าผิดสัญญา",
    en: "4.2 The Security Deposit shall be returned to the Lessee without interest within 30 days upon termination after deduction of any outstanding rent, damages, or losses caused by the Lessee's breach.",
  },
  {
    key: "4.3",
    type: "paragraph",
    th: "4.3 ผู้ให้เช่าได้รับเงินประกันสัญญาจากผู้เช่าไว้แล้วในที่นี้",
    en: "4.3 The Lessor hereby acknowledges receipt of the Security Deposit.",
  },
  {
    key: "4.4",
    type: "paragraph",
    th: "4.4 เงินประกันสัญญาไม่สามารถนำมาชำระแทนค่าเช่า หรือถือว่าเป็นค่าเช่าล่วงหน้า และผู้เช่าไม่สามารถนำมาเป็นข้ออ้างในการไม่ชำระค่าเช่าตามสัญญานี้ได้",
    en: "4.4 The Security Deposit shall not be considered as rent or prepayment of any rent, nor used as an excuse to withhold rent.",
  },
  {
    key: "4.5",
    type: "paragraph",
    th: "4.5 สัญญาฉบับนี้จะสมบูรณ์ต่อเมื่อผู้ให้เช่าได้รับเงินค่าเช่าเดือนแรกตามข้อ 3.2 และเงินประกันสัญญาตามข้อ 4.1 จากผู้เช่าอย่างครบถ้วนเรียบร้อยแล้ว",
    en: "4.5 This Agreement shall be legally valid only when the Lessor has received the first month's rent (Clause 3.2) and the Security Deposit (Clause 4.1) in full.",
  },
  {
    key: "4.6",
    type: "paragraph",
    th: "4.6 กรณีผู้เช่าอยู่ไม่ครบอายุสัญญาเช่าตามกำหนด ทางผู้ให้เช่าขอสงวนสิทธิ์ในการคืนเงินประกันสัญญาให้แก่ผู้เช่า",
    en: "4.6 If the Lessee does not complete the lease term, the Lessor reserves the right to forfeit the Security Deposit.",
  },

  // Section 5 — Lessee's Covenants
  {
    key: "section.5",
    type: "section_bar",
    th: "5. ข้อตกลงของผู้เช่า",
    en: "LESSEE'S COVENANTS",
  },
  { key: "5.1", type: "bullet", th: "5.1 ชำระค่าเช่าและเงินอื่นๆ ตามที่ระบุไว้ในสัญญานี้อย่างครบถ้วนตามเวลาที่ระบุไว้ตลอดอายุสัญญา", en: "To punctually pay the rents and other sums during the entire lease term." },
  { key: "5.2", type: "bullet", th: "5.2 ปฏิบัติตามข้อตกลงในสัญญาฉบับนี้และข้อกำหนดของนิติบุคคลของโครงการอย่างเคร่งครัด", en: "Strictly comply with this Agreement and the Juristic Person's rules." },
  { key: "5.3", type: "bullet", th: "5.3 ใช้ทรัพย์สินเพื่อการอยู่อาศัยเท่านั้น ห้ามเจาะ ตอก ติด ตรึง สิ่งของใดกับผนังห้อง หากละเมิดปรับจุดละ 1,000 บาท", en: "Residential use only. No drilling, nailing, or attaching items to walls. Fine: 1,000 THB per violation." },
  { key: "5.4", type: "bullet", th: "5.4 ดูแลและบำรุงรักษาเครื่องใช้ไฟฟ้าและทรัพย์สินทุกชนิดด้วยค่าใช้จ่ายของผู้เช่าเอง โดยรับผิดชอบงานเล็กน้อย (ค่าใช้จ่ายไม่เกิน 600 บาท/เดือน) เช่น เปลี่ยนหลอดไฟ ทำความสะอาดทั่วไป", en: "Tenant is responsible for minor repairs not exceeding 600 THB/month (e.g., light bulbs, general cleaning)." },
  { key: "5.5", type: "bullet", th: "5.5 ชำระค่าสาธารณูปโภค ไฟฟ้า น้ำประปา โทรศัพท์ อินเตอร์เน็ต และค่าสาธารณูปโภคอื่นๆ ตลอดอายุสัญญา หากละเลยถือเป็นการผิดสัญญา", en: "Pay all utilities (electricity, water, telephone, internet) on time. Failure to do so is a breach." },
  { key: "5.6", type: "bullet", th: "5.6 ไม่ต่อเติม ดัดแปลง หรือเปลี่ยนแปลงทรัพย์สินโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร และต้องคืนสภาพเดิมหากผู้ให้เช่าเรียกร้อง", en: "No modifications without prior written consent; restore on Lessor's request." },
  { key: "5.7", type: "bullet", th: "5.7 สิ่งที่ต่อเติมยึดติดกับทรัพย์สินถือเป็นกรรมสิทธิ์ของผู้ให้เช่าเมื่อสัญญาสิ้นสุด", en: "Fixtures become Lessor's property upon expiration." },
  { key: "5.8", type: "bullet", th: "5.8 ไม่ใช้ทรัพย์สินเพื่อวัตถุประสงค์ที่ผิดศีลธรรมหรือผิดกฎหมาย", en: "No illegal or immoral activities." },
  { key: "5.9", type: "bullet", th: "5.9 ไม่ปล่อยเช่าช่วงทรัพย์สินหรือถ่ายโอนสิทธิตามสัญญานี้ให้ผู้อื่นโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร", en: "No subletting or assignment without prior written consent." },
  { key: "5.10", type: "bullet", th: "5.10 ไม่กระทำการอันใดที่ก่อให้เกิดความรำคาญหรือล่วงละเมิดผู้เช่าอื่นในอาคารและผู้พักอาศัยใกล้เคียง", en: "No nuisance or interference with neighbors." },
  { key: "5.11", type: "bullet", th: "5.11 แจ้งความเสียหายหรือความบกพร่องที่เกิดกับทรัพย์สินภายใน 7 วันนับจากวันที่พบ", en: "Notify Lessor of damages within 7 days of occurrence." },
  { key: "5.12", type: "bullet", th: "5.12 รับผิดชอบความเสียหายที่เกิดจากผู้เช่าหรือบริวาร ลูกจ้าง ผู้รับเหมา ครอบครัวของผู้เช่า ด้วยค่าใช้จ่ายของผู้เช่าทั้งสิ้น", en: "Responsible for damages caused by self, family, servants, or contractors at own cost." },
  { key: "5.13", type: "bullet", th: "5.13 ไม่ติด แขวน แสดง หรือปิดป้ายหรือสิ่งใดทั้งภายในและภายนอกทรัพย์สินหรืออาคารหรือผ่านทางหน้าต่าง", en: "No signs/posters anywhere on or through the windows of the Premises." },
  { key: "5.14", type: "bullet", th: "5.14 ไม่นำวัสดุไวไฟ แก๊สหุงต้ม ระเบิด กรด อัลคาไลน์ วัตถุอันตราย สิ่งผิดกฎหมาย หรือวัสดุที่มีน้ำหนักเกิน 200 กก./ตร.ม. เข้ามาเก็บในทรัพย์สิน", en: "No flammables, gas, explosives, hazardous chemicals, illegal goods, or items over 200 kg/sqm load." },
  { key: "5.15", type: "bullet", th: "5.15 ส่งมอบกุญแจทั้งหมดที่เกี่ยวข้องกับทรัพย์สินให้แก่ผู้ให้เช่าในวันที่สัญญาเช่าสิ้นสุด", en: "Return all keys to the Lessor on the expiry/termination date." },
  { key: "5.16", type: "bullet", th: "5.16 ไม่นำสัตว์เลี้ยงไว้ในทรัพย์สิน และไม่สูบบุหรี่ในห้องหรือบนระเบียง", en: "No pets in the Premises; no smoking inside the room or on the balcony." },
  { key: "5.17", type: "bullet", th: "5.17 ก่อนย้ายออกผู้เช่าต้องทำความสะอาดห้องพักและส่งมอบห้องในสภาพเรียบร้อยตามสภาพปกติให้แก่ผู้ให้เช่า", en: "Before moving out, clean and return the unit in good condition (subject to normal wear and tear)." },

  // Section 6 — Lessor's Covenants
  {
    key: "section.6",
    type: "section_bar",
    th: "6. ข้อตกลงของผู้ให้เช่า",
    en: "LESSOR'S COVENANTS",
  },
  { key: "6.1", type: "bullet", th: "6.1 ผู้ให้เช่ารับรองและรับประกันว่าเป็นผู้มีอำนาจปล่อยเช่าทรัพย์สินโดยถูกต้องภายใต้กฎหมายและข้อบังคับทั้งหลาย", en: "The Lessor warrants the absolute right to lease the Premises under applicable laws." },
  { key: "6.2", type: "bullet", th: "6.2 หากผู้เช่าชำระค่าเช่าและปฏิบัติตามข้อตกลงครบถ้วน ผู้เช่าจะสามารถครอบครองและใช้ทรัพย์สินได้อย่างสงบสุขโดยไม่มีการรบกวนจากผู้ให้เช่าหรือตัวแทนตลอดอายุสัญญาและเวลาที่ขยายออกไป", en: "The Lessee, paying rent and observing covenants, shall peacefully hold and enjoy the Premises during the term and any extension." },
  { key: "6.3", type: "bullet", th: "6.3 ผู้ให้เช่าต้องบำรุงรักษาทรัพย์สินด้วยค่าใช้จ่ายของผู้ให้เช่าเองให้อยู่ในสภาพพักอาศัยและใช้งานได้ตามปกติ และต้องดูแลซ่อมแซมส่วนที่เสียหายในงานหลัก เช่น โครงสร้าง ระบบไฟฟ้า ประปา สายไฟและเคเบิ้ล สี ระบบน้ำเสีย ท่อน้ำทิ้ง บ่อพักน้ำ ท่อระบายน้ำ และระบบเครื่องปรับอากาศ", en: "The Lessor shall, at own cost, maintain the Premises in habitable and usable condition and promptly make all major repairs (structure, electrical, plumbing, drainage, A/C system)." },

  // Section 7 — Termination
  {
    key: "section.7",
    type: "section_bar",
    th: "7. การบอกเลิกสัญญา",
    en: "TERMINATION OF AGREEMENT",
  },
  { key: "7.1", type: "bullet", th: "7.1 ผู้ให้เช่าสามารถบอกเลิกสัญญาฉบับนี้ได้เมื่อผู้เช่าผิดสัญญาในกรณีดังต่อไปนี้", en: "The Lessor may terminate this Agreement upon any of the following events:" },
  { key: "7.1.I", type: "sub_bullet", th: "I. ผู้เช่าไม่ชำระค่าเช่าหรือค่าใช้จ่ายอื่นๆ ให้ครบตรงตามเวลาที่ระบุไว้ในสัญญานี้", en: "I. The Lessee defaults in any payments required hereunder." },
  { key: "7.1.II", type: "sub_bullet", th: "II. ผู้เช่าฝ่าฝืนหรือไม่ปฏิบัติตามข้อตกลงข้อหนึ่งข้อใดที่ระบุไว้ในสัญญานี้", en: "II. The Lessee violates any term or condition of this Agreement." },
  { key: "7.1.III", type: "sub_bullet", th: "III. ผู้เช่าเป็นบุคคลล้มละลายตามกฎหมาย", en: "III. The Lessee is adjudicated bankrupt." },
  { key: "7.1.IV", type: "sub_bullet", th: "IV. หากส่วนหนึ่งส่วนใดของทรัพย์สินไม่สามารถใช้พักอาศัยได้ อันเนื่องมาจากอัคคีภัย ข้อห้ามตามกฎหมาย ข้อกำหนดผังเมือง การเวนคืน หรือคำสั่งของหน่วยงานรัฐ", en: "IV. All or part of the Premises is condemned, damaged by fire, or subject to legal restriction or expropriation." },
  { key: "7.2", type: "bullet", th: "7.2 ผู้ให้เช่าสามารถบอกเลิกสัญญาโดยแจ้งเป็นลายลักษณ์อักษรล่วงหน้าไม่น้อยกว่า 15 วัน", en: "15-day written notice required." },
  { key: "7.3", type: "bullet", th: "7.3 หากการบอกเลิกเกิดจาก 7.1 (I), (II) หรือ (III) ผู้ให้เช่ามีสิทธิ์ริบเงินประกันสัญญาและเรียกร้องค่าเสียหายเพิ่มเติม", en: "Termination under 7.1(I)–(III) — Lessor may forfeit deposit and claim damages." },
  { key: "7.4", type: "bullet", th: "7.4 หากการบอกเลิกเกิดจาก 7.1 (IV) ทั้งสองฝ่ายไม่มีสิทธิ์เรียกร้องค่าเสียหาย และผู้ให้เช่าต้องคืนเงินประกันภายใน 30 วัน", en: "Termination under 7.1(IV) — neither party may claim damages; deposit returned within 30 days." },
  { key: "7.5", type: "bullet", th: "7.5 หากผู้เช่าต้องการต่อสัญญา ต้องแจ้งเป็นลายลักษณ์อักษรล่วงหน้าไม่น้อยกว่า 30 วัน ก่อนวันสิ้นสุดสัญญา", en: "Lessee must notify 30 days in advance to renew." },
  { key: "7.6", type: "bullet", th: "7.6 ผู้เช่ายินยอมให้ผู้ให้เช่านำผู้จะเช่าหรือผู้จะซื้อเข้าชมทรัพย์สินได้ในช่วง 30 วันก่อนสัญญาสิ้นสุด โดยแจ้งล่วงหน้าและต้องเป็นวันที่ผู้เช่าเห็นควร", en: "Lessee allows showings within 30 days before expiry, with prior notice." },
  { key: "7.7", type: "bullet", th: "7.7 หากผู้เช่าบอกเลิกสัญญาก่อนครบกำหนด ต้องแจ้งล่วงหน้าไม่น้อยกว่า 60 วัน และผู้ให้เช่ามีสิทธิ์ริบเงินประกัน", en: "Early termination by Lessee — 60 days notice; deposit forfeited." },
  { key: "7.8", type: "bullet", th: "7.8 เมื่อสัญญาสิ้นสุด ผู้เช่ายินยอมให้ผู้ให้เช่าเข้าครอบครองทรัพย์สิน เคลื่อนย้ายหรือทำให้กลับสู่สภาพเดิมได้ ด้วยค่าใช้จ่ายของผู้เช่า", en: "Upon expiry, Lessor may re-enter and restore the Premises at Lessee's cost." },
  { key: "7.9", type: "bullet", th: "7.9 หากสัญญานี้ยกเลิก สัญญาบริการและสัญญาเช่าเฟอร์นิเจอร์ระหว่างคู่สัญญา (ถ้ามี) จะถูกยกเลิกไปด้วยโดยปริยาย", en: "Service and Furniture agreements (if any) terminate together with this Agreement." },

  // Section 8 — Vacating
  {
    key: "section.8",
    type: "section_bar",
    th: "8. การย้ายออก",
    en: "VACATING THE PREMISES",
  },
  { key: "8.1", type: "bullet", th: "8.1 ในวันที่ครบกำหนดสัญญา ผู้เช่าต้องย้ายและขนย้ายทรัพย์สินของตนออก และส่งมอบทรัพย์สินคืนในสภาพเดิม สะอาด และสามารถนำออกให้เช่าได้ ยกเว้นความเสื่อมโทรมตามปกติ", en: "On expiry, vacate and deliver the Premises in clean, original, tenantable condition (subject to normal wear and tear)." },
  { key: "8.2", type: "bullet", th: "8.2 หากผู้เช่าไม่ทำตาม 8.1: (a) ทรัพย์สินที่ค้างอยู่ตกเป็นกรรมสิทธิ์ของผู้ให้เช่า (b) ผู้เช่าต้องชำระค่าเช่าครึ่งเดือนหากค้างไม่เกิน 15 วัน หรือ 1 เดือนหากค้าง 15-30 วัน บวกค่าปรับวันละ 500 บาท นับจากวันสิ้นสุดสัญญา", en: "If 8.1 is not met: (a) leftover property transfers to Lessor; (b) ½ month rent if delayed ≤15 days, full month if 15–30 days, plus 500 THB/day penalty." },

  // Section 9 — Applicable Law
  {
    key: "section.9",
    type: "section_bar",
    th: "9. การบังคับใช้",
    en: "APPLICABLE LAW",
  },
  {
    key: "9.1",
    type: "paragraph",
    th: "สัญญาฉบับนี้อยู่ภายใต้กฎหมายของรัฐบาลไทย",
    en: "This Agreement shall be governed by the laws of Thailand.",
  },

  // Section 10 — Furniture / Appliances / Other Items (intro + small notes)
  {
    key: "section.10",
    type: "section_bar",
    th: "10. รายการเฟอร์นิเจอร์และอุปกรณ์ภายในห้องชุด",
    en: "FURNITURE & EQUIPMENT",
  },
  {
    key: "10.intro",
    type: "paragraph",
    th: "ผู้ให้เช่าส่งมอบและผู้เช่าได้รับเฟอร์นิเจอร์และอุปกรณ์ดังต่อไปนี้ ภายในห้องชุดในสภาพที่พร้อมใช้งาน — รายการที่ติ๊กถูกจะระบุจำนวนต่อท้าย",
    en: "The Lessor delivers and the Lessee receives the following furniture and equipment. Ticked rows show the agreed quantity.",
  },
  {
    key: "10.note.keys",
    type: "small",
    th: "หากผู้เช่าทำคีย์การ์ดเข้าออกอาคาร กุญแจห้องชุด หรือกุญแจกล่องจดหมาย ชำรุดหรือสูญหาย ผู้เช่าต้องรับผิดชอบค่าใช้จ่ายในการออกใหม่ทั้งหมด",
    en: "If the tenant damages or loses key cards or keys, they shall be responsible for the full replacement cost.",
  },
  {
    key: "10.note.cleaning",
    type: "small",
    th: "กรณีย้ายออก ผู้ให้เช่าจะหักค่าทำความสะอาดห้อง 1,000 บาท (กรณีสกปรกมาก 1,800 บาท) ค่าล้างแอร์ 1,400 บาท ค่าซักโซฟา 1,500 บาท จากเงินประกัน",
    en: "Cleaning fees deducted from deposit upon move-out.",
  },

  // Section 11 — Miscellaneous
  {
    key: "section.11",
    type: "section_bar",
    th: "11. อื่นๆ",
    en: "MISCELLANEOUS",
  },
  { key: "11.1", type: "bullet", th: "11.1 การที่ผู้ให้เช่ารับชำระค่าเช่าจะไม่ถือเป็นข้อยกเว้นไม่ให้ผู้ให้เช่าดำเนินการใดๆ กับผู้เช่า หากมีการละเมิดข้อตกลงข้อหนึ่งข้อใดที่ระบุไว้ในสัญญาฉบับนี้", en: "Acceptance of rent shall not waive the Lessor's right to act against any breach by the Lessee." },
  { key: "11.2", type: "bullet", th: "11.2 หากข้อหนึ่งข้อใดของสัญญาฉบับนี้ไม่สามารถใช้บังคับได้ทางกฎหมายหรือมีเหตุต้องยกเลิก ให้ถือว่าข้อตกลงที่เหลืออยู่ยังคงมีผลบังคับใช้ต่อไปจนครบอายุสัญญา", en: "If any term becomes void or unenforceable, the remaining terms shall remain in full force." },
  { key: "11.3", type: "bullet", th: "11.3 หากผู้เช่าขาดการติดต่อกับผู้ให้เช่าเกิน 5 วัน หรือไม่ชำระค่าเช่าและล่าช้าเกิน 10 วันโดยไม่แจ้งเหตุ ถือว่าผิดสัญญาอย่างมีนัยสำคัญ ผู้ให้เช่ามีสิทธิ์เข้าตรวจสอบ บอกเลิกสัญญา และยึดเงินประกันได้ทันที", en: "Loss of contact over 5 days or rent delay over 10 days = material breach; Lessor may enter, terminate, and forfeit deposit immediately." },
  { key: "11.4", type: "bullet", th: "11.4 ไม่อนุญาตให้บุคคลอื่นที่ไม่มีรายชื่อในสัญญาเข้าพักอาศัยในห้องโดยเด็ดขาด", en: "No unauthorized occupants are permitted in the Premises." },
  { key: "11.5", type: "bullet", th: "11.5 เมื่อผู้เช่าพักอาศัยครบ 6 เดือน ต้องดำเนินการล้างเครื่องปรับอากาศ 1 เครื่องและรับผิดชอบค่าใช้จ่ายเอง", en: "After 6 months of tenancy, the tenant must clean 1 air conditioner at own expense." },
  { key: "11.6", type: "bullet", th: "11.6 เมื่อพักครบ 6 เดือน ผู้เช่ายินยอมให้เจ้าของหรือเอเจ้นท์เข้าตรวจสอบสภาพห้องโดยแจ้งล่วงหน้า 1-3 วัน หากไม่สะดวกผู้เช่าต้องส่งคลิปวิดีโอและภาพถ่ายระบุวันที่", en: "After 6 months, allow inspection with 1-3 days notice; if unavailable, provide dated video/photos." },
];

// ---------------------------------------------------------------------------
// Override / merge helpers
// ---------------------------------------------------------------------------

export function parseClauseOverrides(json: string | null | undefined): ClauseOverrideMap {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const result: ClauseOverrideMap = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (value && typeof value === "object") {
          const v = value as { th?: unknown; en?: unknown };
          result[key] = {
            ...(typeof v.th === "string" ? { th: v.th } : {}),
            ...(typeof v.en === "string" ? { en: v.en } : {}),
          };
        }
      }
      return result;
    }
  } catch {}
  return {};
}

export function serializeClauseOverrides(map: ClauseOverrideMap): string {
  // Drop entries with no actual override values
  const cleaned: ClauseOverrideMap = {};
  for (const [key, value] of Object.entries(map)) {
    if (value && (value.th !== undefined || value.en !== undefined)) {
      cleaned[key] = value;
    }
  }
  return Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned) : "";
}

/**
 * Returns the effective clause text for the given key after applying the
 * override map. If `override.th` is undefined or empty, falls back to the
 * standard text. Same for `en`. Pass `null` to get just the standard.
 */
export function applyOverrides(
  standard: ContractClause[],
  ...overrides: Array<ClauseOverrideMap | null | undefined>
): ContractClause[] {
  return standard.map((c) => {
    let th = c.th;
    let en = c.en;
    for (const layer of overrides) {
      if (!layer) continue;
      const o = layer[c.key];
      if (!o) continue;
      if (typeof o.th === "string" && o.th.length > 0) th = o.th;
      if (typeof o.en === "string" && o.en.length > 0) en = o.en;
    }
    return { ...c, th, en };
  });
}

/**
 * Substitutes `{{placeholder}}` tokens in a text string. Unknown
 * placeholders are left intact so they're visible in the output.
 */
export function applyPlaceholders(
  text: string,
  data: Record<string, string | number | null | undefined>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const v = data[key];
    if (v === null || v === undefined) return match;
    return String(v);
  });
}

/**
 * Splits text into a flat list of "runs" — each run is either plain text
 * or **bold** text. Used by the PDF renderer to wrap bold spans in <D>.
 */
export function parseInlineFormatting(
  text: string
): Array<{ text: string; bold: boolean }> {
  const out: Array<{ text: string; bold: boolean }> = [];
  const re = /\*\*([^*]+)\*\*/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) {
      out.push({ text: text.slice(lastIdx, m.index), bold: false });
    }
    out.push({ text: m[1], bold: true });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    out.push({ text: text.slice(lastIdx), bold: false });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Custom-clauses (Level 2) — kept for backward compat.
// "Custom clauses" are the user-added bullets appended after section 11.6;
// they coexist with the override-driven editing model. The form's
// "ข้อสัญญาเพิ่มเติม" section continues to write into `customClauses`.
// ---------------------------------------------------------------------------

export interface CustomClause {
  th: string;
  en: string;
}

export function parseCustomClauses(
  json: string | null | undefined
): CustomClause[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        th: typeof item?.th === "string" ? item.th : "",
        en: typeof item?.en === "string" ? item.en : "",
      }))
      .filter((c) => c.th.trim() !== "" || c.en.trim() !== "");
  } catch {
    return [];
  }
}

export function serializeCustomClauses(clauses: CustomClause[]): string {
  const cleaned = clauses
    .map((c) => ({ th: c.th.trim(), en: c.en.trim() }))
    .filter((c) => c.th !== "" || c.en !== "");
  return cleaned.length > 0 ? JSON.stringify(cleaned) : "";
}
