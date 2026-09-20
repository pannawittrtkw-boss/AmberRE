"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Home, Building2, Info, CheckCircle2, XCircle, CalendarClock, Users, UserCheck } from "lucide-react";
import { calcContractCommission } from "@/lib/commission";

interface Tier {
  dealCategory: "RENT" | "SALE";
  minAmount: number;
  maxAmount: number | null;
  agentPercent: number;
}

const SAMPLE_RENT = 10000;

// Base commission rate (% of the deal's monthly rent) that a rental
// contract generates, before the monthly tier ladder below decides what
// share of it the agent keeps. Computed live from the same formula the
// system actually uses (calcContractCommission), so this table can never
// drift out of sync with reality.
function basePercent(contractType: "NEW" | "RENEW", termMonths: number, dealType: "DIRECT_OWNER" | "CO_AGENT") {
  const amount = calcContractCommission({ monthlyRent: SAMPLE_RENT, contractType, termMonths, dealType });
  return Math.round((amount / SAMPLE_RENT) * 1000) / 10;
}

function fmtPercent(p: number) {
  return Number.isInteger(p) ? `${p}%` : `${p}%`;
}

const RENT_ROWS: { label: string; contractType: "NEW" | "RENEW"; termMonths: number }[] = [
  { label: "สัญญาใหม่ (1 ปี)", contractType: "NEW", termMonths: 12 },
  { label: "สัญญาใหม่ (6 เดือน)", contractType: "NEW", termMonths: 6 },
  { label: "ต่อสัญญา (1 ปี)", contractType: "RENEW", termMonths: 12 },
  { label: "ต่อสัญญา (6 เดือน)", contractType: "RENEW", termMonths: 6 },
];

function fmtMoney(n: number) {
  return n.toLocaleString("th-TH");
}

function fmtRange(t: Tier) {
  if (t.maxAmount == null) return `${fmtMoney(t.minAmount)} บาทขึ้นไป`;
  return `${fmtMoney(t.minAmount)} - ${fmtMoney(t.maxAmount)} บาท`;
}

