import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Plus, Search } from "lucide-react";
import { toast } from "react-toastify";

export default function Accounts() {
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    type: "INCOME", category: "", amount: "", description: "", memberId: "", depositMonth: ""
  });

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/accounts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
    } catch (error) {
      console.error("Error fetching transactions", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/members", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(res.data);
    } catch (error) {
      console.error("Error fetching members", error);
    }
  };

  const fetchCategories = async (type: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/account-categories?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchMembers();
    fetchCategories("INCOME"); // default type
  }, []);

  // When voucher type changes, reload category list and reset category
  const handleTypeChange = (newType: string) => {
    setFormData(prev => ({ ...prev, type: newType, category: "" }));
    fetchCategories(newType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/accounts", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchTransactions();
      setFormData({ type: "INCOME", category: "", amount: "", description: "", memberId: "", depositMonth: "" });
      toast.success("ভাউচার সফলভাবে তৈরি হয়েছে");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "ভাউচার তৈরি করতে সমস্যা হয়েছে");
    }
  };


  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("bn-BD");
  };

  const formatMonth = (monthStr: string | null) => {
    if (!monthStr) return "-";
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("bn-BD", { year: "numeric", month: "long" });
  };

  // Search filter
  const q = searchQuery.toLowerCase().trim();
  const filteredTx = (transactions as any[]).filter(tx => {
    const member = tx.member || tx.savingsAccount?.member || tx.loan?.member;
    const mName = member?.name || "";
    const mId = member?.memberId || "";
    
    return mName.toLowerCase().includes(q) ||
           mId.toLowerCase().includes(q) ||
           tx.voucherNo?.toLowerCase().includes(q) ||
           tx.category?.toLowerCase().includes(q) ||
           tx.description?.toLowerCase().includes(q) ||
           tx.depositMonth?.toLowerCase().includes(q)
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">অ্যাকাউন্টস লেজার</h2>
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
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="সদস্য, ভাউচার বা ক্যাটাগরি দিয়ে খুঁজুন..."
              className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
            />
          </div>
          <span className="text-sm text-slate-500">
            মোট: <strong>{filteredTx.length}</strong> টি এন্ট্রি
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">সদস্য</th>
                <th className="px-4 py-3 font-medium">তারিখ</th>
                <th className="px-4 py-3 font-medium">ডিপোজিট মাস</th>
                <th className="px-4 py-3 font-medium">ভাউচার নং</th>
                <th className="px-4 py-3 font-medium">ধরণ</th>
                <th className="px-4 py-3 font-medium">ক্যাটাগরি</th>
                <th className="px-4 py-3 font-medium">বিবরণ</th>
                <th className="px-4 py-3 font-medium text-right">পরিমাণ (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-500">লোড হচ্ছে...</td></tr>
              ) : filteredTx.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-500">
                  {q ? `"${searchQuery}" — কোনো ফলাফল পাওয়া যায়নি` : "কোনো ট্রানজেকশন পাওয়া যায়নি"}
                </td></tr>
              ) : filteredTx.map((tx: any) => {
                const member = tx.member || tx.savingsAccount?.member || tx.loan?.member;
                const isIncome = tx.type === "INCOME";
                const isExpense = tx.type === "EXPENSE";

                return (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    {/* সদস্য */}
                    <td className="px-4 py-4">
                      {member ? (
                        <>
                          <div className="font-medium text-slate-800">{member.name}</div>
                          <div className="text-xs text-slate-500">{member.memberId}</div>
                        </>
                      ) : (
                        <div className="text-slate-500 font-medium">অফিস / বিবিধ</div>
                      )}
                    </td>
                    {/* তারিখ */}
                    <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    {/* ডিপোজিট মাস */}
                    <td className="px-4 py-4 text-slate-700 whitespace-nowrap">
                      {formatMonth(tx.depositMonth)}
                    </td>
                    {/* ভাউচার নং */}
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 font-medium whitespace-nowrap">
                        {tx.voucherNo}
                      </span>
                    </td>
                    {/* ধরণ */}
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        isIncome ? "bg-green-100 text-green-700" : 
                        isExpense ? "bg-red-100 text-red-700" : 
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {isIncome ? "আয়" : isExpense ? "ব্যয়" : "বিনিয়োগ"}
                      </span>
                    </td>
                    {/* ক্যাটাগরি */}
                    <td className="px-4 py-4">
                      <span className="text-slate-700 font-medium">
                        {tx.category}
                      </span>
                    </td>
                    {/* বিবরণ */}
                    <td className="px-4 py-4 text-slate-600 max-w-[200px] truncate" title={tx.description || ""}>
                      {tx.description || "-"}
                    </td>
                    {/* পরিমাণ */}
                    <td className={`px-4 py-4 text-right font-bold whitespace-nowrap ${
                      isIncome ? "text-green-600" : isExpense ? "text-red-600" : "text-amber-600"
                    }`}>
                      {isIncome ? "+" : "-"} ৳ {tx.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Voucher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">নতুন ভাউচার এন্ট্রি</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ভাউচারের ধরণ</label>
                  <select
                    value={formData.type}
                    onChange={e => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INCOME">আয় (Income)</option>
                    <option value="EXPENSE">ব্যয় (Expense)</option>
                    <option value="INVESTMENT">বিনিয়োগ (Investment)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ক্যাটাগরি</label>
                  <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">নির্বাচন করুন</option>
                    {categories.length === 0 ? (
                      <option disabled>⚠ Settings থেকে ক্যাটাগরী যোগ করুন</option>
                    ) : (
                      categories.map((cat: any) => <option key={cat.id} value={cat.name}>{cat.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">সদস্য (ঐচ্ছিক)</label>
                <select value={formData.memberId} onChange={e => setFormData({ ...formData, memberId: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">নির্বাচন করুন</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.memberId})</option>
                  ))}
                </select>
              </div>

              {formData.category.toLowerCase().includes("deposit") && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ডিপোজিট মাস</label>
                  <input type="month" value={formData.depositMonth} onChange={e => setFormData({ ...formData, depositMonth: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">পরিমাণ (৳)</label>
                <input required type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">বিবরণ</label>
                <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="ভাউচারের বিস্তারিত বিবরণ" rows={2}></textarea>
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
