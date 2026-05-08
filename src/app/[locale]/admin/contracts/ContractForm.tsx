"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, ChevronDown, ChevronUp, Save } from "lucide-react";
import ItemSelector from "./ItemSelector";
import IdCardUpload from "./IdCardUpload";
import CustomClausesEditor from "./CustomClausesEditor";
import { parseIdCardOcr } from "@/lib/idcard-ocr";
import { parseBankBookOcr } from "@/lib/bank-ocr";
import {
  CustomClause,
  parseCustomClauses,
  serializeCustomClauses,
} from "@/lib/contract-clauses";
import {
  FURNITURE_OPTIONS,
  APPLIANCE_OPTIONS,
  OTHER_ITEM_OPTIONS,
  parseContractItems,
  ContractItem,
} from "@/lib/contract-items";

interface ContractFormProps {
  locale: string;
  initialData?: any;
  contractId?: number;
}

const TERM_OPTIONS = [6, 12, 24, 36];

const THAI_BANKS = [
  "ธนาคารกรุงเทพ (Bangkok Bank — BBL)",
  "ธนาคารกสิกรไทย (Kasikornbank — KBANK)",
  "ธนาคารกรุงไทย (Krungthai Bank — KTB)",
  "ธนาคารไทยพาณิชย์ (Siam Commercial Bank — SCB)",
  "ธนาคารกรุงศรีอยุธยา (Krungsri — BAY)",
  "ธนาคารทหารไทยธนชาต (TMBThanachart — TTB)",
  "ธนาคารยูโอบี (UOB)",
  "ธนาคารแลนด์ แอนด์ เฮ้าส์ (LH Bank)",
  "ธนาคารซีไอเอ็มบี ไทย (CIMB Thai)",
  "ธนาคารเกียรตินาคินภัทร (KKP)",
  "ธนาคารทิสโก้ (Tisco Bank)",
  "ธนาคารไอซีบีซี ไทย (ICBC Thai)",
  "ธนาคารสแตนดาร์ดชาร์เตอร์ด ไทย (Standard Chartered)",
  "ธนาคารเอชเอสบีซี ไทย (HSBC Thailand)",
  "ธนาคารออมสิน (Government Savings Bank — GSB)",
  "ธนาคารอาคารสงเคราะห์ (GHB)",
  "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BAAC)",
  "ธนาคารอิสลามแห่งประเทศไทย (IBank)",
];

const today = () => new Date().toISOString().slice(0, 10);
const addMonths = (dateStr: string, months: number): string => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

