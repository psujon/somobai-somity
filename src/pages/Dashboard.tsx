import { Users, PiggyBank, CreditCard, TrendingUp } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from "recharts";

const data = [
  { name: 'জানু', savings: 4000, loan: 2400 },
  { name: 'ফেব্রি', savings: 3000, loan: 1398 },
  { name: 'মার্চ', savings: 2000, loan: 9800 },
  { name: 'এপ্রিল', savings: 2780, loan: 3908 },
  { name: 'মে', savings: 1890, loan: 4800 },
  { name: 'জুন', savings: 2390, loan: 3800 },
];

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
    <div className={`p-4 rounded-full ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">ড্যাশবোর্ড ওভারভিউ</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          title="সর্বমোট সদস্য" 
          value="৩,২৪৫" 
          icon={Users} 
          colorClass="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="সর্বমোট জমা" 
          value="৳ ১২,৫০,০০০" 
          icon={PiggyBank} 
          colorClass="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="বিনিয়োগকৃত ঋণ" 
          value="৳ ৮,২০,০০০" 
          icon={CreditCard} 
          colorClass="bg-purple-100 text-purple-600" 
        />
        <StatCard 
          title="আজকের কালেকশন" 
          value="৳ ১৫,৪০০" 
          icon={TrendingUp} 
          colorClass="bg-orange-100 text-orange-600" 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">সঞ্চয় ও ঋণের পরিসংখ্যান</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} />
                <Bar dataKey="savings" name="সঞ্চয়" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="loan" name="ঋণ" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">মাসিক আয়-ব্যয়</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="savings" name="আয়" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="loan" name="ব্যয়" stroke="#F43F5E" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">সাম্প্রতিক লেনদেন</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">তারিখ</th>
                <th className="px-6 py-3 font-medium">সদস্যের নাম</th>
                <th className="px-6 py-3 font-medium">ধরণ</th>
                <th className="px-6 py-3 font-medium">পরিমাণ</th>
                <th className="px-6 py-3 font-medium">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600">০২ মে, ২০২৬</td>
                  <td className="px-6 py-4 font-medium text-slate-800">রহিম শেখ (M-00{item})</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">সঞ্চয় জমা</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">৳ ৫০০</td>
                  <td className="px-6 py-4 text-green-600">সফল</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
