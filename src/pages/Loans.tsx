import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, CheckCircle, CreditCard } from "lucide-react";

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const { token } = useAuth();
  
  const [formData, setFormData] = useState({
    memberId: "", amount: "", interestRate: "10"
  });

  const [installmentData, setInstallmentData] = useState({
    amount: ""
  });

  const fetchData = async () => {
    try {
      const [loanRes, memRes] = await Promise.all([
        axios.get("http://localhost:5000/api/loans", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/members", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setLoans(loanRes.data);
      setMembers(memRes.data);
    } catch (error) {
      console.error("Error fetching loans data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/loans", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchData();
      setFormData({ memberId: "", amount: "", interestRate: "10" });
    } catch (error: any) {
      alert(error.response?.data?.message || "Error creating loan");
    }
  };

  const handleApprove = async (id: string) => {
    if(!window.confirm("আপনি কি নিশ্চিত যে এই ঋণটি অনুমোদন ও বিতরণ করতে চান?")) return;
    try {
      await axios.post(`http://localhost:5000/api/loans/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      alert("ঋণ অনুমোদিত ও বিতরণ করা হয়েছে।");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error approving loan");
    }
  };

  const handleInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/api/loans/${selectedLoanId}/installment`, installmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowInstallmentModal(false);
      fetchData();
      setInstallmentData({ amount: "" });
      alert("কিস্তি সফলভাবে আদায় হয়েছে!");
    } catch (error: any) {
      alert(error.response?.data?.message || "Error collecting installment");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">ঋণ ব্যবস্থাপনা</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus size={18} />
          ঋণ আবেদন
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ঋণ খুঁজুন..." 
              className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">ঋণ নম্বর</th>
                <th className="px-6 py-3 font-medium">সদস্যের নাম</th>
                <th className="px-6 py-3 font-medium text-right">ঋণের পরিমাণ</th>
                <th className="px-6 py-3 font-medium text-right">মোট প্রদেয়</th>
                <th className="px-6 py-3 font-medium text-right">আদায়কৃত</th>
                <th className="px-6 py-3 font-medium text-center">স্ট্যাটাস</th>
                <th className="px-6 py-3 font-medium text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">লোড হচ্ছে...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">কোনো ঋণ পাওয়া যায়নি</td></tr>
              ) : loans.map((loan: any) => (
                <tr key={loan.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-blue-600">{loan.loanNo}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {loan.member.name} ({loan.member.memberId})
                  </td>
                  <td className="px-6 py-4 text-right">৳ {loan.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">৳ {loan.totalPayable.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-green-600 font-medium">৳ {loan.totalPaid.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      loan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                      loan.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                      loan.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {loan.status === 'PENDING' && (
                      <button 
                        onClick={() => handleApprove(loan.id)}
                        className="inline-flex items-center gap-1 text-sm bg-orange-50 text-orange-700 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <CheckCircle size={14} />
                        অনুমোদন
                      </button>
                    )}
                    {loan.status === 'ACTIVE' && (
                      <button 
                        onClick={() => {
                          setSelectedLoanId(loan.id);
                          setShowInstallmentModal(true);
                        }}
                        className="inline-flex items-center gap-1 text-sm bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <CreditCard size={14} />
                        কিস্তি আদায়
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Loan Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">ঋণ আবেদন</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleApplyLoan} className="p-6 space-y-4">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">ঋণের পরিমাণ</label>
                <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">মুনাফার হার (%)</label>
                <input type="number" step="0.1" value={formData.interestRate} onChange={e => setFormData({...formData, interestRate: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">বাতিল</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">আবেদন করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Installment Modal */}
      {showInstallmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">কিস্তি আদায়</h3>
              <button onClick={() => setShowInstallmentModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleInstallment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">টাকার পরিমাণ</label>
                <input required type="number" value={installmentData.amount} onChange={e => setInstallmentData({...installmentData, amount: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="0.00" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowInstallmentModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">বাতিল</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">আদায় করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
