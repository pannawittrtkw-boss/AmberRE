"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Loader2,
  Plus,
  TrendingUp,
  TrendingDown,
  Scale,
  ChevronDown,
  ChevronUp,
  Lock,
  X,
  Upload,
  Calendar as CalendarIcon,
  Trash2,
  Pencil,
  Users,
  ArrowUp,
  ArrowDown,
  Rows3,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const ACCOUNTING_PASSWORD = "Amber888";
const STORAGE_KEY = "npb_accounting_unlocked";

const INCOME_CATEGORIES = [
  "Commission Rent",
  "Commission Sell",
  "Commission Wifi",
  "Commission Air conditioner",
  "Commission Cleaning",
  "Other",
];

const EXPENSE_CATEGORIES = [
  "Operation cost",
  "Make Contract",
  "Telephone",
  "Transportation",
  "Marketing",
  "Other",
];

const SHAREHOLDERS = ["Boss", "Namphung", "Yoon Ei", "Yung"];
const PROFIT_SHARE_PERCENT = 25;

// Format a chart bar/line label: hide 0, abbreviate thousands (e.g. 54800 → "54.8k")
function chartLabelFormatter(value: any): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!n || isNaN(n)) return "";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}k`;
  return `${sign}${abs.toFixed(0)}`;
}

interface Transaction {
  id: number;
  date: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  recordType: "ACTUAL" | "FORECAST";
  category: string;
  description: string;
  payee: string | null;
  slipUrl: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AccountingPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [previousMonth, setPreviousMonth] = useState<Transaction[]>([]);
  const [yearlyChart, setYearlyChart] = useState<
    {
      month: number;
      income: number;
      expense: number;
      net: number;
      incomeByCategory: Record<string, number>;
      expenseByCategory: Record<string, number>;
    }[]
  >([]);
  const [pieDrillDown, setPieDrillDown] = useState<
    { month: number; type: "INCOME" | "EXPENSE" } | null
  >(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showMultiModal, setShowMultiModal] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Check unlock state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isUnlocked = sessionStorage.getItem(STORAGE_KEY) === "true";
      setUnlocked(isUnlocked);
    }
  }, []);

  const handleUnlock = () => {
    if (passwordInput === ACCOUNTING_PASSWORD) {
      setUnlocked(true);
      sessionStorage.setItem(STORAGE_KEY, "true");
      setPasswordError(false);
      setPasswordInput("");
    } else {
      setPasswordError(true);
    }
  };

  const fetchTransactions = useCallback(async () => {
    if (!unlocked) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/accounting?year=${year}&month=${month}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data.transactions);
        setPreviousMonth(data.data.previousMonth);
        setYearlyChart(data.data.yearlyChart || []);
      }
    } catch {}
    setLoading(false);
  }, [year, month, unlocked]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Calculate summary
  const summary = useMemo(() => {
    const actualIncome = transactions
      .filter((t) => t.type === "INCOME" && t.recordType === "ACTUAL")
      .reduce((sum, t) => sum + t.amount, 0);
    const actualExpense = transactions
      .filter((t) => t.type === "EXPENSE" && t.recordType === "ACTUAL")
      .reduce((sum, t) => sum + t.amount, 0);
    const forecastIncome = transactions
      .filter((t) => t.type === "INCOME" && t.recordType === "FORECAST")
      .reduce((sum, t) => sum + t.amount, 0);
    const forecastExpense = transactions
      .filter((t) => t.type === "EXPENSE" && t.recordType === "FORECAST")
      .reduce((sum, t) => sum + t.amount, 0);

    const prevIncome = previousMonth
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const prevExpense = previousMonth
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome: actualIncome + forecastIncome,
      actualIncome,
      forecastIncome,
      prevIncome,

      totalExpense: actualExpense + forecastExpense,
      actualExpense,
      forecastExpense,
      prevExpense,

      totalNet: actualIncome + forecastIncome - actualExpense - forecastExpense,
      actualNet: actualIncome - actualExpense,
      forecastNet: forecastIncome - forecastExpense,
      prevNet: prevIncome - prevExpense,
    };
  }, [transactions, previousMonth]);

  // Group by category
  const groupedByCategory = useMemo(() => {
    const result: Record<"INCOME" | "EXPENSE", Record<string, { total: number; items: Transaction[] }>> = {
      INCOME: {},
      EXPENSE: {},
    };

    for (const t of transactions) {
      if (t.recordType !== "ACTUAL") continue;
      if (!result[t.type][t.category]) {
        result[t.type][t.category] = { total: 0, items: [] };
      }
      result[t.type][t.category].total += t.amount;
      result[t.type][t.category].items.push(t);
    }

    return result;
  }, [transactions]);

  // Calculate shareholder payouts
  const shareholderPayouts = useMemo(() => {
    const profit = summary.actualNet;
    const profitShare = (profit * PROFIT_SHARE_PERCENT) / 100;

    // Transportation expenses by payee
    const transportationByPayee: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === "EXPENSE" && t.recordType === "ACTUAL" && t.category === "Transportation" && t.payee) {
        transportationByPayee[t.payee] = (transportationByPayee[t.payee] || 0) + t.amount;
      }
    }

    return SHAREHOLDERS.map((name) => ({
      name,
      profitShare,
      transportation: transportationByPayee[name] || 0,
      total: profitShare + (transportationByPayee[name] || 0),
    }));
  }, [summary.actualNet, transactions]);

  // Sorted/filtered transactions
  const displayTransactions = useMemo(() => {
    let list = transactions.filter((t) => {
      if (filter === "income") return t.type === "INCOME";
      if (filter === "expense") return t.type === "EXPENSE";
      return true;
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        cmp = a.amount - b.amount;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [transactions, filter, sortField, sortDir]);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const formatTHB = (n: number) =>
    `฿${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSort = (field: "date" | "amount") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleDeleteTxn = async (id: number) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await fetch(`/api/admin/accounting/${id}`, { method: "DELETE" });
      fetchTransactions();
    } catch {}
  };

  // Password Lock Screen
  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="bg-white rounded-2xl shadow-xl border p-8 w-full max-w-md">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-[#C8A951]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Accounting Access</h2>
            <p className="text-sm text-gray-500 mt-2">
              Enter password to access accounting
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                placeholder="Enter password"
                autoFocus
                className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 ${
                  passwordError
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-200 focus:ring-amber-200 focus:border-[#C8A951]"
                }`}
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">Incorrect password</p>
              )}
            </div>
            <button
              onClick={handleUnlock}
              className="w-full bg-[#C8A951] hover:bg-[#B8993F] text-white py-3 rounded-lg font-medium transition-colors"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Accounting</h1>
        <p className="text-sm text-gray-500 mt-1">Track your income and expenses.</p>
      </div>

      {/* Filter & Add Button */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-2">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMultiModal(true)}
              className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Rows3 className="w-4 h-4" />
              Add Multi Transaction
            </button>
            <button
              onClick={() => {
                setEditingTxn(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <SummaryCard
            label="Income"
            icon={<TrendingUp className="w-5 h-5" />}
            color="emerald"
            current={summary.actualIncome}
            previous={summary.prevIncome}
          />
          <SummaryCard
            label="Expense"
            icon={<TrendingDown className="w-5 h-5" />}
            color="rose"
            current={summary.actualExpense}
            previous={summary.prevExpense}
          />
          <SummaryCard
            label="Net Profit"
            icon={<Scale className="w-5 h-5" />}
            color={summary.actualNet >= 0 ? "blue" : "rose"}
            current={summary.actualNet}
            previous={summary.prevNet}
          />
        </div>
      </div>

      {/* Yearly Chart */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="font-semibold">Monthly Statistics {year}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Compare income, expense, and net profit by month
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500" />
              Expense
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500" />
              Net
            </span>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={yearlyChart.map((d) => ({
                ...d,
                name: MONTHS[d.month - 1].slice(0, 3),
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
                }
              />
              <Tooltip
                formatter={(value) =>
                  `฿${(typeof value === "number" ? value : 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                }
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke="#cbd5e1" />
              <Bar
                dataKey="income"
                name="Income"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(d: any) => {
                  if (d?.month) {
                    setMonth(d.month);
                    if (d.income > 0) {
                      setPieDrillDown({ month: d.month, type: "INCOME" });
                    }
                  }
                }}
              >
                <LabelList
                  dataKey="income"
                  position="top"
                  formatter={chartLabelFormatter}
                  style={{ fill: "#059669", fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
              <Bar
                dataKey="expense"
                name="Expense"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(d: any) => {
                  if (d?.month) {
                    setMonth(d.month);
                    if (d.expense > 0) {
                      setPieDrillDown({ month: d.month, type: "EXPENSE" });
                    }
                  }
                }}
              >
                <LabelList
                  dataKey="expense"
                  position="top"
                  formatter={chartLabelFormatter}
                  style={{ fill: "#e11d48", fontSize: 11, fontWeight: 600 }}
                />
              </Bar>
              <Line
                type="monotone"
                dataKey="net"
                name="Net"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
              >
                <LabelList
                  dataKey="net"
                  position="top"
                  formatter={chartLabelFormatter}
                  style={{ fill: "#2563eb", fontSize: 11, fontWeight: 700 }}
                  offset={12}
                />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CategoryTable
          title="Income by Category (Actual)"
          data={groupedByCategory.INCOME}
          expandedKeys={expandedCategories}
          onToggle={toggleCategory}
          formatMoney={formatTHB}
          prefix="income"
        />
        <CategoryTable
          title="Expense by Category (Actual)"
          data={groupedByCategory.EXPENSE}
          expandedKeys={expandedCategories}
          onToggle={toggleCategory}
          formatMoney={formatTHB}
          prefix="expense"
        />
      </div>

      {/* Shareholder Payouts */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Users className="w-4 h-4" />
          Shareholder Payout Summary
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-2 font-normal">Shareholder</th>
                <th className="text-right py-2 font-normal">Profit Share ({PROFIT_SHARE_PERCENT}%)</th>
                <th className="text-right py-2 font-normal">Transportation</th>
                <th className="text-right py-2 font-normal">Total Payout</th>
              </tr>
            </thead>
            <tbody>
              {shareholderPayouts.map((sh) => (
                <tr key={sh.name} className="border-b last:border-b-0">
                  <td className="py-3">{sh.name}</td>
                  <td className="text-right py-3">{formatTHB(sh.profitShare)}</td>
                  <td className="text-right py-3">{formatTHB(sh.transportation)}</td>
                  <td className="text-right py-3 font-bold">{formatTHB(sh.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl border">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Transactions for {MONTHS[month - 1]} {year}</h2>
          <div className="flex gap-1 border rounded-lg p-1">
            {(["all", "income", "expense"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-md capitalize ${
                  filter === f
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C8A951]" />
          </div>
        ) : displayTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No transactions for this period
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 bg-gray-50/50">
                  <th
                    className="text-left px-4 py-2.5 font-normal cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort("date")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Date
                      {sortField === "date" && (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </span>
                  </th>
                  <th className="text-left px-4 py-2.5 font-normal">Description</th>
                  <th className="text-left px-4 py-2.5 font-normal">Category</th>
                  <th className="text-left px-4 py-2.5 font-normal">Type</th>
                  <th
                    className="text-right px-4 py-2.5 font-normal cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort("amount")}
                  >
                    <span className="inline-flex items-center gap-1">
                      Amount
                      {sortField === "amount" && (sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </span>
                  </th>
                  <th className="text-left px-4 py-2.5 font-normal">Slip</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {displayTransactions.map((t) => (
                  <tr key={t.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div>{t.description}</div>
                      {t.payee && (
                        <div className="text-xs text-gray-400">For: {t.payee}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          t.type === "INCOME"
                            ? "bg-amber-50 text-[#C8A951]"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {t.type === "INCOME" ? "Income" : "Expense"}
                      </span>
                      {t.recordType === "FORECAST" && (
                        <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                          F
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      {formatTHB(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {t.slipUrl ? (
                        <a href={t.slipUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          View
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTxn(t);
                            setShowModal(true);
                          }}
                          className="p-1 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTxn(t.id)}
                          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <TransactionModal
          editing={editingTxn}
          onClose={() => {
            setShowModal(false);
            setEditingTxn(null);
          }}
          onSaved={() => {
            setShowModal(false);
            setEditingTxn(null);
            fetchTransactions();
          }}
        />
      )}

      {/* Multi-Transaction Modal */}
      {showMultiModal && (
        <MultiTransactionModal
          onClose={() => setShowMultiModal(false)}
          onSaved={() => {
            setShowMultiModal(false);
            fetchTransactions();
          }}
        />
      )}

      {/* Pie Chart Drilldown Modal */}
      {pieDrillDown &&
        (() => {
          const monthData = yearlyChart.find((d) => d.month === pieDrillDown.month);
          if (!monthData) return null;
          const breakdown =
            pieDrillDown.type === "INCOME"
              ? monthData.incomeByCategory
              : monthData.expenseByCategory;
          return (
            <CategoryPieModal
              monthName={MONTHS[pieDrillDown.month - 1]}
              year={year}
              type={pieDrillDown.type}
              breakdown={breakdown}
              onClose={() => setPieDrillDown(null)}
            />
          );
        })()}
    </div>
  );
}

// =====================================
// Sub-components
// =====================================

function SummaryCard({
  label,
  icon,
  color,
  current,
  previous,
}: {
  label: string;
  icon: React.ReactNode;
  color: "emerald" | "rose" | "blue";
  current: number;
  previous: number;
}) {
  const formatMoney = (n: number) =>
    `฿${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const diff = current - previous;
  const percentChange =
    previous !== 0 ? (diff / Math.abs(previous)) * 100 : current !== 0 ? 100 : 0;
  const isUp = diff > 0;
  const isDown = diff < 0;

  const colorClasses = {
    emerald: {
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
      value: "text-emerald-700",
    },
    rose: {
      bg: "bg-rose-50",
      iconBg: "bg-rose-100",
      iconText: "text-rose-600",
      value: "text-rose-700",
    },
    blue: {
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      value: "text-blue-700",
    },
  }[color];

  return (
    <div className={`relative rounded-xl border p-5 ${colorClasses.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-gray-600">{label}</div>
          <div className="text-xs text-gray-400 mt-0.5">This Month</div>
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses.iconBg} ${colorClasses.iconText}`}
        >
          {icon}
        </div>
      </div>

      <div className={`text-3xl font-bold ${colorClasses.value} mb-2`}>
        {formatMoney(current)}
      </div>

      <div className="flex items-center justify-between text-xs pt-3 border-t border-white/60">
        <span className="text-gray-500">Last Month {formatMoney(previous)}</span>
        {previous !== 0 && (
          <span
            className={`flex items-center gap-1 font-medium ${
              isUp
                ? color === "rose"
                  ? "text-rose-600"
                  : "text-emerald-600"
                : isDown
                ? color === "rose"
                  ? "text-emerald-600"
                  : "text-rose-600"
                : "text-gray-500"
            }`}
          >
            {isUp ? <ArrowUp className="w-3 h-3" /> : isDown ? <ArrowDown className="w-3 h-3" /> : null}
            {Math.abs(percentChange).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function CategoryTable({
  title,
  data,
  expandedKeys,
  onToggle,
  formatMoney,
  prefix,
}: {
  title: string;
  data: Record<string, { total: number; items: any[] }>;
  expandedKeys: Set<string>;
  onToggle: (key: string) => void;
  formatMoney: (n: number) => string;
  prefix: string;
}) {
  const total = Object.values(data).reduce((sum, c) => sum + c.total, 0);
  const sortedCategories = Object.entries(data).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="bg-white rounded-xl border">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50/50 text-gray-500">
            <th className="text-left px-4 py-2 font-normal">Category</th>
            <th className="text-right px-4 py-2 font-normal">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sortedCategories.length === 0 ? (
            <tr>
              <td colSpan={2} className="text-center py-8 text-gray-400">
                No data
              </td>
            </tr>
          ) : (
            sortedCategories.map(([category, { total: catTotal, items }]) => {
              const key = `${prefix}-${category}`;
              const isExpanded = expandedKeys.has(key);
              return (
                <React.Fragment key={key}>
                  <tr
                    className="border-b cursor-pointer hover:bg-gray-50"
                    onClick={() => onToggle(key)}
                  >
                    <td className="px-4 py-3 font-medium">
                      <span className="inline-flex items-center gap-1">
                        {category}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </span>
                    </td>
                    <td className="text-right px-4 py-3 font-medium">
                      {formatMoney(catTotal)}
                    </td>
                  </tr>
                  {isExpanded && category === "Transportation"
                    ? (() => {
                        // Aggregate Transportation items by payee
                        const byPayee: Record<string, number> = {};
                        for (const item of items as Transaction[]) {
                          const key = item.payee || "—";
                          byPayee[key] = (byPayee[key] || 0) + item.amount;
                        }
                        return Object.entries(byPayee)
                          .sort((a, b) => b[1] - a[1])
                          .map(([payee, total]) => (
                            <tr
                              key={payee}
                              className="border-b bg-gray-50/30"
                            >
                              <td className="px-8 py-2 text-gray-700 font-medium">
                                {payee === "—" ? (
                                  <span className="text-gray-400">
                                    (ไม่ระบุ)
                                  </span>
                                ) : (
                                  payee
                                )}
                              </td>
                              <td className="text-right px-4 py-2 text-gray-700 font-medium">
                                {formatMoney(total)}
                              </td>
                            </tr>
                          ));
                      })()
                    : isExpanded &&
                      items.map((item: Transaction) => (
                        <tr key={item.id} className="border-b bg-gray-50/30">
                          <td className="px-8 py-2 text-gray-600">
                            {item.description}
                          </td>
                          <td className="text-right px-4 py-2 text-gray-600">
                            {formatMoney(item.amount)}
                          </td>
                        </tr>
                      ))}
                </React.Fragment>
              );
            })
          )}
        </tbody>
        {sortedCategories.length > 0 && (
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td className="px-4 py-3">Total</td>
              <td className="text-right px-4 py-3">{formatMoney(total)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function TransactionModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Transaction | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [recordType, setRecordType] = useState<"ACTUAL" | "FORECAST">(
    editing?.recordType || "ACTUAL"
  );
  const [date, setDate] = useState(
    editing
      ? new Date(editing.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState(editing?.amount.toString() || "0");
  const [type, setType] = useState<"INCOME" | "EXPENSE">(editing?.type || "INCOME");
  const [category, setCategory] = useState(editing?.category || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [payee, setPayee] = useState(editing?.payee || "");
  const [slipUrl, setSlipUrl] = useState(editing?.slipUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const showPayee = type === "EXPENSE" && (category === "Transportation" || category === "Operation cost");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) setSlipUrl(data.data.url);
    } catch {}
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!category || !date || !amount) return;
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/accounting/${editing.id}`
        : "/api/admin/accounting";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          amount: parseFloat(amount),
          type,
          recordType,
          category,
          description,
          payee: showPayee ? payee : null,
          slipUrl: slipUrl || null,
        }),
      });
      const data = await res.json();
      if (data.success) onSaved();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">
            {editing ? "Edit Transaction" : "Add New Transaction"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left column */}
          <div className="space-y-4">
            {/* Record Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Record Type
              </label>
              <div className="flex gap-4">
                {(["ACTUAL", "FORECAST"] as const).map((rt) => (
                  <label key={rt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={recordType === rt}
                      onChange={() => setRecordType(rt)}
                      className="text-[#C8A951] focus:ring-amber-300"
                    />
                    <span className="text-sm capitalize">{rt.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as "INCOME" | "EXPENSE");
                  setCategory("");
                }}
                className="w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Payee (for transportation/operation cost) */}
            {showPayee && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Payee / For
                </label>
                <select
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                  <option value="">None</option>
                  {SHAREHOLDERS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Slip Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Payment Slip / Map
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              {slipUrl ? (
                <div className="relative border rounded-lg overflow-hidden">
                  <img src={slipUrl} alt="Slip" className="w-full h-48 object-contain bg-gray-50" />
                  <button
                    onClick={() => setSlipUrl("")}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6" />
                      <span className="text-xs text-center">
                        <span className="text-gray-600 font-medium">Click to upload</span>
                        <br />or drag and drop
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="e.g., Rent payment for August"
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={saving || !category || !date}
            className="bg-[#C8A951] hover:bg-[#B8993F] text-white px-6 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Transaction
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================
// Category Pie Chart Modal
// =====================================

const PIE_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899",
  "#06b6d4", "#f43f5e", "#84cc16", "#6366f1", "#14b8a6",
  "#eab308", "#a855f7",
];

function CategoryPieModal({
  monthName,
  year,
  type,
  breakdown,
  onClose,
}: {
  monthName: string;
  year: number;
  type: "INCOME" | "EXPENSE";
  breakdown: Record<string, number>;
  onClose: () => void;
}) {
  const data = Object.entries(breakdown)
    .map(([category, amount]) => ({ category, amount }))
    .filter((d) => d.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const formatMoney = (n: number) =>
    `฿${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isIncome = type === "INCOME";
  const titleColor = isIncome ? "text-emerald-700" : "text-rose-700";
  const titleBg = isIncome ? "bg-emerald-50" : "bg-rose-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${titleBg} flex items-center justify-center`}>
              {isIncome ? (
                <TrendingUp className={`w-5 h-5 ${titleColor}`} />
              ) : (
                <TrendingDown className={`w-5 h-5 ${titleColor}`} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isIncome ? "Income" : "Expense"} Breakdown
              </h3>
              <p className="text-xs text-gray-500">
                {monthName} {year} • Total {formatMoney(total)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No {isIncome ? "income" : "expense"} data for this month
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Pie Chart */}
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ percent }) =>
                      percent && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                    }
                    labelLine={false}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      `฿${(typeof value === "number" ? value : 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category List */}
            <div className="space-y-2 self-center">
              {data.map((d, i) => {
                const percent = total > 0 ? (d.amount / total) * 100 : 0;
                return (
                  <div key={d.category} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="truncate">{d.category}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold">{formatMoney(d.amount)}</div>
                      <div className="text-xs text-gray-400">{percent.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================
// Multi Transaction Modal — bulk entry table
// =====================================

interface MultiRow {
  id: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  amount: string;
  payee: string;
  recordType: "ACTUAL" | "FORECAST";
}

function MultiTransactionModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const newRow = (): MultiRow => ({
    id: Math.random().toString(36).slice(2),
    date: today,
    type: "INCOME",
    category: "",
    description: "",
    amount: "",
    payee: "",
    recordType: "ACTUAL",
  });

  const [bulkDate, setBulkDate] = useState<string>(today);
  const [rows, setRows] = useState<MultiRow[]>([newRow(), newRow(), newRow()]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");

  const applyDateToAll = () => {
    if (!bulkDate) return;
    setRows((prev) => prev.map((r) => ({ ...r, date: bulkDate })));
  };

  const updateRow = (id: string, patch: Partial<MultiRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // Reset category if type changed
        if (patch.type && patch.type !== r.type) next.category = "";
        return next;
      })
    );
  };

  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const duplicateRow = (id: string) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx < 0) return prev;
      const copy = { ...prev[idx], id: Math.random().toString(36).slice(2) };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };
  const removeRow = (id: string) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((r) => r.id !== id)));
  const clearAll = () => setRows([newRow()]);

  // Validate which rows have enough data to save
  const validRows = rows.filter(
    (r) => r.date && r.category && parseFloat(r.amount) > 0
  );

  const handleSave = async () => {
    setError("");
    if (validRows.length === 0) {
      setError("กรุณากรอกอย่างน้อย 1 รายการ (ต้องมี วันที่ + หมวด + จำนวนเงิน)");
      return;
    }
    setSaving(true);
    setProgress({ done: 0, total: validRows.length });
    let success = 0;
    let failed = 0;
    for (const r of validRows) {
      try {
        const res = await fetch("/api/admin/accounting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: r.date,
            amount: parseFloat(r.amount),
            type: r.type,
            recordType: r.recordType,
            category: r.category,
            description: r.description || "",
            payee: r.payee || null,
          }),
        });
        const data = await res.json();
        if (data.success) success++;
        else failed++;
      } catch {
        failed++;
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setSaving(false);
    if (failed === 0) {
      onSaved();
    } else {
      setError(`บันทึกสำเร็จ ${success}/${validRows.length} (ล้มเหลว ${failed})`);
      if (success > 0) {
        // Refresh anyway since some saved
        setTimeout(onSaved, 1500);
      }
    }
  };

  const totalAmount = validRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={!saving ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-stone-900 to-stone-800 text-white">
          <div className="flex items-center gap-3">
            <Rows3 className="w-5 h-5 text-[#E8C97A]" />
            <div>
              <h3 className="text-lg font-bold">Add Multiple Transactions</h3>
              <p className="text-xs text-white/70">
                บันทึกหลายรายการพร้อมกัน — กดปุ่ม + เพิ่มแถวใหม่
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 hover:bg-white/10 rounded-lg disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 bg-stone-50 border-b flex items-center justify-between flex-wrap gap-3">
          {/* Bulk Date — apply to all rows */}
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-500 font-semibold mb-1">
                ตั้งวันที่ทั้งหมด
              </label>
              <div className="flex gap-2">
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    disabled={saving}
                    className="pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A951] focus:border-[#C8A951] disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={applyDateToAll}
                  disabled={saving || !bulkDate}
                  className="px-3 py-2 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-[#8B6F2F] border border-amber-200 rounded-lg disabled:opacity-50"
                  title="ใช้วันที่นี้กับทุก row"
                >
                  Apply to all
                </button>
              </div>
            </div>
            <div className="text-sm text-stone-600 ml-2">
              <span className="font-bold text-stone-900">{rows.length}</span> rows ·{" "}
              <span className="font-bold text-emerald-600">{validRows.length}</span> ready
              <div className="text-xs mt-0.5">
                Total: ฿
                <span className="font-bold">
                  {totalAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 self-end">
            <button
              onClick={clearAll}
              disabled={saving}
              className="px-3 py-2 text-xs border rounded-lg hover:bg-stone-100 disabled:opacity-50"
            >
              Clear All
            </button>
            <button
              onClick={addRow}
              disabled={saving}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs bg-stone-900 hover:bg-stone-800 text-white rounded-lg disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
              Add Row
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-stone-200 z-10">
              <tr className="text-xs uppercase tracking-wider text-stone-500">
                <th className="px-2 py-3 text-left font-medium w-8">#</th>
                <th className="px-2 py-3 text-left font-medium min-w-[140px]">Date</th>
                <th className="px-2 py-3 text-left font-medium min-w-[110px]">Type</th>
                <th className="px-2 py-3 text-left font-medium min-w-[170px]">Category</th>
                <th className="px-2 py-3 text-left font-medium min-w-[200px]">Description</th>
                <th className="px-2 py-3 text-left font-medium min-w-[130px]">Amount (฿)</th>
                <th
                  className="px-2 py-3 text-left font-medium min-w-[120px]"
                  title="ผู้รับเงิน — ใช้กับ Transportation / Operation cost เพื่อแบ่งจ่ายให้ผู้ถือหุ้น"
                >
                  Payee
                </th>
                <th className="px-2 py-3 text-left font-medium min-w-[110px]">Record</th>
                <th className="px-2 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const cats =
                  r.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                const showPayee =
                  r.type === "EXPENSE" &&
                  (r.category === "Transportation" ||
                    r.category === "Operation cost");
                const valid =
                  r.date && r.category && parseFloat(r.amount) > 0;
                return (
                  <tr
                    key={r.id}
                    className={`border-b border-stone-100 hover:bg-stone-50/50 ${
                      valid ? "" : "bg-amber-50/20"
                    }`}
                  >
                    <td className="px-2 py-1.5 text-xs text-stone-400 text-center">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="date"
                        value={r.date}
                        onChange={(e) => updateRow(r.id, { date: e.target.value })}
                        className={cellInputCls}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={r.type}
                        onChange={(e) =>
                          updateRow(r.id, {
                            type: e.target.value as "INCOME" | "EXPENSE",
                          })
                        }
                        className={cellInputCls}
                      >
                        <option value="INCOME">Income</option>
                        <option value="EXPENSE">Expense</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={r.category}
                        onChange={(e) => updateRow(r.id, { category: e.target.value })}
                        className={cellInputCls}
                      >
                        <option value="">— Select —</option>
                        {cats.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={r.description}
                        onChange={(e) =>
                          updateRow(r.id, { description: e.target.value })
                        }
                        placeholder="Description"
                        className={cellInputCls}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={r.amount}
                        onChange={(e) => updateRow(r.id, { amount: e.target.value })}
                        placeholder="0.00"
                        className={`${cellInputCls} text-right font-medium`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      {showPayee ? (
                        <select
                          value={r.payee}
                          onChange={(e) => updateRow(r.id, { payee: e.target.value })}
                          className={cellInputCls}
                        >
                          <option value="">—</option>
                          {SHAREHOLDERS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-stone-300 text-xs px-2">—</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={r.recordType}
                        onChange={(e) =>
                          updateRow(r.id, {
                            recordType: e.target.value as "ACTUAL" | "FORECAST",
                          })
                        }
                        className={cellInputCls}
                      >
                        <option value="ACTUAL">Actual</option>
                        <option value="FORECAST">Forecast</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => duplicateRow(r.id)}
                          disabled={saving}
                          className="p-1.5 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded disabled:opacity-50"
                          title="Duplicate"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeRow(r.id)}
                          disabled={saving || rows.length === 1}
                          className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-stone-50 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            {error && <p className="text-sm text-rose-600">{error}</p>}
            {saving && (
              <p className="text-sm text-stone-700">
                Saving... ({progress.done}/{progress.total})
              </p>
            )}
            {!saving && !error && validRows.length > 0 && (
              <p className="text-xs text-stone-500">
                ✓ {validRows.length} รายการพร้อมบันทึก
                {rows.length - validRows.length > 0 && (
                  <span className="text-amber-600">
                    {" "}
                    · {rows.length - validRows.length} รายการยังไม่ครบข้อมูล (จะข้าม)
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2 border rounded-lg text-sm hover:bg-stone-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || validRows.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#C8A951] hover:bg-[#B8993F] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save {validRows.length} Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const cellInputCls =
  "w-full px-2 py-1.5 border border-stone-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#C8A951] focus:border-[#C8A951] bg-white";
