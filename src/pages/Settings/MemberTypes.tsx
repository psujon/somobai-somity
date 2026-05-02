import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Plus, Edit, Trash2, Tag } from "lucide-react";

export default function MemberTypes() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const { token } = useAuth();

  const [name, setName] = useState("");

  const fetchTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/member-types", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTypes(res.data);
    } catch (error) {
      console.error("Error fetching member types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await axios.put(`http://localhost:5000/api/member-types/${editingType.id}`, { name }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post("http://localhost:5000/api/member-types", { name }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      setEditingType(null);
      setName("");
      fetchTypes();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error saving member type");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে এই সদস্য ধরনটি ডিলিট করতে চান?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/member-types/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTypes();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error deleting member type");
    }
  };

  const openEditModal = (type: any) => {
    setEditingType(type);
    setName(type.name);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingType(null);
    setName("");
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">মেম্বার ধরন</h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus size={18} />
          নতুন ধরন
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">সদস্য ধরনের নাম</th>
                <th className="px-6 py-3 font-medium text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={2} className="text-center py-8 text-slate-500">লোড হচ্ছে...</td></tr>
              ) : types.length === 0 ? (
                <tr><td colSpan={2} className="text-center py-8 text-slate-500">কোনো সদস্য ধরন পাওয়া যায়নি</td></tr>
              ) : types.map((type: any) => (
                <tr key={type.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 font-medium text-slate-800">
                      <Tag size={16} className="text-purple-500" />
                      {type.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(type)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition bg-slate-50 hover:bg-blue-50 rounded-md"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(type.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition bg-slate-50 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {editingType ? "সদস্য ধরন সম্পাদনা" : "নতুন সদস্য ধরন তৈরি"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">সদস্য ধরনের নাম</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="যেমন: সাধারণ সদস্য"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">বাতিল</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingType ? "আপডেট করুন" : "সেভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
