"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, Upload, Loader2, Bot, Calendar } from "lucide-react";

type Tab = "unit" | "daily";

interface UnitResult {
  pricePerUnit: number;
  totalUnits: number;
  oldTenantUnits: number;
  vacantUnits: number;
  newTenantUnits: number;
  oldTenantCost: number;
  vacantCost: number;
  newTenantCost: number;
}

interface DailyResult {
  totalDays: number;
  dailyRate: number;
  oldTenantDays: number;
  vacantDays: number;
  newTenantDays: number;
  oldTenantCost: number;
  vacantCost: number;
  newTenantCost: number;
}

export default function ElectricityCalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("unit");
  const [noOldTenant, setNoOldTenant] = useState(false);

  // Unit-based form
  const [billAmount, setBillAmount] = useState("");
  const [unitsUsed, setUnitsUsed] = useState("");
  const [latestMeter, setLatestMeter] = useState("");
  const [previousMeter, setPreviousMeter] = useState("");
  const [oldTenantMeter, setOldTenantMeter] = useState("");
  const [newTenantMeter, setNewTenantMeter] = useState("");

  // Daily-based form
  const [dailyBillAmount, setDailyBillAmount] = useState("");
  const [previousBillDate, setPreviousBillDate] = useState("");
  const [oldTenantMoveOutDate, setOldTenantMoveOutDate] = useState("");
  const [latestBillDate, setLatestBillDate] = useState("");
  const [newTenantMoveInDate, setNewTenantMoveInDate] = useState("");

  // Results
  const [unitResult, setUnitResult] = useState<UnitResult | null>(null);
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(null);

  // AI upload states
  const [analyzingBill, setAnalyzingBill] = useState(false);
  const [analyzingOldMeter, setAnalyzingOldMeter] = useState(false);
  const [analyzingNewMeter, setAnalyzingNewMeter] = useState(false);

  const billInputRef = useRef<HTMLInputElement>(null);
  const oldMeterInputRef = useRef<HTMLInputElement>(null);
  const newMeterInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const handleAIUpload = async (
    file: File,
    type: "bill" | "oldMeter" | "newMeter"
  ) => {
    const setAnalyzing =
      type === "bill"
        ? setAnalyzingBill
        : type === "oldMeter"
        ? setAnalyzingOldMeter
        : setAnalyzingNewMeter;

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/ai/extract-electricity", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        if (type === "bill") {
          if (data.data.billAmount != null)
            setBillAmount(String(data.data.billAmount));
          if (data.data.unitsUsed != null)
            setUnitsUsed(String(data.data.unitsUsed));
          if (data.data.latestMeter != null)
            setLatestMeter(String(data.data.latestMeter));
          if (data.data.previousMeter != null)
            setPreviousMeter(String(data.data.previousMeter));
        } else if (type === "oldMeter") {
          if (data.data.meterReading != null)
            setOldTenantMeter(String(data.data.meterReading));
        } else if (type === "newMeter") {
          if (data.data.meterReading != null)
            setNewTenantMeter(String(data.data.meterReading));
        }
      }
    } catch {
      // Silently handle errors
    }
    setAnalyzing(false);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "bill" | "oldMeter" | "newMeter"
  ) => {
    const file = e.target.files?.[0];
    if (file) handleAIUpload(file, type);
    e.target.value = "";
  };

  const calculateByUnit = () => {
    const bill = parseFloat(billAmount);
    const units = parseFloat(unitsUsed);
    const latest = parseFloat(latestMeter);
    const previous = parseFloat(previousMeter);
    const oldMeter = parseFloat(oldTenantMeter);
    const newMeter = parseFloat(newTenantMeter);

    if (isNaN(bill) || isNaN(units) || units === 0) return;
    if (isNaN(latest) || isNaN(previous)) return;
    if (isNaN(newMeter)) return;
    if (!noOldTenant && isNaN(oldMeter)) return;

    const pricePerUnit = bill / units;
    const totalUnits = latest - previous;

    let oldTenantUnits: number;
    let vacantUnits: number;
    let newTenantUnits: number;

    if (noOldTenant) {
      oldTenantUnits = 0;
      newTenantUnits = latest - newMeter;
      vacantUnits = totalUnits - newTenantUnits;
    } else {
      oldTenantUnits = oldMeter - previous;
      newTenantUnits = latest - newMeter;
      vacantUnits = totalUnits - oldTenantUnits - newTenantUnits;
    }

    setUnitResult({
      pricePerUnit,
      totalUnits,
      oldTenantUnits,
      vacantUnits,
      newTenantUnits,
      oldTenantCost: parseFloat((oldTenantUnits * pricePerUnit).toFixed(2)),
      vacantCost: parseFloat((vacantUnits * pricePerUnit).toFixed(2)),
      newTenantCost: parseFloat((newTenantUnits * pricePerUnit).toFixed(2)),
    });
  };

  const calculateByDaily = () => {
    const bill = parseFloat(dailyBillAmount);
    if (isNaN(bill)) return;

    const prevDate = new Date(previousBillDate);
    const latestDate = new Date(latestBillDate);
    const moveOutDate = new Date(oldTenantMoveOutDate);
    const moveInDate = new Date(newTenantMoveInDate);

    if (isNaN(prevDate.getTime()) || isNaN(latestDate.getTime())) return;
    if (isNaN(moveInDate.getTime())) return;
    if (!noOldTenant && isNaN(moveOutDate.getTime())) return;

    const totalDays = Math.round(
      (latestDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (totalDays <= 0) return;

    const dailyRate = bill / totalDays;

    let oldTenantDays: number;
    let vacantDays: number;
    let newTenantDays: number;

    if (noOldTenant) {
      oldTenantDays = 0;
      newTenantDays = Math.round(
        (latestDate.getTime() - moveInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      vacantDays = totalDays - newTenantDays;
    } else {
      oldTenantDays = Math.round(
        (moveOutDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      newTenantDays = Math.round(
        (latestDate.getTime() - moveInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      vacantDays = totalDays - oldTenantDays - newTenantDays;
    }

    setDailyResult({
      totalDays,
      dailyRate,
      oldTenantDays,
      vacantDays,
      newTenantDays,
      oldTenantCost: parseFloat((oldTenantDays * dailyRate).toFixed(2)),
      vacantCost: parseFloat((vacantDays * dailyRate).toFixed(2)),
      newTenantCost: parseFloat((newTenantDays * dailyRate).toFixed(2)),
    });
  };

  if (!messages)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );

  const t = messages.electricityCalculator;

  const formatNumber = (num: number) =>
    num.toLocaleString(locale === "th" ? "th-TH" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          {t.title}
        </h1>
        <p className="text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-6">
        <button
          onClick={() => {
            setTab("unit");
            setDailyResult(null);
          }}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            tab === "unit"
              ? "bg-white text-gray-900 border-b-2 border-gray-900"
              : "bg-gray-50 text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.tabUnit}
        </button>
        <button
          onClick={() => {
            setTab("daily");
            setUnitResult(null);
          }}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            tab === "daily"
              ? "bg-white text-gray-900 border-b-2 border-gray-900"
              : "bg-gray-50 text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.tabDaily}
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {tab === "unit" ? (
          <>
            <h2 className="text-xl font-bold mb-1">{t.unitTitle}</h2>
            <p className="text-gray-500 text-sm mb-6">{t.unitSubtitle}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-5">
                {/* No old tenant checkbox */}
                <label className="flex items-center gap-3 cursor-pointer bg-gray-50 rounded-lg px-4 py-3">
                  <input
                    type="checkbox"
                    checked={noOldTenant}
                    onChange={(e) => setNoOldTenant(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">{t.noOldTenant}</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      1. {t.billAmount}
                    </label>
                    <input
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      2. {t.unitsUsed}
                    </label>
                    <input
                      type="number"
                      value={unitsUsed}
                      onChange={(e) => setUnitsUsed(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      3. {t.latestMeter}
                    </label>
                    <input
                      type="number"
                      value={latestMeter}
                      onChange={(e) => setLatestMeter(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      4. {t.previousMeter}
                    </label>
                    <input
                      type="number"
                      value={previousMeter}
                      onChange={(e) => setPreviousMeter(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!noOldTenant && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        5. {t.oldTenantMeter}
                      </label>
                      <input
                        type="number"
                        value={oldTenantMeter}
                        onChange={(e) => setOldTenantMeter(e.target.value)}
                        className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        placeholder="0"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {noOldTenant ? "5" : "6"}. {t.newTenantMeter}
                    </label>
                    <input
                      type="number"
                      value={newTenantMeter}
                      onChange={(e) => setNewTenantMeter(e.target.value)}
                      className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* AI Assistant */}
              <div className="bg-gray-50 rounded-xl p-5 h-fit">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-5 h-5 text-gray-700" />
                  <h3 className="font-semibold text-sm">{t.aiAssistant}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">{t.aiDescription}</p>

                {/* Upload Bill */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1.5">
                    <Zap className="w-3 h-3 inline mr-1" />
                    1-4. {t.autoFillBill}
                  </p>
                  <input
                    ref={billInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "bill")}
                  />
                  <button
                    onClick={() => billInputRef.current?.click()}
                    disabled={analyzingBill}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm hover:border-gray-400 hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {analyzingBill ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.analyzing}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {t.uploadBill}
                      </>
                    )}
                  </button>
                </div>

                {/* Upload Old Meter */}
                {!noOldTenant && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1.5">
                      <Zap className="w-3 h-3 inline mr-1" />
                      5. {t.autoFillMeter}
                    </p>
                    <input
                      ref={oldMeterInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "oldMeter")}
                    />
                    <button
                      onClick={() => oldMeterInputRef.current?.click()}
                      disabled={analyzingOldMeter}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm hover:border-gray-400 hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {analyzingOldMeter ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t.analyzing}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          {t.uploadOldMeter}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Upload New Meter */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">
                    <Zap className="w-3 h-3 inline mr-1" />
                    {noOldTenant ? "5" : "6"}. {t.autoFillMeter}
                  </p>
                  <input
                    ref={newMeterInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "newMeter")}
                  />
                  <button
                    onClick={() => newMeterInputRef.current?.click()}
                    disabled={analyzingNewMeter}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm hover:border-gray-400 hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {analyzingNewMeter ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.analyzing}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {t.uploadNewMeter}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateByUnit}
              className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              {t.calculate}
            </button>

            {/* Unit Result */}
            {unitResult && (
              <div className="mt-6 bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#C8A951]" />
                  {t.result}
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t.pricePerUnit}</span>
                    <span className="font-semibold">
                      {formatNumber(unitResult.pricePerUnit)} {t.baht}/{t.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t.totalUnits}</span>
                    <span className="font-semibold">
                      {formatNumber(unitResult.totalUnits)} {t.unit}
                    </span>
                  </div>

                  {!noOldTenant && (
                    <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                      <span className="text-gray-600">
                        {t.oldTenantUnits}
                      </span>
                      <span className="font-semibold">
                        {formatNumber(unitResult.oldTenantUnits)} {t.unit}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                    <span className="text-gray-600">{noOldTenant ? t.ownerCost : t.vacantUnits}</span>
                    <span className="font-semibold">
                      {formatNumber(unitResult.vacantUnits)} {t.unit}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t.newTenantUnits}</span>
                    <span className="font-semibold">
                      {formatNumber(unitResult.newTenantUnits)} {t.unit}
                    </span>
                  </div>

                  <div className="pt-3 space-y-2">
                    {!noOldTenant && (
                      <div className="flex justify-between items-center bg-blue-50 rounded-lg px-4 py-3">
                        <span className="text-sm font-medium text-blue-900">
                          {t.oldTenantCost}
                        </span>
                        <span className="text-lg font-bold text-blue-700">
                          {formatNumber(unitResult.oldTenantCost)} {t.baht}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center bg-orange-50 rounded-lg px-4 py-3">
                      <span className="text-sm font-medium text-orange-900">
                        {noOldTenant ? t.ownerCost : t.vacantCost}
                      </span>
                      <span className="text-lg font-bold text-orange-700">
                        {formatNumber(unitResult.vacantCost)} {t.baht}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-green-50 rounded-lg px-4 py-3">
                      <span className="text-sm font-medium text-green-900">
                        {t.newTenantCost}
                      </span>
                      <span className="text-lg font-bold text-green-700">
                        {formatNumber(unitResult.newTenantCost)} {t.baht}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Daily Average Tab */}
            <h2 className="text-xl font-bold mb-1">{t.dailyTitle}</h2>
            <p className="text-gray-500 text-sm mb-6">{t.dailySubtitle}</p>

            {/* No old tenant checkbox */}
            <label className="flex items-center gap-3 cursor-pointer bg-gray-50 rounded-lg px-4 py-3 mb-5">
              <input
                type="checkbox"
                checked={noOldTenant}
                onChange={(e) => setNoOldTenant(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">{t.noOldTenant}</span>
            </label>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    1. {t.billAmount}
                  </label>
                  <input
                    type="number"
                    value={dailyBillAmount}
                    onChange={(e) => setDailyBillAmount(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    2. {t.previousBillDate}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={previousBillDate}
                      onChange={(e) => setPreviousBillDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
              </div>

              {!noOldTenant && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      3. {t.oldTenantMoveOut}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="date"
                        value={oldTenantMoveOutDate}
                        onChange={(e) =>
                          setOldTenantMoveOutDate(e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {noOldTenant ? "3" : "4"}. {t.latestBillDate}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={latestBillDate}
                      onChange={(e) => setLatestBillDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {noOldTenant ? "4" : "5"}. {t.newTenantMoveIn}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="date"
                      value={newTenantMoveInDate}
                      onChange={(e) => setNewTenantMoveInDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculateByDaily}
              className="w-full mt-6 bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              {t.calculate}
            </button>

            {/* Daily Result */}
            {dailyResult && (
              <div className="mt-6 bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#C8A951]" />
                  {t.result}
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t.totalDays}</span>
                    <span className="font-semibold">
                      {dailyResult.totalDays} {t.days}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t.dailyRate}</span>
                    <span className="font-semibold">
                      {formatNumber(dailyResult.dailyRate)} {t.baht}/{t.days}
                    </span>
                  </div>

                  {!noOldTenant && (
                    <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                      <span className="text-gray-600">
                        {t.oldTenantDays}
                      </span>
                      <span className="font-semibold">
                        {dailyResult.oldTenantDays} {t.days}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                    <span className="text-gray-600">{noOldTenant ? t.ownerCost : t.vacantDays}</span>
                    <span className="font-semibold">
                      {dailyResult.vacantDays} {t.days}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t.newTenantDays}</span>
                    <span className="font-semibold">
                      {dailyResult.newTenantDays} {t.days}
                    </span>
                  </div>

                  <div className="pt-3 space-y-2">
                    {!noOldTenant && (
                      <div className="flex justify-between items-center bg-blue-50 rounded-lg px-4 py-3">
                        <span className="text-sm font-medium text-blue-900">
                          {t.oldTenantCost}
                        </span>
                        <span className="text-lg font-bold text-blue-700">
                          {formatNumber(dailyResult.oldTenantCost)} {t.baht}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center bg-orange-50 rounded-lg px-4 py-3">
                      <span className="text-sm font-medium text-orange-900">
                        {noOldTenant ? t.ownerCost : t.vacantCost}
                      </span>
                      <span className="text-lg font-bold text-orange-700">
                        {formatNumber(dailyResult.vacantCost)} {t.baht}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-green-50 rounded-lg px-4 py-3">
                      <span className="text-sm font-medium text-green-900">
                        {t.newTenantCost}
                      </span>
                      <span className="text-lg font-bold text-green-700">
                        {formatNumber(dailyResult.newTenantCost)} {t.baht}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
