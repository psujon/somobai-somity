import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, User, LogOut,
  PiggyBank, CreditCard, Printer, RefreshCw, Download
} from "lucide-react";

export default function MemberDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  // Statement Tab States
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [statementData, setStatementData] = useState<any>(null);
  const [statementLoading, setStatementLoading] = useState(false);

  const fetchCompanyProfile = async () => {
    try {
      const res = await axios.get(`${process.env.API_HOST}/api/company-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanyProfile(res.data);
    } catch (err) {
      console.error("Error fetching company profile", err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${process.env.API_HOST}/api/member-portal/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummaryData(res.data);
      if (res.data.accounts?.length > 0) {
        setSelectedAccountId(res.data.accounts[0].id);
      }
    } catch (err) {
      console.error("Error fetching member summary", err);
    }
  };

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(`${process.env.API_HOST}/api/member-portal/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfiles(res.data);
    } catch (err) {
      console.error("Error fetching member profiles", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchProfiles(), fetchCompanyProfile()]);
    setLoading(false);
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  useEffect(() => {
    const fetchStatement = async () => {
      if (!selectedAccountId) return;
      setStatementLoading(true);
      try {
        const res = await axios.get(`${process.env.API_HOST}/api/member-portal/statement/${selectedAccountId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStatementData(res.data);
      } catch (err) {
        console.error("Error fetching statement", err);
      } finally {
        setStatementLoading(false);
      }
    };

    if (activeTab === "statement" && selectedAccountId) {
      fetchStatement();
    }
  }, [activeTab, selectedAccountId]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("printable-statement");
    if (!element || !statementData) return;

    const opt = {
      margin: 10,
      filename: `Statement-${statementData.account?.accountNo || 'Account'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const runHtml2Pdf = () => {
      (window as any).html2pdf().from(element).set(opt).save();
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = runHtml2Pdf;
      document.body.appendChild(script);
    } else {
      runHtml2Pdf();
    }
  };

  const activeProfile = profiles[selectedProfileIndex] || null;

  // Calculate stats for the statement
  const transactions = statementData?.transactions || [];
  const totalDeposits = transactions
    .filter((tx: any) => tx.type === "DEPOSIT")
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const totalWithdrawals = transactions
    .filter((tx: any) => tx.type === "WITHDRAWAL")
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const netBalance = totalDeposits - totalWithdrawals;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
          <p className="text-slate-600 font-medium">তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-slate-900 text-white flex flex-col print:hidden">
        <div className="h-16 flex items-center px-6 bg-slate-950 border-b border-slate-800">
          <span className="font-bold text-lg tracking-wider text-blue-400">সদস্য পোর্টাল</span>
        </div>

        <div className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "dashboard" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <LayoutDashboard size={18} />
            ড্যাশবোর্ড
          </button>

          <button
            onClick={() => setActiveTab("statement")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "statement" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <FileText size={18} />
            স্টেটমেন্ট
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "profile" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
          >
            <User size={18} />
            প্রোফাইল
          </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/20 transition-colors"
          >
            <LogOut size={18} />
            লগআউট
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="mb-6 flex justify-between items-center print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              স্বাগতম, {activeProfile?.name || "সদস্য"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">সদস্য আইডি: {activeProfile?.memberId || "-"}</p>
          </div>
        </header>

        {/* Tab contents */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 print:hidden">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-4 rounded-full bg-green-50 text-green-600">
                  <PiggyBank size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">সর্ব মোট জমা</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">
                    ৳ {summaryData?.totalBalance?.toLocaleString() || 0}
                  </h3>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="p-4 rounded-full bg-blue-50 text-blue-600">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">মোট হিসাব সংখ্যা</p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-1">
                    {summaryData?.accountsCount || 0} টি
                  </h3>
                </div>
              </div>
            </div>

            {/* Accounts Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">হিসাব তালিকা</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-3 font-medium">হিসাব নম্বর</th>
                      <th className="px-6 py-3 font-medium">ধরন</th>
                      <th className="px-6 py-3 font-medium">সদস্য</th>
                      <th className="px-6 py-3 font-medium text-right">ব্যালেন্স (জমা)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaryData?.accounts?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                          কোনো হিসাব খুঁজে পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      summaryData?.accounts?.map((acc: any) => (
                        <tr key={acc.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-blue-600">{acc.accountNo}</td>
                          <td className="px-6 py-4">{acc.type}</td>
                          <td className="px-6 py-4 font-medium text-slate-700">
                            {acc.member?.name} ({acc.member?.memberId})
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800">
                            ৳ {acc.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "statement" && (
          <div className="space-y-6">
            {/* Account Selector & Print Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">হিসাব নির্বাচন করুন:</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {summaryData?.accounts?.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNo} ({acc.type}) - ৳{acc.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {statementData && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 self-start md:self-auto"
                  >
                    <Printer size={16} />
                    প্রিন্ট করুন
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 self-start md:self-auto"
                  >
                    <Download size={16} />
                    ডাউনলোড করুন
                  </button>
                </div>
              )}
            </div>

            {/* Statement Printable Area */}
            {statementLoading ? (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-100 flex justify-center items-center">
                <RefreshCw className="animate-spin text-blue-600" size={24} />
                <span className="ml-2 text-slate-600 font-medium">স্টেটমেন্ট লোড হচ্ছে...</span>
              </div>
            ) : statementData ? (
              <div id="printable-statement" className="bg-white rounded-xl border border-slate-100 overflow-hidden p-4 space-y-4 print:border-none print:shadow-none print:p-0">
                {/* PDF rendering letter-spacing fix for Bengali text */}
                <style dangerouslySetInnerHTML={{
                  __html: `
                  #printable-statement, #printable-statement * {
                    letter-spacing: 0px !important;
                    word-spacing: 0px !important;
                  }
                `}} />

                {/* 1. Header (Bank-style Top Header) */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-3 gap-3">
                  <div className="flex items-center gap-3">
                    {companyProfile?.logo ? (
                      <img
                        src={`${process.env.API_HOST}${companyProfile.logo}`}
                        alt="Logo"
                        className="h-12 w-12 object-contain"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-base shadow-md">
                        FV
                      </div>
                    )}
                    <div>
                      <h2 className="text-base font-bold text-slate-800 tracking-tight">
                        {companyProfile?.name || "ফিউচার ভ্যাল্যু কো-অপারেটিভ সোসাইটি লিমিটেড"}
                      </h2>
                      {companyProfile?.address && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{companyProfile.address}</p>
                      )}
                      {companyProfile?.hotline && (
                        <p className="text-[11px] text-slate-400 mt-0.5">হটলাইন: {companyProfile.hotline}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-left md:text-right bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 min-w-[150px] print:bg-white print:border">
                    <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">হিসাব বিবরণী</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">প্রিন্ট তারিখ: {new Date().toLocaleDateString("bn-BD")}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">বিবরণী পিরিয়ড: আজ পর্যন্ত</p>
                  </div>
                </div>

                {/* 2. Member & Account Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Member Details */}
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/80">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">গ্রাহক তথ্য (Member Info)</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-slate-100/50">
                          <td className="py-1 text-slate-500 font-medium">সদস্যের নাম:</td>
                          <td className="py-1 text-slate-800 font-bold text-right">{statementData.account?.member?.name}</td>
                        </tr>
                        <tr className="border-b border-slate-100/50">
                          <td className="py-1 text-slate-500 font-medium">সদস্য আইডি:</td>
                          <td className="py-1 text-blue-600 font-bold text-right">{statementData.account?.member?.memberId}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-slate-500 font-medium">মোবাইল নম্বর:</td>
                          <td className="py-1 text-slate-800 font-bold text-right">{statementData.account?.member?.phone}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Account Details */}
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/80">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">হিসাব তথ্য (Account Info)</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-slate-100/50">
                          <td className="py-1 text-slate-500 font-medium">হিসাব নম্বর:</td>
                          <td className="py-1 text-blue-600 font-bold text-right">{statementData.account?.accountNo}</td>
                        </tr>
                        <tr className="border-b border-slate-100/50">
                          <td className="py-1 text-slate-500 font-medium">হিসাবের ধরন:</td>
                          <td className="py-1 text-slate-800 font-bold text-right">{statementData.account?.type}</td>
                        </tr>
                        <tr>
                          <td className="py-1 text-slate-500 font-medium">হিসাব স্থিতি:</td>
                          <td className="py-1 text-green-600 font-bold text-right">সক্রিয় (Active)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Account Summary Cards (Financial stats) */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/30 p-1.5 rounded-xl border border-slate-100/50">
                 
                  <div className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">মোট জমা (Deposits)</span>
                      <span className="text-base font-black text-green-600 block mt-0.5">
                        ৳ {totalDeposits.toLocaleString()}
                      </span>
                    </div>
                    <span className="h-8 w-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center font-bold text-sm">
                      +
                    </span>
                  </div>

                  
                  <div className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">মোট উত্তোলন (Withdrawals)</span>
                      <span className="text-base font-black text-red-500 block mt-0.5">
                        ৳ {totalWithdrawals.toLocaleString()}
                      </span>
                    </div>
                    <span className="h-8 w-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center font-bold text-sm">
                      -
                    </span>
                  </div>

                  <div className="bg-blue-600 p-3 rounded-lg flex items-center justify-between shadow-sm text-white">
                    <div>
                      <span className="text-[10px] font-bold text-blue-100 block">বর্তমান স্থিতি (Net Balance)</span>
                      <span className="text-base font-black block mt-0.5">
                        ৳ {netBalance.toLocaleString()}
                      </span>
                    </div>
                    <span className="h-8 w-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      =
                    </span>
                  </div>
                </div> */}

                {/* 4. Transaction Ledger Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white print:bg-slate-100 print:text-slate-800 border-b border-slate-300">
                      <tr>
                        <th className="border border-slate-300 px-4 py-2 font-bold">তারিখ</th>
                        <th className="border border-slate-300 px-4 py-2 font-bold">ভাউচার কোড</th>
                        <th className="border border-slate-300 px-4 py-2 font-bold">বিবরণ / মন্তব্য</th>
                        <th className="border border-slate-300 px-4 py-2 font-bold text-center">লেনদেন ধরন</th>
                        <th className="border border-slate-300 px-4 py-2 font-bold text-right">পরিমাণ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="border border-slate-200 text-center py-6 text-slate-400 font-medium bg-slate-50/50">
                            কোনো লেনদেনের তথ্য পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        transactions.map((tx: any, idx: number) => (
                          <tr key={tx.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                            <td className="border border-slate-200 px-4 py-1.5 text-slate-600 font-semibold whitespace-nowrap">
                              {new Date(tx.transactionDate || tx.date).toLocaleDateString("bn-BD")}
                            </td>
                            <td className="border border-slate-200 px-4 py-1.5 font-bold text-slate-800">{tx.voucherRef || "-"}</td>
                            <td className="border border-slate-200 px-4 py-1.5 text-slate-500 truncate max-w-[200px]" title={tx.remarks || ""}>
                              {tx.remarks || tx.depositMonth || "-"}
                            </td>
                            <td className="border border-slate-200 px-4 py-1.5 text-center">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700">
                                {tx.type === "DEPOSIT" ? "জমা" : "উত্তোলন"}
                              </span>
                            </td>
                            <td className={`border border-slate-200 px-4 py-1.5 text-right font-bold text-xs ${tx.type === "DEPOSIT" ? "text-green-600" : "text-red-500"
                              }`}>
                              {tx.type === "DEPOSIT" ? "+" : "-"} ৳ {tx.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 5. Statement Footer (টাকার সামারি ও স্বাক্ষর) */}
                <div className="pt-2.5 border-t border-slate-200 space-y-3">
                  {/* Summary Block */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-2 text-[10px] text-slate-600 print:bg-white print:border">
                    <div className="border-r border-slate-300 last:border-none pr-2">
                      <span className="text-[9px] text-slate-400 block font-medium">মোট লেনদেন সংখ্যা</span>
                      <span className="text-xs font-bold text-slate-700 block mt-0.5">{transactions.length} টি</span>
                    </div>
                    <div className="border-r border-slate-300 last:border-none pr-2">
                      <span className="text-[9px] text-slate-400 block font-medium">মোট জমা</span>
                      <span className="text-xs font-bold text-green-600 block mt-0.5">৳ {totalDeposits.toLocaleString()}</span>
                    </div>
                    <div className="border-r border-slate-300 last:border-none pr-2">
                      <span className="text-[9px] text-slate-400 block font-medium">মোট উত্তোলন</span>
                      <span className="text-xs font-bold text-red-500 block mt-0.5">৳ {totalWithdrawals.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-medium">সর্বশেষ স্থিতি (ক্লোজিং ব্যালেন্স)</span>
                      <span className="text-xs font-black text-blue-600 block mt-0.5">৳ {netBalance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="hidden print:flex justify-between pt-10 text-center text-xs font-semibold text-slate-500">
                    <div className="border-t border-slate-300 w-32 pt-1">
                      প্রস্তুতকারীর স্বাক্ষর
                    </div>
                    <div className="border-t border-slate-300 w-32 pt-1">
                      যাচাইকারীর স্বাক্ষর
                    </div>
                  </div>

                  {/* Disclaimer Notice */}
                  <p className="text-center text-[10px] text-slate-400 font-medium pt-1">
                    * এটি একটি কম্পিউটার জেনারেটেড হিসাব বিবরণী বিধায় কোনো স্বাক্ষর বা সিলের প্রয়োজন নেই। কোনো গরমিল পরিলক্ষিত হলে অবিলম্বের যোগাযোগ করুন।
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 text-center text-slate-400 rounded-xl border border-slate-100">
                হিসাব সিলেক্ট করে বিবরণী লোড করুন।
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6 print:hidden">
            {/* Switch Profiles Tab (If multiple profiles matching this phone exist) */}
            {profiles.length > 1 && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-600">Switch profile account:</span>
                <div className="flex gap-2">
                  {profiles.map((prof: any, i: number) => (
                    <button
                      key={prof.id}
                      onClick={() => setSelectedProfileIndex(i)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${selectedProfileIndex === i ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                      {prof.name} ({prof.memberId})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Detail Layout */}
            {activeProfile && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Photo Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-100 flex items-center justify-center">
                    {activeProfile.photo ? (
                      <img
                        src={`${process.env.API_HOST}${activeProfile.photo}`}
                        alt={activeProfile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={64} className="text-slate-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mt-4">{activeProfile.name}</h3>
                  <p className="text-sm text-blue-600 font-medium mt-1">{activeProfile.position}</p>

                  <div className="mt-4 px-3 py-1 text-xs font-bold rounded-full bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide">
                    {activeProfile.status}
                  </div>
                </div>

                {/* Details Card */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 border-b pb-4 mb-4">ব্যক্তিগত তথ্য</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <span className="text-slate-400 font-medium block">সদস্য আইডি</span>
                      <span className="text-slate-800 font-bold mt-0.5 block">{activeProfile.memberId}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">মোবাইল নম্বর</span>
                      <span className="text-slate-800 font-bold mt-0.5 block">{activeProfile.phone}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">ইমেইল</span>
                      <span className="text-slate-800 font-bold mt-0.5 block">{activeProfile.email || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">জাতীয় পরিচয়পত্র (NID)</span>
                      <span className="text-slate-800 font-bold mt-0.5 block">{activeProfile.nid || "-"}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">সদস্য ধরন</span>
                      <span className="text-slate-800 font-bold mt-0.5 block">{activeProfile.type}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">যোগদানের তারিখ</span>
                      <span className="text-slate-800 font-bold mt-0.5 block">
                        {new Date(activeProfile.joinDate).toLocaleDateString("bn-BD")}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-slate-400 font-medium block">ঠিকানা</span>
                      <span className="text-slate-800 font-semibold mt-0.5 block">{activeProfile.address || "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
