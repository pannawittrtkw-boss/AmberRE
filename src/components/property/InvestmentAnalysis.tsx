"use client";

import { useState } from "react";
import { TrendingUp, Wallet, Receipt, HandCoins, RotateCcw, BarChart3 } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";

const LOAN_TERM_OPTIONS = [5, 10, 15, 20, 25, 30];

interface Props {
  locale: string;
  defaults: {
    purchasePrice: number;
    renovationCost: number;
    rentPerMonth: number;
    brokerFeeMonths: number;
    commonFeePerYear: number;
    maintenancePerYear: number;
    landTaxRate: number;
    vacancyMonths: number;
    loanAmount: number;
    loanTermYears: number;
    loanInterestRate: number;
  };
}

export default function InvestmentAnalysis({ locale, defaults }: Props) {
  const [purchasePrice, setPurchasePrice] = useState(String(defaults.purchasePrice));
  const [renovationCost, setRenovationCost] = useState(String(defaults.renovationCost));
  const [loanTermYears, setLoanTermYears] = useState(defaults.loanTermYears || 30);
  const [loanInterestRate, setLoanInterestRate] = useState(String(defaults.loanInterestRate || 2.5));

  const isTh = locale === "th";
  const fmt = (n: number) => new Intl.NumberFormat("th-TH").format(Math.round(n));

  const isModified =
    purchasePrice !== String(defaults.purchasePrice) ||
    renovationCost !== String(defaults.renovationCost) ||
    loanTermYears !== (defaults.loanTermYears || 30) ||
    loanInterestRate !== String(defaults.loanInterestRate || 2.5);

  const reset = () => {
    setPurchasePrice(String(defaults.purchasePrice));
    setRenovationCost(String(defaults.renovationCost));
    setLoanTermYears(defaults.loanTermYears || 30);
    setLoanInterestRate(String(defaults.loanInterestRate || 2.5));
  };

  // Derived calculations
  const pp = parseFloat(purchasePrice) || 0;
  const reno = parseFloat(renovationCost) || 0;
  const totalCost = pp + reno;

  const rent = defaults.rentPerMonth;
  const rentPerYear = rent * 12;

  const brokerFee = rent * defaults.brokerFeeMonths;
  const commonFee = defaults.commonFeePerYear;
  const maintenance = defaults.maintenancePerYear;
  const landTax = pp * (defaults.landTaxRate / 100);
  const vacancyCost = rent * defaults.vacancyMonths;
  const operatingExpense = brokerFee + commonFee + maintenance + landTax + vacancyCost;
  const operatingExpensePerMonth = operatingExpense / 12;

  const grossYield = totalCost > 0 ? (rentPerYear / totalCost) * 100 : 0;
  const noi = rentPerYear - operatingExpense;
  const netYield = totalCost > 0 ? (noi / totalCost) * 100 : 0;
  const noiPerMonth = noi / 12;

  const loanAmt = defaults.loanAmount;
  let monthlyPayment = 0, interestFirstMonth = 0, principalFirstMonth = 0, freeCashFlow = noiPerMonth;
  if (loanAmt > 0) {
    const r = parseFloat(loanInterestRate) / 100 / 12;
    const n = loanTermYears * 12;
    monthlyPayment = r > 0 ? loanAmt * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : loanAmt / n;
    interestFirstMonth = loanAmt * r;
    principalFirstMonth = monthlyPayment - interestFirstMonth;
    freeCashFlow = noiPerMonth - monthlyPayment;
  }

  const inputCls = "w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium";

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <SectionTitle
          badge={isTh ? "การลงทุน" : "Investment"}
          title={isTh ? "วิเคราะห์ผลตอบแทนการลงทุน" : "Investment Analysis"}
        />
        {isModified && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 border border-amber-300 rounded-full px-3 py-1.5 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            {isTh ? "คืนค่าเดิม" : "Reset"}
          </button>
        )}
      </div>

      {isModified && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          {isTh ? "กำลังแสดงการคำนวณเพื่อทดลองเท่านั้น — ไม่ได้บันทึกข้อมูล" : "Preview calculation only — no data saved"}
        </p>
      )}

      <div className="space-y-4">

        {/* Cost — editable */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-semibold text-stone-600 uppercase tracking-wide">{isTh ? "ต้นทุน" : "Investment Cost"}</span>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">{isTh ? "แก้ไขได้" : "Editable"}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">{isTh ? "ราคาซื้อ (บาท)" : "Purchase Price (฿)"}</label>
              <input
                type="number"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">{isTh ? "ค่าตกแต่ง + ต่อเติม (บาท)" : "Renovation (฿)"}</label>
              <input
                type="number"
                min="0"
                value={renovationCost}
                onChange={(e) => setRenovationCost(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex justify-between text-sm pt-3 border-t border-stone-100 font-semibold">
            <span>{isTh ? "ต้นทุนรวม" : "Total Investment"}</span>
            <span className="text-stone-800">฿{fmt(totalCost)}</span>
          </div>
        </div>

        {/* Yield */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-semibold text-stone-600 uppercase tracking-wide">{isTh ? "ผลตอบแทนค่าเช่า" : "Rental Yield"}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-xs text-amber-700 font-medium mb-1">Gross Rental Yield</p>
              <p className="text-2xl font-bold text-amber-600">{grossYield.toFixed(2)}%</p>
              <p className="text-xs text-stone-400">{isTh ? "ต่อปี" : "per year"}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-xs text-emerald-700 font-medium mb-1">Net Rental Yield (Cap Rate)</p>
              <p className="text-2xl font-bold text-emerald-600">{netYield.toFixed(2)}%</p>
              <p className="text-xs text-stone-400">{isTh ? "ต่อปี" : "per year"}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">{isTh ? "ค่าเช่า / เดือน" : "Monthly Rent"}</span>
              <span className="font-medium">฿{fmt(rent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{isTh ? "ค่าเช่า / ปี" : "Annual Rent"}</span>
              <span className="font-medium">฿{fmt(rentPerYear)}</span>
            </div>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-semibold text-stone-600 uppercase tracking-wide">{isTh ? "ค่าใช้จ่ายดำเนินงาน" : "Operating Expenses"}</span>
          </div>
          <div className="space-y-2 text-sm">
            {brokerFee > 0 && <div className="flex justify-between"><span className="text-stone-500">{isTh ? "ค่านายหน้า" : "Broker Fee"}</span><span>฿{fmt(brokerFee)}</span></div>}
            {commonFee > 0 && <div className="flex justify-between"><span className="text-stone-500">{isTh ? "ค่าส่วนกลาง" : "Common Fee"}</span><span>฿{fmt(commonFee)}</span></div>}
            {maintenance > 0 && <div className="flex justify-between"><span className="text-stone-500">{isTh ? "ค่าบำรุงรักษา" : "Maintenance"}</span><span>฿{fmt(maintenance)}</span></div>}
            {landTax > 0 && <div className="flex justify-between"><span className="text-stone-500">{isTh ? "ภาษีที่ดิน" : "Land Tax"}</span><span>฿{fmt(landTax)}</span></div>}
            {vacancyCost > 0 && <div className="flex justify-between"><span className="text-stone-500">{isTh ? "ห้องว่าง (ประมาณ)" : "Vacancy Loss"}</span><span>฿{fmt(vacancyCost)}</span></div>}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
              <div className="flex justify-between font-semibold text-rose-600 col-span-2 sm:col-span-1">
                <span>Operating Expense / {isTh ? "ปี" : "Year"}</span>
                <span>฿{fmt(operatingExpense)}</span>
              </div>
              <div className="flex justify-between font-semibold text-rose-500 col-span-2 sm:col-span-1">
                <span>Operating Expense / {isTh ? "เดือน" : "Month"}</span>
                <span>฿{fmt(operatingExpensePerMonth)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* NOI */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between font-semibold text-emerald-700">
              <span>{isTh ? "กำไรจากค่าเช่าสุทธิ (NOI) / เดือน" : "Net Operating Income / Month"}</span>
              <span>฿{fmt(noiPerMonth)}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-700">
              <span>{isTh ? "กำไรจากค่าเช่าสุทธิ (NOI) / ปี" : "Net Operating Income / Year"}</span>
              <span>฿{fmt(noi)}</span>
            </div>
          </div>
        </div>

        {/* ROI Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-semibold text-stone-600 uppercase tracking-wide">ROI Summary</span>
          </div>
          <div className={`grid gap-3 ${loanAmt > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xs text-amber-700 font-medium mb-1">Gross Yield</p>
              <p className="text-xl font-bold text-amber-600">{grossYield.toFixed(2)}%</p>
              <p className="text-[10px] text-stone-400">{isTh ? "ผลตอบแทนรวม/ปี" : "Total return/yr"}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-700 font-medium mb-1">Net Yield (ROI)</p>
              <p className="text-xl font-bold text-emerald-600">{netYield.toFixed(2)}%</p>
              <p className="text-[10px] text-stone-400">{isTh ? "หลังหักค่าใช้จ่าย/ปี" : "After expenses/yr"}</p>
            </div>
            {loanAmt > 0 && (() => {
              const equity = totalCost - loanAmt;
              const cashOnCash = equity > 0 ? ((freeCashFlow * 12) / equity) * 100 : null;
              const noEquity = equity <= 0;
              return (
                <div className={`rounded-xl p-3 text-center ${noEquity ? "bg-stone-50" : cashOnCash !== null && cashOnCash >= 0 ? "bg-blue-50" : "bg-rose-50"}`}>
                  <p className={`text-xs font-medium mb-1 ${noEquity ? "text-stone-400" : cashOnCash !== null && cashOnCash >= 0 ? "text-blue-700" : "text-rose-700"}`}>Cash-on-Cash</p>
                  {noEquity ? (
                    <>
                      <p className="text-xl font-bold text-stone-400">N/A</p>
                      <p className="text-[10px] text-stone-400">{isTh ? "วงเงินกู้ = ต้นทุนรวม" : "Loan = total cost"}</p>
                    </>
                  ) : (
                    <>
                      <p className={`text-xl font-bold ${cashOnCash !== null && cashOnCash >= 0 ? "text-blue-600" : "text-rose-600"}`}>{cashOnCash !== null ? cashOnCash.toFixed(2) : "0.00"}%</p>
                      <p className="text-[10px] text-stone-400">{isTh ? `เงินดาวน์ ฿${fmt(equity)}` : `Down ฿${fmt(equity)}`}</p>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 space-y-1 text-xs text-stone-400">
            <p>• <strong className="text-stone-500">Gross Yield</strong> = ค่าเช่า/ปี ÷ ต้นทุนรวม × 100</p>
            <p>• <strong className="text-stone-500">Net Yield (ROI)</strong> = NOI/ปี ÷ ต้นทุนรวม × 100</p>
            {loanAmt > 0 && <p>• <strong className="text-stone-500">Cash-on-Cash</strong> = Free Cash Flow/ปี ÷ เงินดาวน์ × 100</p>}
          </div>
        </div>

        {/* Loan — editable term + rate */}
        {loanAmt > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <HandCoins className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-semibold text-stone-600 uppercase tracking-wide">{isTh ? "สินเชื่อ" : "Financing"}</span>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">{isTh ? "แก้ไขได้" : "Editable"}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-stone-500 mb-1">{isTh ? "ระยะเวลาผ่อน (ปี)" : "Loan Term (years)"}</label>
                <select
                  value={loanTermYears}
                  onChange={(e) => setLoanTermYears(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium bg-white"
                >
                  {LOAN_TERM_OPTIONS.map((y) => (
                    <option key={y} value={y}>{y} {isTh ? "ปี" : "years"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">{isTh ? "อัตราดอกเบี้ย (% ต่อปี)" : "Interest Rate (% p.a.)"}</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={loanInterestRate}
                  onChange={(e) => setLoanInterestRate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-stone-400 text-xs mb-2">
                <span>{isTh ? `วงเงินกู้ ฿${fmt(loanAmt)} · ผ่อน ${loanTermYears} ปี @ ${loanInterestRate}%` : `Loan ฿${fmt(loanAmt)} · ${loanTermYears}yr @ ${loanInterestRate}%`}</span>
              </div>
              <div className="flex justify-between"><span className="text-stone-500">{isTh ? "ผ่อนค่างวด / เดือน" : "Monthly Payment"}</span><span className="font-medium">฿{fmt(monthlyPayment)}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">{isTh ? "ดอกเบี้ย (ประมาณ ปีแรก) / เดือน" : "Interest ~Year 1 / Month"}</span><span>฿{fmt(interestFirstMonth)}</span></div>
              <div className="flex justify-between"><span className="text-stone-500">{isTh ? "เข้าเงินต้น (ประมาณ ปีแรก) / เดือน" : "Principal ~Year 1 / Month"}</span><span>฿{fmt(principalFirstMonth)}</span></div>
              <div className="flex justify-between pt-2 border-t border-stone-100 font-bold">
                <span className="text-blue-700">{isTh ? "กระแสเงินสด (Free Cash Flow) / เดือน" : "Free Cash Flow / Month"}</span>
                <span className={freeCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"}>฿{fmt(freeCashFlow)}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
