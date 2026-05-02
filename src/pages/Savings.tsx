import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, DollarSign } from "lucide-react";

export default function Savings() {
  const [accounts, setAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    memberId: "", type: "GENERAL", interestRate: "0"
  });

  const [depositData, setDepositData] = useState({
    amount: "", reference: ""
  });

  const fetchData = async () => {
    try {
      const [accRes, memRes] = await Promise.all([
        axios.get("http://localhost:5000/api/savings", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/members", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAccounts(accRes.data);
      setMembers(memRes.data);
    } catch (error) {
      console.error("Error fetching savings data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/savings", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchData();
      setFormData({ memberId: "", type: "GENERAL", interestRate: "0" });
    } catch (error: any) {
      alert(error.response?.data?.message || "Error creating account");
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/api/savings/${selectedAccountId}/deposit`, depositData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDepositModal(false);
      fetchData();
      setDepositData({ amount: "", reference: "" });
      alert("সফলভাবে জমা হয়েছে!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error during deposit");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">সঞ্চয় ও আমানত</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus size={18} />
          নতুন হিসাব খুলুন
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="হিসাব খুঁজুন..." 
              className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">হিসাব নম্বর</th>
                <th className="px-6 py-3 font-medium">সদস্যের নাম</th>
                <th className="px-6 py-3 font-medium">ধরণ</th>
                <th className="px-6 py-3 font-medium text-right">বর্তমান ব্যালেন্স</th>
                <th className="px-6 py-3 font-medium text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">লোড হচ্ছে...</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">কোনো হিসাব পাওয়া যায়নি</td></tr>
              ) : accounts.map((acc: any) => (
                <tr key={acc.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-blue-600">{acc.accountNo}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {acc.member.name} ({acc.member.memberId})
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                      {acc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">৳ {acc.balance.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        setShowDepositModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-sm bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg transition"
                    >
                      <DollarSign size={14} />
                      জমা দিন
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">নতুন সঞ্চয় হিসাব</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">সদস্য নির্বাচন করুন</label>
                <select required value={formData.memberId} onChange={e => setFormData({...formData, memberId: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">নির্বাচন করুন</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.memberId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">হিসাবের ধরণ</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="GENERAL">সাধারণ সঞ্চয় (General)</option>
                  <option value="DPS">ডিপিএস (DPS)</option>
                  <option value="FDR">এফডিআর (FDR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">মুনাফার হার (%)</label>
                <input type="number" step="0.1" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">বাতিল</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">খুলুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">সঞ্চয় জমা</h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleDeposit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">টাকার পরিমাণ</label>
                <input required type="number" value={depositData.amount} onChange={e => setDepositData({...depositData, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">রেফারেন্স বা বিবরণ (ঐচ্ছিক)</label>
                <input type="text" value={depositData.reference} onChange={e => setDepositData({...depositData, reference: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="মাসিক জমা" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowDepositModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">বাতিল</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">জমা করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
