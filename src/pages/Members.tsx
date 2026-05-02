import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

export default function Members() {
  const [members, setMembers] = useState<any[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [positions, setPositions] = useState<any[]>([]);
  const [memberTypes, setMemberTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const { token } = useAuth();

  const defaultForm = {
    name: "", phone: "", email: "", nid: "", address: "",
    type: "", position: "", joinDate: new Date().toISOString().split('T')[0]
  };
  const [formData, setFormData] = useState(defaultForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const fetchMembers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/members", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(res.data);
      setFilteredMembers(res.data);
    } catch (error) {
      console.error("Error fetching members", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/positions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPositions(res.data);
    } catch (error) {
      console.error("Error fetching positions", error);
    }
  };

  const fetchMemberTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/member-types", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMemberTypes(res.data);
    } catch (error) {
      console.error("Error fetching member types", error);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchPositions();
    fetchMemberTypes();
  }, []);

  // Live search
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredMembers(
      members.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.memberId.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, members]);

  const openCreateModal = () => {
    setEditingMember(null);
    setFormData(defaultForm);
    setPhotoFile(null);
    setShowModal(true);
  };

  const openEditModal = (member: any) => {
    setEditingMember(member);
    setFormData({
      name: member.name || "",
      phone: member.phone || "",
      email: member.email || "",
      nid: member.nid || "",
      address: member.address || "",
      type: member.type || "",
      position: member.position || "",
      joinDate: member.joinDate ? new Date(member.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setPhotoFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (photoFile) {
        data.append("photo", photoFile);
      }

      if (editingMember) {
        await axios.put(`http://localhost:5000/api/members/${editingMember.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post("http://localhost:5000/api/members", data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
      }

      setShowModal(false);
      fetchMembers();
      setFormData(defaultForm);
      setPhotoFile(null);
      setEditingMember(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Error saving member");
    }
  };

  const handleDelete = async (member: any) => {
    if (!window.confirm(`"${member.name}" কে বাতিল করতে চান? তার স্ট্যাটাস 'বাতিল' হয়ে যাবে।`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/members/${member.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMembers();
    } catch (error: any) {
      alert(error.response?.data?.message || "Error cancelling member");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">সদস্য ব্যবস্থাপনা</h2>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus size={18} />
          নতুন সদস্য
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="সদস্য খুঁজুন..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <span className="text-sm text-slate-500">মোট: {filteredMembers.length} জন সদস্য</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">ছবি</th>
                <th className="px-6 py-3 font-medium">নাম ও আইডি</th>
                <th className="px-6 py-3 font-medium">ফোন</th>
                <th className="px-6 py-3 font-medium">ধরণ ও পদবী</th>
                <th className="px-6 py-3 font-medium">যোগদানের তারিখ</th>
                <th className="px-6 py-3 font-medium">স্ট্যাটাস</th>
                <th className="px-6 py-3 font-medium text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">লোড হচ্ছে...</td></tr>
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">কোনো সদস্য পাওয়া যায়নি</td></tr>
              ) : filteredMembers.map((member: any) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {member.photo ? (
                      <img src={`http://localhost:5000${member.photo}`} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">{member.name.charAt(0)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{member.name}</p>
                    <p className="text-xs text-blue-600 font-semibold">{member.memberId}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{member.phone}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <p className="text-sm">{member.type}</p>
                    <p className="text-xs text-slate-500">{member.position}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(member.joinDate).toLocaleDateString('bn-BD')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {member.status === 'ACTIVE' ? 'সক্রিয়' : 'বাতিল'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(member)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition bg-slate-50 hover:bg-blue-50 rounded-md"
                      title="সম্পাদনা"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(member)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition bg-slate-50 hover:bg-red-50 rounded-md"
                      title="বাতিল করুন"
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

      {/* Add / Edit Member Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                {editingMember ? "সদস্য সম্পাদনা" : "নতুন সদস্য ভর্তি"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">নাম *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ফোন *</label>
                  <input required type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ইমেইল (অপশনাল)</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NID (অপশনাল)</label>
                  <input type="text" value={formData.nid} onChange={e => setFormData({ ...formData, nid: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">ঠিকানা</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">সদস্য ধরণ</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">নির্বাচিত করুন</option>
                    {memberTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">পদবী</label>
                  <select value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">নির্বাচিত করুন</option>
                    {positions.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">যোগদানের তারিখ</label>
                  <input type="date" value={formData.joinDate} onChange={e => setFormData({ ...formData, joinDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {!editingMember && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ছবি <span className="text-red-500 text-xs">(পরিবর্তনযোগ্য নহে)</span></label>
                    <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="w-full px-3 py-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">বাতিল</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingMember ? "আপডেট করুন" : "সেভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