export default function ContractForm({
  locale,
  initialData,
  contractId,
}: ContractFormProps) {
  const router = useRouter();
  const isEdit = !!contractId;

  const [form, setForm] = useState({
    contractDate: initialData?.contractDate?.slice(0, 10) || today(),
    startDate: initialData?.startDate?.slice(0, 10) || today(),
    endDate: initialData?.endDate?.slice(0, 10) || addMonths(today(), 12),
    termMonths: initialData?.termMonths || 12,

    lessorName: initialData?.lessorName || "",
    lessorNationality: initialData?.lessorNationality || "ไทย",
    lessorIdCard: initialData?.lessorIdCard || "",
    lessorAddress: initialData?.lessorAddress || "",
    lessorPhone: initialData?.lessorPhone || "",
    lessorIdImage: initialData?.lessorIdImage || "",

    lesseeName: initialData?.lesseeName || "",
    lesseeNationality: initialData?.lesseeNationality || "ไทย",
    lesseeIdCard: initialData?.lesseeIdCard || "",
    lesseeAddress: initialData?.lesseeAddress || "",
    lesseePhone: initialData?.lesseePhone || "",
    lesseeIdImage: initialData?.lesseeIdImage || "",

    jointLesseeName: initialData?.jointLesseeName || "",
    jointLesseeNationality: initialData?.jointLesseeNationality || "",
    jointLesseeIdCard: initialData?.jointLesseeIdCard || "",
    jointLesseeAddress: initialData?.jointLesseeAddress || "",
    jointLesseePhone: initialData?.jointLesseePhone || "",
    jointLesseeIdImage: initialData?.jointLesseeIdImage || "",

    propertyId: initialData?.propertyId || null,
    projectName: initialData?.projectName || "",
    unitNumber: initialData?.unitNumber || "",
    buildingName: initialData?.buildingName || "",
    floorNumber: initialData?.floorNumber || "",
    propertyAddress: initialData?.propertyAddress || "",
    sizeSqm: initialData?.sizeSqm || "",

    monthlyRent: initialData?.monthlyRent || "",
    paymentDay: initialData?.paymentDay || 1,
    bankName: initialData?.bankName || "",
    bankBranch: initialData?.bankBranch || "",
    bankAccountName: initialData?.bankAccountName || "",
    bankAccountNumber: initialData?.bankAccountNumber || "",
    // Transient — only used to preview the bank-book image during OCR. Not
    // persisted to the DB; the API ignores unknown fields.
    bankBookImage: "",
    latePaymentFee: initialData?.latePaymentFee || 500,

    securityDeposit: initialData?.securityDeposit || "",

    status: initialData?.status || "DRAFT",
  });

  const [furniture, setFurniture] = useState<ContractItem[]>(
    parseContractItems(initialData?.furnitureList)
  );
  const [appliances, setAppliances] = useState<ContractItem[]>(
    parseContractItems(initialData?.applianceList)
  );
  const [otherItems, setOtherItems] = useState<ContractItem[]>(
    parseContractItems(initialData?.otherItems)
  );
  const [customClauses, setCustomClauses] = useState<CustomClause[]>(
    parseCustomClauses(initialData?.customClauses)
  );

  const [showJoint, setShowJoint] = useState(!!initialData?.jointLesseeName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // On NEW contracts: pre-fill custom clauses from the global default
  // template. Skipped when editing an existing contract — that contract
  // already holds its own copy of clauses (which may diverge from the
  // current template, by design).
  useEffect(() => {
    if (isEdit) return;
    if (initialData?.customClauses) return;
    let cancelled = false;
    fetch("/api/admin/contract-defaults")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.success) return;
        const clauses = data.data?.clauses as CustomClause[] | undefined;
        if (clauses && clauses.length > 0) setCustomClauses(clauses);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetCustomClausesFromTemplate = async () => {
    try {
      const res = await fetch("/api/admin/contract-defaults");
      const data = await res.json();
      if (data?.success) {
        setCustomClauses((data.data?.clauses as CustomClause[]) || []);
      }
    } catch {}
  };

  // Track whether the user has manually edited the security deposit. If they
  // have, stop auto-syncing it to monthlyRent × 2.
  const depositTouchedRef = useRef(!!initialData?.securityDeposit);

  // Auto-calc end date when startDate or termMonths changes (end date is read-only)
  useEffect(() => {
    if (form.startDate && form.termMonths) {
      const end = addMonths(form.startDate, Number(form.termMonths));
      if (end !== form.endDate) {
        setForm((prev) => ({ ...prev, endDate: end }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.startDate, form.termMonths]);

  // Default security deposit to monthlyRent × 2 unless user has overridden it
  useEffect(() => {
    if (depositTouchedRef.current) return;
    const rent = Number(form.monthlyRent);
    if (rent > 0) {
      const auto = String(rent * 2);
      if (auto !== String(form.securityDeposit)) {
        setForm((prev) => ({ ...prev, securityDeposit: auto }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.monthlyRent]);

  const update = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = {
      ...form,
      jointLesseeName: showJoint ? form.jointLesseeName : "",
      jointLesseeNationality: showJoint ? form.jointLesseeNationality : "",
      jointLesseeIdCard: showJoint ? form.jointLesseeIdCard : "",
      jointLesseeAddress: showJoint ? form.jointLesseeAddress : "",
      jointLesseePhone: showJoint ? form.jointLesseePhone : "",
      jointLesseeIdImage: showJoint ? form.jointLesseeIdImage : "",
      furnitureList: furniture.length ? JSON.stringify(furniture) : "",
      applianceList: appliances.length ? JSON.stringify(appliances) : "",
      otherItems: otherItems.length ? JSON.stringify(otherItems) : "",
      customClauses: serializeCustomClauses(customClauses),
    };

    const url = isEdit
      ? `/api/admin/contracts/${contractId}`
      : "/api/admin/contracts";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!data.success) {
      setError(data.error || (locale === "th" ? "บันทึกไม่สำเร็จ" : "Failed to save"));
      return;
    }
    router.push(`/${locale}/admin/contracts/${data.data.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pb-24 sm:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Link
          href={`/${locale}/admin/contracts`}
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-[#C8A951] self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === "th" ? "กลับ" : "Back"}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">
          {isEdit
            ? locale === "th" ? "แก้ไขสัญญา" : "Edit Contract"
            : locale === "th" ? "สร้างสัญญาใหม่" : "New Contract"}
        </h1>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Section 1: Contract Info */}
      <Card title={locale === "th" ? "ข้อมูลสัญญา" : "Contract Info"}>
        <Grid>
          <Field label={locale === "th" ? "วันที่ทำสัญญา" : "Contract Date"} required>
            <input
              type="date"
              required
              value={form.contractDate}
              onChange={(e) => update("contractDate", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "วันเริ่มสัญญา" : "Start Date"} required>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "ระยะเวลา (เดือน)" : "Term (months)"} required>
            <select
              required
              value={form.termMonths}
              onChange={(e) => update("termMonths", Number(e.target.value))}
              className={inputCls}
            >
              {TERM_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} {locale === "th" ? "เดือน" : "months"}
                </option>
              ))}
            </select>
          </Field>
          <Field label={locale === "th" ? "วันสิ้นสุด (คำนวณอัตโนมัติ)" : "End Date (auto)"}>
            <input
              type="date"
              value={form.endDate}
              readOnly
              disabled
              className={`${inputCls} bg-stone-100 cursor-not-allowed`}
            />
          </Field>
        </Grid>
      </Card>

      {/* Section 2: Lessor */}
      <Card title={locale === "th" ? "ผู้ให้เช่า (Lessor)" : "Lessor"}>
        <Grid>
          <Field label={locale === "th" ? "ชื่อ-นามสกุล" : "Name"} required>
            <input
              required
              value={form.lessorName}
              onChange={(e) => update("lessorName", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "สัญชาติ" : "Nationality"}>
            <input
              value={form.lessorNationality}
              onChange={(e) => update("lessorNationality", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "เลขบัตรประชาชน/ID" : "ID No."}>
            <input
              value={form.lessorIdCard}
              onChange={(e) => update("lessorIdCard", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "ที่อยู่" : "Address"} colSpan={2}>
            <textarea
              rows={2}
              value={form.lessorAddress}
              onChange={(e) => update("lessorAddress", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "เบอร์โทร" : "Phone"}>
            <input
              value={form.lessorPhone}
              onChange={(e) => update("lessorPhone", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field
            label={locale === "th" ? "รูปบัตรประชาชน" : "ID Card Image"}
            colSpan={2}
          >
            <IdCardUpload
              label=""
              value={form.lessorIdImage}
              onChange={(url) => update("lessorIdImage", url)}
              onOcrText={(text) => {
                const o = parseIdCardOcr(text);
                // Passport documents have no street address — fall back to
                // the country / nationality so the address field isn't left
                // blank for foreign lessors.
                const addressFallback =
                  o.address ||
                  (o.documentType === "passport" && o.nationality
                    ? o.nationality
                    : "");
                // Replace, don't merge — uploading a new card always wipes
                // the previous values on the related fields.
                setForm((prev) => ({
                  ...prev,
                  lessorName: o.name || "",
                  lessorNationality: o.nationality || "",
                  lessorIdCard: o.idNumber || "",
                  lessorAddress: addressFallback,
                }));
              }}
              buildOcrPreview={(text) => {
                const o = parseIdCardOcr(text);
                const out: Array<{ label: string; value: string }> = [];
                if (o.name)
                  out.push({ label: locale === "th" ? "ชื่อ" : "Name", value: o.name });
                if (o.idNumber)
                  out.push({ label: locale === "th" ? "เลข ID" : "ID No.", value: o.idNumber });
                if (o.nationality)
                  out.push({ label: locale === "th" ? "สัญชาติ" : "Nationality", value: o.nationality });
                if (o.address)
                  out.push({ label: locale === "th" ? "ที่อยู่" : "Address", value: o.address });
                return out;
              }}
              locale={locale}
            />
          </Field>
        </Grid>
      </Card>

      {/* Section 3: Lessee */}
      <Card title={locale === "th" ? "ผู้เช่า (Lessee)" : "Lessee"}>
        <Grid>
          <Field label={locale === "th" ? "ชื่อ-นามสกุล" : "Name"} required>
            <input
              required
              value={form.lesseeName}
              onChange={(e) => update("lesseeName", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "สัญชาติ" : "Nationality"}>
            <input
              value={form.lesseeNationality}
              onChange={(e) => update("lesseeNationality", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "เลขบัตรประชาชน/พาสปอร์ต" : "ID/Passport"}>
            <input
              value={form.lesseeIdCard}
              onChange={(e) => update("lesseeIdCard", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "เบอร์โทร" : "Phone"}>
            <input
              value={form.lesseePhone}
              onChange={(e) => update("lesseePhone", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "ที่อยู่" : "Address"} colSpan={2}>
            <textarea
              rows={2}
              value={form.lesseeAddress}
              onChange={(e) => update("lesseeAddress", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field
            label={
              locale === "th"
                ? "รูปบัตรประชาชน / พาสปอร์ต"
                : "ID Card / Passport Image"
            }
            colSpan={2}
          >
            <IdCardUpload
              label=""
              value={form.lesseeIdImage}
              onChange={(url) => update("lesseeIdImage", url)}
              onOcrText={(text) => {
                const o = parseIdCardOcr(text);
                const addressFallback =
                  o.address ||
                  (o.documentType === "passport" && o.nationality
                    ? o.nationality
                    : "");
                setForm((prev) => ({
                  ...prev,
                  lesseeName: o.name || "",
                  lesseeIdCard: o.idNumber || "",
                  lesseeAddress: addressFallback,
                  lesseeNationality: o.nationality || "",
                }));
              }}
              buildOcrPreview={(text) => {
                const o = parseIdCardOcr(text);
                const out: Array<{ label: string; value: string }> = [];
                if (o.name)
                  out.push({ label: locale === "th" ? "ชื่อ" : "Name", value: o.name });
                if (o.idNumber)
                  out.push({ label: locale === "th" ? "เลข ID" : "ID No.", value: o.idNumber });
                if (o.address)
                  out.push({ label: locale === "th" ? "ที่อยู่" : "Address", value: o.address });
                if (o.nationality)
                  out.push({ label: locale === "th" ? "สัญชาติ" : "Nationality", value: o.nationality });
                return out;
              }}
              locale={locale}
            />
          </Field>
        </Grid>
      </Card>

      {/* Joint Lessee (collapsible) */}
      <div className="bg-white border rounded-xl">
        <button
          type="button"
          onClick={() => setShowJoint(!showJoint)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="font-semibold">
            {locale === "th" ? "ผู้เช่าร่วม (เพิ่มเติม)" : "Joint Lessee (Optional)"}
          </span>
          {showJoint ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showJoint && (
          <div className="p-4 pt-0">
            <Grid>
              <Field label={locale === "th" ? "ชื่อ" : "Name"}>
                <input
                  value={form.jointLesseeName}
                  onChange={(e) => update("jointLesseeName", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label={locale === "th" ? "สัญชาติ" : "Nationality"}>
                <input
                  value={form.jointLesseeNationality}
                  onChange={(e) => update("jointLesseeNationality", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="ID/Passport">
                <input
                  value={form.jointLesseeIdCard}
                  onChange={(e) => update("jointLesseeIdCard", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label={locale === "th" ? "เบอร์โทร" : "Phone"}>
                <input
                  value={form.jointLesseePhone}
                  onChange={(e) => update("jointLesseePhone", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label={locale === "th" ? "ที่อยู่" : "Address"} colSpan={2}>
                <textarea
                  rows={2}
                  value={form.jointLesseeAddress}
                  onChange={(e) => update("jointLesseeAddress", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field
                label={
                  locale === "th"
                    ? "รูปบัตรประชาชน / พาสปอร์ต"
                    : "ID Card / Passport Image"
                }
                colSpan={2}
              >
                <IdCardUpload
                  label=""
                  value={form.jointLesseeIdImage}
                  onChange={(url) => update("jointLesseeIdImage", url)}
                  onOcrText={(text) => {
                    const o = parseIdCardOcr(text);
                    const addressFallback =
                      o.address ||
                      (o.documentType === "passport" && o.nationality
                        ? o.nationality
                        : "");
                    setForm((prev) => ({
                      ...prev,
                      jointLesseeName: o.name || "",
                      jointLesseeIdCard: o.idNumber || "",
                      jointLesseeAddress: addressFallback,
                      jointLesseeNationality: o.nationality || "",
                    }));
                  }}
                  buildOcrPreview={(text) => {
                    const o = parseIdCardOcr(text);
                    const out: Array<{ label: string; value: string }> = [];
                    if (o.name)
                      out.push({ label: locale === "th" ? "ชื่อ" : "Name", value: o.name });
                    if (o.idNumber)
                      out.push({ label: locale === "th" ? "เลข ID" : "ID No.", value: o.idNumber });
                    if (o.address)
                      out.push({ label: locale === "th" ? "ที่อยู่" : "Address", value: o.address });
                    if (o.nationality)
                      out.push({ label: locale === "th" ? "สัญชาติ" : "Nationality", value: o.nationality });
                    return out;
                  }}
                  locale={locale}
                />
              </Field>
            </Grid>
          </div>
        )}
      </div>

      {/* Section 4: Property */}
      <Card title={locale === "th" ? "ทรัพย์สิน" : "Property"}>
        <Grid>
          <Field label={locale === "th" ? "ชื่อโครงการ" : "Project Name"} required>
            <input
              required
              value={form.projectName}
              onChange={(e) => update("projectName", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "เลขห้องชุด" : "Unit Number"} required>
            <input
              required
              value={form.unitNumber}
              onChange={(e) => update("unitNumber", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "อาคาร" : "Building"}>
            <input
              value={form.buildingName}
              onChange={(e) => update("buildingName", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "ชั้น" : "Floor"}>
            <input
              value={form.floorNumber}
              onChange={(e) => update("floorNumber", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "ขนาด (ตร.ม.)" : "Size (sqm)"}>
            <input
              type="number"
              step="0.01"
              value={form.sizeSqm}
              onChange={(e) => update("sizeSqm", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "ที่อยู่ทรัพย์สิน" : "Address"} colSpan={2} required>
            <textarea
              required
              rows={2}
              value={form.propertyAddress}
              onChange={(e) => update("propertyAddress", e.target.value)}
              className={inputCls}
            />
          </Field>
        </Grid>
      </Card>

      {/* Section 5: Rent */}
      <Card title={locale === "th" ? "ค่าเช่า" : "Rent & Payment"}>
        <Grid>
          <Field label={locale === "th" ? "ค่าเช่ารายเดือน (บาท)" : "Monthly Rent (THB)"} required>
            <input
              type="number"
              required
              step="0.01"
              value={form.monthlyRent}
              onChange={(e) => update("monthlyRent", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "ชำระทุกวันที่ (1-31)" : "Due day"}>
            <input
              type="number"
              min={1}
              max={31}
              value={form.paymentDay}
              onChange={(e) => update("paymentDay", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "ค่าปรับชำระล่าช้า (บาท/วัน)" : "Late fee/day"}>
            <input
              type="number"
              value={form.latePaymentFee}
              onChange={(e) => update("latePaymentFee", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field
            label={
              locale === "th"
                ? "อัพโหลดรูปสมุดบัญชี / หน้าจอแอปธนาคาร (ตัวเลือก)"
                : "Upload bank book or app screenshot (optional)"
            }
            colSpan={2}
          >
            <IdCardUpload
              label=""
              value={form.bankBookImage}
              onChange={(url) => update("bankBookImage", url)}
              onOcrText={(text) => {
                const b = parseBankBookOcr(text);
                setForm((prev) => ({
                  ...prev,
                  bankName: b.bankName || "",
                  bankBranch: b.bankBranch || "",
                  bankAccountName: b.accountName || "",
                  bankAccountNumber: b.accountNumber || "",
                }));
              }}
              buildOcrPreview={(text) => {
                const b = parseBankBookOcr(text);
                const out: Array<{ label: string; value: string }> = [];
                if (b.bankName)
                  out.push({ label: locale === "th" ? "ธนาคาร" : "Bank", value: b.bankName });
                if (b.bankBranch)
                  out.push({ label: locale === "th" ? "สาขา" : "Branch", value: b.bankBranch });
                if (b.accountName)
                  out.push({ label: locale === "th" ? "ชื่อบัญชี" : "Account Name", value: b.accountName });
                if (b.accountNumber)
                  out.push({ label: locale === "th" ? "เลขบัญชี" : "Account No.", value: b.accountNumber });
                return out;
              }}
              ocrHint={
                locale === "th"
                  ? "ระบบจะอ่าน ธนาคาร / สาขา / ชื่อบัญชี / เลขบัญชี (โปรดตรวจทาน)"
                  : "Will auto-fill bank / branch / account name / number (please review)"
              }
              locale={locale}
            />
          </Field>
          <Field label={locale === "th" ? "ธนาคาร" : "Bank"}>
            <select
              value={form.bankName}
              onChange={(e) => update("bankName", e.target.value)}
              className={inputCls}
            >
              <option value="">
                {locale === "th" ? "— เลือกธนาคาร —" : "— Select bank —"}
              </option>
              {THAI_BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label={locale === "th" ? "สาขา" : "Branch"}>
            <input
              value={form.bankBranch}
              onChange={(e) => update("bankBranch", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "ชื่อบัญชี" : "Account Name"}>
            <input
              value={form.bankAccountName}
              onChange={(e) => update("bankAccountName", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={locale === "th" ? "เลขที่บัญชี" : "Account Number"}>
            <input
              value={form.bankAccountNumber}
              onChange={(e) => update("bankAccountNumber", e.target.value)}
              className={inputCls}
            />
          </Field>
        </Grid>
      </Card>

      {/* Section 6: Deposit */}
      <Card title={locale === "th" ? "เงินประกัน" : "Security Deposit"}>
        <Grid>
          <Field
            label={locale === "th" ? "เงินประกัน (บาท)" : "Deposit (THB)"}
            required
            colSpan={2}
          >
            <input
              type="number"
              required
              step="0.01"
              value={form.securityDeposit}
              onChange={(e) => {
                depositTouchedRef.current = true;
                update("securityDeposit", e.target.value);
              }}
              className={inputCls}
              placeholder={locale === "th" ? "ปกติเท่ากับ 2 เดือนของค่าเช่า" : "Typically 2× monthly rent"}
            />
            <p className="text-xs text-stone-500 mt-1">
              {locale === "th"
                ? "ระบบ default ค่าเป็น 2 เท่าของค่าเช่ารายเดือน — แก้ไขได้"
                : "Defaults to 2× monthly rent — editable"}
            </p>
          </Field>
        </Grid>
      </Card>

      {/* Section 7: Furniture */}
      <Card title={locale === "th" ? "เฟอร์นิเจอร์" : "Furniture"}>
        <p className="text-xs text-gray-500 mb-3">
          {locale === "th"
            ? "เลือกเฟอร์นิเจอร์ที่มีในห้องและระบุจำนวน"
            : "Tick included furniture and enter quantity"}
        </p>
        <ItemSelector
          options={FURNITURE_OPTIONS}
          value={furniture}
          onChange={setFurniture}
          locale={locale}
        />
      </Card>

      <Card title={locale === "th" ? "เครื่องใช้ไฟฟ้า" : "Electrical Appliances"}>
        <p className="text-xs text-gray-500 mb-3">
          {locale === "th"
            ? "เลือกเครื่องใช้ไฟฟ้าที่มีในห้องและระบุจำนวน"
            : "Tick included appliances and enter quantity"}
        </p>
        <ItemSelector
          options={APPLIANCE_OPTIONS}
          value={appliances}
          onChange={setAppliances}
          locale={locale}
        />
      </Card>

      <Card title={locale === "th" ? "รายการอื่นๆ" : "Other Items"}>
        <p className="text-xs text-gray-500 mb-3">
          {locale === "th"
            ? "เลือกรายการกุญแจ/คีย์การ์ดที่ส่งมอบให้ผู้เช่าและระบุจำนวน"
            : "Tick keys/keycards handed over to the tenant and enter quantity"}
        </p>
        <ItemSelector
          options={OTHER_ITEM_OPTIONS}
          value={otherItems}
          onChange={setOtherItems}
          locale={locale}
        />
      </Card>

      {/* Custom Clauses — appended after section 11 of the standard contract */}
      <Card
        title={
          locale === "th"
            ? "ข้อสัญญาเพิ่มเติม (ต่อท้ายข้อ 11)"
            : "Additional Clauses (after section 11)"
        }
      >
        <CustomClausesEditor
          value={customClauses}
          onChange={setCustomClauses}
          onResetFromTemplate={handleResetCustomClausesFromTemplate}
          locale={locale}
        />
      </Card>

      {/* Status */}
      {isEdit && (
        <Card title={locale === "th" ? "สถานะ" : "Status"}>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className={inputCls}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="TERMINATED">TERMINATED</option>
          </select>
        </Card>
      )}

      {/* Submit — fixed bar at the bottom of the viewport on mobile so the
          action is always reachable without scrolling through the long form. */}
      <div
        className="fixed sm:static bottom-0 left-0 right-0 z-30 flex gap-2 px-4 py-3 sm:p-0 bg-white sm:bg-transparent border-t sm:border-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        <Link
          href={`/${locale}/admin/contracts`}
          className="flex-1 py-3 bg-white border rounded-lg text-center text-sm hover:bg-gray-50"
        >
          {locale === "th" ? "ยกเลิก" : "Cancel"}
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="flex-[2] flex items-center justify-center gap-2 py-3 bg-[#C8A951] hover:bg-[#B8993F] text-white rounded-lg text-sm font-semibold disabled:opacity-60"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {locale === "th"
            ? isEdit ? "บันทึกการแก้ไข" : "สร้างสัญญา"
            : isEdit ? "Save Changes" : "Create Contract"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl p-4 sm:p-5">
      <h2 className="font-bold mb-3 sm:mb-4 text-base sm:text-lg">{title}</h2>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">{children}</div>;
}

function Field({
  label,
  required,
  colSpan,
  children,
}: {
  label: string;
  required?: boolean;
  colSpan?: number;
  children: React.ReactNode;
}) {
  return (
    <div className={colSpan === 2 ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
