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

  // —– তারিখ ফিল্টার ———
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // ——— স্টেটমেন্ট ডেটা ———
  const [statement, setStatement] = useState<any>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // ——— সমিতি আয়-ব্যয় বিবরণী ———
  const [activeReportTab, setActiveReportTab] = useState<"member" | "association">("member");
  const [associationData, setAssociationData] = useState<any>(null);
  const [loadingAssociation, setLoadingAssociation] = useState(false);

  // ——— কোম্পানি প্রোফাইল ———
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  // সদস্য তালিকা ও কোম্পানি প্রোফাইল লোড
  useEffect(() => {
    axios.get(`${process.env.API_HOST}/api/members`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setMembers(res.data))
      .finally(() => setLoadingMembers(false));

    axios.get(`${process.env.API_HOST}/api/company-profile`, {
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
        `${process.env.API_HOST}/api/savings/statement/${selectedMember.id}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatement(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "স্টেটমেন্ট লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoadingStatement(false);
    }
  };

  // সমিতি বিবরণী ফেচ
  const fetchAssociationReport = async () => {
    setLoadingAssociation(true);
    setAssociationData(null);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      const res = await axios.get(
        `${process.env.API_HOST}/api/savings/reports/association-income-expense?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssociationData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "বিবরণী লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoadingAssociation(false);
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
        h1{font-size:20px;color:#1e3a5f;margin:0}h2{font-size:14px;color:#334155;margin:4px 0 0}
        .hdr{display:flex;align-items:center;justify-content:center;gap:16px;border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:18px}
        .hdr-logo{height:55px;width:55px;object-fit:contain}
        .hdr-text{text-align:center}
        .mbox{background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between}
        table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f1f5f9;padding:7px 9px;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap}td{padding:6px 9px;border:1px solid #e2e8f0}
        @media print{body{margin:12px}@page{margin:12mm}}
      </style></head><body>
      <table style="width:100%; border-collapse:collapse; border-bottom:2px solid #1e3a5f; margin-bottom:18px; padding-bottom:12px;">
        <tr>
          ${companyProfile?.logo ? `
          <td style="width:70px; vertical-align:middle; border:none; padding:0;">
            <img src="${process.env.API_HOST}${companyProfile.logo}" style="height:60px; width:60px; object-fit:contain; display:block;" alt="Logo"/>
          </td>` : ''}
          <td style="vertical-align:middle; text-align:center; border:none; padding:0;">
            <div style="${companyProfile?.logo ? 'margin-right:70px;' : ''}">
              <h1 style="font-size:20px; color:#1e3a5f; margin:0;">${companyProfile?.name || 'সমবায় সমিতি'}</h1>
              <h2 style="font-size:14px; color:#334155; margin:4px 0 0;">সঞ্চয় ব্যাংক স্টেটমেন্ট</h2>
              ${companyProfile?.address ? `<div style="font-size:11px; color:#64748b; margin-top:2px;">${companyProfile.address}</div>` : ''}
              ${companyProfile?.registrationNo ? `<div style="font-size:11px; color:#64748b;">নিবন্ধন নং: ${companyProfile.registrationNo}</div>` : ''}
              <div style="font-size:11px; color:#64748b; margin-top:3px; text-align:right;">মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </td>
        </tr>
      </table>
      <div class="mbox">
        <div style="flex:1">
          <div style="font-size:16px;font-weight:700;color:#1e3a5f;">${member?.name}</div>
          <div style="color:#64748b;font-size:12px;">সদস্য আইডি: ${member?.memberId}</div>
          ${member?.phone ? `<div style="color:#64748b;font-size:12px;">ফোন: ${member.phone}</div>` : ''}
        </div>
      </div>
      ${accountSections}
    </body></html>`;
  };

  const getAssociationReportHTML = () => {
    if (!associationData) return "";

    const incomesHtml = associationData.incomes.length === 0
      ? `<tr><td colspan="2" style="text-align:center;padding:12px;color:#94a3b8;">কোনো আয়ের বিবরণ পাওয়া যায়নি</td></tr>`
      : associationData.incomes.map((inc: any) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${inc.category}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;font-weight:600;color:#16a34a;">৳ ${fmt(inc.amount)}</td>
          </tr>
        `).join('');

    const expensesHtml = associationData.expenses.length === 0
      ? `<tr><td colspan="2" style="text-align:center;padding:12px;color:#94a3b8;">কোনো ব্যয়ের বিবরণ পাওয়া যায়নি</td></tr>`
      : associationData.expenses.map((exp: any) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${exp.category}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;font-weight:600;color:#dc2626;">৳ ${fmt(exp.amount)}</td>
          </tr>
        `).join('');

    const netLabel = associationData.netBalance >= 0 ? "নীট উদ্বৃত্ত (Surplus)" : "নীট ঘাটতি (Deficit)";
    const netColor = associationData.netBalance >= 0 ? "#16a34a" : "#dc2626";

    return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/>
      <title>সমিতি আয়-ব্যয় বিবরণী</title>
      <style>
        *{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:13px;color:#1e293b;margin:28px 32px}
        h1{font-size:20px;color:#1e3a5f;margin:0}h2{font-size:14px;color:#334155;margin:4px 0 0}
        .hdr{display:flex;align-items:center;justify-content:center;gap:16px;border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:18px}
        .hdr-logo{height:55px;width:55px;object-fit:contain}
        .hdr-text{text-align:center}
        .grid{display:flex;gap:20px;margin-bottom:20px}
        .col{flex:1}
        .table-title{background:#1e3a5f;color:#fff;padding:8px 12px;font-weight:bold;font-size:14px;border-top-left-radius:6px;border-top-right-radius:6px}
        table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f8fafc;padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;text-align:left}td{padding:8px 12px;border:1px solid #cbd5e1}
        .summary-box{background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:16px;margin-top:28px}
        .summary-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px dashed #e2e8f0}
        .summary-row:last-child{border-bottom:none;padding-top:10px;font-size:15px;font-weight:bold}
        .signatures{display:flex;justify-content:space-between;margin-top:70px;text-align:center;font-size:12px;color:#64748b}
        .sig-line{border-top:1px solid #cbd5e1;width:150px;padding-top:6px}
        @media print{body{margin:12px}@page{margin:12mm}}
      </style></head><body>
      <table style="width:100%; border-collapse:collapse; border-bottom:2px solid #1e3a5f; margin-bottom:18px; padding-bottom:12px;">
        <tr>
          ${companyProfile?.logo ? `
          <td style="width:70px; vertical-align:middle; border:none; padding:0;">
            <img src="${process.env.API_HOST}${companyProfile.logo}" style="height:60px; width:60px; object-fit:contain; display:block;" alt="Logo"/>
          </td>` : ''}
          <td style="vertical-align:middle; text-align:center; border:none; padding:0;">
            <div style="${companyProfile?.logo ? 'margin-right:70px;' : ''}">
              <h1 style="font-size:20px; color:#1e3a5f; margin:0;">${companyProfile?.name || 'সমবায় সমিতি'}</h1>
              ${companyProfile?.address ? `<div style="font-size:11px; color:#64748b; margin-top:2px;">${companyProfile.address}</div>` : ''}
              <h2 style="font-size:14px; color:#334155; margin:4px 0 0;">সমিতি আয়-ব্যয় বিবরণী</h2>
              <div style="font-size:11px; color:#64748b; margin-top:4px;">
                বিবরণী সময়কাল: ${fromDate ? fmtDate(fromDate) : 'শুরু'} থেকে ${toDate ? fmtDate(toDate) : 'আজ পর্যন্ত'}
              </div>
              <div style="font-size:11px; color:#64748b; margin-top:3px; text-align:right">মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </td>
        </tr>
      </table>
      <div class="grid">
        <div class="col">
          <div class="table-title">আয় সমূহ (Incomes)</div>
          <table>
            <thead>
              <tr>
                <th>আয়ের খাত (Category)</th>
                <th style="text-align:right;">টাকার পরিমাণ (Amount)</th>
              </tr>
            </thead>
            <tbody>${incomesHtml}</tbody>
            <tfoot>
              <tr style="background:#f8fafc;font-weight:bold;">
                <td>মোট আয় (Total Income)</td>
                <td style="text-align:right;color:#16a34a;">৳ ${fmt(associationData.totalIncome)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="col">
          <div class="table-title">ব্যয় সমূহ (Expenses)</div>
          <table>
            <thead>
              <tr>
                <th>ব্যয়ের খাত (Category)</th>
                <th style="text-align:right;">টাকার পরিমাণ (Amount)</th>
              </tr>
            </thead>
            <tbody>${expensesHtml}</tbody>
            <tfoot>
              <tr style="background:#f8fafc;font-weight:bold;">
                <td>মোট ব্যয় (Total Expense)</td>
                <td style="text-align:right;color:#dc2626;">৳ ${fmt(associationData.totalExpense)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div class="summary-box">
        <div style="font-weight:bold;font-size:14px;color:#1e3a5f;margin-bottom:10px;">আয়-ব্যয় সারসংক্ষেপ (Summary)</div>
        <div class="summary-row"><span>সর্বমোট আয় (Total Income):</span><span style="color:#16a34a;font-weight:bold;">৳ ${fmt(associationData.totalIncome)}</span></div>
        <div class="summary-row"><span>সর্বমোট ব্যয় (Total Expense):</span><span style="color:#dc2626;font-weight:bold;">৳ ${fmt(associationData.totalExpense)}</span></div>
        <div class="summary-row"><span>${netLabel}:</span><span style="color:${netColor};font-size:16px;">৳ ${fmt(associationData.netBalance)}</span></div>
      </div>
      <div class="signatures">
        <div class="sig-line">প্রস্তুতকারীর স্বাক্ষর</div>
        <div class="sig-line">কোষাধক্ষের স্বাক্ষর</div>
        <div class="sig-line">সহ-সভাপতির স্বাক্ষর</div>
        <div class="sig-line">সভাপতির স্বাক্ষর</div>
      </div>
    </body></html>`;
  };

  // প্রিন্ট
  const handlePrint = () => {
    const html = activeReportTab === "member" ? getStatementHTML() : getAssociationReportHTML();
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
    const html = activeReportTab === "member" ? getStatementHTML() : getAssociationReportHTML();
    if (!html) return;

    const reportName = activeReportTab === "member"
      ? `Statement_${statement.member?.name || 'Statement'}`
      : `Income_Expense_Report`;

    const opt = {
      margin: 10,
      filename: `${reportName}_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
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
          <h2 className="text-2xl font-bold text-slate-800">
            {activeReportTab === "member" ? "সঞ্চয় স্টেটমেন্ট" : "সমিতি আয়-ব্যয় বিবরণী"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeReportTab === "member"
              ? "সদস্যের জমা ও উত্তোলনের ব্যাংক স্টেটমেন্ট"
              : "সমিতির সার্বিক আয় ও ব্যয়ের বিবরণী"}
          </p>
        </div>
        <div className="flex gap-3">
          {((activeReportTab === "member" && statement) ||
            (activeReportTab === "association" && associationData)) && (
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

      {/* রিপোর্ট ক্যাটাগরি ট্যাব */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveReportTab("member");
            setSelectedMember(null);
            setMemberSearch("");
            setStatement(null);
            setAssociationData(null);
          }}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeReportTab === "member"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          সদস্য স্টেটমেন্ট
        </button>
        <button
          onClick={() => {
            setActiveReportTab("association");
            setSelectedMember(null);
            setMemberSearch("");
            setStatement(null);
            setAssociationData(null);
          }}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${activeReportTab === "association"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          সমিতি আয়-ব্যয় বিবরণী
        </button>
      </div>

      {/* ফিল্টার প্যানেল */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className={`grid grid-cols-1 gap-4 items-end ${activeReportTab === "member" ? "md:grid-cols-4" : "md:grid-cols-2"}`}>
          {/* সদস্য নির্বাচন (শুধুমাত্র সদস্য স্টেটমেন্ট ট্যাবে থাকবে) */}
          {activeReportTab === "member" && (
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
          )}

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
            onClick={activeReportTab === "member" ? fetchStatement : fetchAssociationReport}
            disabled={activeReportTab === "member" ? (!selectedMember || loadingStatement) : loadingAssociation}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition text-sm"
          >
            <FileText size={16} />
            {activeReportTab === "member"
              ? (loadingStatement ? "লোড হচ্ছে..." : "স্টেটমেন্ট দেখুন")
              : (loadingAssociation ? "লোড হচ্ছে..." : "বিবরণী দেখুন")}
          </button>
          {(selectedMember || fromDate || toDate || statement || associationData) && (
            <button
              onClick={() => {
                setSelectedMember(null);
                setMemberSearch("");
                setFromDate("");
                setToDate("");
                setStatement(null);
                setAssociationData(null);
              }}
              className="px-4 py-2.5 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm transition"
            >
              রিসেট
            </button>
          )}
        </div>
      </div>

      {/* ——— সদস্য স্টেটমেন্ট রিপোর্ট ——— */}
      {activeReportTab === "member" && loadingStatement && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          স্টেটমেন্ট প্রস্তুত হচ্ছে...
        </div>
      )}

      {activeReportTab === "member" && !loadingStatement && statement && (
        <div ref={printRef}>
          {/* ——— প্রিন্ট হেডার (স্ক্রিনে লুকানো) ——— */}
          <div className="org-header hidden print:block relative text-center border-b-2 border-blue-900 pb-3 mb-4">
            {companyProfile?.logo && (
              <img
                src={`${process.env.API_HOST}${companyProfile.logo}`}
                alt="Logo"
                className="absolute left-0 top-0 h-14 w-14 object-contain"
              />
            )}
            <div className={`inline-block ${companyProfile?.logo ? "pr-14" : ""}`}>
              <div className="org-name text-xl font-bold text-blue-900">{companyProfile?.name || "সমবায় সমিতি"}</div>
              {companyProfile?.address && (
                <div className="text-xs text-slate-500 mt-0.5">{companyProfile.address}</div>
              )}
              <div className="report-title text-sm font-semibold text-slate-600">সঞ্চয় ব্যাংক স্টেটমেন্ট</div>
            </div>
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
                {/* <p className="text-blue-200 text-sm">মোট হিসাব</p>
                <p className="text-2xl font-bold">{statement.accounts.length} টি</p> */}
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

      {/* ——— সমিতি আয়-ব্যয় বিবরণী রিপোর্ট ——— */}
      {activeReportTab === "association" && loadingAssociation && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          বিবরণী প্রস্তুত হচ্ছে...
        </div>
      )}

      {activeReportTab === "association" && !loadingAssociation && associationData && (
        <div ref={printRef} className="space-y-6">
          {/* ——— প্রিন্ট হেডার (স্ক্রিনে লুকানো) ——— */}
          <div className="org-header hidden print:block relative text-center border-b-2 border-blue-900 pb-3 mb-4">
            {companyProfile?.logo && (
              <img
                src={`${process.env.API_HOST}${companyProfile.logo}`}
                alt="Logo"
                className="absolute left-0 top-0 h-14 w-14 object-contain"
              />
            )}
            <div className={`inline-block ${companyProfile?.logo ? "pr-14" : ""}`}>
              <div className="org-name text-xl font-bold text-blue-900">{companyProfile?.name || "সমবায় সমিতি"}</div>
              <div className="report-title text-sm font-semibold text-slate-600">সমিতি আয়-ব্যয় বিবরণী</div>
              {companyProfile?.address && (
                <div className="text-xs text-slate-500 mt-0.5">{companyProfile.address}</div>
              )}
              <div className="text-slate-500 text-xs mt-1">
                সময়কাল: {fromDate ? fmtDate(fromDate) : "শুরু"} থেকে {toDate ? fmtDate(toDate) : "আজ পর্যন্ত"}
              </div>
            </div>
          </div>

          {/* Two Sided Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-green-600 text-white px-6 py-4">
                <h3 className="font-bold text-lg">আয় সমূহ (Incomes)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">আয়ের খাত (Category)</th>
                      <th className="px-6 py-3 font-semibold text-right text-green-700">পরিমাণ (Amount)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {associationData.incomes.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-slate-400">
                          কোনো আয়ের বিবরণ পাওয়া যায়নি
                        </td>
                      </tr>
                    ) : (
                      associationData.incomes.map((inc: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                          <td className="px-6 py-4 text-slate-700 font-medium">{inc.category}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">
                            ৳ {fmt(inc.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {associationData.incomes.length > 0 && (
                    <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                      <tr>
                        <td className="px-6 py-3 font-bold text-slate-700">মোট আয় (Total Income):</td>
                        <td className="px-6 py-3 text-right font-bold text-green-700">
                          ৳ {fmt(associationData.totalIncome)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Expense Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-red-500 text-white px-6 py-4">
                <h3 className="font-bold text-lg">ব্যয় সমূহ (Expenses)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">ব্যয়ের খাত (Category)</th>
                      <th className="px-6 py-3 font-semibold text-right text-red-600">পরিমাণ (Amount)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {associationData.expenses.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-slate-400">
                          কোনো ব্যয়ের বিবরণ পাওয়া যায়নি
                        </td>
                      </tr>
                    ) : (
                      associationData.expenses.map((exp: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                          <td className="px-6 py-4 text-slate-700 font-medium">{exp.category}</td>
                          <td className="px-6 py-4 text-right font-bold text-red-500">
                            ৳ {fmt(exp.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {associationData.expenses.length > 0 && (
                    <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                      <tr>
                        <td className="px-6 py-3 font-bold text-slate-700">মোট ব্যয় (Total Expense):</td>
                        <td className="px-6 py-3 text-right font-bold text-red-700">
                          ৳ {fmt(associationData.totalExpense)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-inner">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-3 mb-4">আয়-ব্যয় সারসংক্ষেপ (Summary)</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                <span className="text-slate-600 font-medium">সর্বমোট আয় (Total Income)</span>
                <span className="text-lg font-bold text-green-600">৳ {fmt(associationData.totalIncome)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                <span className="text-slate-600 font-medium">সর্বমোট ব্যয় (Total Expense)</span>
                <span className="text-lg font-bold text-red-500">৳ {fmt(associationData.totalExpense)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-800 font-bold text-base">
                  {associationData.netBalance >= 0 ? "নিট উদ্বৃত্ত (Net Surplus)" : "নিট ঘাটতি (Net Deficit)"}
                </span>
                <span className={`text-xl font-black ${associationData.netBalance >= 0 ? "text-green-600" : "text-red-500"
                  }`}>
                  ৳ {fmt(associationData.netBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback empty blocks */}
      {activeReportTab === "member" && !loadingStatement && !statement && !selectedMember && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <FileText size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">একজন সদস্য নির্বাচন করুন</p>
          <p className="text-sm mt-1">সদস্য নির্বাচন করে স্টেটমেন্ট দেখুন বাটনে ক্লিক করুন</p>
        </div>
      )}

      {activeReportTab === "association" && !loadingAssociation && !associationData && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <FileText size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">সমিতি আয়-ব্যয় বিবরণী</p>
          <p className="text-sm mt-1">তারিখ সীমা নির্ধারণ করে বিবরণী দেখুন বাটনে ক্লিক করুন</p>
        </div>
      )}
    </div>
  );
}
