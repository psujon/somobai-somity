import { useState, useEffect, useMemo } from "react";
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
  const [searchFilters, setSearchFilters] = useState({
    type: "",
    category: "",
    memberId: "",
    amount: ""
  });
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);
  const [formMemberSearchQuery, setFormMemberSearchQuery] = useState("");
  const [showFormMemberSuggestions, setShowFormMemberSuggestions] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [afterlastTransaction, setAfterLastTransaction] = useState<any>(null);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    type: "INCOME",
    category: "",
    amount: "",
    description: "",
    memberId: "",
    depositMonth: "",
    date: new Date().toISOString().split("T")[0],
    voucherNo: ""
  });

  const handleLastTransaction = () => {
    if (afterlastTransaction) {
      setFormData(afterlastTransaction);
      if (afterlastTransaction.memberId) {
        const member = members.find((m: any) => m.id === afterlastTransaction.memberId);
        if (member) {
          setFormMemberSearchQuery(`${member.name} (${member.memberId})`);
        }
      } else {
        setFormMemberSearchQuery("");
      }
    } else {
      toast.info("কোনো পূর্ববর্তী লেনদেন পাওয়া যায়নি");
    }
  };

  const fetchTransactions = async (filters = searchFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.category) params.append("category", filters.category);
      if (filters.memberId) params.append("memberId", filters.memberId);
      if (filters.amount) params.append("amount", filters.amount);

      const res = await axios.get(`${process.env.API_HOST}/api/accounts?${params.toString()}`, {
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
      const res = await axios.get(`${process.env.API_HOST}/api/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(res.data);
    } catch (error) {
      console.error("Error fetching members", error);
    }
  };

  const fetchCategories = async (type: string) => {
    try {
      const res = await axios.get(`${process.env.API_HOST}/api/account-categories?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const res = await axios.get(`${process.env.API_HOST}/api/account-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllCategories(res.data);
    } catch (error) {
      console.error("Error fetching all categories", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchMembers();
    fetchCategories("INCOME"); // default type
    fetchAllCategories();
  }, []);

  // When voucher type changes, reload category list and reset category
  const handleTypeChange = (newType: string) => {
    setFormData(prev => ({ ...prev, type: newType, category: "" }));
    fetchCategories(newType);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormMemberSearchQuery("");
    setFormData({
      type: "INCOME",
      category: "",
      amount: "",
      description: "",
      memberId: "",
      depositMonth: "",
      date: new Date().toISOString().split("T")[0],
      voucherNo: ""
    });
    setShowModal(true);
  };

  const handleEdit = (tx: any) => {
    setEditingId(tx.id);
    const member = tx.member || tx.savingsAccount?.member || tx.loan?.member;
    setFormMemberSearchQuery(member ? `${member.name} (${member.memberId})` : "");
    setFormData({
      type: tx.type,
      category: tx.category,
      amount: String(tx.amount),
      description: tx.description || "",
      memberId: tx.memberId || "",
      depositMonth: tx.depositMonth || "",
      date: tx.date ? new Date(tx.date).toISOString().split("T")[0] : "",
      voucherNo: tx.voucherNo || ""
    });
    fetchCategories(tx.type);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই ভাউচারটি ডিলিট করতে চান?")) return;
    try {
      await axios.delete(`${process.env.API_HOST}/api/accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("ভাউচার সফলভাবে ডিলিট হয়েছে");
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "ভাউচার ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${process.env.API_HOST}/api/accounts/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("ভাউচার সফলভাবে আপডেট হয়েছে");
      } else {
        await axios.post(`${process.env.API_HOST}/api/accounts`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("ভাউচার সফলভাবে তৈরি হয়েছে");
      }
      setAfterLastTransaction(formData);
      setShowModal(false);
      setEditingId(null);
      setFormMemberSearchQuery("");
      fetchTransactions();
      setFormData({
        type: "INCOME",
        category: "",
        amount: "",
        description: "",
        memberId: "",
        depositMonth: "",
        date: new Date().toISOString().split("T")[0],
        voucherNo: ""
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "ভাউচার প্রসেস করতে সমস্যা হয়েছে");
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

  const handleMemberSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMemberSearchQuery(val);
    if (val === "") {
      setSearchFilters(prev => ({ ...prev, memberId: "" }));
    }
    setShowMemberSuggestions(true);
  };

  const handleSelectMember = (m: any) => {
    setSearchFilters(prev => ({ ...prev, memberId: m.id }));
    setMemberSearchQuery(`${m.name} (${m.memberId})`);
    setShowMemberSuggestions(false);
  };

  const filteredMembers = useMemo(() => {
    const q = memberSearchQuery.toLowerCase().trim();
    if (!q) return [];
    return members.filter((m: any) =>
      m.name.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [memberSearchQuery, members]);

  const handleFormMemberSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormMemberSearchQuery(val);
    if (val === "") {
      setFormData(prev => ({ ...prev, memberId: "" }));
    }
    setShowFormMemberSuggestions(true);
  };

  const handleSelectFormMember = (m: any) => {
    setFormData(prev => ({ ...prev, memberId: m.id }));
    setFormMemberSearchQuery(`${m.name} (${m.memberId})`);
    setShowFormMemberSuggestions(false);
  };

  const filteredFormMembers = useMemo(() => {
    const q = formMemberSearchQuery.toLowerCase().trim();
    if (!q) return [];
    return members.filter((m: any) =>
      m.name.toLowerCase().includes(q) || m.memberId.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [formMemberSearchQuery, members]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  const filteredTx = transactions;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">অ্যাকাউন্টস লেজার</h2>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus size={18} />
          নতুন ভাউচার
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSearchSubmit} className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between w-full">
          <div className="flex flex-wrap gap-2 items-center text-sm">
            {/* ভাউচার ধরন */}
            <select
              value={searchFilters.type}
              onChange={e => setSearchFilters({ ...searchFilters, type: e.target.value })}
              className="px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">ভাউচার ধরন (সব)</option>
              <option value="INCOME">আয় (Income)</option>
              <option value="EXPENSE">ব্যয় (Expense)</option>
              <option value="INVESTMENT">বিনিয়োগ (Investment)</option>
            </select>

            {/* হিসাবের ধরন / ক্যাটাগরি */}
            <select
              value={searchFilters.category}
              onChange={e => setSearchFilters({ ...searchFilters, category: e.target.value })}
              className="px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-[180px]"
            >
              <option value="">ক্যাটাগরি (সব)</option>
              {Array.from(new Set(allCategories.map(cat => cat.name))).map((catName: any) => (
                <option key={catName} value={catName}>{catName}</option>
              ))}
            </select>

            {/* সদস্য */}
            <div className="relative">
              <input
                type="text"
                placeholder="সদস্য খুঁজুন (নাম/নম্বর)"
                value={memberSearchQuery}
                onChange={handleMemberSearchChange}
                onFocus={() => setShowMemberSuggestions(true)}
                onBlur={() => setTimeout(() => setShowMemberSuggestions(false), 200)}
                className="px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 bg-white"
              />
              {showMemberSuggestions && filteredMembers.length > 0 && (
                <div className="absolute left-0 mt-1 w-60 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {filteredMembers.map((m: any) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelectMember(m)}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex flex-col transition text-xs"
                    >
                      <span className="font-semibold text-slate-800">{m.name}</span>
                      <span className="text-slate-500">{m.memberId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* পরিমাণ */}
            <input
              type="number"
              placeholder="পরিমাণ (৳)"
              value={searchFilters.amount}
              onChange={e => setSearchFilters({ ...searchFilters, amount: e.target.value })}
              className="px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-28 bg-white"
            />

            {/* সার্চ বাটন */}
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-1"
            >
              <Search size={14} />
              সার্চ
            </button>
          </div>
          <span className="text-sm text-slate-500">
            মোট: <strong>{filteredTx.length}</strong> টি এন্ট্রি
          </span>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">সদস্য / হিসাবের ধরন</th>
                <th className="px-4 py-3 font-medium">তারিখ</th>
                <th className="px-4 py-3 font-medium">ডিপোজিট মাস</th>
                <th className="px-4 py-3 font-medium">ভাউচার নং</th>
                <th className="px-4 py-3 font-medium">ধরণ</th>
                <th className="px-4 py-3 font-medium">ক্যাটাগরি</th>
                <th className="px-4 py-3 font-medium">বিবরণ</th>
                <th className="px-4 py-3 font-medium text-right">পরিমাণ (৳)</th>
                <th className="px-4 py-3 font-medium text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-500">লোড হচ্ছে...</td></tr>
              ) : filteredTx.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-500">
                  {Object.values(searchFilters).some(v => v !== "") ? "ফিল্টারিং ফলাফল — কোনো এন্ট্রি পাওয়া যায়নি" : "কোনো ট্রানজেকশন পাওয়া যায়নি"}
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
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${isIncome ? "bg-green-100 text-green-700" :
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
                    <td className={`px-4 py-4 text-right font-bold whitespace-nowrap ${isIncome ? "text-green-600" : isExpense ? "text-red-600" : "text-amber-600"
                      }`}>
                      {isIncome ? "+" : "-"} ৳ {tx.amount.toLocaleString()}
                    </td>
                    {/* অ্যাকশন */}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2">
                        <button
                          disabled={tx.category === "Savings Deposit"}
                          onClick={() => handleEdit(tx)}
                          className="px-2 py-1 text-xs font-medium rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          এডিট
                        </button>
                        <button
                          disabled={tx.category === "Savings Deposit"}
                          onClick={() => handleDelete(tx.id)}
                          className="px-2 py-1 text-xs font-medium rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ডিলেট
                        </button>
                      </div>
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
              <h3 className="text-xl font-bold text-slate-800">
                {editingId ? "ভাউচার এডিট করুন" : "নতুন ভাউচার এন্ট্রি"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
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

              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">সদস্য (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="সদস্য খুঁজুন (নাম/নম্বর)"
                  value={formMemberSearchQuery}
                  onChange={handleFormMemberSearchChange}
                  onFocus={() => setShowFormMemberSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowFormMemberSuggestions(false), 200)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {showFormMemberSuggestions && filteredFormMembers.length > 0 && (
                  <div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {filteredFormMembers.map((m: any) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectFormMember(m)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 flex flex-col transition text-xs"
                      >
                        <span className="font-semibold text-slate-800">{m.name}</span>
                        <span className="text-slate-500">{m.memberId}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">তারিখ</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ভাউচার নং</label>
                  <input
                    type="text"
                    value={formData.voucherNo}
                    onChange={e => setFormData({ ...formData, voucherNo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ভাউচার নম্বর লিখুন"
                  />
                </div>
              </div>

              {formData.category?.toLowerCase().includes("deposit") && (
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
              <div className="pt-4 flex items-center justify-between gap-3">
                <button type="button" onClick={() => handleLastTransaction()} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">সর্বশেষ জমা</button>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">বাতিল</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">সেভ করুন</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
