import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Building2, Plus, Search, Edit, Trash2, Eye, MapPin, Calendar,
  TrendingUp, TrendingDown, Wallet, CheckCircle2, Clock,
  PauseCircle, Printer, X
} from "lucide-react";
import { toast } from "react-toastify";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ONGOING: { label: "চলমান", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  COMPLETED: { label: "সমাপ্ত", color: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle2 },
  PLANNED: { label: "পরিকল্পিত", color: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  PAUSED: { label: "স্থগিত", color: "bg-rose-100 text-rose-800 border-rose-200", icon: PauseCircle },
};

export default function Projects() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalProjects: 0,
    overallInvestment: 0,
    overallIncome: 0,
    overallExpense: 0,
    overallNet: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    location: "",
    budget: "",
    status: "ONGOING",
    startDate: "",
    endDate: "",
    description: "",
  });

  // Project Statement / Details Modal
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailTab, setDetailTab] = useState<"vouchers" | "categories">("vouchers");
  const statementPrintRef = useRef<HTMLDivElement>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await axios.get(`${process.env.API_HOST}/api/projects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(res.data.projects || []);
      setSummary(res.data.summary || {});
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("প্রজেক্টের তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: "",
      code: "",
      location: "",
      budget: "",
      status: "ONGOING",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      description: "",
    });
    setShowModal(true);
  };

  const openEditModal = (p: any) => {
    setEditingProject(p);
    setFormData({
      name: p.name || "",
      code: p.code || "",
      location: p.location || "",
      budget: p.budget ? String(p.budget) : "",
      status: p.status || "ONGOING",
      startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
      endDate: p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "",
      description: p.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await axios.put(`${process.env.API_HOST}/api/projects/${editingProject.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("প্রজেক্ট সফলভাবে আপডেট হয়েছে");
      } else {
        await axios.post(`${process.env.API_HOST}/api/projects`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("নতুন প্রজেক্ট সফলভাবে তৈরি হয়েছে");
      }
      setShowModal(false);
      fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "প্রজেক্ট সেভ করতে সমস্যা হয়েছে");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে "${name}" প্রজেক্টটি ডিলিট করতে চান?`)) return;
    try {
      await axios.delete(`${process.env.API_HOST}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("প্রজেক্ট সফলভাবে ডিলিট হয়েছে");
      fetchProjects();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "প্রজেক্ট ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  const viewProjectDetails = async (id: string) => {
    setSelectedProjectId(id);
    setLoadingDetails(true);
    try {
      const res = await axios.get(`${process.env.API_HOST}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjectDetails(res.data);
    } catch (error) {
      toast.error("প্রজেক্ট স্টেটমেন্ট লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.code?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">প্রজেক্ট হিসাব ও ব্যবস্থাপনা</h2>
              <p className="text-sm text-slate-500">প্রজেক্টভিত্তিক আয়, ব্যয় ও বিনিয়োগের সার্বিক হিসাব</p>
            </div>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition shadow-sm hover:shadow"
        >
          <Plus size={18} />
          নতুন প্রজেক্ট তৈরি করুন
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">মোট প্রজেক্ট</div>
            <div className="text-2xl font-bold text-slate-800">{summary.totalProjects || 0} টি</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">মোট বিনিয়োগ</div>
            <div className="text-2xl font-bold text-amber-600">
              ৳ {(summary.overallInvestment || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">মোট প্রজেক্ট আয়</div>
            <div className="text-2xl font-bold text-emerald-600">
              ৳ {(summary.overallIncome || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown size={24} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">মোট প্রজেক্ট ব্যয়</div>
            <div className="text-2xl font-bold text-rose-600">
              ৳ {(summary.overallExpense || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-center">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { id: "ALL", label: "সকল প্রজেক্ট" },
            { id: "ONGOING", label: "চলমান" },
            { id: "COMPLETED", label: "সমাপ্ত" },
            { id: "PLANNED", label: "পরিকল্পিত" },
            { id: "PAUSED", label: "স্থগিত" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-72">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="প্রজেক্ট খুঁজুন (নাম, কোড, ঠিকানা)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium"
          >
            সার্চ
          </button>
        </form>
      </div>

      {/* Project Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500">প্রজেক্ট তালিকা লোড হচ্ছে...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">কোনো প্রজেক্ট পাওয়া যায়নি</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            আপনার সমিতি বা প্রতিষ্ঠানের জমি, ফ্ল্যাট বা যেকোনো প্রকল্পের জন্য উপরে "+ নতুন প্রজেক্ট তৈরি করুন" বাটনে ক্লিক করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const statusInfo = STATUS_CONFIG[p.status] || STATUS_CONFIG.ONGOING;
            const StatusIcon = statusInfo.icon;
            const isProfit = p.netBalance >= 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      {p.code && (
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full inline-block mb-1">
                          {p.code}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-slate-800 leading-snug">{p.name}</h3>
                    </div>
                    <span
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${statusInfo.color}`}
                    >
                      <StatusIcon size={12} />
                      {statusInfo.label}
                    </span>
                  </div>

                  {p.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </div>
                  )}

                  {/* Budget & Progress */}
                  {p.budget > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>প্রাক্কলিত বাজেট: ৳ {p.budget.toLocaleString()}</span>
                        <span className="font-semibold text-slate-700">{p.budgetUtilization}% ব্যবহৃত</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            p.budgetUtilization > 100
                              ? "bg-rose-500"
                              : p.budgetUtilization > 80
                              ? "bg-amber-500"
                              : "bg-indigo-600"
                          }`}
                          style={{ width: `${Math.min(p.budgetUtilization, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Financial Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 p-3 rounded-lg">
                    <div>
                      <div className="text-[11px] font-medium text-slate-500">বিনিয়োগ (Investment)</div>
                      <div className="text-sm font-bold text-amber-700">৳ {p.totalInvestment.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-500">প্রজেক্ট আয় (Income)</div>
                      <div className="text-sm font-bold text-emerald-700">৳ {p.totalIncome.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-500">প্রজেক্ট ব্যয় (Expense)</div>
                      <div className="text-sm font-bold text-rose-700">৳ {p.totalExpense.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-500">নীট ব্যালেন্স / লাভ</div>
                      <div className={`text-sm font-bold ${isProfit ? "text-emerald-700" : "text-rose-700"}`}>
                        {isProfit ? "+" : ""} ৳ {p.netBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">{p.voucherCount} টি ভাউচার</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => viewProjectDetails(p.id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition flex items-center gap-1"
                      title="পূর্ণাঙ্গ হিসাব ও ভাউচার দেখুন"
                    >
                      <Eye size={13} />
                      হিসাব বিবরণী
                    </button>
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                      title="সম্পাদনা"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                      title="ডিলেট"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Building2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingProject ? "প্রজেক্ট তথ্য সম্পাদনা" : "নতুন প্রজেক্ট তৈরি করুন"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  প্রজেক্টের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: পূর্বাচল গ্রিন সিটি প্রজেক্ট"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">প্রজেক্ট কোড (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    placeholder="যেমন: PRJ-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">স্ট্যাটাস</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="ONGOING">চলমান (ONGOING)</option>
                    <option value="COMPLETED">সমাপ্ত (COMPLETED)</option>
                    <option value="PLANNED">পরিকল্পিত (PLANNED)</option>
                    <option value="PAUSED">স্থগিত (PAUSED)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">অবস্থান / ঠিকানা</label>
                  <input
                    type="text"
                    placeholder="যেমন: সেক্টর ৪, পূর্বাচল"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">প্রাক্কলিত বাজেট (৳)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">শুরুর তারিখ</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">সমাপ্তির তারিখ (ঐচ্ছিক)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বিস্তারিত বিবরণ (ঐচ্ছিক)</label>
                <textarea
                  rows={3}
                  placeholder="প্রজেক্ট সম্পর্কিত যেকোনো তথ্য বা নোট লিখুন..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
                >
                  {editingProject ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT DETAILED STATEMENT MODAL */}
      {selectedProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-800">
                    {projectDetails?.project?.name || "প্রজেক্ট বিবরণী"}
                  </h3>
                  {projectDetails?.project?.code && (
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                      {projectDetails.project.code}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  {projectDetails?.project?.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {projectDetails.project.location}
                    </span>
                  )}
                  {projectDetails?.project?.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> শুরু:{" "}
                      {new Date(projectDetails.project.startDate).toLocaleDateString("bn-BD")}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintStatement}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition"
                >
                  <Printer size={14} /> প্রিন্ট
                </button>
                <button
                  onClick={() => setSelectedProjectId(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {loadingDetails ? (
              <div className="py-20 text-center text-slate-500">হিসাব বিবরণী লোড হচ্ছে...</div>
            ) : projectDetails ? (
              <div className="overflow-y-auto flex-1 py-4 space-y-6" ref={statementPrintRef}>
                {/* 4 Financial Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl">
                    <div className="text-xs font-semibold text-amber-800">মোট বিনিয়োগ (Investment)</div>
                    <div className="text-xl font-bold text-amber-700 mt-1">
                      ৳ {(projectDetails.metrics?.totalInvestment || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl">
                    <div className="text-xs font-semibold text-emerald-800">মোট আয় (Income)</div>
                    <div className="text-xl font-bold text-emerald-700 mt-1">
                      ৳ {(projectDetails.metrics?.totalIncome || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-xl">
                    <div className="text-xs font-semibold text-rose-800">মোট ব্যয় (Expense)</div>
                    <div className="text-xl font-bold text-rose-700 mt-1">
                      ৳ {(projectDetails.metrics?.totalExpense || 0).toLocaleString()}
                    </div>
                  </div>
                  <div
                    className={`p-3.5 rounded-xl border ${
                      projectDetails.metrics?.netBalance >= 0
                        ? "bg-indigo-50/70 border-indigo-200 text-indigo-900"
                        : "bg-rose-50/70 border-rose-200 text-rose-900"
                    }`}
                  >
                    <div className="text-xs font-semibold">নীট ব্যালেন্স / লাভ-ক্ষতি</div>
                    <div className="text-xl font-bold mt-1">
                      {projectDetails.metrics?.netBalance >= 0 ? "+" : ""} ৳{" "}
                      {(projectDetails.metrics?.netBalance || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-slate-200">
                  <button
                    onClick={() => setDetailTab("vouchers")}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                      detailTab === "vouchers"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    ভাউচার তালিকা ({projectDetails.vouchers?.length || 0})
                  </button>
                  <button
                    onClick={() => setDetailTab("categories")}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                      detailTab === "categories"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    খাতভিত্তিক সারসংক্ষেপ (Category Breakdown)
                  </button>
                </div>

                {/* VOUCHERS LIST TAB */}
                {detailTab === "vouchers" && (
                  <div className="overflow-x-auto">
                    {projectDetails.vouchers?.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-sm">
                        এই প্রজেক্টের সাথে কোনো ভাউচার যুক্ত করা হয়নি। ভাউচার মেনু থেকে প্রজেক্ট নির্বাচন করে ভাউচার যোগ করতে পারেন।
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                        <thead className="bg-slate-100 text-slate-700 font-semibold">
                          <tr>
                            <th className="p-2.5">তারিখ</th>
                            <th className="p-2.5">ভাউচার নং</th>
                            <th className="p-2.5">ধরণ</th>
                            <th className="p-2.5">ক্যাটাগরি</th>
                            <th className="p-2.5">সদস্য / পক্ষ</th>
                            <th className="p-2.5">বিবরণ</th>
                            <th className="p-2.5 text-right">পরিমাণ (৳)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {projectDetails.vouchers.map((v: any) => {
                            const isInc = v.type === "INCOME";
                            const isExp = v.type === "EXPENSE";

                            return (
                              <tr key={v.id} className="hover:bg-slate-50">
                                <td className="p-2.5 whitespace-nowrap text-slate-600">
                                  {new Date(v.date).toLocaleDateString("bn-BD")}
                                </td>
                                <td className="p-2.5 whitespace-nowrap font-medium text-slate-800">
                                  {v.voucherNo || "-"}
                                </td>
                                <td className="p-2.5 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                      isInc
                                        ? "bg-emerald-100 text-emerald-800"
                                        : isExp
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-amber-100 text-amber-800"
                                    }`}
                                  >
                                    {isInc ? "আয়" : isExp ? "ব্যয়" : "বিনিয়োগ"}
                                  </span>
                                </td>
                                <td className="p-2.5 whitespace-nowrap font-medium text-slate-700">
                                  {v.category}
                                </td>
                                <td className="p-2.5 whitespace-nowrap text-slate-600">
                                  {v.member?.name ? `${v.member.name} (${v.member.memberId})` : "অফিস / বিবিধ"}
                                </td>
                                <td className="p-2.5 text-slate-500 max-w-[200px] truncate" title={v.description}>
                                  {v.description || "-"}
                                </td>
                                <td
                                  className={`p-2.5 text-right font-bold whitespace-nowrap ${
                                    isInc ? "text-emerald-700" : "text-rose-700"
                                  }`}
                                >
                                  {isInc ? "+" : "-"} ৳ {v.amount.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* CATEGORY BREAKDOWN TAB */}
                {detailTab === "categories" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Investment Categories */}
                    <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-200">
                      <div className="font-bold text-sm text-amber-900 mb-3 flex justify-between items-center">
                        <span>বিনিয়োগ খাতসমূহ</span>
                        <span className="text-xs bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded-full">
                          {projectDetails.categoryBreakdown?.investment?.length || 0} টি
                        </span>
                      </div>
                      <div className="space-y-2">
                        {projectDetails.categoryBreakdown?.investment?.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">কোনো বিনিয়োগ লেনদেন নেই</p>
                        ) : (
                          projectDetails.categoryBreakdown.investment.map((c: any) => (
                            <div key={c.category} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-amber-100">
                              <span className="font-medium text-slate-700">{c.category}</span>
                              <span className="font-bold text-amber-700">৳ {c.amount.toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Income Categories */}
                    <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200">
                      <div className="font-bold text-sm text-emerald-900 mb-3 flex justify-between items-center">
                        <span>আয়ের খাতসমূহ</span>
                        <span className="text-xs bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-full">
                          {projectDetails.categoryBreakdown?.income?.length || 0} টি
                        </span>
                      </div>
                      <div className="space-y-2">
                        {projectDetails.categoryBreakdown?.income?.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">কোনো আয় লেনদেন নেই</p>
                        ) : (
                          projectDetails.categoryBreakdown.income.map((c: any) => (
                            <div key={c.category} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-emerald-100">
                              <span className="font-medium text-slate-700">{c.category}</span>
                              <span className="font-bold text-emerald-700">৳ {c.amount.toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Expense Categories */}
                    <div className="bg-rose-50/40 rounded-xl p-4 border border-rose-200">
                      <div className="font-bold text-sm text-rose-900 mb-3 flex justify-between items-center">
                        <span>ব্যয়ের খাতসমূহ</span>
                        <span className="text-xs bg-rose-200/70 text-rose-800 px-2 py-0.5 rounded-full">
                          {projectDetails.categoryBreakdown?.expense?.length || 0} টি
                        </span>
                      </div>
                      <div className="space-y-2">
                        {projectDetails.categoryBreakdown?.expense?.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">কোনো ব্যয় লেনদেন নেই</p>
                        ) : (
                          projectDetails.categoryBreakdown.expense.map((c: any) => (
                            <div key={c.category} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border border-rose-100">
                              <span className="font-medium text-slate-700">{c.category}</span>
                              <span className="font-bold text-rose-700">৳ {c.amount.toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
