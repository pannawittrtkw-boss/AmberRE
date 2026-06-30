"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Loader2, AlertTriangle } from "lucide-react";

export default function ContractSharePage({
  params,
}: {
  params: Promise<{ token: string; locale: string }>;
}) {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      fetch(`/api/contracts/share/${t}`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setContract(d.data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [params]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });

  const fmtRemaining = (days: number) => {
    if (days <= 0) return null;
    const months = Math.floor(days / 30);
    const remainDays = days % 30;
    if (months === 0) return `${days} วัน`;
    if (remainDays === 0) return `${months} เดือน`;
    return `${months} เดือน ${remainDays} วัน`;
  };

  const remainingDays = (endIso: string) => {
    const end = new Date(endIso);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );

  if (!contract)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-lg font-medium">ไม่พบเอกสาร หรือลิงก์หมดอายุแล้ว</p>
        <p className="text-sm">Document not found or link is no longer valid.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-amber-100 p-2 rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-amber-700" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{contract.contractNumber}</p>
            <p className="text-xs text-gray-500 truncate">{contract.projectName} — ห้อง {contract.unitNumber}</p>
          </div>
        </div>
        <a
          href={`/api/contracts/share/${token}/pdf`}
          download={`${contract.contractNumber}.pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          ดาวน์โหลด
        </a>
      </div>

      {/* Contract summary */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">ผู้ให้เช่า / Lessor</p>
            <p className="font-medium text-gray-800">{contract.lessorName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">ผู้เช่า / Lessee</p>
            <p className="font-medium text-gray-800">{contract.lesseeName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">ระยะเวลา / Period</p>
            <p className="font-medium text-gray-800">{fmt(contract.startDate)} – {fmt(contract.endDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">ค่าเช่า / Rent</p>
            <p className="font-medium text-amber-700">฿{Number(contract.monthlyRent).toLocaleString()}/เดือน</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">วันที่คงเหลือ / Remaining</p>
            {(() => {
              const days = remainingDays(contract.endDate);
              if (days < 0)
                return <p className="font-medium text-red-600">หมดอายุแล้ว {fmtRemaining(Math.abs(days))}</p>;
              if (days === 0)
                return <p className="font-medium text-red-600">วันนี้เป็นวันสุดท้าย</p>;
              if (days <= 30)
                return <p className="font-medium text-orange-500">{fmtRemaining(days)}</p>;
              if (days <= 90)
                return <p className="font-medium text-yellow-600">{fmtRemaining(days)}</p>;
              return <p className="font-medium text-green-600">{fmtRemaining(days)}</p>;
            })()}
          </div>
        </div>

        {/* PDF embed */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
          <iframe
            src={`/api/contracts/share/${token}/pdf#toolbar=1&navpanes=0`}
            className="w-full h-full"
            title="Signed Contract"
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          Amber Real Estate · {contract.contractNumber} · เอกสารนี้ใช้เพื่อการอ้างอิงเท่านั้น
        </p>
      </div>
    </div>
  );
}
