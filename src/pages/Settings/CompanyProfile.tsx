import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Save, Building2, FileText, Phone, Landmark, CheckCircle } from "lucide-react";

export default function CompanyProfile() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [formData, setFormData] = useState({
    name: "", shortCode: "", establishedYear: "", registrationNo: "",
    tinNo: "", vatNo: "", tradeLicenseNo: "", hotline: "",
    website: "", socialMediaLinks: "", bankName: "", bankBranch: "",
    bankAccountNo: "", address: ""
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogo, setExistingLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/company-profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) {
          setFormData({
            name: res.data.name || "",
            shortCode: res.data.shortCode || "",
            establishedYear: res.data.establishedYear || "",
            registrationNo: res.data.registrationNo || "",
            tinNo: res.data.tinNo || "",
            vatNo: res.data.vatNo || "",
            tradeLicenseNo: res.data.tradeLicenseNo || "",
            hotline: res.data.hotline || "",
            website: res.data.website || "",
            socialMediaLinks: res.data.socialMediaLinks || "",
            bankName: res.data.bankName || "",
            bankBranch: res.data.bankBranch || "",
            bankAccountNo: res.data.bankAccountNo || "",
            address: res.data.address || ""
          });
          setExistingLogo(res.data.logo);
        }
      } catch (error) {
        console.error("Error fetching company profile");
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (logoFile) {
        data.append("logo", logoFile);
      }

      const res = await axios.post("http://localhost:5000/api/company-profile", data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      
      setExistingLogo(res.data.logo);
      setSuccessMsg("কোম্পানী প্রোফাইল সফলভাবে আপডেট করা হয়েছে!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      alert("Error saving company profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center py-10 text-slate-500">লোড হচ্ছে...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">কোম্পানী প্রোফাইল সেটিংস</h2>
      </div>

      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 border border-green-200">
          <CheckCircle size={20} />
          <p className="font-medium">{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2 text-slate-700 font-semibold">
            <Building2 size={18} />
            সাধারণ তথ্য
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">সমিতির/কোম্পানীর নাম *</label>
              <input required name="name" value={formData.name} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">কোম্পানী শর্ট কোড</label>
              <input name="shortCode" value={formData.shortCode} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">স্থাপিত বছর</label>
              <input name="establishedYear" value={formData.establishedYear} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">কোম্পানীর লোগো</label>
              <div className="flex items-center gap-4">
                {existingLogo && !logoFile && (
                  <img src={`http://localhost:5000${existingLogo}`} alt="Logo" className="h-10 w-10 object-cover rounded border" />
                )}
                <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">ঠিকানা</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Legal & Registration */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2 text-slate-700 font-semibold">
            <FileText size={18} />
            লাইসেন্স ও নিবন্ধন তথ্য
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">নিবন্ধন নম্বর</label>
              <input name="registrationNo" value={formData.registrationNo} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ট্রেড লাইসেন্স নম্বর</label>
              <input name="tradeLicenseNo" value={formData.tradeLicenseNo} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">টিন (TIN) নম্বর</label>
              <input name="tinNo" value={formData.tinNo} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ভ্যাট (VAT) নম্বর</label>
              <input name="vatNo" value={formData.vatNo} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2 text-slate-700 font-semibold">
            <Phone size={18} />
            যোগাযোগের তথ্য
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">হটলাইন নম্বর</label>
              <input name="hotline" value={formData.hotline} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ওয়েবসােইট</label>
              <input name="website" value={formData.website} onChange={handleChange} type="text" placeholder="https://..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">সোশ্যাল মিডিয়া লিংক</label>
              <input name="socialMediaLinks" value={formData.socialMediaLinks} onChange={handleChange} type="text" placeholder="Facebook, Twitter, etc." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Bank Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2 text-slate-700 font-semibold">
            <Landmark size={18} />
            ব্যাংক অ্যাকাউন্ট তথ্য
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ব্যাংক-এর নাম</label>
              <input name="bankName" value={formData.bankName} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">শাখা</label>
              <input name="bankBranch" value={formData.bankBranch} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">অ্যাকাউন্ট নম্বর</label>
              <input name="bankAccountNo" value={formData.bankAccountNo} onChange={handleChange} type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-70"
          >
            {loading ? "সংরক্ষণ হচ্ছে..." : (
              <>
                <Save size={20} />
                প্রোফাইল সেভ করুন
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
