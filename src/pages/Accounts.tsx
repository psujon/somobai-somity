import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Plus, Search } from "lucide-react";

export default function Accounts() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    type: "INCOME", category: "General", amount: "", description: ""
  });

  const fetchVouchers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/accounts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVouchers(res.data);
    } catch (error) {
      console.error("Error fetching vouchers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/accounts", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchVouchers();
      setFormData({ type: "INCOME", category: "General", amount: "", description: "" });
    } catch (error: any) {
      alert(error.response?.data?.message || "Error creating voucher");
    }
  };

  const getCategoryOptions = () => {
    if (formData.type === "INCOME") {
      return ["Savings Deposit", "Loan Installment", "Form Fee", "Other Income"];
    } else if (formData.type === "EXPENSE") {
      return ["Loan Disbursement", "Salary", "Office Rent", "Utility Bill", "Other Expense"];
    } else {
      return ["FDR Investment", "Other Investment"];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">হিসাবরক্ষণ ও ভাউচার</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus size={18} />
          নতুন ভাউচার
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ভাউচার খুঁজুন..." 
              className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">ভাউচার নম্বর</th>
                <th className="px-6 py-3 font-medium">তারিখ</th>
                <th className="px-6 py-3 font-medium">ধরণ</th>
                <th className="px-6 py-3 font-medium">ক্যাটাগরি</th>
                <th className="px-6 py-3 font-medium">বিবরণ</th>
                <th className="px-6 py-3 font-medium text-right">পরিমাণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">লোড হচ্ছে...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">কোনো ভাউচার পাওয়া যায়নি</td></tr>
              ) : vouchers.map((voucher: any) => (
                <tr key={voucher.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{voucher.voucherNo}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(voucher.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      voucher.type === 'INCOME' ? 'bg-green-100 text-green-700' : 
                      voucher.type === 'EXPENSE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {voucher.type === 'INCOME' ? 'আয়' : voucher.type === 'EXPENSE' ? 'ব্যয়' : 'বিনিয়োগ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-800">{voucher.category}</td>
                  <td className="px-6 py-4 text-slate-600">{voucher.description || "-"}</td>
                  <td className={`px-6 py-4 text-right font-bold ${
                    voucher.type === 'INCOME' ? 'text-green-600' : 
                    voucher.type === 'EXPENSE' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {voucher.type === 'EXPENSE' ? '- ' : '+ '}
                    ৳ {voucher.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Voucher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">নতুন ভাউচার এন্ট্রি</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ভাউচারের ধরণ</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value, category: ""})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="INCOME">আয় (Income)</option>
                  <option value="EXPENSE">ব্যয় (Expense)</option>
                  <option value="INVESTMENT">বিনিয়োগ (Investment)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ক্যাটাগরি</label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">নির্বাচন করুন</option>
                  {getCategoryOptions().map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">পরিমাণ (৳)</label>
                <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">বিবরণ</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="ভাউচারের বিস্তারিত বিবরণ" rows={3}></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">বাতিল</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">সেভ করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
