import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Users, PiggyBank, CreditCard, TrendingUp,
  CalendarCheck, Banknote, RefreshCw, Wallet, Coins, TrendingDown, Calendar
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
  const [recentIncome, setRecentIncome] = useState<any[]>([]);
  const [recentExpense, setRecentExpense] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.API_HOST}/api/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data.stats);
      setChartData(res.data.chartData);
      setRecentIncome(res.data.recentIncome || []);
      setRecentExpense(res.data.recentExpense || []);
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

      {/* Financial Stats Grid — ৫টি কার্ড */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">আর্থিক বিবরণী</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
          <StatCard
            title="নিট ব্যালেন্স"
            value={stats ? fmt(stats.netBalance) : "—"}
            sub="মোট আয় - মোট ব্যয়"
            icon={Wallet}
            colorClass="bg-indigo-100 text-indigo-600"
            loading={loading}
          />
          <StatCard
            title="মোট সদস্য আয়"
            value={stats ? fmt(stats.totalMemberDeposit) : "—"}
            sub="সদস্যদের মোট সঞ্চয় জমা"
            icon={PiggyBank}
            colorClass="bg-green-100 text-green-600"
            loading={loading}
          />
          <StatCard
            title="বিবিধ আয়"
            value={stats ? fmt(stats.othersIncome) : "—"}
            sub="সদস্য জমা ব্যতীত অন্যান্য আয়"
            icon={Coins}
            colorClass="bg-amber-100 text-amber-600"
            loading={loading}
          />
          <StatCard
            title="মোট ব্যয়"
            value={stats ? fmt(stats.totalExpenseAmount) : "—"}
            sub="অফিস ও অন্যান্য সকল ব্যয়"
            icon={TrendingDown}
            colorClass="bg-red-100 text-red-600"
            loading={loading}
          />
          {/* <StatCard
            title="মোট সঞ্চয় ব্যালেন্স"
            value={stats ? fmt(stats.totalSavings) : "—"}
            sub="সকল হিসাবের সম্মিলিত ব্যালেন্স"
            icon={PiggyBank}
            colorClass="bg-green-100 text-green-600"
            loading={loading}
          /> */}
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
          <StatCard
            title="মাসিক ব্যয়"
            value={stats ? fmt(stats.runningMonthExpense) : "—"}
            sub="চলতি মাসের মোট ব্যয়"
            icon={Calendar}
            colorClass="bg-rose-100 text-rose-600"
            loading={loading}
          />
          <StatCard
            title="সর্বমোট সদস্য"
            value={stats ? `${stats.totalMembers.toLocaleString()} জন` : "—"}
            sub={stats ? `সক্রিয়: ${stats.activeMembers} জন` : ""}
            icon={Users}
            colorClass="bg-blue-100 text-blue-600"
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
        </div>
      </div>



      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* বার চার্ট — আয় ও ব্যয় */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">মাসিক আয় ও ব্যয় বিবরণী</h3>
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
                  <Bar dataKey="income" name="আয়" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="ব্যয়" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* লাইন চার্ট — ট্রেন্ড */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">আয় ও ব্যয় ট্রেন্ড</h3>
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
                  <Line type="monotone" dataKey="income" name="আয়" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="expense" name="ব্যয়" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* সাম্প্রতিক লেনদেন টেবিলসমূহ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* সাম্প্রতিক আয় */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">সাম্প্রতিক আয়</h3>
            <span className="text-xs text-slate-400">সর্বশেষ ৫টি</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">তারিখ</th>
                  <th className="px-4 py-3 font-medium">ক্যাটাগরি</th>
                  <th className="px-4 py-3 font-medium">বিবরণ / সদস্য</th>
                  <th className="px-4 py-3 font-medium text-right">পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 animate-pulse rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : recentIncome.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">কোনো আয় পাওয়া যায়নি</td>
                  </tr>
                ) : recentIncome.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {fmtDate(tx.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {tx.category}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate" title={tx.description || ""}>
                      {tx.member?.name ? (
                        <>
                          <div className="font-semibold">{tx.member.name}</div>
                          <div className="text-[10px]">{tx.member.memberId}</div>
                        </>
                      ) : tx.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600 whitespace-nowrap">
                      + ৳ {tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* সাম্প্রতিক ব্যয় */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">সাম্প্রতিক ব্যয়</h3>
            <span className="text-xs text-slate-400">সর্বশেষ ৫টি</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">তারিখ</th>
                  <th className="px-4 py-3 font-medium">ক্যাটাগরি</th>
                  <th className="px-4 py-3 font-medium">বিবরণ / সদস্য</th>
                  <th className="px-4 py-3 font-medium text-right">পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-100 animate-pulse rounded w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : recentExpense.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400">কোনো ব্যয় পাওয়া যায়নি</td>
                  </tr>
                ) : recentExpense.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {fmtDate(tx.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {tx.category}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate" title={tx.description || ""}>
                      {tx.member?.name ? (
                        <>
                          <div className="font-semibold">{tx.member.name}</div>
                          <div className="text-[10px]">{tx.member.memberId}</div>
                        </>
                      ) : tx.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600 whitespace-nowrap">
                      - ৳ {tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
