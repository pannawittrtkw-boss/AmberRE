"use client";

import { useState, useEffect } from "react";
import { Wallet, Receipt, HandCoins, RotateCcw, BarChart3 } from "lucide-react";
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
  const [messages, setMessages] = useState<any>(null);
  const [purchasePrice, setPurchasePrice] = useState(String(defaults.purchasePrice));
  const [renovationCost, setRenovationCost] = useState(String(defaults.renovationCost));
  const [rentPerMonth, setRentPerMonth] = useState(String(defaults.rentPerMonth));
  const [maintenancePerYear, setMaintenancePerYear] = useState(String(defaults.maintenancePerYear));
  const [loanAmount, setLoanAmount] = useState(String(defaults.loanAmount || ""));
  const [loanTermYears, setLoanTermYears] = useState(defaults.loanTermYears || 30);
  const [loanInterestRate, setLoanInterestRate] = useState(String(defaults.loanInterestRate || 2.5));

  useEffect(() => {
    import(`@/messages/${locale}.json`).then((m) => setMessages(m.default));
  }, [locale]);

  const fmt = (n: number) => new Intl.NumberFormat("th-TH").format(Math.round(n));

  const defaultLoanAmount = String(defaults.loanAmount || "");
  const isModified =
    purchasePrice !== String(defaults.purchasePrice) ||
    renovationCost !== String(defaults.renovationCost) ||
    rentPerMonth !== String(defaults.rentPerMonth) ||
    maintenancePerYear !== String(defaults.maintenancePerYear) ||
    loanAmount !== defaultLoanAmount ||
    loanTermYears !== (defaults.loanTermYears || 30) ||
    loanInterestRate !== String(defaults.loanInterestRate || 2.5);

  const reset = () => {
    setPurchasePrice(String(defaults.purchasePrice));
    setRenovationCost(String(defaults.renovationCost));
    setRentPerMonth(String(defaults.rentPerMonth));
    setMaintenancePerYear(String(defaults.maintenancePerYear));
    setLoanAmount(defaultLoanAmount);
    setLoanTermYears(defaults.loanTermYears || 30);
    setLoanInterestRate(String(defaults.loanInterestRate || 2.5));
  };

  const pp = parseFloat(purchasePrice) || 0;
  const reno = parseFloat(renovationCost) || 0;
  const totalCost = pp + reno;

  const rent = parseFloat(rentPerMonth) || 0;
  const rentPerYear = rent * 12;

  const brokerFee = rent * defaults.brokerFeeMonths;
  const commonFee = defaults.commonFeePerYear;
  const maintenance = parseFloat(maintenancePerYear) || 0;
  const landTax = pp * (defaults.landTaxRate / 100);
  const vacancyCost = rent * defaults.vacancyMonths;
  const operatingExpense = brokerFee + commonFee + maintenance + landTax + vacancyCost;
  const operatingExpensePerMonth = operatingExpense / 12;

  const grossYield = totalCost > 0 ? (rentPerYear / totalCost) * 100 : 0;
  const noi = rentPerYear - operatingExpense;
  const netYield = totalCost > 0 ? (noi / totalCost) * 100 : 0;
  const noiPerMonth = noi / 12;

  const loanAmt = parseFloat(loanAmount) || 0;
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

  if (!messages) return null;
  const I = messages.investment;
  const tp = messages.property;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <SectionTitle
          badge={I.badge}
          title={tp.investmentAnalysis}
        />
        {isModified && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 border border-amber-300 rounded-full px-3 py-1.5 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            {I.reset}
          </button>
        )}
      </div>

      {isModified && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          {I.previewDisclaimer}
        </p>
      )}

      <div className="space-y-4">

        {/* Cost — editable */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-semibold text-stone-600 uppercase tracking-wide">{I.cost}</span>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">{I.editable}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">{I.purchasePrice}</label>
              <input
                type="number"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">{I.renovation}</label>
              <input
                type="number"
                min="0"
                value={renovationCost}
                onChange={(e) => setRenovationCost(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">{I.monthlyRentLabel}</label>
              <input
                type="number"
                min="0"
                value={rentPerMonth}
                onChange={(e) => setRentPerMonth(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex justify-between text-sm pt-3 border-t border-stone-100 font-semibold">
            <span>{I.totalCost}</span>
            <span className="text-stone-800">฿{fmt(totalCost)}</span>
          </div>
        </div>

        {/* ROI Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-semibold text-stone-600 uppercase tracking-wide">ROI Summary</span>
          </div>
          <div className={`grid gap-3 mb-4 ${loanAmt > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xs text-amber-700 font-medium mb-1">Gross Yield</p>
              <p className="text-xl font-bold text-amber-600">{grossYield.toFixed(2)}%</p>
              <p className="text-[10px] text-stone-400">{I.totalReturnPerYear}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-700 font-medium mb-1">Net Yield (ROI)</p>
              <p className="text-xl font-bold text-emerald-600">{netYield.toFixed(2)}%</p>
              <p className="text-[10px] text-stone-400">{I.afterExpensesPerYear}</p>
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
                      <p className="text-[10px] text-stone-400">{I.loanEqualsCost}</p>
                    </>
                  ) : (
                    <>
                      <p className={`text-xl font-bold ${cashOnCash !== null && cashOnCash >= 0 ? "text-blue-600" : "text-rose-600"}`}>{cashOnCash !== null ? cashOnCash.toFixed(2) : "0.00"}%</p>
                      <p className="text-[10px] text-stone-400">{I.downPrefix} ฿{fmt(equity)}</p>
                    </>
                  )}
                </div>
              );
            })()}
          </div>
          <div className="space-y-2 text-sm border-t border-stone-100 pt-3">
            <div className="flex justify-between">
              <span className="text-stone-500">{I.monthlyRent}</span>
              <span className="font-medium">฿{fmt(rent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{I.annualRent}</span>
              <span className="font-medium">฿{fmt(rentPerYear)}</span>
            </div>

            {(() => {
              const equity = totalCost - loanAmt;
              const paybackNoLoan = noi > 0 ? totalCost / noi : null;
              const paybackWithLoan = loanAmt > 0 && equity > 0 && freeCashFlow > 0 ? equity / (freeCashFlow * 12) : null;
              return (
                <>
                  <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                    <span className="font-semibold text-stone-700">{I.paybackCash}</span>
                    <span className="font-bold text-violet-600 text-base">
                      {paybackNoLoan !== null ? `${paybackNoLoan.toFixed(1)} ${I.yrs}` : "N/A"}
                    </span>
                  </div>
                  {loanAmt > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-stone-700">{I.paybackLoan}</span>
                      <span className="font-bold text-violet-500 text-base">
                        {paybackWithLoan !== null ? `${paybackWithLoan.toFixed(1)} ${I.yrs}` : "N/A"}
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 space-y-3 text-xs">
            <div>
              <p className="font-semibold text-stone-500 mb-0.5">
                Gross Yield = {I.grossYieldFormula}
              </p>
              <p className="text-stone-400 leading-relaxed">{I.grossYieldDesc}</p>
            </div>
            <div>
              <p className="font-semibold text-stone-500 mb-0.5">
                Net Yield (ROI) = {I.netYieldFormula}
              </p>
              <p className="text-stone-400 leading-relaxed">{I.netYieldDesc}</p>
            </div>
            {loanAmt > 0 && (
              <div>
                <p className="font-semibold text-stone-500 mb-0.5">
                  Cash-on-Cash = {I.cashOnCashFormula}
                </p>
                <p className="text-stone-400 leading-relaxed">{I.cashOnCashDesc}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-stone-500 mb-0.5">
                {I.paybackCash} = {I.paybackCashFormula}
              </p>
              <p className="text-stone-400 leading-relaxed">{I.paybackCashDesc}</p>
            </div>
            {loanAmt > 0 && (
              <div>
                <p className="font-semibold text-stone-500 mb-0.5">
                  {I.paybackLoan} = {I.paybackLoanFormula}
                </p>
                <p className="text-stone-400 leading-relaxed">{I.paybackLoanDesc}</p>
              </div>
            )}
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-semibold text-stone-600 uppercase tracking-wide">{I.operatingExpenses}</span>
          </div>
          <div className="space-y-2 text-sm">
            {brokerFee > 0 && <div className="flex justify-between"><span className="text-stone-500">{I.brokerFee}</span><span>฿{fmt(brokerFee)}</span></div>}
            {commonFee > 0 && <div className="flex justify-between"><span className="text-stone-500">{I.commonFee}</span><span>฿{fmt(commonFee)}</span></div>}
            <div className="flex items-center justify-between gap-3">
              <span className="text-stone-500 shrink-0">{I.maintenancePerYear}</span>
              <input
                type="number"
                min="0"
                value={maintenancePerYear}
                onChange={(e) => setMaintenancePerYear(e.target.value)}
                className="w-36 border rounded-lg px-2 py-1 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium text-right"
              />
            </div>
            {landTax > 0 && <div className="flex justify-between"><span className="text-stone-500">{I.landTax}</span><span>฿{fmt(landTax)}</span></div>}
            {vacancyCost > 0 && <div className="flex justify-between"><span className="text-stone-500">{I.vacancyLoss}</span><span>฿{fmt(vacancyCost)}</span></div>}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex justify-between font-semibold text-rose-600">
                <span>Operating Expense {I.perMonth}</span>
                <span>฿{fmt(operatingExpensePerMonth)}</span>
              </div>
              <div className="flex justify-between font-semibold text-rose-500">
                <span>Operating Expense {I.perYear}</span>
                <span>฿{fmt(operatingExpense)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* NOI */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between font-semibold text-emerald-700">
              <span>{I.noiPerMonth}</span>
              <span>฿{fmt(noiPerMonth)}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-700">
              <span>{I.noiPerYear}</span>
              <span>฿{fmt(noi)}</span>
            </div>
          </div>
        </div>

        {/* Financing */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <HandCoins className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-semibold text-stone-600 uppercase tracking-wide">{I.financing}</span>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">{I.editable}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">{I.loanAmount}</label>
              <input
                type="number"
                min="0"
                placeholder={I.loanPlaceholder}
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className={inputCls}
              />
              {loanAmt > 0 && totalCost > 0 && (
                <p className="text-[11px] text-stone-400 mt-1">
                  LTV {((loanAmt / totalCost) * 100).toFixed(0)}% · {I.downPayment} ฿{fmt(Math.max(0, totalCost - loanAmt))}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">{I.loanTerm}</label>
              <select
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none text-sm font-medium bg-white"
              >
                {LOAN_TERM_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y} {I.yearsUnit}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">{I.interestRate}</label>
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

          {loanAmt > 0 ? (
            <div className="text-sm">
              <div className="grid grid-cols-3 text-xs text-stone-400 font-medium mb-2 pb-2 border-b border-stone-100">
                <span></span>
                <span className="text-right">{I.perMonth}</span>
                <span className="text-right">{I.perYear}</span>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-3">
                  <span className="text-stone-500">{I.monthlyPayment}</span>
                  <span className="text-right font-medium">฿{fmt(monthlyPayment)}</span>
                  <span className="text-right text-stone-500">฿{fmt(monthlyPayment * 12)}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-stone-500">{I.interestYr1}</span>
                  <span className="text-right">฿{fmt(interestFirstMonth)}</span>
                  <span className="text-right text-stone-500">฿{fmt(interestFirstMonth * 12)}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-stone-500">{I.principalYr1}</span>
                  <span className="text-right">฿{fmt(principalFirstMonth)}</span>
                  <span className="text-right text-stone-500">฿{fmt(principalFirstMonth * 12)}</span>
                </div>
                <div className="grid grid-cols-3 pt-2 border-t border-stone-100 font-bold">
                  <span className="text-blue-700">Free Cash Flow</span>
                  <span className={`text-right ${freeCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>฿{fmt(freeCashFlow)}</span>
                  <span className={`text-right ${freeCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>฿{fmt(freeCashFlow * 12)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-2">{I.enterLoanPrompt}</p>
          )}
        </div>

      </div>
    </section>
  );
}
