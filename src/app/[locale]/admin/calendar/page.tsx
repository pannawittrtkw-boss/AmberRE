"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X, Bell } from "lucide-react";

type Contract = {
  id: number;
  contractNumber: string;
  startDate: string;
  endDate: string;
  lesseeName: string;
  projectName: string;
  unitNumber: string;
  monthlyRent: string;
  status: string;
};

type EventKind = "expired" | "expiring" | "active" | "reminder";

type DayEvent = {
  contract: Contract;
  daysLeft: number;   // days until expiry (can be negative)
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
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<{ date: Date; events: DayEvent[] } | null>(null);

  useEffect(() => { params.then(({ locale: l }) => setLocale(l)); }, [params]);

  useEffect(() => {
    fetch("/api/admin/contracts")
      .then(r => r.json())
      .then(d => { if (d.success) setContracts(d.data); })
      .finally(() => setLoading(false));
  }, []);

  // Build event map: each contract contributes TWO dates
  //   1. endDate        → expiry event (red/amber/green)
  //   2. endDate - 45d  → renewal reminder event (blue)
  const eventsByDate = contracts.reduce<Record<string, DayEvent[]>>((acc, c) => {
    const days = calcDaysLeft(c.endDate);

    // --- Expiry event ---
    const expiryKind: EventKind = days < 0 ? "expired" : days <= 45 ? "expiring" : "active";
    const expiryKey = c.endDate.slice(0, 10);
    (acc[expiryKey] ??= []).push({ contract: c, daysLeft: days, kind: expiryKind });

    // --- Renewal reminder event (45 days before expiry) ---
    // Show for all non-expired contracts (reminder may be past but still useful to see)
    if (days >= -45) {
      const reminderDate = addDays(c.endDate, -45);
      const reminderKey  = toDateKey(reminderDate);
      (acc[reminderKey] ??= []).push({ contract: c, daysLeft: days, kind: "reminder" });
    }

    return acc;
  }, {});

  // Calendar grid — Monday first
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay   = new Date(year, month, 1);
  const lastDay    = new Date(year, month + 1, 0);
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

  // Summary (unique contracts, not duplicate reminder+expiry)
  const expiredCount  = contracts.filter(c => calcDaysLeft(c.endDate) < 0).length;
  const expiringCount = contracts.filter(c => { const d = calcDaysLeft(c.endDate); return d >= 0 && d <= 45; }).length;
  const reminderCount = contracts.filter(c => { const d = calcDaysLeft(c.endDate); return d >= 0 && d <= 45; }).length; // same group

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
              ? "ติดตามวันหมดสัญญาและวันที่ควรติดต่อผู้เช่าเพื่อต่อสัญญา"
              : "Track contract expiry and renewal reminder dates"}
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
            { label: locale === "th" ? "หมดสัญญาแล้ว" : "Expired",        count: expiredCount,  color: "bg-red-50 text-red-700 border-red-200" },
            { label: locale === "th" ? "ใกล้หมด (≤45 วัน)" : "Expiring ≤45d", count: expiringCount, color: "bg-amber-50 text-amber-700 border-amber-200" },
            { label: locale === "th" ? "แจ้งเตือนต่อสัญญา" : "Renewal reminders", count: reminderCount, color: "bg-blue-50 text-blue-700 border-blue-200" },
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
              const dateKey = date ? toDateKey(date) : `empty-${i}`;
              const events  = date ? (eventsByDate[dateKey] ?? []) : [];
              const col       = i % 7;
              const isWeekend = col === 5 || col === 6;
              const active    = date && isSelected(date);
              const todayCell = date && isToday(date);

              // Sort: reminder first, then expiry
              const sorted = [...events].sort((a, b) => {
                const order: Record<EventKind, number> = { reminder: 0, expiring: 1, expired: 2, active: 3 };
                return order[a.kind] - order[b.kind];
              });

              return (
                <div
                  key={dateKey}
                  onClick={() => date && setSelected({ date, events: sorted })}
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
                        {sorted.slice(0, 3).map((ev, idx) => (
                          <div
                            key={`${ev.contract.id}-${ev.kind}-${idx}`}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium border flex items-center gap-0.5 ${KIND_STYLE[ev.kind].chip}`}
                            title={`${ev.kind === "reminder" ? "🔔 ติดต่อผู้เช่า: " : ""}${ev.contract.projectName} #${ev.contract.unitNumber} — ${ev.contract.lesseeName}`}
                          >
                            {ev.kind === "reminder" && <Bell className="w-2.5 h-2.5 shrink-0" />}
                            <span className="truncate">{ev.contract.projectName}</span>
                          </div>
                        ))}
                        {sorted.length > 3 && (
                          <div className="text-[10px] text-gray-400 px-1">+{sorted.length - 3} more</div>
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
              { dot: "bg-blue-500",   label: locale === "th" ? "🔔 ติดต่อผู้เช่า (ครบ 45 วัน)" : "🔔 Renewal reminder (45d)" },
              { dot: "bg-amber-500",  label: locale === "th" ? "ใกล้หมดสัญญา (≤45 วัน)"        : "Expiring ≤45 days" },
              { dot: "bg-red-500",    label: locale === "th" ? "หมดสัญญาแล้ว"                   : "Expired" },
              { dot: "bg-green-500",  label: locale === "th" ? "สัญญาปกติ"                      : "Active" },
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

              {selected.events.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  {locale === "th" ? "ไม่มีรายการวันนี้" : "No events on this day"}
                </p>
              ) : (
                <div className="divide-y max-h-[70vh] overflow-y-auto">
                  {selected.events.map((ev, idx) => (
                    <div key={`${ev.contract.id}-${ev.kind}-${idx}`} className="px-4 py-3 space-y-1.5">
                      {/* Kind badge */}
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
