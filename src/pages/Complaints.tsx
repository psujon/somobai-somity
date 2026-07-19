import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { RefreshCw, MessageSquareWarning, CheckCircle } from "lucide-react";

export default function Complaints() {
  const { token } = useAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get(`${process.env.API_HOST}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(res.data);
    } catch (err) {
      console.error("Error fetching feedbacks", err);
      toast.error("তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFeedbacks();
    }
  }, [token]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.patch(`${process.env.API_HOST}/api/feedback/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("স্ট্যাটাস আপডেট করা হয়েছে");
      fetchFeedbacks();
    } catch (err) {
      console.error("Error updating status", err);
      toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
          <p className="text-slate-600 font-medium">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">অভিযোগ ও পরামর্শ</h1>
          <p className="text-sm text-slate-500 mt-1">মেম্বারদের সকল অভিযোগ ও পরামর্শের তালিকা</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">তারিখ</th>
                <th className="px-6 py-3 font-medium">মেম্বার</th>
                <th className="px-6 py-3 font-medium">ধরন</th>
                <th className="px-6 py-3 font-medium">বিষয় ও বিস্তারিত</th>
                <th className="px-6 py-3 font-medium">স্ট্যাটাস</th>
                <th className="px-6 py-3 font-medium text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    কোনো অভিযোগ বা পরামর্শ পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                feedbacks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{item.member?.name}</div>
                      <div className="text-xs text-slate-500">{item.member?.memberId} | {item.member?.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        item.type === 'COMPLAINT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {item.type === 'COMPLAINT' ? 'অভিযোগ' : 'পরামর্শ'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 mb-1">{item.subject}</div>
                      <div className="text-sm text-slate-600 max-w-md whitespace-pre-wrap">{item.message}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                        item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        item.status === 'REVIEWED' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.status === 'PENDING' ? 'পেন্ডিং' : item.status === 'REVIEWED' ? 'রিভিউড' : 'সমাধান'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-sm border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="PENDING">পেন্ডিং</option>
                        <option value="REVIEWED">রিভিউ করা হয়েছে</option>
                        <option value="RESOLVED">সমাধান হয়েছে</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
