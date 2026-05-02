import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FileText, Download, Printer } from "lucide-react";

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    // In a real application, you would have a dedicated reports API endpoint.
    // For this demonstration, we'll fetch vouchers and summarize them.
    axios.get("http://localhost:5000/api/accounts", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const vouchers = res.data;
      const totalIncome = vouchers.filter((v: any) => v.type === "INCOME").reduce((sum: number, v: any) => sum + v.amount, 0);
      const totalExpense = vouchers.filter((v: any) => v.type === "EXPENSE").reduce((sum: number, v: any) => sum + v.amount, 0);
      const totalInvestment = vouchers.filter((v: any) => v.type === "INVESTMENT").reduce((sum: number, v: any) => sum + v.amount, 0);
      
      setData({ totalIncome, totalExpense, totalInvestment, netBalance: totalIncome - totalExpense, vouchers });
    })
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>লোড হচ্ছে...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">অ্যাকাউন্টিং রিপোর্টস</h2>
        <div className="flex gap-2">
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition">
            <Printer size={18} />
            প্রিন্ট
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition">
            <Download size={18} />
            এক্সেল ডাউনলোড
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-2">মোট আয়</p>
          <h3 className="text-3xl font-bold text-green-600">৳ {data?.totalIncome.toLocaleString()}</h3>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-2">মোট ব্যয়</p>
          <h3 className="text-3xl font-bold text-red-600">৳ {data?.totalExpense.toLocaleString()}</h3>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-2">বর্তমান তহবিল (ক্যাশ)</p>
          <h3 className="text-3xl font-bold text-blue-600">৳ {data?.netBalance.toLocaleString()}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-slate-500" />
          ইনকাম স্টেটমেন্ট (Income Statement)
        </h3>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-700 w-1/2">বিবরণ</th>
                <th className="px-6 py-3 font-semibold text-slate-700 text-right">পরিমাণ (টাকা)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-6 py-4 font-medium text-slate-800 bg-slate-50" colSpan={2}>আয়সমূহ:</td>
              </tr>
              {data?.vouchers.filter((v: any) => v.type === "INCOME").slice(0, 5).map((v: any) => (
                <tr key={v.id}>
                  <td className="px-6 py-3 text-slate-600 pl-10">{v.category}</td>
                  <td className="px-6 py-3 text-slate-800 text-right">{v.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="font-bold bg-green-50">
                <td className="px-6 py-3 text-green-800 pl-10 text-right">মোট আয়:</td>
                <td className="px-6 py-3 text-green-800 text-right">{data?.totalIncome.toLocaleString()}</td>
              </tr>
              
              <tr>
                <td className="px-6 py-4 font-medium text-slate-800 bg-slate-50" colSpan={2}>ব্যয়সমূহ:</td>
              </tr>
              {data?.vouchers.filter((v: any) => v.type === "EXPENSE").slice(0, 5).map((v: any) => (
                <tr key={v.id}>
                  <td className="px-6 py-3 text-slate-600 pl-10">{v.category}</td>
                  <td className="px-6 py-3 text-slate-800 text-right">{v.amount.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="font-bold bg-red-50">
                <td className="px-6 py-3 text-red-800 pl-10 text-right">মোট ব্যয়:</td>
                <td className="px-6 py-3 text-red-800 text-right">{data?.totalExpense.toLocaleString()}</td>
              </tr>

              <tr className="border-t-2 border-slate-800 font-bold bg-slate-100">
                <td className="px-6 py-4 text-slate-800 text-right">নীট মুনাফা / (ক্ষতি):</td>
                <td className={`px-6 py-4 text-right ${data?.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data?.netBalance.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
