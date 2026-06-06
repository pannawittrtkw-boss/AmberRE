"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";

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

type DayEvent = {
  contract: Contract;
  daysLeft: number;
  type: "expired" | "warning" | "active";
};

function daysLeft(endDate: string): number {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function eventType(days: number): "expired" | "warning" | "active" {
  if (days < 0) return "expired";
  if (days <= 45) return "warning";
  return "active";
}

const TYPE_STYLE = {
  expired: { dot: "bg-red-500", chip: "bg-red-100 text-red-700 border-red-200", label: "" },
  warning: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-700 border-amber-200", label: "" },
  active:  { dot: "bg-green-500", chip: "bg-green-50 text-green-700 border-green-200", label: "" },
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

  const refresh = async () => {
    const res = await fetch("/api/admin/contracts");
    const data = await res.json();
    if (data.success) setContracts(data.data);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  // Group events by endDate (YYYY-MM-DD)
  const eventsByDate = contracts.reduce<Record<string, DayEvent[]>>((acc, c) => {
    const key = c.endDate.slice(0, 10);
    const days = daysLeft(c.endDate);
    if (!acc[key]) acc[key] = [];
    acc[key].push({ contract: c, daysLeft: days, type: eventType(days) });
    return acc;
  }, {});

  // Calendar grid — always start on Monday
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday=0 offset
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - startOffset + 1;
    if (d < 1 || d > lastDay.getDate()) return null;
    return new Date(year, month, d);
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => { setViewDate(new Date()); setSelected(null); };

  const isToday = (d: Date) => d.getTime() === today.getTime();
  const isSelected = (d: Date) => selected?.date.getTime() === d.getTime();

  // Summary counts
  const allEvents = Object.values(eventsByDate).flat();
  const expiredCount = allEvents.filter(e => e.type === "expired").length;
  const warningCount = allEvents.filter(e => e.type === "warning").length;
  const activeCount  = allEvents.filter(e => e.type === "active").length;

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
            {locale === "th" ? "ติดตามวันหมดสัญญาและการแจ้งเตือน" : "Track contract expiry dates and alerts"}
          </p>
        </div>
        <button
          onClick={goToday}
          className="self-start sm:self-auto text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {locale === "th" ? "วันนี้" : "Today"}
        </button>
      </div>

      {/* Summary chips */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: locale === "th" ? "หมดสัญญาแล้ว" : "Expired", count: expiredCount, color: "bg-red-50 text-red-700 border-red-200" },
            { label: locale === "th" ? "เหลือ ≤45 วัน" : "≤45 days left", count: warningCount, color: "bg-amber-50 text-amber-700 border-amber-200" },
            { label: locale === "th" ? "ปกติ" : "Active", count: activeCount, color: "bg-green-50 text-green-700 border-green-200" },
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
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-lg">
              {months[month]} {locale === "th" ? year + 543 : year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b">
            {dows.map((d, i) => (
              <div key={d} className={`text-center text-xs font-medium py-2 ${i >= 5 ? "text-red-400" : "text-gray-500"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {cells.map((date, i) => {
              const key = date ? date.toISOString().slice(0, 10) : `empty-${i}`;
              const events = date ? (eventsByDate[date.toISOString().slice(0, 10)] ?? []) : [];
              const col = i % 7;
              const isWeekend = col === 5 || col === 6;
              const active = date && isSelected(date);
              const todayCell = date && isToday(date);

              return (
                <div
                  key={key}
                  onClick={() => date && setSelected({ date, events })}
                  className={`min-h-[88px] p-1.5 border-b border-r text-xs transition-colors
                    ${date ? "cursor-pointer hover:bg-blue-50/50" : "bg-gray-50/50"}
                    ${active ? "bg-blue-50 ring-2 ring-inset ring-blue-400" : ""}
                    ${!active && todayCell ? "bg-amber-50/60" : ""}
                  `}
                >
                  {date && (
                    <>
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1
                        ${todayCell ? "bg-blue-600 text-white" : isWeekend ? "text-red-400" : "text-gray-700"}
                      `}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {events.slice(0, 3).map((ev) => (
                          <div
                            key={ev.contract.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium border ${TYPE_STYLE[ev.type].chip}`}
                            title={`${ev.contract.projectName} #${ev.contract.unitNumber} — ${ev.contract.lesseeName}`}
                          >
                            {ev.contract.projectName}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="text-[10px] text-gray-400 px-1">+{events.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 px-5 py-3 border-t text-xs text-gray-500">
            {[
              { color: "bg-red-500", label: locale === "th" ? "หมดสัญญา" : "Expired" },
              { color: "bg-amber-500", label: locale === "th" ? "เหลือ ≤45 วัน" : "≤45 days" },
              { color: "bg-green-500", label: locale === "th" ? "ปกติ" : "Active" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
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
                  {locale === "th" ? "ไม่มีสัญญาวันนี้" : "No contracts on this day"}
                </p>
              ) : (
                <div className="divide-y">
                  {selected.events.map((ev) => (
                    <div key={ev.contract.id} className="px-4 py-3 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-sm">{ev.contract.projectName}</div>
                          <div className="text-xs text-gray-500">#{ev.contract.unitNumber}</div>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${TYPE_STYLE[ev.type].chip}`}>
                          {ev.type === "expired"
                            ? (locale === "th" ? "หมดแล้ว" : "Expired")
                            : ev.type === "warning"
                            ? `${ev.daysLeft} ${locale === "th" ? "วัน" : "d"}`
                            : `${ev.daysLeft} ${locale === "th" ? "วัน" : "d"}`}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">{ev.contract.lesseeName}</div>
                      <div className="text-xs text-gray-400 font-mono">{ev.contract.contractNumber}</div>
                      <div className="text-xs font-medium text-gray-700">
                        ฿{Number(ev.contract.monthlyRent).toLocaleString()}/เดือน
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
