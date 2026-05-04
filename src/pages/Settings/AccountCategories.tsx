import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";
import { toast } from "react-toastify";

const TYPE_OPTIONS = [
  { value: "INCOME", label: "আয় (Income)", color: "bg-green-100 text-green-700" },
  { value: "EXPENSE", label: "ব্যয় (Expense)", color: "bg-red-100 text-red-700" },
  { value: "INVESTMENT", label: "বিনিয়োগ (Investment)", color: "bg-amber-100 text-amber-700" },
];

export default function AccountCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const { token } = useAuth();

  const [formData, setFormData] = useState({ name: "", type: "INCOME" });

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/account-categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching account categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(
          `http://localhost:5000/api/account-categories/${editingCategory.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("ক্যাটাগরী সফলভাবে আপডেট হয়েছে");
      } else {
        await axios.post("http://localhost:5000/api/account-categories", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("নতুন ক্যাটাগরী সফলভাবে তৈরি হয়েছে");
      }
      setShowModal(false);
      setEditingCategory(null);
      setFormData({ name: "", type: "INCOME" });
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "ক্যাটাগরী সেভ করতে সমস্যা হয়েছে");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" ক্যাটাগরীটি ডিলেট করতে চান?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/account-categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("ক্যাটাগরী ডিলেট হয়েছে");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "ডিলেট করতে সমস্যা হয়েছে");
    }
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, type: cat.type });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", type: "INCOME" });
    setShowModal(true);
  };

  // Group categories by type for display
  const grouped = TYPE_OPTIONS.map((t) => ({
    ...t,
    items: categories.filter((c) => c.type === t.value),
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">হিসাবের ক্যাটাগরী</h2>
          <p className="text-sm text-slate-500 mt-1">আয়, ব্যয় ও বিনিয়োগের খাতসমূহ পরিচালনা করুন</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus size={18} />
          নতুন ক্যাটাগরী
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">লোড হচ্ছে...</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm text-center py-16">
          <FolderOpen className="mx-auto mb-4 text-slate-300" size={48} />
          <p className="text-slate-500 font-medium">কোনো ক্যাটাগরী পাওয়া যায়নি</p>
          <p className="text-slate-400 text-sm mt-1">উপরের বাটনে ক্লিক করে নতুন ক্যাটাগরী তৈরি করুন</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {grouped.map((group) => (
            <div key={group.value} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className={`px-5 py-3 border-b border-slate-100 flex items-center justify-between`}>
                <span className={`font-semibold text-sm ${group.color} px-3 py-1 rounded-full`}>
                  {group.label}
                </span>
                <span className="text-xs text-slate-400">{group.items.length} টি</span>
              </div>
              <div className="divide-y divide-slate-50">
                {group.items.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 text-sm">কোনো ক্যাটাগরী নেই</p>
                ) : (
                  group.items.map((cat: any) => (
                    <div key={cat.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition">
                      <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-md transition"
                          title="সম্পাদনা"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-md transition"
                          title="ডিলেট"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {editingCategory ? "ক্যাটাগরী সম্পাদনা" : "নতুন ক্যাটাগরী তৈরি"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">টাইপ</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ক্যাটাগরীর নাম</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="যেমন: বেতন ব্যয়, সঞ্চয় জমা"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? "আপডেট করুন" : "সেভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
