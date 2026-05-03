import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FileText, Printer, Search, ChevronDown, ArrowDownCircle, ArrowUpCircle, Landmark, Download } from "lucide-react";
import { toast } from 'react-toastify';
// @ts-ignore
import html2pdf from 'html2pdf.js';

// ——— তারিখ ফরম্যাট ———
const fmtDate = (d: string | null) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("bn-BD", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const fmtMonth = (m: string | null) => {
  if (!m) return "-";
  const [y, mo] = m.split("-");
  return new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleDateString("bn-BD", {
    year: "numeric", month: "long",
  });
};

const fmt = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Reports() {
  const { token } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  // ——— সদস্য তালিকা ———
  const [members, setMembers] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // ——— তারিখ ফিল্টার ———
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ——— স্টেটমেন্ট ডেটা ———
  const [statement, setStatement] = useState<any>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // ——— কোম্পানি প্রোফাইল ———
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  // সদস্য তালিকা ও কোম্পানি প্রোফাইল লোড
  useEffect(() => {
    axios.get("http://localhost:5000/api/members", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setMembers(res.data))
      .finally(() => setLoadingMembers(false));

    axios.get("http://localhost:5000/api/company-profile", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setCompanyProfile(res.data)).catch(() => { });
  }, []);

  // স্টেটমেন্ট ফেচ
  const fetchStatement = async () => {
    if (!selectedMember) return;
    setLoadingStatement(true);
    setStatement(null);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      const res = await axios.get(
        `http://localhost:5000/api/savings/statement/${selectedMember.id}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatement(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "স্টেটমেন্ট লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoadingStatement(false);
    }
  };

  // ——— HTML জেনারেটর ———
  const getStatementHTML = () => {
    if (!statement) return "";

    const member = statement.member;
    const accounts = statement.accounts ?? [];

    const buildRows = (acc: any) => {
      if (acc.transactions.length === 0)
        return `<tr><td colspan="7" style="text-align:center;padding:14px;color:#94a3b8;">এই সময়কালে কোনো লেনদেন নেই</td></tr>`;
      return acc.transactions
        .map((tx: any, i: number) => `
          <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
            <td style="padding:6px 9px;border:1px solid #e2e8f0;">${fmtDate(tx.transactionDate)}</td>
            <td style="padding:6px 9px;border:1px solid #e2e8f0;">${fmtMonth(tx.depositMonth)}</td>
            <td style="padding:6px 9px;border:1px solid #e2e8f0;">${tx.voucherNo ?? '-'}</td>
            <td style="padding:6px 9px;border:1px solid #e2e8f0;">${tx.remarks ?? '-'}</td>
            <td style="text-align:right;color:#16a34a;font-weight:600;padding:6px 9px;border:1px solid #e2e8f0;">${(tx.type === 'DEPOSIT' || tx.type === 'INTEREST') ? '৳ ' + fmt(tx.amount) : ''}</td>
            <td style="text-align:right;color:#dc2626;font-weight:600;padding:6px 9px;border:1px solid #e2e8f0;">${tx.type === 'WITHDRAWAL' ? '৳ ' + fmt(tx.amount) : ''}</td>
            <td style="text-align:right;color:#2563eb;font-weight:700;padding:6px 9px;border:1px solid #e2e8f0;">৳ ${fmt(tx.runningBalance)}</td>
          </tr>`).join('');
    };

    const accountSections = accounts.map((acc: any) => `
      <div style="margin-bottom:28px;">
        <div style="background:#1e3a5f;color:#fff;padding:10px 14px;display:flex;justify-content:space-between;">
          <div><strong>${acc.accountNo}</strong> &nbsp;<span style="font-size:12px;color:#93c5fd;">${acc.type === 'GENERAL' ? 'সাধারণ সঞ্চয়' : acc.type}</span></div>
          <div style="text-align:right"><span style="font-size:11px;color:#93c5fd;">বর্তমান ব্যালেন্স</span><br/><strong style="color:#4ade80;">৳ ${fmt(acc.balance)}</strong></div>
        </div>
        <div style="display:flex;border:1px solid #e2e8f0;border-top:none;">
          <div style="flex:1;padding:8px 12px;text-align:center;border-right:1px solid #e2e8f0;">
            <div style="font-size:11px;color:#64748b;">মোট জমা</div>
            <div style="font-size:15px;font-weight:700;color:#16a34a;">৳ ${fmt(acc.summary.totalDeposit)}</div>
          </div>
          <div style="flex:1;padding:8px 12px;text-align:center;border-right:1px solid #e2e8f0;">
            <div style="font-size:11px;color:#64748b;">মোট উত্তোলন</div>
            <div style="font-size:15px;font-weight:700;color:#dc2626;">৳ ${fmt(acc.summary.totalWithdrawal)}</div>
          </div>
          <div style="flex:1;padding:8px 12px;text-align:center;">
            <div style="font-size:11px;color:#64748b;">নীট জমা</div>
            <div style="font-size:15px;font-weight:700;color:#2563eb;">৳ ${fmt(acc.summary.totalDeposit - acc.summary.totalWithdrawal)}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:10px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:7px 9px;border:1px solid #e2e8f0;text-align:left;">তারিখ</th>
              <th style="padding:7px 9px;border:1px solid #e2e8f0;text-align:left;">ডিপোজিট মাস</th>
              <th style="padding:7px 9px;border:1px solid #e2e8f0;text-align:left;">ভাউচার</th>
              <th style="padding:7px 9px;border:1px solid #e2e8f0;text-align:left;">বিবরণ</th>
              <th style="padding:7px 9px;border:1px solid #e2e8f0;text-align:right;color:#16a34a;">জমা (ক্রেডিট)</th>
              <th style="padding:7px 9px;border:1px solid #e2e8f0;text-align:right;color:#dc2626;">উত্তোলন (ডেবিট)</th>
              <th style="padding:7px 9px;border:1px solid #e2e8f0;text-align:right;color:#2563eb;">ব্যালেন্স</th>
            </tr>
          </thead>
          <tbody>${buildRows(acc)}</tbody>
          ${acc.transactions.length > 0 ? `<tfoot><tr style="background:#e2e8f0;font-weight:700;border-top:2px solid #334155;">
            <td colspan="4" style="text-align:right;padding:6px 9px;border:1px solid #e2e8f0;">সর্বমোট:</td>
            <td style="text-align:right;color:#16a34a;padding:6px 9px;border:1px solid #e2e8f0;">৳ ${fmt(acc.summary.totalDeposit)}</td>
            <td style="text-align:right;color:#dc2626;padding:6px 9px;border:1px solid #e2e8f0;">৳ ${fmt(acc.summary.totalWithdrawal)}</td>
            <td style="text-align:right;color:#2563eb;padding:6px 9px;border:1px solid #e2e8f0;">৳ ${fmt(acc.balance)}</td>
          </tr></tfoot>` : ''}
        </table>
      </div>`).join('');

    return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/>
      <title>ব্যাংক স্টেটমেন্ট — ${member?.name}</title>
      <style>
        *{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;color:#1e293b;margin:28px 32px}
        h1{text-align:center;font-size:20px;color:#1e3a5f;margin:0}h2{text-align:center;font-size:14px;color:#334155;margin:4px 0 0}
        .hdr{text-align:center;border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:18px}
        .mbox{background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between}
        table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f1f5f9;padding:7px 9px;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap}td{padding:6px 9px;border:1px solid #e2e8f0}
        @media print{body{margin:12px}@page{margin:12mm}}
      </style></head><body>
      <div class="hdr"><h1>${companyProfile?.name || 'সমবায় সমিতি'}</h1><h2>সঞ্চয় ব্যাংক স্টেটমেন্ট</h2>
        ${companyProfile?.address ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${companyProfile.address}</div>` : ''}
        ${companyProfile?.registrationNo ? `<div style="font-size:11px;color:#64748b;">নিবন্ধন নং: ${companyProfile.registrationNo}</div>` : ''}
        <div style="font-size:11px;color:#64748b;margin-top:3px;">মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}</div></div>
      <div class="mbox">
        <div style="flex:1">
          <div style="font-size:16px;font-weight:700;color:#1e3a5f;">${member?.name}</div>
          <div style="color:#64748b;font-size:12px;">সদস্য আইডি: ${member?.memberId}</div>
          ${member?.phone ? `<div style="color:#64748b;font-size:12px;">ফোন: ${member.phone}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;color:#64748b;">মোট হিসাব</div>
          <div style="font-size:18px;font-weight:700;color:#1e3a5f;">${accounts.length} টি</div>
        </div>
      </div>
      ${accountSections}
    </body></html>`;
  };

  // প্রিন্ট
  const handlePrint = () => {
    const html = getStatementHTML();
    if (!html) return;

    const win = window.open('', '_blank', 'width=960,height=750');
    if (!win) {
      toast.error('পপআপ ব্লক হয়েছে। ব্রাউজার পপআপ অনুমতি দিন।');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  // পিডিএফ ডাউনলোড
  const handleDownloadPDF = () => {
    const html = getStatementHTML();
    if (!html) return;

    const memberName = statement.member?.name || 'Statement';
    const opt = {
      margin: 10,
      filename: `Statement_${memberName}_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    toast.info("পিডিএফ তৈরি হচ্ছে...");
    html2pdf().from(html).set(opt).save()
      .then(() => toast.success("ডাউনলোড সম্পন্ন হয়েছে"))
      .catch((err: any) => {
        console.error("PDF Error:", err);
        toast.error("পিডিএফ তৈরি করতে সমস্যা হয়েছে");
      });
  };

  // ফিল্টার করা সদস্য তালিকা
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.memberId.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">সঞ্চয় স্টেটমেন্ট</h2>
          <p className="text-sm text-slate-500 mt-0.5">সদস্যের জমা ও উত্তোলনের ব্যাংক স্টেটমেন্ট</p>
        </div>
        <div className="flex gap-3">
          {statement && (
            <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition whitespace-nowrap"
              >
                <Printer size={16} />
                প্রিন্ট
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition whitespace-nowrap"
              >
                <Download size={16} />
                ডাউনলোড
              </button>
            </>
          )}
        </div>
      </div>

      {/* ফিল্টার প্যানেল */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* সদস্য নির্বাচন */}
          <div className="md:col-span-2 relative">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">সদস্য নির্বাচন করুন</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={selectedMember ? `${selectedMember.name} (${selectedMember.memberId})` : memberSearch}
                onChange={e => {
                  setMemberSearch(e.target.value);
                  setSelectedMember(null);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="নাম বা আইডি লিখুন..."
                className="w-full pl-9 pr-8 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
            {showDropdown && !selectedMember && filteredMembers.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                {loadingMembers ? (
                  <div className="px-4 py-3 text-sm text-slate-500">লোড হচ্ছে...</div>
                ) : filteredMembers.map(m => (
                  <button
                    key={m.id}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-slate-50 last:border-0"
                    onClick={() => {
                      setSelectedMember(m);
                      setMemberSearch("");
                      setShowDropdown(false);
                      setStatement(null);
                    }}
                  >
                    <span className="font-medium text-slate-800">{m.name}</span>
                    <span className="text-slate-400 ml-2 text-xs">{m.memberId}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* তারিখ ফ্রম */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">শুরুর তারিখ</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* তারিখ টু */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">শেষ তারিখ</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={fetchStatement}
            disabled={!selectedMember || loadingStatement}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition text-sm"
          >
            <FileText size={16} />
            {loadingStatement ? "লোড হচ্ছে..." : "স্টেটমেন্ট দেখুন"}
          </button>
          {(selectedMember || fromDate || toDate) && (
            <button
              onClick={() => { setSelectedMember(null); setMemberSearch(""); setFromDate(""); setToDate(""); setStatement(null); }}
              className="px-4 py-2.5 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm transition"
            >
              রিসেট
            </button>
          )}
        </div>
      </div>

      {/* ——— স্টেটমেন্ট ——— */}
      {loadingStatement && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          স্টেটমেন্ট প্রস্তুত হচ্ছে...
        </div>
      )}

      {!loadingStatement && statement && (
        <div ref={printRef}>
          {/* ——— প্রিন্ট হেডার (স্ক্রিনে লুকানো) ——— */}
          <div className="org-header hidden print:block text-center border-b-2 border-blue-900 pb-3 mb-4">
            <div className="org-name text-xl font-bold text-blue-900">{companyProfile?.name || "সমবায় সমিতি"}</div>
            <div className="report-title">সঞ্চয় ব্যাংক স্টেটমেন্ট</div>
          </div>

          {/* সদস্য তথ্য কার্ড */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-6 text-white mb-4 shadow">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Landmark size={28} />
                  <div>
                    <h3 className="text-xl font-bold">{statement.member.name}</h3>
                    <p className="text-blue-200 text-sm">{statement.member.memberId}</p>
                  </div>
                </div>
                {statement.member.phone && (
                  <p className="text-blue-100 text-sm mt-1">📞 {statement.member.phone}</p>
                )}
                {statement.member.address && (
                  <p className="text-blue-100 text-sm">📍 {statement.member.address}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-sm">মোট হিসাব</p>
                <p className="text-2xl font-bold">{statement.accounts.length} টি</p>
                {(fromDate || toDate) && (
                  <p className="text-blue-200 text-xs mt-1">
                    {fromDate ? fmtDate(fromDate) : "শুরু"} — {toDate ? fmtDate(toDate) : "এখন"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* প্রতিটি হিসাবের স্টেটমেন্ট */}
          {statement.accounts.map((acc: any) => (
            <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
              {/* হিসাব হেডার */}
              <div className="bg-slate-800 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-lg">{acc.accountNo}</p>
                  <p className="text-slate-300 text-sm">{acc.type === "GENERAL" ? "সাধারণ সঞ্চয়" : acc.type === "DPS" ? "ডিপিএস" : "এফডিআর"}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-300 text-xs">বর্তমান ব্যালেন্স</p>
                  <p className="text-xl font-bold text-green-400">৳ {fmt(acc.balance)}</p>
                </div>
              </div>

              {/* সারসংক্ষেপ */}
              <div className="grid grid-cols-3 border-b border-slate-100">
                <div className="p-4 text-center border-r border-slate-100">
                  <div className="flex items-center justify-center gap-1.5 text-green-600 mb-1">
                    <ArrowDownCircle size={16} />
                    <span className="text-xs font-medium">মোট জমা</span>
                  </div>
                  <p className="text-lg font-bold text-green-700">৳ {fmt(acc.summary.totalDeposit)}</p>
                </div>
                <div className="p-4 text-center border-r border-slate-100">
                  <div className="flex items-center justify-center gap-1.5 text-red-500 mb-1">
                    <ArrowUpCircle size={16} />
                    <span className="text-xs font-medium">মোট উত্তোলন</span>
                  </div>
                  <p className="text-lg font-bold text-red-600">৳ {fmt(acc.summary.totalWithdrawal)}</p>
                </div>
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-blue-500 mb-1">
                    <span className="text-xs font-medium">নীট জমা</span>
                  </div>
                  <p className="text-lg font-bold text-blue-700">
                    ৳ {fmt(acc.summary.totalDeposit - acc.summary.totalWithdrawal)}
                  </p>
                </div>
              </div>

              {/* ট্রানজেকশন টেবিল */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">তারিখ</th>
                      <th className="px-4 py-3 font-semibold">ডিপোজিট মাস</th>
                      <th className="px-4 py-3 font-semibold">ভাউচার</th>
                      <th className="px-4 py-3 font-semibold">বিবরণ</th>
                      <th className="px-4 py-3 font-semibold text-right text-green-700">জমা (ক্রেডিট)</th>
                      <th className="px-4 py-3 font-semibold text-right text-red-600">উত্তোলন (ডেবিট)</th>
                      <th className="px-4 py-3 font-semibold text-right text-blue-700">ব্যালেন্স</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {acc.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                          এই সময়কালে কোনো লেনদেন নেই
                        </td>
                      </tr>
                    ) : (
                      acc.transactions.map((tx: any, idx: number) => (
                        <tr key={tx.id} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {fmtDate(tx.transactionDate)}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {fmtMonth(tx.depositMonth)}
                          </td>
                          <td className="px-4 py-3">
                            {tx.voucherNo ? (
                              <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 font-mono">
                                {tx.voucherNo}
                              </span>
                            ) : "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate" title={tx.remarks || ""}>
                            {tx.remarks || "-"}
                          </td>
                          {/* ক্রেডিট */}
                          <td className="px-4 py-3 text-right font-medium text-green-700">
                            {(tx.type === "DEPOSIT" || tx.type === "INTEREST") ? `৳ ${fmt(tx.amount)}` : ""}
                          </td>
                          {/* ডেবিট */}
                          <td className="px-4 py-3 text-right font-medium text-red-600">
                            {tx.type === "WITHDRAWAL" ? `৳ ${fmt(tx.amount)}` : ""}
                          </td>
                          {/* রানিং ব্যালেন্স */}
                          <td className="px-4 py-3 text-right font-bold text-blue-700 whitespace-nowrap">
                            ৳ {fmt(tx.runningBalance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {acc.transactions.length > 0 && (
                    <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 font-bold text-slate-700 text-right">সর্বমোট:</td>
                        <td className="px-4 py-3 text-right font-bold text-green-700">
                          ৳ {fmt(acc.summary.totalDeposit)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">
                          ৳ {fmt(acc.summary.totalWithdrawal)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700">
                          ৳ {fmt(acc.balance)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingStatement && !statement && !selectedMember && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <FileText size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">একজন সদস্য নির্বাচন করুন</p>
          <p className="text-sm mt-1">সদস্য নির্বাচন করে স্টেটমেন্ট দেখুন বাটনে ক্লিক করুন</p>
        </div>
      )}
    </div>
  );
}