export default function CommissionRatesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [tiers, setTiers] = useState<Tier[]>([]);
  const [currentTierPercent, setCurrentTierPercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/commission-tiers");
      const d = await res.json();
      if (d.success) setTiers(d.data);

      if (role === "CO_AGENT") {
        const statsRes = await fetch("/api/admin/agent-stats");
        const statsData = await statsRes.json();
        if (statsData.success) {
          setCurrentTierPercent(statsData.data?.commission?.currentMonth?.tierPercent ?? null);
        }
      }
    } catch {
      // keep whatever's already loaded
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );
  }

  const rentTiers = tiers.filter((t) => t.dealCategory === "RENT").sort((a, b) => a.minAmount - b.minAmount);
  const saleTiers = tiers.filter((t) => t.dealCategory === "SALE").sort((a, b) => a.minAmount - b.minAmount);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">อัตราค่าคอมมิชชั่น Agent</h1>
        <p className="text-sm text-gray-500 mt-1">
          ค่าคอมมิชชั่นคำนวณเป็น 2 ขั้นตอน — 1) มูลค่าฐานของสัญญาแต่ละฉบับ 2) ส่วนแบ่งที่ Agent ได้รับจากยอดรวมทั้งเดือน
        </p>
      </div>

      {/* ── Step 1: base commission rate per contract ────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center">1</span>
        <h2 className="text-sm font-semibold text-gray-800">มูลค่าฐานค่าคอมของสัญญา</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">งานเช่า (RENT)</h3>
            <p className="text-xs text-gray-400">% ของค่าเช่า/เดือน ตามประเภทสัญญาและคู่ดีล</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/60 text-xs text-gray-500">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium">ประเภทสัญญา</th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="inline-flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> ดีลตรงกับเจ้าของ</span>
                </th>
                <th className="px-4 py-2.5 font-medium">
                  <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> ดีลผ่าน Co-agent</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {RENT_ROWS.map((r, idx) => (
                <tr key={r.label} className={idx !== RENT_ROWS.length - 1 ? "border-b border-gray-50" : ""}>
                  <td className="px-5 py-3.5 font-medium text-gray-800">{r.label}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-bold text-[#C8A951]">{fmtPercent(basePercent(r.contractType, r.termMonths, "DIRECT_OWNER"))}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-bold text-blue-600">{fmtPercent(basePercent(r.contractType, r.termMonths, "CO_AGENT"))}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 text-xs text-gray-500">
          * คิดตามสัดส่วนจำนวนเดือนของสัญญาเทียบ 1 ปี เช่น สัญญา 9 เดือน = 9/12 ของอัตรานี้ (สูงสุดไม่เกิน 100% ต่อสัญญา แม้ระยะสัญญาจะยาวกว่า 1 ปี)
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">งานขาย (SALE)</h3>
            <p className="text-xs text-gray-400">อัตราตกลงเป็นรายทรัพย์ — ยังไม่มีระบบสัญญาขายในแอปนี้</p>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <UserCheck className="w-3.5 h-3.5 text-gray-400" /> ดีลตรงกับเจ้าของ / Property
            </span>
            <span className="text-sm font-bold text-gray-700">100% ของอัตราที่ตกลง</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <Users className="w-3.5 h-3.5 text-gray-400" /> ดีลผ่าน Co-agent
            </span>
            <span className="text-sm font-bold text-gray-700">อัตราที่ตกลง ÷ จำนวน Co-agent</span>
          </div>
        </div>
      </div>

      {/* ── Step 2: monthly tier ladder ────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center">2</span>
        <h2 className="text-sm font-semibold text-gray-800">ส่วนแบ่งที่ Agent ได้รับจากยอดรวมทั้งเดือน</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">งานเช่า (RENT)</h3>
            <p className="text-xs text-gray-400">รวมมูลค่าฐาน (ขั้นที่ 1) ของทุกสัญญาที่ปิดในเดือนนั้น แล้วดูว่าตกช่วงไหน ได้ % ของยอดรวมทั้งเดือนตามช่วงนั้น</p>
          </div>
        </div>

        {rentTiers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีการตั้งค่าอัตราค่าคอมงานเช่า</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {rentTiers.map((t, idx) => {
              const isCurrent = currentTierPercent != null && t.agentPercent === currentTierPercent;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-5 py-4 ${isCurrent ? "bg-amber-50/60" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{fmtRange(t)}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        เดือนนี้คุณอยู่ช่วงนี้
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-bold text-[#C8A951]">{t.agentPercent}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">งานขาย (SALE)</h3>
            <p className="text-xs text-gray-400">
              {saleTiers.length <= 1
                ? "อัตราคงที่ ไม่ขึ้นกับยอดขาย"
                : "แบ่งตามยอดขายรวมทั้งเดือน — เหมือนงานเช่า ยอดทั้งเดือนอยู่ช่วงไหน ได้ % ของทั้งยอดตามช่วงนั้น"}
            </p>
          </div>
        </div>

        {saleTiers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">ยังไม่มีการตั้งค่าอัตราค่าคอมงานขาย</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {saleTiers.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  {saleTiers.length > 1 && (
                    <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-800">
                    {saleTiers.length <= 1 ? "ทุกยอดขาย" : fmtRange(t)}
                  </span>
                </div>
                <span className="text-lg font-bold text-blue-600">{t.agentPercent}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Policy notes */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">เงื่อนไขเพิ่มเติม</h3>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            สัญญาที่ถูกยกเลิกจะไม่มีการคำนวณค่าคอมมิชชั่น
          </li>
          <li className="flex items-start gap-2">
            <CalendarClock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            ค่าคอมมิชชั่นจะจ่ายทุกวันที่ 5 ของเดือนถัดไป
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            สัญญาต่ออายุ (ต่อสัญญา) นับเป็นทรัพย์ที่ปิดได้เพิ่มเติมเช่นกัน
          </li>
        </ul>
      </div>
    </div>
  );
}
