import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Users, PiggyBank, CreditCard, TrendingUp,
  CalendarCheck, Banknote, RefreshCw
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";

// ——— স্ট্যাট কার্ড কম্পোনেন্ট ———
const StatCard = ({ title, value, sub, icon: Icon, colorClass, loading }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`p-4 rounded-full ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {loading ? (
        <div className="h-8 w-28 bg-slate-100 animate-pulse rounded mt-1" />
      ) : (
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      )}
      {sub && !loading && (
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      )}
    </div>
  </div>
);

// ——— টাকা ফরম্যাট হেল্পার ———
const fmt = (n: number) =>
  "৳ " + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

// ——— তারিখ ফরম্যাট ———
const fmtDate = (d: string | null) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("bn-BD", {
    day: "2-digit", month: "short", year: "numeric"
  });
};

export default function Dashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/dashboard/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data.stats);
      setChartData(res.data.chartData);
      setRecentTx(res.data.recentTransactions);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ড্যাশবোর্ড ওভারভিউ</h2>
          {lastUpdated && (
            <p className="text-xs text-slate-400 mt-0.5">
              সর্বশেষ আপডেট: {lastUpdated.toLocaleTimeString("bn-BD")}
            </p>
          )}
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-2 rounded-lg transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          রিফ্রেশ
        </button>
      </div>

      {/* Stats Grid — ৬টি কার্ড */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <StatCard
          title="সর্বমোট সদস্য"
          value={stats ? `${stats.totalMembers.toLocaleString()} জন` : "—"}
          sub={stats ? `সক্রিয়: ${stats.activeMembers} জন` : ""}
          icon={Users}
          colorClass="bg-blue-100 text-blue-600"
          loading={loading}
        />
        <StatCard
          title="মোট সঞ্চয় ব্যালেন্স"
          value={stats ? fmt(stats.totalSavings) : "—"}
          sub="সকল হিসাবের সম্মিলিত ব্যালেন্স"
          icon={PiggyBank}
          colorClass="bg-green-100 text-green-600"
          loading={loading}
        />
        <StatCard
          title="বিতরণকৃত ঋণ"
          value={stats ? fmt(stats.totalLoanDisbursed) : "—"}
          sub={stats ? `বকেয়া: ${fmt(stats.outstandingLoan)}` : ""}
          icon={CreditCard}
          colorClass="bg-purple-100 text-purple-600"
          loading={loading}
        />
        <StatCard
          title="সক্রিয় ঋণ"
          value={stats ? `${stats.activeLoanCount} টি` : "—"}
          sub="চলমান ঋণ হিসাব"
          icon={Banknote}
          colorClass="bg-rose-100 text-rose-600"
          loading={loading}
        />
        <StatCard
          title="আজকের কালেকশন"
          value={stats ? fmt(stats.todayDeposits) : "—"}
          sub="আজকের সঞ্চয় জমা"
          icon={TrendingUp}
          colorClass="bg-orange-100 text-orange-600"
          loading={loading}
        />
        <StatCard
          title="মাসিক কালেকশন"
          value={stats ? fmt(stats.monthDeposits) : "—"}
          sub="চলতি মাসের মোট জমা"
          icon={CalendarCheck}
          colorClass="bg-teal-100 text-teal-600"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* বার চার্ট — সঞ্চয় ও ঋণ */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">মাসিক সঞ্চয় ও ঋণ বিতরণ</h3>
          <div className="h-72">
            {loading ? (
              <div className="h-full bg-slate-50 animate-pulse rounded-lg" />
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">কোনো ডেটা নেই</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => [`৳ ${Number(v).toLocaleString()}`, ""]} />
                  <Legend />
                  <Bar dataKey="savings" name="সঞ্চয়" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="loan" name="ঋণ" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* লাইন চার্ট — ট্রেন্ড */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">সঞ্চয় ও ঋণ ট্রেন্ড</h3>
          <div className="h-72">
            {loading ? (
              <div className="h-full bg-slate-50 animate-pulse rounded-lg" />
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">কোনো ডেটা নেই</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => [`৳ ${Number(v).toLocaleString()}`, ""]} />
                  <Legend />
                  <Line type="monotone" dataKey="savings" name="সঞ্চয়" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="loan" name="ঋণ" stroke="#F43F5E" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* সাম্প্রতিক ট্রানজেকশন টেবিল */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">সাম্প্রতিক লেনদেন</h3>
          <span className="text-xs text-slate-400">সর্বশেষ ১০টি</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">তারিখ</th>
                <th className="px-6 py-3 font-medium">সদস্যের নাম</th>
                <th className="px-6 py-3 font-medium">হিসাব নম্বর</th>
                <th className="px-6 py-3 font-medium">ধরণ</th>
                <th className="px-6 py-3 font-medium text-right">পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 animate-pulse rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentTx.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">কোনো লেনদেন পাওয়া যায়নি</td>
                </tr>
              ) : recentTx.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                    {fmtDate(tx.transactionDate)}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {tx.savingsAccount?.member?.name || "-"}
                    <span className="text-xs text-slate-400 ml-1">
                      ({tx.savingsAccount?.member?.memberId})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-blue-600 font-medium">
                    {tx.savingsAccount?.accountNo || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${tx.type === "DEPOSIT"
                        ? "bg-green-100 text-green-700"
                        : tx.type === "WITHDRAWAL"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                      {tx.type === "DEPOSIT" ? "সঞ্চয় জমা" : tx.type === "WITHDRAWAL" ? "উত্তোলন" : "সুদ"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600 whitespace-nowrap">
                    + ৳ {tx.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
