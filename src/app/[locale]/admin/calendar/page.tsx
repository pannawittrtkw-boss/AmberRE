"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X, Bell, CheckCircle2, Clock, AlertCircle, Banknote } from "lucide-react";

type Contract = {
  id: number;
  contractNumber: string;
  startDate: string;
  endDate: string;
  lesseeName: string;
  projectName: string;
  unitNumber: string;
  monthlyRent: string;
  paymentDay: number;
  latePaymentFee: string;
  status: string;
};

type RentPayment = {
  id: number;
  contractId: number;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
  note: string | null;
  contract: {
    id: number;
    contractNumber: string;
    lesseeName: string;
    projectName: string;
    unitNumber: string;
    monthlyRent: number;
    paymentDay: number;
    latePaymentFee: number;
    status: string;
  };
};

type EventKind = "expired" | "expiring" | "active" | "reminder";

type DayEvent = {
  contract: Contract;
  daysLeft: number;
  kind: EventKind;
};

function calcDaysLeft(endDate: string): number {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): Date {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d;
}

function calcDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  const diff = Math.ceil((Date.now() - due.getTime()) / 86400000);
  return Math.max(0, diff);
}

const KIND_STYLE: Record<EventKind, { chip: string; dot: string }> = {
  expired:  { chip: "bg-red-100 text-red-700 border-red-200",       dot: "bg-red-500" },
  expiring: { chip: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-500" },
  active:   { chip: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500" },
  reminder: { chip: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-500" },
};

const MONTH_TH = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const MONTH_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW_TH = ["จ","อ","พ","พฤ","ศ","ส","อา"];
const DOW_EN = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function AdminCalendarPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<{ date: Date; events: DayEvent[]; payments: RentPayment[] } | null>(null);

  useEffect(() => { params.then(({ locale: l }) => setLocale(l)); }, [params]);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Sync rent payments then fetch for visible month range (prev/current/next for dots)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetch("/api/admin/rent-payments/sync", { method: "POST" }),
        fetch("/api/admin/contracts").then(r => r.json()).then(d => { if (d.success) setContracts(d.data); }),
      ]);
      // Fetch 3-month window so prev/next arrows don't flash
      const [prev, curr, next] = await Promise.all([
        fetch(`/api/admin/rent-payments?year=${month === 0 ? year - 1 : year}&month=${month === 0 ? 12 : month}`).then(r => r.json()),
        fetch(`/api/admin/rent-payments?year=${year}&month=${month + 1}`).then(r => r.json()),
        fetch(`/api/admin/rent-payments?year=${month === 11 ? year + 1 : year}&month=${month === 11 ? 1 : month + 2}`).then(r => r.json()),
      ]);
      const all: RentPayment[] = [
        ...(prev.success ? prev.data : []),
        ...(curr.success ? curr.data : []),
        ...(next.success ? next.data : []),
      ];
      setRentPayments(all);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadData(); }, [loadData]);

  // Re-fetch rent payments for current month after toggling
  const refreshPayments = useCallback(async () => {
    const res = await fetch(`/api/admin/rent-payments?year=${year}&month=${month + 1}`);
    const d = await res.json();
    if (d.success) {
      setRentPayments(prev => {
        const updated = new Map(d.data.map((p: RentPayment) => [p.id, p]));
        return prev.map(p => updated.has(p.id) ? (updated.get(p.id) as RentPayment) : p);
      });
      // Update selected panel
      if (selected) {
        setSelected(sel => {
          if (!sel) return sel;
          const key = toDateKey(sel.date);
          const updatedPayments = d.data.filter((p: RentPayment) => p.dueDate.slice(0, 10) === key);
          return { ...sel, payments: updatedPayments };
        });
      }
    }
  }, [year, month, selected]);

  const togglePaid = async (payment: RentPayment) => {
    setToggling(payment.id);
    try {
      await fetch(`/api/admin/rent-payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: !payment.isPaid }),
      });
      await refreshPayments();
    } finally {
      setToggling(null);
    }
  };

  // Build contract event map
  const eventsByDate = contracts.reduce<Record<string, DayEvent[]>>((acc, c) => {
    const days = calcDaysLeft(c.endDate);
    const expiryKind: EventKind = days < 0 ? "expired" : days <= 45 ? "expiring" : "active";
    const expiryKey = c.endDate.slice(0, 10);
    (acc[expiryKey] ??= []).push({ contract: c, daysLeft: days, kind: expiryKind });

    if (days >= -45) {
      const reminderDate = addDays(c.endDate, -45);
      const reminderKey  = toDateKey(reminderDate);
      (acc[reminderKey] ??= []).push({ contract: c, daysLeft: days, kind: "reminder" });
    }
    return acc;
  }, {});

  // Build rent payment map by date
  const paymentsByDate = rentPayments.reduce<Record<string, RentPayment[]>>((acc, p) => {
    const key = p.dueDate.slice(0, 10);
    (acc[key] ??= []).push(p);
    return acc;
  }, {});

  // Calendar grid
  const firstDay    = new Date(year, month, 1);
  const lastDay     = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells  = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - startOffset + 1;
    return (d < 1 || d > lastDay.getDate()) ? null : new Date(year, month, d);
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday   = () => { setViewDate(new Date()); setSelected(null); };

  const isToday    = (d: Date) => d.getTime() === today.getTime();
  const isSelected = (d: Date) => selected?.date.getTime() === d.getTime();

  // Summary
  const expiredCount  = contracts.filter(c => calcDaysLeft(c.endDate) < 0).length;
  const expiringCount = contracts.filter(c => { const d = calcDaysLeft(c.endDate); return d >= 0 && d <= 45; }).length;
  const overduePaymentCount = rentPayments.filter(p => !p.isPaid && calcDaysOverdue(p.dueDate) > 0).length;

  const months = locale === "th" ? MONTH_TH : MONTH_EN;
  const dows   = locale === "th" ? DOW_TH : DOW_EN;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
            {locale === "th" ? "ปฏิทินสัญญา" : "Contract Calendar"}
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">
            {locale === "th"
              ? "ติดตามวันหมดสัญญา วันชำระค่าเช่า และวันที่ควรติดต่อผู้เช่า"
              : "Track contract expiry, rent due dates and renewal reminders"}
          </p>
        </div>
        <button onClick={goToday} className="self-start sm:self-auto text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          {locale === "th" ? "วันนี้" : "Today"}
        </button>
      </div>

      {/* Summary */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: locale === "th" ? "หมดสัญญาแล้ว" : "Expired",        count: expiredCount,         color: "bg-red-50 text-red-700 border-red-200" },
            { label: locale === "th" ? "ใกล้หมด (≤45 วัน)" : "Expiring ≤45d", count: expiringCount,    color: "bg-amber-50 text-amber-700 border-amber-200" },
            { label: locale === "th" ? "ค้างชำระค่าเช่า" : "Overdue rent", count: overduePaymentCount,  color: "bg-purple-50 text-purple-700 border-purple-200" },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium ${s.color}`}>
              <span className="text-xl font-bold">{s.count}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Calendar */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
            <h2 className="font-semibold text-lg">{months[month]} {locale === "th" ? year + 543 : year}</h2>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
          </div>

          {/* DoW headers */}
          <div className="grid grid-cols-7 border-b">
            {dows.map((d, i) => (
              <div key={d} className={`text-center text-xs font-medium py-2 ${i >= 5 ? "text-red-400" : "text-gray-500"}`}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {cells.map((date, i) => {
              const dateKey   = date ? toDateKey(date) : `empty-${i}`;
              const events    = date ? (eventsByDate[dateKey] ?? []) : [];
              const payments  = date ? (paymentsByDate[dateKey] ?? []) : [];
              const col       = i % 7;
              const isWeekend = col === 5 || col === 6;
              const active    = date && isSelected(date);
              const todayCell = date && isToday(date);

              const sorted = [...events].sort((a, b) => {
                const order: Record<EventKind, number> = { reminder: 0, expiring: 1, expired: 2, active: 3 };
                return order[a.kind] - order[b.kind];
              });

              const unpaidPayments = payments.filter(p => !p.isPaid);
              const paidPayments   = payments.filter(p => p.isPaid);

              return (
                <div
                  key={dateKey}
                  onClick={() => date && setSelected({ date, events: sorted, payments })}
                  className={`min-h-[96px] p-1.5 border-b border-r text-xs transition-colors
                    ${date ? "cursor-pointer hover:bg-blue-50/40" : "bg-gray-50/40"}
                    ${active ? "bg-blue-50 ring-2 ring-inset ring-blue-400" : ""}
                    ${!active && todayCell ? "bg-amber-50/60" : ""}
                  `}
                >
                  {date && (
                    <>
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1
                        ${todayCell ? "bg-blue-600 text-white" : isWeekend ? "text-red-400" : "text-gray-700"}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {/* Contract events */}
                        {sorted.slice(0, 2).map((ev, idx) => (
                          <div
                            key={`${ev.contract.id}-${ev.kind}-${idx}`}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium border flex items-center gap-0.5 ${KIND_STYLE[ev.kind].chip}`}
                            title={`${ev.kind === "reminder" ? "🔔 ติดต่อผู้เช่า: " : ""}${ev.contract.projectName} #${ev.contract.unitNumber}`}
                          >
                            {ev.kind === "reminder" && <Bell className="w-2.5 h-2.5 shrink-0" />}
                            <span className="truncate">{ev.contract.projectName}</span>
                          </div>
                        ))}
                        {/* Unpaid rent due */}
                        {unpaidPayments.slice(0, 2).map((p) => (
                          <div
                            key={`pay-${p.id}`}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium border flex items-center gap-0.5
                              ${calcDaysOverdue(p.dueDate) > 0
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"}`}
                            title={`${locale === "th" ? "ค่าเช่า: " : "Rent: "}${p.contract.projectName} #${p.contract.unitNumber}`}
                          >
                            <Banknote className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{p.contract.projectName}</span>
                            <span className="shrink-0 font-bold opacity-80">#{p.contract.unitNumber}</span>
                          </div>
                        ))}
                        {/* Paid rent */}
                        {paidPayments.slice(0, 1).map((p) => (
                          <div
                            key={`pay-paid-${p.id}`}
                            className="truncate rounded px-1 py-0.5 text-[10px] font-medium border flex items-center gap-0.5 bg-gray-50 text-gray-400 border-gray-200"
                            title={`${locale === "th" ? "ชำระแล้ว: " : "Paid: "}${p.contract.projectName} #${p.contract.unitNumber}`}
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-green-500" />
                            <span className="truncate line-through">{p.contract.projectName}</span>
                            <span className="shrink-0 font-bold opacity-60">#{p.contract.unitNumber}</span>
                          </div>
                        ))}
                        {/* Overflow count */}
                        {(sorted.length + payments.length) > 3 && (
                          <div className="text-[10px] text-gray-400 px-1">
                            +{sorted.length + payments.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-t text-xs text-gray-500">
            {[
              { dot: "bg-blue-500",   label: locale === "th" ? "🔔 ติดต่อผู้เช่า (ครบ 45 วัน)" : "🔔 Renewal reminder" },
              { dot: "bg-amber-500",  label: locale === "th" ? "ใกล้หมดสัญญา (≤45 วัน)"        : "Expiring ≤45d" },
              { dot: "bg-red-500",    label: locale === "th" ? "หมดสัญญา/เกินกำหนดชำระ"         : "Expired/Overdue" },
              { dot: "bg-purple-500", label: locale === "th" ? "วันชำระค่าเช่า"                  : "Rent due" },
              { dot: "bg-green-500",  label: locale === "th" ? "ชำระแล้ว"                        : "Paid" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${l.dot}`} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="lg:w-80">
          {selected ? (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden sticky top-4">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="font-semibold text-sm">
                  {selected.date.toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </div>
                <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selected.events.length === 0 && selected.payments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  {locale === "th" ? "ไม่มีรายการวันนี้" : "No events on this day"}
                </p>
              ) : (
                <div className="divide-y max-h-[75vh] overflow-y-auto">

                  {/* Rent payment section */}
                  {selected.payments.length > 0 && (
                    <div className="px-4 py-3 space-y-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5" />
                        {locale === "th" ? "วันชำระค่าเช่า" : "Rent Due"}
                      </div>
                      {selected.payments.map((p) => {
                        const overdueDays = calcDaysOverdue(p.dueDate);
                        const lateFee = p.isPaid ? 0 : overdueDays * p.contract.latePaymentFee;
                        return (
                          <div
                            key={p.id}
                            className={`rounded-lg border p-3 space-y-2 ${
                              p.isPaid
                                ? "bg-green-50 border-green-200"
                                : overdueDays > 0
                                ? "bg-red-50 border-red-200"
                                : "bg-purple-50 border-purple-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-medium text-sm truncate">{p.contract.projectName}</span>
                                  <span className="shrink-0 bg-gray-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">#{p.contract.unitNumber}</span>
                                </div>
                                <div className="text-xs text-gray-600 truncate">{p.contract.lesseeName}</div>
                                <div className="text-xs text-gray-400 font-mono">{p.contract.contractNumber}</div>
                              </div>
                              <button
                                onClick={() => togglePaid(p)}
                                disabled={toggling === p.id}
                                className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors
                                  ${p.isPaid
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                  }`}
                              >
                                {toggling === p.id ? (
                                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : p.isPaid ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <Clock className="w-3 h-3" />
                                )}
                                {p.isPaid
                                  ? (locale === "th" ? "ชำระแล้ว" : "Paid")
                                  : (locale === "th" ? "ยังไม่ชำระ" : "Unpaid")}
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-gray-800">฿{p.amount.toLocaleString()}</span>
                              {p.isPaid && p.paidAt && (
                                <span className="text-green-600 text-[10px]">
                                  {locale === "th" ? "ชำระ " : "Paid "}
                                  {new Date(p.paidAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short" })}
                                </span>
                              )}
                              {!p.isPaid && overdueDays === 0 && (() => {
                                const dueD = new Date(p.dueDate);
                                const todayD = new Date(); todayD.setHours(0,0,0,0); dueD.setHours(0,0,0,0);
                                const isTodayDue = dueD.getTime() === todayD.getTime();
                                return isTodayDue ? (
                                  <span className="text-purple-600 font-medium">
                                    {locale === "th" ? "ถึงกำหนดวันนี้" : "Due today"}
                                  </span>
                                ) : (
                                  <span className="text-gray-500 text-[10px]">
                                    {locale === "th" ? "กำหนด " : "Due "}
                                    {new Date(p.dueDate).toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                                  </span>
                                );
                              })()}
                            </div>

                            {/* Late fee */}
                            {!p.isPaid && overdueDays > 0 && (
                              <div className="flex items-center gap-1.5 bg-red-100 rounded-md px-2 py-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                <div className="text-[11px] text-red-700 leading-tight">
                                  <div className="font-semibold">
                                    {locale === "th" ? `เกินกำหนด ${overdueDays} วัน` : `${overdueDays} days overdue`}
                                  </div>
                                  <div>
                                    {locale === "th"
                                      ? `ค่าปรับ ฿${p.contract.latePaymentFee.toLocaleString()}/วัน = ฿${lateFee.toLocaleString()}`
                                      : `Fine ฿${p.contract.latePaymentFee.toLocaleString()}/day = ฿${lateFee.toLocaleString()}`}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Contract events section */}
                  {selected.events.length > 0 && (
                    <div className="px-4 py-3 space-y-2">
                      {selected.payments.length > 0 && (
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {locale === "th" ? "สัญญา" : "Contracts"}
                        </div>
                      )}
                      {selected.events.map((ev, idx) => (
                        <div key={`${ev.contract.id}-${ev.kind}-${idx}`} className="space-y-1.5">
                          <div className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${KIND_STYLE[ev.kind].chip}`}>
                            {ev.kind === "reminder" && <Bell className="w-2.5 h-2.5" />}
                            {ev.kind === "reminder"
                              ? (locale === "th" ? "ติดต่อผู้เช่าเพื่อต่อสัญญา" : "Contact for renewal")
                              : ev.kind === "expired"
                              ? (locale === "th" ? "หมดสัญญาแล้ว" : "Expired")
                              : ev.kind === "expiring"
                              ? (locale === "th" ? `หมดสัญญาใน ${ev.daysLeft} วัน` : `Expires in ${ev.daysLeft}d`)
                              : (locale === "th" ? `เหลือ ${ev.daysLeft} วัน` : `${ev.daysLeft}d left`)}
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-medium text-sm">{ev.contract.projectName}</div>
                              <div className="text-xs text-gray-500">#{ev.contract.unitNumber}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-700 font-medium">{ev.contract.lesseeName}</div>
                          <div className="text-xs text-gray-400 font-mono">{ev.contract.contractNumber}</div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 font-medium">฿{Number(ev.contract.monthlyRent).toLocaleString()}/เดือน</span>
                            <span className="text-gray-400">
                              {locale === "th" ? "หมด " : "Ends "}
                              {new Date(ev.contract.endDate).toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-sm text-gray-400 sticky top-4">
              {locale === "th" ? "คลิกวันที่เพื่อดูรายละเอียด" : "Click a date to see details"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
