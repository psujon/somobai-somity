import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Download, Database, CheckCircle, AlertCircle, Calendar } from "lucide-react";

export default function DatabaseBackup() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const fetchBackups = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/backup", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBackups(res.data);
    } catch (error) {
      console.error("Error fetching backups");
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleBackup = async () => {
    setLoading(true);
    setStatusMsg({ type: "", text: "" });
    try {
      await axios.post("http://localhost:5000/api/backup", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatusMsg({ type: "success", text: "ডাটাবেজ সফলভাবে ব্যাকআপ নেওয়া হয়েছে!" });
      fetchBackups();
    } catch (error: any) {
      setStatusMsg({ type: "error", text: error.response?.data?.message || "ব্যাকআপ নিতে সমস্যা হয়েছে।" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Database className="text-blue-600" />
              ডাটাবেজ ব্যাকআপ
            </h2>
            <p className="text-slate-600 mb-4 max-w-lg">
              আপনার সম্পূর্ণ সফটওয়্যারের ডাটাবেজ সুরক্ষিত রাখতে নিয়মিত ব্যাকআপ নিন। ব্যাকআপ ফাইলগুলো সরাসরি সার্ভারের <code className="bg-slate-100 px-1 rounded text-sm text-pink-600">backups</code> ফোল্ডারে সেভ হবে।
            </p>
          </div>
          
          <button 
            onClick={handleBackup} 
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <span className="animate-pulse">ব্যাকআপ হচ্ছে...</span>
            ) : (
              <>
                <Download size={18} />
                এখনই ব্যাকআপ নিন
              </>
            )}
          </button>
        </div>

        {statusMsg.text && (
          <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 text-sm font-medium ${
            statusMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {statusMsg.text}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-slate-500" />
            পূর্বের ব্যাকআপ সমূহ
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 font-medium">ফাইলের নাম</th>
                <th className="px-6 py-3 font-medium">তারিখ ও সময়</th>
                <th className="px-6 py-3 font-medium text-right">সাইজ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    এখনো কোনো ব্যাকআপ নেওয়া হয়নি।
                  </td>
                </tr>
              ) : (
                backups.map((backup, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-700">{backup.filename}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(backup.date).toLocaleString('bn-BD')}</td>
                    <td className="px-6 py-4 text-slate-600 text-right">{backup.size}</td>
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
