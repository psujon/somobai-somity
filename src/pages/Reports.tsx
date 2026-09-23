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
  const [activeReportTab, setActiveReportTab] = useState<"member" | "association" | "monthly_association" | "income_statement" | "expense_statement" | "investment_statement">("member");
  const [associationData, setAssociationData] = useState<any>(null);
  const [loadingAssociation, setLoadingAssociation] = useState(false);

  // ——— মাসিক সমিতি আয়-ব্যয় বিবরণী ———
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // ——— আয়ের বিবরণী ———
  const [incomeData, setIncomeData] = useState<any>(null);
  const [loadingIncome, setLoadingIncome] = useState(false);

  // ——— ব্যয়ের বিবরণী ———
  const [expenseData, setExpenseData] = useState<any>(null);
  const [loadingExpense, setLoadingExpense] = useState(false);

  // ——— বিনিয়োগ বিবরণী ———
  const [investmentData, setInvestmentData] = useState<any>(null);
  const [loadingInvestment, setLoadingInvestment] = useState(false);

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

  // মাসিক সমিতি বিবরণী ফেচ
  const fetchMonthlyAssociationReport = async () => {
    setLoadingMonthly(true);
    setMonthlyData(null);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append("month", selectedMonth);
      const res = await axios.get(
        `${process.env.API_HOST}/api/savings/reports/monthly-association-income-expense?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMonthlyData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "মাসিক বিবরণী লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoadingMonthly(false);
    }
  };

  // আয়ের বিবরণী ফেচ
  const fetchIncomeReport = async () => {
    setLoadingIncome(true);
    setIncomeData(null);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      const res = await axios.get(
        `${process.env.API_HOST}/api/savings/reports/income-statement?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIncomeData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "আয়ের বিবরণী লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoadingIncome(false);
    }
  };

  // ব্যয়ের বিবরণী ফেচ
  const fetchExpenseReport = async () => {
    setLoadingExpense(true);
    setExpenseData(null);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      const res = await axios.get(
        `${process.env.API_HOST}/api/savings/reports/expense-statement?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExpenseData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "ব্যয়ের বিবরণী লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoadingExpense(false);
    }
  };

  // বিনিয়োগ বিবরণী ফেচ
  const fetchInvestmentReport = async () => {
    setLoadingInvestment(true);
    setInvestmentData(null);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      const res = await axios.get(
        `${process.env.API_HOST}/api/savings/reports/investment-statement?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvestmentData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "বিনিয়োগ বিবরণী লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoadingInvestment(false);
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
        *{box-sizing:border-box}
        body{width:800px;font-family:Arial,sans-serif;font-size:13px;color:#1e293b;margin:28px auto;padding:10px}
        h1{font-size:20px;color:#1e3a5f;margin:0}h2{font-size:14px;color:#334155;margin:4px 0 0}
        .hdr{display:flex;align-items:center;justify-content:center;gap:16px;border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:18px}
        .hdr-logo{height:55px;width:55px;object-fit:contain}
        .hdr-text{text-align:center}
        .mbox{background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between}
        table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f1f5f9;padding:7px 9px;border:1px solid #e2e8f0;font-weight:600;white-space:nowrap}td{padding:6px 9px;border:1px solid #e2e8f0}
        @media print{body{width:800px;margin:12px}@page{size:A4 portrait;margin:12mm}}
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

    const expensesHtml = associationData.expenses.length === 0 && (!associationData.investments || associationData.investments.length === 0)
      ? `<tr><td colspan="2" style="text-align:center;padding:12px;color:#94a3b8;">কোনো ব্যয়ের বিবরণ পাওয়া যায়নি</td></tr>`
      : associationData.expenses.map((exp: any) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${exp.category}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;font-weight:600;color:#dc2626;">৳ ${fmt(exp.amount)}</td>
          </tr>
        `).join('') +
      (associationData.investments && associationData.investments.length > 0
        ? `<tr><td colspan="2" style="background:#f1f5f9;font-weight:bold;padding:8px 12px;border:1px solid #cbd5e1;text-align:center;color:#334155;">বিনিয়োগ বাবদ খরচ (Investments)</td></tr>` +
        associationData.investments.map((inv: any) => `
            <tr>
              <td style="padding:8px 12px;border:1px solid #cbd5e1;">${inv.category}</td>
              <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;font-weight:600;color:#dc2626;">৳ ${fmt(inv.amount)}</td>
            </tr>
          `).join('')
        : '');

    const netLabel = associationData.netBalance >= 0 ? "নীট উদ্বৃত্ত (Surplus)" : "নীট ঘাটতি (Deficit)";
    const netColor = associationData.netBalance >= 0 ? "#16a34a" : "#dc2626";

    return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/>
      <title>সমিতি আয়-ব্যয় বিবরণী</title>
      <style>
        *{box-sizing:border-box}
        body{width:800px;font-family:Arial,sans-serif;font-size:13px;color:#1e293b;margin:28px auto;padding:10px}
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
        @media print{body{width:800px;margin:12px}@page{size:A4 portrait;margin:12mm}}
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
      <!-- Table-based Grid layout for side-by-side columns to ensure compatibility with html2pdf/html2canvas -->
      <table style="width:100%; border-collapse:collapse; border:none; margin-bottom:20px; table-layout:fixed;">
        <tr>
          <!-- Income Column -->
          <td style="width:50%; vertical-align:top; border:none; padding:0 10px 0 0;">
            <div class="table-title">আয় সমূহ (Incomes)</div>
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:left;">আয়ের খাত (Category)</th>
                  <th style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:right;">টাকার পরিমাণ (Amount)</th>
                </tr>
              </thead>
              <tbody>${incomesHtml}</tbody>
              <tfoot>
                <tr style="background:#f8fafc;font-weight:bold;">
                  <td style="padding:8px 12px;border:1px solid #cbd5e1;">মোট আয় (Total Income)</td>
                  <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;color:#16a34a;">৳ ${fmt(associationData.totalIncome)}</td>
                </tr>
              </tfoot>
            </table>
          </td>
          <td style="width:50%; vertical-align:top; border:none; padding:0 0 0 10px;">
            <div class="table-title">ব্যয় ও বিনিয়োগ সমূহ (Expenses & Investments)</div>
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:left;">খাত (Category)</th>
                  <th style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:right;">টাকার পরিমাণ (Amount)</th>
                </tr>
              </thead>
              <tbody>${expensesHtml}</tbody>
              <tfoot>
                <tr style="background:#f8fafc;font-weight:bold;">
                  <td style="padding:8px 12px;border:1px solid #cbd5e1;">মোট ব্যয় ও বিনিয়োগ</td>
                  <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;color:#dc2626;">৳ ${fmt(associationData.totalExpense)}</td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>
      </table>

      <!-- Summary Box with Table layout -->
      <div class="summary-box">
        <div style="font-weight:bold;font-size:14px;color:#1e3a5f;margin-bottom:10px;">আয়-ব্যয় সারসংক্ষেপ (Summary)</div>
        <table style="width:100%; border-collapse:collapse; border:none;">
          <tr style="border-bottom:1px dashed #cbd5e1;">
            <td style="padding:6px 0; border:none; text-align:left;">সর্বমোট আয় (Total Income):</td>
            <td style="padding:6px 0; border:none; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(associationData.totalIncome)}</td>
          </tr>
          <tr style="border-bottom:1px dashed #cbd5e1;">
            <td style="padding:6px 0; border:none; text-align:left;">সর্বমোট ব্যয় ও বিনিয়োগ:</td>
            <td style="padding:6px 0; border:none; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(associationData.totalExpense)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0 6px 0; border:none; text-align:left; font-size:15px; font-weight:bold;">${netLabel}:</td>
            <td style="padding:10px 0 6px 0; border:none; text-align:right; color:${netColor}; font-size:16px; font-weight:bold;">৳ ${fmt(associationData.netBalance)}</td>
          </tr>
        </table>
      </div>

      <!-- Signatures with Table layout -->
      <table style="width:100%; border-collapse:collapse; border:none; margin-top:70px; text-align:center; font-size:12px; color:#64748b;">
        <tr>
          <td style="width:25%; border:none; padding:0;"><div class="sig-line">প্রস্তুতকারীর স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div class="sig-line">কোষাধক্ষের স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div class="sig-line">সহ-সভাপতির স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div class="sig-line">সভাপতির স্বাক্ষর</div></td>
        </tr>
      </table>
    </body></html>`;
  };

  const getMonthlyAssociationReportHTML = () => {
    if (!monthlyData) return "";

    const incomesHtml = monthlyData.incomes.length === 0
      ? `<tr><td colspan="2" style="text-align:center;padding:12px;color:#94a3b8;">কোনো আয়ের বিবরণ পাওয়া যায়নি</td></tr>`
      : monthlyData.incomes.map((inc: any) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${inc.category}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;font-weight:600;color:#16a34a;">৳ ${fmt(inc.amount)}</td>
          </tr>
        `).join('');

    const expensesHtml = monthlyData.expenses.length === 0 && (!monthlyData.investments || monthlyData.investments.length === 0)
      ? `<tr><td colspan="2" style="text-align:center;padding:12px;color:#94a3b8;">কোনো ব্যয়ের বিবরণ পাওয়া যায়নি</td></tr>`
      : monthlyData.expenses.map((exp: any) => `
          <tr>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;">${exp.category}</td>
            <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;font-weight:600;color:#dc2626;">৳ ${fmt(exp.amount)}</td>
          </tr>
        `).join('') +
      (monthlyData.investments && monthlyData.investments.length > 0
        ? `<tr><td colspan="2" style="background:#f1f5f9;font-weight:bold;padding:8px 12px;border:1px solid #cbd5e1;text-align:center;color:#334155;">বিনিয়োগ বাবদ খরচ (Investments)</td></tr>` +
        monthlyData.investments.map((inv: any) => `
            <tr>
              <td style="padding:8px 12px;border:1px solid #cbd5e1;">${inv.category}</td>
              <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;font-weight:600;color:#dc2626;">৳ ${fmt(inv.amount)}</td>
            </tr>
          `).join('')
        : '');

    const summary = monthlyData.summary;
    const finalResultLabel = summary.finalBalance >= 0 ? "সর্বমোট নীট উদ্বৃত্ত (Cumulative Net Surplus)" : "সর্বমোট নীট ঘাটতি (Cumulative Net Deficit)";

    return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/>
      <title>মাসিক আয়-ব্যয় বিবরণী — ${fmtMonth(monthlyData.month)}</title>
      <style>
        *{box-sizing:border-box}
        body{width:800px;font-family:Arial,sans-serif;font-size:13px;color:#1e293b;margin:28px auto;padding:10px}
        h1{font-size:20px;color:#1e3a5f;margin:0}h2{font-size:14px;color:#334155;margin:4px 0 0}
        .hdr{display:flex;align-items:center;justify-content:center;gap:16px;border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:18px}
        .table-title{background:#1e3a5f;color:#fff;padding:8px 12px;font-weight:bold;font-size:14px;border-top-left-radius:6px;border-top-right-radius:6px}
        table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f8fafc;padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;text-align:left}td{padding:8px 12px;border:1px solid #cbd5e1}
        .summary-box{background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:16px;margin-top:24px}
        @media print{body{width:800px;margin:12px}@page{size:A4 portrait;margin:12mm}}
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
              <h2 style="font-size:14px; color:#334155; margin:4px 0 0;">মাসিক আয়-ব্যয় বিবরণী</h2>
              <div style="font-size:12px; font-weight:bold; color:#1e3a5f; margin-top:4px;">
                রিপোর্ট মাস: ${fmtMonth(monthlyData.month)} (${fmtDate(monthlyData.startDate)} থেকে ${fmtDate(monthlyData.endDate)})
              </div>
              <div style="font-size:11px; color:#64748b; margin-top:3px; text-align:right">মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Table-based Grid layout for side-by-side columns -->
      <table style="width:100%; border-collapse:collapse; border:none; margin-bottom:20px; table-layout:fixed;">
        <tr>
          <!-- Income Column -->
          <td style="width:50%; vertical-align:top; border:none; padding:0 10px 0 0;">
            <div class="table-title">আয় সমূহ (Monthly Incomes)</div>
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:left;">আয়ের খাত (Category)</th>
                  <th style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:right;">টাকার পরিমাণ (Amount)</th>
                </tr>
              </thead>
              <tbody>${incomesHtml}</tbody>
              <tfoot>
                <tr style="background:#f8fafc;font-weight:bold;">
                  <td style="padding:8px 12px;border:1px solid #cbd5e1;">মোট রানিং আয় (Total Month Income)</td>
                  <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;color:#16a34a;">৳ ${fmt(summary.currentMonthIncome)}</td>
                </tr>
              </tfoot>
            </table>
          </td>
          <!-- Expense Column -->
          <td style="width:50%; vertical-align:top; border:none; padding:0 0 0 10px;">
            <div class="table-title">ব্যয় ও বিনিয়োগ (Expenses & Investments)</div>
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:left;">খাত (Category)</th>
                  <th style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:right;">টাকার পরিমাণ (Amount)</th>
                </tr>
              </thead>
              <tbody>${expensesHtml}</tbody>
              <tfoot>
                <tr style="background:#f8fafc;font-weight:bold;">
                  <td style="padding:8px 12px;border:1px solid #cbd5e1;">মোট রানিং ব্যয় ও বিনিয়োগ</td>
                  <td style="padding:8px 12px;border:1px solid #cbd5e1;text-align:right;color:#dc2626;">৳ ${fmt(summary.currentMonthExpense)}</td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>
      </table>

      <!-- ৩টি সারসংক্ষেপ মেট্রিক কার্ড (Metric Cards) -->
      <table style="width:100%; border-collapse:separate; border-spacing:10px 0; margin-bottom:20px; table-layout:fixed;">
        <tr>
          <!-- Card 1: বিগত মাসগুলোর হিসাব -->
          <td style="width:33.33%; vertical-align:top; border:1px solid #bfdbfe; background:#eff6ff; border-radius:6px; padding:10px 12px;">
            <div style="font-weight:bold; font-size:12px; color:#1e3a5f; border-bottom:1px solid #bfdbfe; padding-bottom:4px; margin-bottom:6px;">
              <span style="color:#2563eb; font-size:12px; margin-right:3px;">●</span> বিগত মাসগুলোর হিসাব
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:11px;">
              <tr>
                <td style="padding:3px 0; border:none; color:#475569;">বিগত মোট আয়:</td>
                <td style="padding:3px 0; border:none; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.previousTotalIncome)}</td>
              </tr>
              <tr>
                <td style="padding:3px 0; border:none; color:#475569;">বিগত মোট ব্যয়:</td>
                <td style="padding:3px 0; border:none; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.previousTotalExpense)}</td>
              </tr>
              <tr style="border-top:1px solid #bfdbfe;">
                <td style="padding:4px 0 0 0; border:none; font-weight:bold; color:#1e3a5f;">বিগত নীট স্থিতি:</td>
                <td style="padding:4px 0 0 0; border:none; text-align:right; color:${summary.previousNetBalance >= 0 ? '#2563eb' : '#dc2626'}; font-weight:bold;">৳ ${fmt(summary.previousNetBalance)}</td>
              </tr>
            </table>
          </td>

          <!-- Card 2: রিপোর্ট মাসের হিসাব -->
          <td style="width:33.33%; vertical-align:top; border:1px solid #bbf7d0; background:#f0fdf4; border-radius:6px; padding:10px 12px;">
            <div style="font-weight:bold; font-size:12px; color:#166534; border-bottom:1px solid #bbf7d0; padding-bottom:4px; margin-bottom:6px;">
              <span style="color:#16a34a; font-size:12px; margin-right:3px;">●</span> রিপোর্ট মাসের হিসাব (${fmtMonth(monthlyData.month)})
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:11px;">
              <tr>
                <td style="padding:3px 0; border:none; color:#475569;">রানিং আয়:</td>
                <td style="padding:3px 0; border:none; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.currentMonthIncome)}</td>
              </tr>
              <tr>
                <td style="padding:3px 0; border:none; color:#475569;">রানিং ব্যয়:</td>
                <td style="padding:3px 0; border:none; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.currentMonthExpense)}</td>
              </tr>
              <tr style="border-top:1px solid #bbf7d0;">
                <td style="padding:4px 0 0 0; border:none; font-weight:bold; color:#166534;">রানিং নীট ফলাফল:</td>
                <td style="padding:4px 0 0 0; border:none; text-align:right; color:${summary.currentMonthNetBalance >= 0 ? '#16a34a' : '#dc2626'}; font-weight:bold;">৳ ${fmt(summary.currentMonthNetBalance)}</td>
              </tr>
            </table>
          </td>

          <!-- Card 3: সর্বমোট ফলাফল -->
          <td style="width:33.33%; vertical-align:top; border:1px solid #cbd5e1; background:#f8fafc; border-radius:6px; padding:10px 12px; color:#1e293b;">
            <div style="font-weight:bold; font-size:12px; color:#1e293b; border-bottom:1px solid #cbd5e1; padding-bottom:4px; margin-bottom:6px;">
              <span style="color:#475569; font-size:12px; margin-right:3px;">●</span> সর্বমোট ফলাফল (Cumulative)
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:11px;">
              <tr>
                <td style="padding:3px 0; border:none; color:#475569;">সর্বমোট আয়:</td>
                <td style="padding:3px 0; border:none; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.totalIncome)}</td>
              </tr>
              <tr>
                <td style="padding:3px 0; border:none; color:#475569;">সর্বমোট ব্যয়:</td>
                <td style="padding:3px 0; border:none; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.totalExpense)}</td>
              </tr>
              <tr style="border-top:1px solid #cbd5e1;">
                <td style="padding:4px 0 0 0; border:none; font-weight:bold; color:#1e293b;">ফলাফল (স্থিতি):</td>
                <td style="padding:4px 0 0 0; border:none; text-align:right; color:${summary.finalBalance >= 0 ? '#16a34a' : '#dc2626'}; font-weight:bold; font-size:11px;">৳ ${fmt(summary.finalBalance)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Summary Box with 5 Requested Metrics -->
      <div class="summary-box">
        <div style="font-weight:bold;font-size:14px;color:#1e3a5f;margin-bottom:12px;border-bottom:1px solid #cbd5e1;padding-bottom:6px;">
          আয়-ব্যয় সারসংক্ষেপ ও ফলাফল (Monthly Financial Summary & Final Result)
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <tr style="background:#eff6ff;">
            <td style="padding:7px 10px; border:1px solid #cbd5e1; font-weight:600; color:#1e3a5f;">১. বিগত মাসগুলোর সর্বমোট আয় (Previous Months' Total Income):</td>
            <td style="padding:7px 10px; border:1px solid #cbd5e1; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.previousTotalIncome)}</td>
          </tr>
          <tr style="background:#fff;">
            <td style="padding:7px 10px; border:1px solid #cbd5e1; font-weight:600; color:#1e3a5f;">২. বিগত মাসগুলোর সর্বমোট ব্যয় ও বিনিয়োগ (Previous Months' Total Expense & Investment):</td>
            <td style="padding:7px 10px; border:1px solid #cbd5e1; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.previousTotalExpense)}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:6px 10px; border:1px solid #cbd5e1; color:#64748b; padding-left:24px;">└ বিগত মাসগুলোর নীট স্থিতি (Previous Net Balance):</td>
            <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:right; color:${summary.previousNetBalance >= 0 ? '#16a34a' : '#dc2626'}; font-weight:600;">৳ ${fmt(summary.previousNetBalance)}</td>
          </tr>
          <tr style="background:#f0fdf4;">
            <td style="padding:7px 10px; border:1px solid #cbd5e1; font-weight:600; color:#1e3a5f;">৩. আয় (Report Month's Running Income):</td>
            <td style="padding:7px 10px; border:1px solid #cbd5e1; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.currentMonthIncome)}</td>
          </tr>
          <tr style="background:#fef2f2;">
            <td style="padding:7px 10px; border:1px solid #cbd5e1; font-weight:600; color:#1e3a5f;">৪. ব্যয় (Report Month's Running Expense & Investment):</td>
            <td style="padding:7px 10px; border:1px solid #cbd5e1; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.currentMonthExpense)}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:6px 10px; border:1px solid #cbd5e1; color:#64748b; padding-left:24px;">└ নীট ফলাফল (This Month's Net Balance):</td>
            <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:right; color:${summary.currentMonthNetBalance >= 0 ? '#16a34a' : '#dc2626'}; font-weight:600;">৳ ${fmt(summary.currentMonthNetBalance)}</td>
          </tr>
          <tr style="background:#f1f5f9;">
            <td style="padding:6px 10px; border:1px solid #cbd5e1; color:#334155; font-weight:600;">└ সর্বমোট আয় (বিগত + রানিং):</td>
            <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.totalIncome)}</td>
          </tr>
          <tr style="background:#f1f5f9;">
            <td style="padding:6px 10px; border:1px solid #cbd5e1; color:#334155; font-weight:600;">└ সর্বমোট ব্যয় (বিগত + রানিং):</td>
            <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.totalExpense)}</td>
          </tr>
          <tr style="background:#1e3a5f; color:#fff;">
            <td style="padding:10px; border:1px solid #1e3a5f; font-size:14px; font-weight:bold; color:#fff;">৫. ${finalResultLabel}:</td>
            <td style="padding:10px; border:1px solid #1e3a5f; text-align:right; font-size:15px; font-weight:bold; color:${summary.finalBalance >= 0 ? '#4ade80' : '#f87171'};">৳ ${fmt(summary.finalBalance)}</td>
          </tr>
        </table>
      </div>

      <!-- Signatures with Table layout -->
      <table style="width:100%; border-collapse:collapse; border:none; margin-top:70px; text-align:center; font-size:12px; color:#64748b;">
        <tr>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:150px;margin:0 auto;padding-top:6px;">প্রস্তুতকারীর স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:150px;margin:0 auto;padding-top:6px;">কোষাধক্ষের স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:150px;margin:0 auto;padding-top:6px;">সহ-সভাপতির স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:150px;margin:0 auto;padding-top:6px;">সভাপতির স্বাক্ষর</div></td>
        </tr>
      </table>
    </body></html>`;
  };

  // ——— আয়ের বিবরণী HTML জেনারেটর ———
  const getIncomeReportHTML = () => {
    if (!incomeData) return "";

    const periodText = incomeData.from || incomeData.to
      ? `${fmtDate(incomeData.from || '')} থেকে ${fmtDate(incomeData.to || '')}`
      : "সর্বকালের শুরু থেকে আজ পর্যন্ত";

    const catRows = incomeData.categorySummary && incomeData.categorySummary.length > 0
      ? incomeData.categorySummary.map((c: any, i: number) => `
        <tr style="${i % 2 === 0 ? '' : 'background:#f8fafc'}">
          <td style="padding:6px 10px; border:1px solid #cbd5e1;">${c.category}</td>
          <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:center;">${c.count} টি</td>
          <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:right; font-weight:bold; color:#16a34a;">৳ ${fmt(c.amount)}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="3" style="text-align:center; padding:10px; color:#64748b;">কোনো আয়ের বিবরণ নেই</td></tr>`;

    const voucherRows = incomeData.vouchers && incomeData.vouchers.length > 0
      ? incomeData.vouchers.map((v: any, i: number) => `
        <tr style="${i % 2 === 0 ? '' : 'background:#f8fafc'}">
          <td style="padding:6px 8px; border:1px solid #cbd5e1; text-align:center;">${i + 1}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; text-align:center;">${fmtDate(v.date)}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; font-weight:600; color:#1e3a5f;">${v.voucherNo || '-'}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; font-weight:500;">${v.category}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; color:#334155;">
            ${v.member ? `${v.member.name} (${v.member.memberId})` : (v.description || '-')}
          </td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; text-align:right; font-weight:bold; color:#16a34a;">৳ ${fmt(v.amount)}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="6" style="text-align:center; padding:14px; color:#64748b;">কোনো লেনদেন পাওয়া যায়নি</td></tr>`;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <title>আয়ের বিবরণী — ${periodText}</title>
      <style>
        *{box-sizing:border-box}
        body{width:800px;font-family:Arial,sans-serif;font-size:12px;color:#1e293b;margin:28px auto;padding:10px}
        h1{font-size:20px;color:#1e3a5f;margin:0}h2{font-size:14px;color:#334155;margin:4px 0 0}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:#f8fafc;padding:7px 10px;border:1px solid #cbd5e1;font-weight:600;text-align:left}
        td{padding:6px 10px;border:1px solid #cbd5e1}
        .section-title{background:#1e3a5f;color:#fff;padding:6px 10px;font-weight:bold;font-size:13px;border-top-left-radius:5px;border-top-right-radius:5px}
        @media print{body{width:800px;margin:12px}@page{size:A4 portrait;margin:12mm}}
      </style></head><body>
      <table style="width:100%; border-collapse:collapse; border-bottom:2px solid #1e3a5f; margin-bottom:16px; padding-bottom:10px;">
        <tr>
          ${companyProfile?.logo ? `
          <td style="width:70px; vertical-align:middle; border:none; padding:0;">
            <img src="${process.env.API_HOST}${companyProfile.logo}" style="height:60px; width:60px; object-fit:contain; display:block;" alt="Logo"/>
          </td>` : ''}
          <td style="vertical-align:middle; text-align:center; border:none; padding:0;">
            <div style="${companyProfile?.logo ? 'margin-right:70px;' : ''}">
              <h1 style="font-size:20px; color:#1e3a5f; margin:0;">${companyProfile?.name || 'সমবায় সমিতি'}</h1>
              ${companyProfile?.address ? `<div style="font-size:11px; color:#64748b; margin-top:2px;">${companyProfile.address}</div>` : ''}
              <h2 style="font-size:14px; color:#334155; margin:4px 0 0;">আয়ের বিবরণী (Income Statement)</h2>
              <div style="font-size:12px; font-weight:bold; color:#1e3a5f; margin-top:4px;">
                সময়কাল: ${periodText}
              </div>
              <div style="font-size:11px; color:#64748b; margin-top:3px; text-align:right">মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Category Breakdown Table -->
      <div style="margin-bottom:20px;">
        <div class="section-title">খাতভিত্তিক আয়ের সারসংক্ষেপ (Category-wise Income Summary)</div>
        <table>
          <thead>
            <tr>
              <th style="width:50%;">আয়ের খাত (Income Category)</th>
              <th style="width:25%; text-align:center;">ভাউচার সংখ্যা (Count)</th>
              <th style="width:25%; text-align:right;">মোট টাকার পরিমাণ (Amount)</th>
            </tr>
          </thead>
          <tbody>${catRows}</tbody>
          <tfoot>
            <tr style="background:#f1f5f9; font-weight:bold;">
              <td style="border:1px solid #cbd5e1;">সর্বমোট আয় (Total Income)</td>
              <td style="border:1px solid #cbd5e1; text-align:center;">${incomeData.totalCount} টি</td>
              <td style="border:1px solid #cbd5e1; text-align:right; color:#16a34a; font-size:12px;">৳ ${fmt(incomeData.totalIncome)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Detailed Transactions -->
      <div style="margin-bottom:20px;">
        <div class="section-title">আয়ের বিস্তারিত ভাউচার তালিকা (Detailed Income Transactions)</div>
        <table>
          <thead>
            <tr>
              <th style="width:6%; text-align:center;">ক্র নং</th>
              <th style="width:14%; text-align:center;">তারিখ</th>
              <th style="width:16%;">ভাউচার নং</th>
              <th style="width:22%;">আয়ের খাত</th>
              <th style="width:24%;">সদস্য / বিবরণ</th>
              <th style="width:18%; text-align:right;">টাকার পরিমাণ</th>
            </tr>
          </thead>
          <tbody>${voucherRows}</tbody>
          <tfoot>
            <tr style="background:#1e3a5f; color:#fff; font-weight:bold;">
              <td colspan="5" style="border:1px solid #1e3a5f; font-size:12px; color:#fff;">সর্বমোট সংগৃহীত আয়:</td>
              <td style="border:1px solid #1e3a5f; text-align:right; font-size:13px; color:#4ade80;">৳ ${fmt(incomeData.totalIncome)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Signatures -->
      <table style="width:100%; border-collapse:collapse; border:none; margin-top:60px; text-align:center; font-size:12px; color:#64748b;">
        <tr>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">প্রস্তুতকারীর স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">কোষাধক্ষের স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">সহ-সভাপতির স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">সভাপতির স্বাক্ষর</div></td>
        </tr>
      </table>
    </body></html>`;
  };

  // ——— ব্যয়ের বিবরণী HTML জেনারেটর ———
  const getExpenseReportHTML = () => {
    if (!expenseData) return "";

    const periodText = expenseData.from || expenseData.to
      ? `${fmtDate(expenseData.from || '')} থেকে ${fmtDate(expenseData.to || '')}`
      : "সর্বকালের শুরু থেকে আজ পর্যন্ত";

    const expCatRows = expenseData.expenseCategories && expenseData.expenseCategories.length > 0
      ? expenseData.expenseCategories.map((c: any, i: number) => `
        <tr style="${i % 2 === 0 ? '' : 'background:#f8fafc'}">
          <td style="padding:6px 10px; border:1px solid #cbd5e1;">${c.category}</td>
          <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:center;">সাধারণ ব্যয়</td>
          <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:center;">${c.count} টি</td>
          <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:right; font-weight:bold; color:#dc2626;">৳ ${fmt(c.amount)}</td>
        </tr>
      `).join('')
      : '';

    const invCatRows = expenseData.investmentCategories && expenseData.investmentCategories.length > 0
      ? expenseData.investmentCategories.map((c: any, i: number) => `
        <tr style="${i % 2 === 0 ? '' : 'background:#f8fafc'}">
          <td style="padding:6px 10px; border:1px solid #cbd5e1;">${c.category}</td>
          <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:center; color:#2563eb; font-weight:600;">বিনিয়োগ বাবদ</td>
          <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:center;">${c.count} টি</td>
          <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:right; font-weight:bold; color:#2563eb;">৳ ${fmt(c.amount)}</td>
        </tr>
      `).join('')
      : '';

    const voucherRows = expenseData.vouchers && expenseData.vouchers.length > 0
      ? expenseData.vouchers.map((v: any, i: number) => `
        <tr style="${i % 2 === 0 ? '' : 'background:#f8fafc'}">
          <td style="padding:6px 8px; border:1px solid #cbd5e1; text-align:center;">${i + 1}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; text-align:center;">${fmtDate(v.date)}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; font-weight:600; color:#1e3a5f;">${v.voucherNo || '-'}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; font-weight:500;">${v.category}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; text-align:center; font-size:10px;">
            <span style="padding:2px 6px; border-radius:4px; font-weight:600; background:${v.type === 'INVESTMENT' ? '#dbeafe; color:#1e40af;' : '#fee2e2; color:#991b1b;'}">
              ${v.type === 'INVESTMENT' ? 'বিনিয়োগ' : 'সাধারণ ব্যয়'}
            </span>
          </td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; color:#334155;">
            ${v.member ? `${v.member.name} (${v.member.memberId})` : (v.description || '-')}
          </td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; text-align:right; font-weight:bold; color:#dc2626;">৳ ${fmt(v.amount)}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="7" style="text-align:center; padding:14px; color:#64748b;">কোনো ব্যয়ের বিবরণ পাওয়া যায়নি</td></tr>`;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <title>ব্যয়ের বিবরণী — ${periodText}</title>
      <style>
        *{box-sizing:border-box}
        body{width:800px;font-family:Arial,sans-serif;font-size:12px;color:#1e293b;margin:28px auto;padding:10px}
        h1{font-size:20px;color:#1e3a5f;margin:0}h2{font-size:14px;color:#334155;margin:4px 0 0}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:#f8fafc;padding:7px 10px;border:1px solid #cbd5e1;font-weight:600;text-align:left}
        td{padding:6px 10px;border:1px solid #cbd5e1}
        .section-title{background:#1e3a5f;color:#fff;padding:6px 10px;font-weight:bold;font-size:13px;border-top-left-radius:5px;border-top-right-radius:5px}
        @media print{body{width:800px;margin:12px}@page{size:A4 portrait;margin:12mm}}
      </style></head><body>
      <table style="width:100%; border-collapse:collapse; border-bottom:2px solid #1e3a5f; margin-bottom:16px; padding-bottom:10px;">
        <tr>
          ${companyProfile?.logo ? `
          <td style="width:70px; vertical-align:middle; border:none; padding:0;">
            <img src="${process.env.API_HOST}${companyProfile.logo}" style="height:60px; width:60px; object-fit:contain; display:block;" alt="Logo"/>
          </td>` : ''}
          <td style="vertical-align:middle; text-align:center; border:none; padding:0;">
            <div style="${companyProfile?.logo ? 'margin-right:70px;' : ''}">
              <h1 style="font-size:20px; color:#1e3a5f; margin:0;">${companyProfile?.name || 'সমবায় সমিতি'}</h1>
              ${companyProfile?.address ? `<div style="font-size:11px; color:#64748b; margin-top:2px;">${companyProfile.address}</div>` : ''}
              <h2 style="font-size:14px; color:#334155; margin:4px 0 0;">ব্যয়ের বিবরণী (Expense & Investment Statement)</h2>
              <div style="font-size:12px; font-weight:bold; color:#1e3a5f; margin-top:4px;">
                সময়কাল: ${periodText}
              </div>
              <div style="font-size:11px; color:#64748b; margin-top:3px; text-align:right">মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Summary Metric Cards -->
      <table style="width:100%; border-collapse:separate; border-spacing:10px 0; margin-bottom:18px; table-layout:fixed;">
        <tr>
          <td style="width:33.33%; border:1px solid #fee2e2; background:#fef2f2; border-radius:6px; padding:10px 12px;">
            <div style="font-size:11px; color:#64748b; font-weight:600;">সাধারণ পরিচালন ব্যয়</div>
            <div style="font-size:15px; font-weight:bold; color:#dc2626; margin-top:3px;">৳ ${fmt(expenseData.totalExpense)}</div>
          </td>
          <td style="width:33.33%; border:1px solid #dbeafe; background:#eff6ff; border-radius:6px; padding:10px 12px;">
            <div style="font-size:11px; color:#64748b; font-weight:600;">বিনিয়োগ বাবদ খরচ</div>
            <div style="font-size:15px; font-weight:bold; color:#2563eb; margin-top:3px;">৳ ${fmt(expenseData.totalInvestment)}</div>
          </td>
          <td style="width:33.33%; border:1px solid #cbd5e1; background:#f8fafc; border-radius:6px; padding:10px 12px;">
            <div style="font-size:11px; color:#1e293b; font-weight:bold;">সর্বমোট ব্যয় ও বিনিয়োগ</div>
            <div style="font-size:16px; font-weight:bold; color:#b91c1c; margin-top:3px;">৳ ${fmt(expenseData.grandTotalExpense)}</div>
          </td>
        </tr>
      </table>

      <!-- Category Breakdown Table -->
      <div style="margin-bottom:20px;">
        <div class="section-title">খাতভিত্তিক ব্যয়ের সারসংক্ষেপ (Category-wise Summary)</div>
        <table>
          <thead>
            <tr>
              <th style="width:45%;">ব্যয়ের খাত (Expense Category)</th>
              <th style="width:20%; text-align:center;">ধরন (Type)</th>
              <th style="width:15%; text-align:center;">ভাউচার সংখ্যা</th>
              <th style="width:20%; text-align:right;">মোট টাকার পরিমাণ</th>
            </tr>
          </thead>
          <tbody>
            ${expCatRows || invCatRows ? `${expCatRows}${invCatRows}` : `<tr><td colspan="4" style="text-align:center; padding:10px; color:#64748b;">কোনো ব্যয়ের বিবরণ নেই</td></tr>`}
          </tbody>
          <tfoot>
            <tr style="background:#f1f5f9; font-weight:bold;">
              <td colspan="2" style="border:1px solid #cbd5e1;">সর্বমোট ব্যয় ও বিনিয়োগ</td>
              <td style="border:1px solid #cbd5e1; text-align:center;">${expenseData.totalCount} টি</td>
              <td style="border:1px solid #cbd5e1; text-align:right; color:#dc2626; font-size:12px;">৳ ${fmt(expenseData.grandTotalExpense)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Detailed Transactions -->
      <div style="margin-bottom:20px;">
        <div class="section-title">ব্যয়ের বিস্তারিত ভাউচার তালিকা (Detailed Transactions)</div>
        <table>
          <thead>
            <tr>
              <th style="width:5%; text-align:center;">ক্র নং</th>
              <th style="width:13%; text-align:center;">তারিখ</th>
              <th style="width:14%;">ভাউচার নং</th>
              <th style="width:18%;">খাত</th>
              <th style="width:12%; text-align:center;">ধরন</th>
              <th style="width:22%;">বিবরণ / গ্রহীতা</th>
              <th style="width:16%; text-align:right;">টাকার পরিমাণ</th>
            </tr>
          </thead>
          <tbody>${voucherRows}</tbody>
          <tfoot>
            <tr style="background:#1e3a5f; color:#fff; font-weight:bold;">
              <td colspan="6" style="border:1px solid #1e3a5f; font-size:12px; color:#fff;">সর্বমোট ব্যয় ও বিনিয়োগ:</td>
              <td style="border:1px solid #1e3a5f; text-align:right; font-size:13px; color:#f87171;">৳ ${fmt(expenseData.grandTotalExpense)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Signatures -->
      <table style="width:100%; border-collapse:collapse; border:none; margin-top:60px; text-align:center; font-size:12px; color:#64748b;">
        <tr>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">প্রস্তুতকারীর স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">কোষাধক্ষের স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">সহ-সভাপতির স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">সভাপতির স্বাক্ষর</div></td>
        </tr>
      </table>
    </body></html>`;
  };

  // ——— বিনিয়োগ বিবরণী HTML জেনারেটর ———
  const getInvestmentReportHTML = () => {
    if (!investmentData) return "";

    const periodText = investmentData.from || investmentData.to
      ? `${fmtDate(investmentData.from || '')} থেকে ${fmtDate(investmentData.to || '')}`
      : "সর্বকালের শুরু থেকে আজ পর্যন্ত";

    const catRows = investmentData.categorySummary && investmentData.categorySummary.length > 0
      ? investmentData.categorySummary.map((c: any, i: number) => `
        <tr style="${i % 2 === 0 ? '' : 'background:#f8fafc'}">
          <td style="padding:6px 10px; border:1px solid #cbd5e1;">${c.category}</td>
          <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:center;">${c.count} টি</td>
          <td style="padding:6px 10px; border:1px solid #cbd5e1; text-align:right; font-weight:bold; color:#2563eb;">৳ ${fmt(c.amount)}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="3" style="text-align:center; padding:10px; color:#64748b;">কোনো বিনিয়োগের বিবরণ নেই</td></tr>`;

    const voucherRows = investmentData.vouchers && investmentData.vouchers.length > 0
      ? investmentData.vouchers.map((v: any, i: number) => `
        <tr style="${i % 2 === 0 ? '' : 'background:#f8fafc'}">
          <td style="padding:6px 8px; border:1px solid #cbd5e1; text-align:center;">${i + 1}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; text-align:center;">${fmtDate(v.date)}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; font-weight:600; color:#1e3a5f;">${v.voucherNo || '-'}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; font-weight:500;">${v.category}</td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; color:#334155;">
            ${v.member ? `${v.member.name} (${v.member.memberId})` : (v.description || '-')}
          </td>
          <td style="padding:6px 8px; border:1px solid #cbd5e1; text-align:right; font-weight:bold; color:#2563eb;">৳ ${fmt(v.amount)}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="6" style="text-align:center; padding:14px; color:#64748b;">কোনো বিনিয়োগ লেনদেন পাওয়া যায়নি</td></tr>`;

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <title>বিনিয়োগ বিবরণী — ${periodText}</title>
      <style>
        *{box-sizing:border-box}
        body{width:800px;font-family:Arial,sans-serif;font-size:12px;color:#1e293b;margin:28px auto;padding:10px}
        h1{font-size:20px;color:#1e3a5f;margin:0}h2{font-size:14px;color:#334155;margin:4px 0 0}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:#f8fafc;padding:7px 10px;border:1px solid #cbd5e1;font-weight:600;text-align:left}
        td{padding:6px 10px;border:1px solid #cbd5e1}
        .section-title{background:#1e3a5f;color:#fff;padding:6px 10px;font-weight:bold;font-size:13px;border-top-left-radius:5px;border-top-right-radius:5px}
        @media print{body{width:800px;margin:12px}@page{size:A4 portrait;margin:12mm}}
      </style></head><body>
      <table style="width:100%; border-collapse:collapse; border-bottom:2px solid #1e3a5f; margin-bottom:16px; padding-bottom:10px;">
        <tr>
          ${companyProfile?.logo ? `
          <td style="width:70px; vertical-align:middle; border:none; padding:0;">
            <img src="${process.env.API_HOST}${companyProfile.logo}" style="height:60px; width:60px; object-fit:contain; display:block;" alt="Logo"/>
          </td>` : ''}
          <td style="vertical-align:middle; text-align:center; border:none; padding:0;">
            <div style="${companyProfile?.logo ? 'margin-right:70px;' : ''}">
              <h1 style="font-size:20px; color:#1e3a5f; margin:0;">${companyProfile?.name || 'সমবায় সমিতি'}</h1>
              ${companyProfile?.address ? `<div style="font-size:11px; color:#64748b; margin-top:2px;">${companyProfile.address}</div>` : ''}
              <h2 style="font-size:14px; color:#334155; margin:4px 0 0;">বিনিয়োগ বিবরণী (Investment Statement)</h2>
              <div style="font-size:12px; font-weight:bold; color:#1e3a5f; margin-top:4px;">
                সময়কাল: ${periodText}
              </div>
              <div style="font-size:11px; color:#64748b; margin-top:3px; text-align:right">মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Category Breakdown Table -->
      <div style="margin-bottom:20px;">
        <div class="section-title">খাতভিত্তিক বিনিয়োগের সারসংক্ষেপ (Category-wise Investment Summary)</div>
        <table>
          <thead>
            <tr>
              <th style="width:50%;">বিনিয়োগের খাত (Investment Category)</th>
              <th style="width:25%; text-align:center;">ভাউচার সংখ্যা (Count)</th>
              <th style="width:25%; text-align:right;">মোট টাকার পরিমাণ (Amount)</th>
            </tr>
          </thead>
          <tbody>${catRows}</tbody>
          <tfoot>
            <tr style="background:#f1f5f9; font-weight:bold;">
              <td style="border:1px solid #cbd5e1;">সর্বমোট বিনিয়োগ (Total Investment)</td>
              <td style="border:1px solid #cbd5e1; text-align:center;">${investmentData.totalCount} টি</td>
              <td style="border:1px solid #cbd5e1; text-align:right; color:#2563eb; font-size:12px;">৳ ${fmt(investmentData.totalInvestment)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Detailed Transactions -->
      <div style="margin-bottom:20px;">
        <div class="section-title">বিনিয়োগের বিস্তারিত ভাউচার তালিকা (Detailed Investment Transactions)</div>
        <table>
          <thead>
            <tr>
              <th style="width:6%; text-align:center;">ক্র নং</th>
              <th style="width:14%; text-align:center;">তারিখ</th>
              <th style="width:16%;">ভাউচার নং</th>
              <th style="width:22%;">বিনিয়োগের খাত</th>
              <th style="width:24%;">বিবরণ / খাত সংশ্লিষ্ট তথ্য</th>
              <th style="width:18%; text-align:right;">টাকার পরিমাণ</th>
            </tr>
          </thead>
          <tbody>${voucherRows}</tbody>
          <tfoot>
            <tr style="background:#1e3a5f; color:#fff; font-weight:bold;">
              <td colspan="5" style="border:1px solid #1e3a5f; font-size:12px; color:#fff;">সর্বমোট বিনিয়োগ বাবদ খরচ:</td>
              <td style="border:1px solid #1e3a5f; text-align:right; font-size:13px; color:#93c5fd;">৳ ${fmt(investmentData.totalInvestment)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Signatures -->
      <table style="width:100%; border-collapse:collapse; border:none; margin-top:60px; text-align:center; font-size:12px; color:#64748b;">
        <tr>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">প্রস্তুতকারীর স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">কোষাধক্ষের স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">সহ-সভাপতির স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:140px;margin:0 auto;padding-top:6px;">সভাপতির স্বাক্ষর</div></td>
        </tr>
      </table>
    </body></html>`;
  };

  // প্রিন্ট
  const handlePrint = () => {
    let html = "";
    if (activeReportTab === "member") html = getStatementHTML();
    else if (activeReportTab === "association") html = getAssociationReportHTML();
    else if (activeReportTab === "monthly_association") html = getMonthlyAssociationReportHTML();
    else if (activeReportTab === "income_statement") html = getIncomeReportHTML();
    else if (activeReportTab === "expense_statement") html = getExpenseReportHTML();
    else if (activeReportTab === "investment_statement") html = getInvestmentReportHTML();

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
    let html = "";
    let reportName = "Report";

    if (activeReportTab === "member") {
      html = getStatementHTML();
      reportName = `Statement_${statement?.member?.name || 'Statement'}`;
    } else if (activeReportTab === "association") {
      html = getAssociationReportHTML();
      reportName = `Income_Expense_Report`;
    } else if (activeReportTab === "monthly_association") {
      html = getMonthlyAssociationReportHTML();
      reportName = `Monthly_Income_Expense_${selectedMonth || 'Report'}`;
    } else if (activeReportTab === "income_statement") {
      html = getIncomeReportHTML();
      reportName = `Income_Statement_Report`;
    } else if (activeReportTab === "expense_statement") {
      html = getExpenseReportHTML();
      reportName = `Expense_Statement_Report`;
    } else if (activeReportTab === "investment_statement") {
      html = getInvestmentReportHTML();
      reportName = `Investment_Statement_Report`;
    }

    if (!html) return;

    const opt = {
      margin: 10,
      filename: `${reportName}_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 800 },
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

  const resetAllFilters = () => {
    setSelectedMember(null);
    setMemberSearch("");
    setFromDate("");
    setToDate("");
    setStatement(null);
    setAssociationData(null);
    setMonthlyData(null);
    setIncomeData(null);
    setExpenseData(null);
    setInvestmentData(null);
  };

  return (
    <div className="space-y-6">
      {/* হেডার */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {activeReportTab === "member"
              ? "সঞ্চয় স্টেটমেন্ট"
              : activeReportTab === "association"
                ? "সমিতি আয়-ব্যয় বিবরণী"
                : activeReportTab === "monthly_association"
                  ? "মাসিক আয়-ব্যয় বিবরণী"
                  : activeReportTab === "income_statement"
                    ? "আয়ের বিবরণী"
                    : activeReportTab === "expense_statement"
                      ? "ব্যয়ের বিবরণী"
                      : "বিনিয়োগ বিবরণী"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeReportTab === "member"
              ? "সদস্যের জমা ও উত্তোলনের ব্যাংক স্টেটমেন্ট"
              : activeReportTab === "association"
                ? "সমিতির সার্বিক আয় ও ব্যয়ের বিবরণী"
                : activeReportTab === "monthly_association"
                  ? "নির্দিষ্ট মাসের সমিতির আয়-ব্যয় এবং বিগত মাসের তুলনামূলক সারসংক্ষেপ বিবরণী"
                  : activeReportTab === "income_statement"
                    ? "নির্বাচিত সময়কালের সমস্ত আয়ের খাতভিত্তিক ও বিস্তারিত লেনদেন তালিকা"
                    : activeReportTab === "expense_statement"
                      ? "নির্বাচিত সময়কালের পরিচালন ব্যয় ও বিনিয়োগ বাবদ বিস্তারিত লেনদেন তালিকা"
                      : "নির্বাচিত সময়কালের সমস্ত বিনিয়োগের খাতভিত্তিক ও বিস্তারিত লেনদেন তালিকা"}
          </p>
        </div>
        <div className="flex gap-3">
          {((activeReportTab === "member" && statement) ||
            (activeReportTab === "association" && associationData) ||
            (activeReportTab === "monthly_association" && monthlyData) ||
            (activeReportTab === "income_statement" && incomeData) ||
            (activeReportTab === "expense_statement" && expenseData) ||
            (activeReportTab === "investment_statement" && investmentData)) && (
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
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => {
            setActiveReportTab("member");
            resetAllFilters();
          }}
          className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeReportTab === "member"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          সদস্য স্টেটমেন্ট
        </button>
        <button
          onClick={() => {
            setActiveReportTab("association");
            resetAllFilters();
          }}
          className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeReportTab === "association"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          সমিতি আয়-ব্যয় বিবরণী
        </button>
        <button
          onClick={() => {
            setActiveReportTab("monthly_association");
            resetAllFilters();
          }}
          className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeReportTab === "monthly_association"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          মাসিক আয়-ব্যয় বিবরণী
        </button>
        <button
          onClick={() => {
            setActiveReportTab("income_statement");
            resetAllFilters();
          }}
          className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeReportTab === "income_statement"
            ? "border-emerald-600 text-emerald-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          আয়ের বিবরণী
        </button>
        <button
          onClick={() => {
            setActiveReportTab("expense_statement");
            resetAllFilters();
          }}
          className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeReportTab === "expense_statement"
            ? "border-rose-600 text-rose-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          ব্যয়ের বিবরণী
        </button>
        <button
          onClick={() => {
            setActiveReportTab("investment_statement");
            resetAllFilters();
          }}
          className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeReportTab === "investment_statement"
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          বিনিয়োগ বিবরণী
        </button>
      </div>

      {/* ফিল্টার প্যানেল */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        {activeReportTab === "monthly_association" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">রিপোর্ট মাস নির্বাচন করুন</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="text-xs text-slate-500 pb-2">
              নির্বাচিত মাস: <span className="font-semibold text-slate-800">{fmtMonth(selectedMonth)}</span>
            </div>
          </div>
        ) : (
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
        )}

        <div className="mt-4 flex gap-3">
          <button
            onClick={
              activeReportTab === "member"
                ? fetchStatement
                : activeReportTab === "association"
                  ? fetchAssociationReport
                  : activeReportTab === "monthly_association"
                    ? fetchMonthlyAssociationReport
                    : activeReportTab === "income_statement"
                      ? fetchIncomeReport
                      : activeReportTab === "expense_statement"
                        ? fetchExpenseReport
                        : fetchInvestmentReport
            }
            disabled={
              activeReportTab === "member"
                ? (!selectedMember || loadingStatement)
                : activeReportTab === "association"
                  ? loadingAssociation
                  : activeReportTab === "monthly_association"
                    ? (!selectedMonth || loadingMonthly)
                    : activeReportTab === "income_statement"
                      ? loadingIncome
                      : activeReportTab === "expense_statement"
                        ? loadingExpense
                        : loadingInvestment
            }
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium transition text-sm"
          >
            <FileText size={16} />
            {activeReportTab === "member"
              ? (loadingStatement ? "লোড হচ্ছে..." : "স্টেটমেন্ট দেখুন")
              : activeReportTab === "association"
                ? (loadingAssociation ? "লোড হচ্ছে..." : "বিবরণী দেখুন")
                : activeReportTab === "monthly_association"
                  ? (loadingMonthly ? "লোড হচ্ছে..." : "বিবরণী দেখুন")
                  : activeReportTab === "income_statement"
                    ? (loadingIncome ? "লোড হচ্ছে..." : "আয়ের বিবরণী দেখুন")
                    : activeReportTab === "expense_statement"
                      ? (loadingExpense ? "লোড হচ্ছে..." : "ব্যয়ের বিবরণী দেখুন")
                      : (loadingInvestment ? "লোড হচ্ছে..." : "বিনিয়োগ বিবরণী দেখুন")}
          </button>
          {(selectedMember || fromDate || toDate || statement || associationData || monthlyData || incomeData || expenseData || investmentData) && (
            <button
              onClick={resetAllFilters}
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
                <h3 className="font-bold text-lg">ব্যয় ও বিনিয়োগ সমূহ (Expenses & Investments)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">খাত (Category)</th>
                      <th className="px-6 py-3 font-semibold text-right text-red-600">পরিমাণ (Amount)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {associationData.expenses.length === 0 && (!associationData.investments || associationData.investments.length === 0) ? (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-slate-400">
                          কোনো ব্যয়ের বিবরণ পাওয়া যায়নি
                        </td>
                      </tr>
                    ) : (
                      <>
                        {associationData.expenses.map((exp: any, idx: number) => (
                          <tr key={`exp-${idx}`} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                            <td className="px-6 py-4 text-slate-700 font-medium">{exp.category}</td>
                            <td className="px-6 py-4 text-right font-bold text-red-500">
                              ৳ {fmt(exp.amount)}
                            </td>
                          </tr>
                        ))}
                        {associationData.investments && associationData.investments.length > 0 && (
                          <>
                            <tr className="bg-slate-100/70 border-y border-slate-200">
                              <td colSpan={2} className="px-6 py-3 text-center font-bold text-slate-600">
                                বিনিয়োগ বাবদ খরচ (Investments)
                              </td>
                            </tr>
                            {associationData.investments.map((inv: any, idx: number) => (
                              <tr key={`inv-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                                <td className="px-6 py-4 text-slate-700 font-medium">{inv.category}</td>
                                <td className="px-6 py-4 text-right font-bold text-red-500">
                                  ৳ {fmt(inv.amount)}
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </tbody>
                  {(associationData.expenses.length > 0 || (associationData.investments && associationData.investments.length > 0)) && (
                    <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                      <tr>
                        <td className="px-6 py-3 font-bold text-slate-700">মোট ব্যয় ও বিনিয়োগ:</td>
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
                <span className="text-slate-600 font-medium">সর্বমোট ব্যয় ও বিনিয়োগ (Total Expense & Investment)</span>
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

      {/* ——— মাসিক সমিতি আয়-ব্যয় বিবরণী রিপোর্ট ——— */}
      {activeReportTab === "monthly_association" && loadingMonthly && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          মাসিক বিবরণী প্রস্তুত হচ্ছে...
        </div>
      )}

      {activeReportTab === "monthly_association" && !loadingMonthly && monthlyData && (
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
              <div className="report-title text-sm font-semibold text-slate-600">মাসিক আয়-ব্যয় বিবরণী</div>
              {companyProfile?.address && (
                <div className="text-xs text-slate-500 mt-0.5">{companyProfile.address}</div>
              )}
              <div className="text-slate-600 text-xs font-semibold mt-1">
                রিপোর্ট মাস: {fmtMonth(monthlyData.month)} ({fmtDate(monthlyData.startDate)} থেকে {fmtDate(monthlyData.endDate)})
              </div>
            </div>
          </div>

          {/* স্ক্রিন হেডার ব্যানার */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 rounded-xl p-6 text-white shadow flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Landmark size={28} className="text-blue-400" />
                <div>
                  <h3 className="text-xl font-bold">মাসিক আয়-ব্যয় বিবরণী</h3>
                  <p className="text-blue-200 text-sm">
                    রিপোর্ট মাস: <span className="font-semibold text-white">{fmtMonth(monthlyData.month)}</span>
                  </p>
                </div>
              </div>
              <p className="text-blue-200 text-xs mt-2">
                সময়কাল: {fmtDate(monthlyData.startDate)} হতে {fmtDate(monthlyData.endDate)}
              </p>
            </div>
            <div className="flex gap-4 text-right">
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 border border-white/10">
                <div className="text-xs text-blue-200">চলতি মাসের রানিং আয়</div>
                <div className="text-lg font-bold text-green-400">৳ {fmt(monthlyData.summary.currentMonthIncome)}</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 border border-white/10">
                <div className="text-xs text-blue-200">চলতি মাসের রানিং ব্যয়</div>
                <div className="text-lg font-bold text-red-400">৳ {fmt(monthlyData.summary.currentMonthExpense)}</div>
              </div>
            </div>
          </div>

          {/* Two Sided Grid for Monthly Incomes vs Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Income Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
                <h3 className="font-bold text-lg">আয় সমূহ (Incomes)</h3>
                <span className="text-xs bg-green-700/60 px-2.5 py-1 rounded-full">{fmtMonth(monthlyData.month)}</span>
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
                    {monthlyData.incomes.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-slate-400">
                          এই মাসে কোনো আয়ের বিবরণ পাওয়া যায়নি
                        </td>
                      </tr>
                    ) : (
                      monthlyData.incomes.map((inc: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                          <td className="px-6 py-4 text-slate-700 font-medium">{inc.category}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-600">
                            ৳ {fmt(inc.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {monthlyData.incomes.length > 0 && (
                    <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                      <tr>
                        <td className="px-6 py-3 font-bold text-slate-700">মোট রানিং আয় (Total Month Income):</td>
                        <td className="px-6 py-3 text-right font-bold text-green-700">
                          ৳ {fmt(monthlyData.summary.currentMonthIncome)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Monthly Expense Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-red-500 text-white px-6 py-4 flex justify-between items-center">
                <h3 className="font-bold text-lg">ব্যয় ও বিনিয়োগ সমূহ (Expenses & Investments)</h3>
                <span className="text-xs bg-red-600/60 px-2.5 py-1 rounded-full">{fmtMonth(monthlyData.month)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">খাত (Category)</th>
                      <th className="px-6 py-3 font-semibold text-right text-red-600">টাকার পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyData.expenses.length === 0 && (!monthlyData.investments || monthlyData.investments.length === 0) ? (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-slate-400">
                          এই মাসে কোনো ব্যয়ের বিবরণ পাওয়া যায়নি
                        </td>
                      </tr>
                    ) : (
                      <>
                        {monthlyData.expenses.map((exp: any, idx: number) => (
                          <tr key={`mexp-${idx}`} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                            <td className="px-6 py-4 text-slate-700 font-medium">{exp.category}</td>
                            <td className="px-6 py-4 text-right font-bold text-red-500">
                              {fmt(exp.amount)}
                            </td>
                          </tr>
                        ))}
                        {monthlyData.investments && monthlyData.investments.length > 0 && (
                          <>
                            <tr className="bg-slate-100/70 border-y border-slate-200">
                              <td colSpan={2} className="px-6 py-3 text-center font-bold text-slate-600">
                                বিনিয়োগ বাবদ খরচ (Investments)
                              </td>
                            </tr>
                            {monthlyData.investments.map((inv: any, idx: number) => (
                              <tr key={`minv-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                                <td className="px-6 py-4 text-slate-700 font-medium">{inv.category}</td>
                                <td className="px-6 py-4 text-right font-bold text-red-500">
                                  {fmt(inv.amount)}
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </tbody>
                  {(monthlyData.expenses.length > 0 || (monthlyData.investments && monthlyData.investments.length > 0)) && (
                    <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                      <tr>
                        <td className="px-6 py-3 font-bold text-slate-700">মোট রানিং ব্যয় ও বিনিয়োগ:</td>
                        <td className="px-6 py-3 text-right font-bold text-red-700">
                          ৳ {fmt(monthlyData.summary.currentMonthExpense)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          {/* ——— ৩টি সারসংক্ষেপ মেট্রিক কার্ড ——— */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* বিগত মাসগুলোর হিসাব */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-blue-900 font-bold mb-3 border-b border-blue-200/60 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                বিগত মাসগুলোর হিসাব
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">বিগত মোট আয়:</span>
                  <span className="font-bold text-green-600">{fmt(monthlyData.summary.previousTotalIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">বিগত মোট ব্যয়:</span>
                  <span className="font-bold text-red-600">{fmt(monthlyData.summary.previousTotalExpense)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200/60 pt-2 font-semibold">
                  <span className="text-slate-700">বিগত নীট স্থিতি:</span>
                  <span className={monthlyData.summary.previousNetBalance >= 0 ? "text-blue-700 font-bold" : "text-red-600 font-bold"}>
                    {fmt(monthlyData.summary.previousNetBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* চলতি রিপোর্ট মাসের হিসাব */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-900 font-bold mb-3 border-b border-emerald-200/60 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                {fmtMonth(monthlyData.month)} মাসের হিসাব
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">রানিং আয়:</span>
                  <span className="font-bold text-green-600">৳ {fmt(monthlyData.summary.currentMonthIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">রানিং ব্যয়:</span>
                  <span className="font-bold text-red-600">৳ {fmt(monthlyData.summary.currentMonthExpense)}</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200/60 pt-2 font-semibold">
                  <span className="text-slate-700">রানিং নীট ফলাফল:</span>
                  <span className={monthlyData.summary.currentMonthNetBalance >= 0 ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
                    ৳ {fmt(monthlyData.summary.currentMonthNetBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* ফলাফল ও সমাপনী স্থিতি */}
            <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-800 font-bold mb-3 border-b border-slate-200 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                সর্বমোট ফলাফল (Cumulative)
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>সর্বমোট আয়:</span>
                  <span className="font-bold text-green-600">৳ {fmt(monthlyData.summary.totalIncome)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>সর্বমোট ব্যয়:</span>
                  <span className="font-bold text-red-600">৳ {fmt(monthlyData.summary.totalExpense)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-base text-slate-800">
                  <span>ফলাফল (স্থিতি):</span>
                  <span className={monthlyData.summary.finalBalance >= 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                    ৳ {fmt(monthlyData.summary.finalBalance)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ——— আয়-ব্যয় বিস্তারিত সারসংক্ষেপ ও ফলাফল বক্স ——— */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-800 text-white px-6 py-4">
              <h3 className="font-bold text-lg">আয়-ব্যয় সারসংক্ষেপ ও ফলাফল (Monthly Financial Summary)</h3>
              <p className="text-slate-300 text-xs mt-0.5">বিগত মাস ও চলতি মাসের সমন্বিত আর্থিক সারসংক্ষেপ</p>
            </div>
            <div className="p-6">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  <tr className="bg-blue-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      ১. বিগত মাসগুলোর টোটাল আয় (Previous Months' Total Income)
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-600 text-base">
                      ৳ {fmt(monthlyData.summary.previousTotalIncome)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      ২. বিগত মাসগুলোর টোটাল ব্যয় (Previous Months' Total Expense & Investment)
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-600 text-base">
                      ৳ {fmt(monthlyData.summary.previousTotalExpense)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/70 text-xs text-slate-500">
                    <td className="py-2 px-4 pl-8">
                      └ বিগত মাসগুলোর নীট উদ্বৃত্ত / স্থিতি (Previous Net Balance)
                    </td>
                    <td className={`py-2 px-4 text-right font-bold ${monthlyData.summary.previousNetBalance >= 0 ? "text-blue-600" : "text-red-500"}`}>
                      ৳ {fmt(monthlyData.summary.previousNetBalance)}
                    </td>
                  </tr>
                  <tr className="bg-green-50/40">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      ৩. রিপোর্ট মাসের রানিং আয় (Report Month's Running Income)
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-green-600 text-base">
                      ৳ {fmt(monthlyData.summary.currentMonthIncome)}
                    </td>
                  </tr>
                  <tr className="bg-red-50/30">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      ৪. রিপোর্ট মাসের রানিং ব্যয় (Report Month's Running Expense & Investment)
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-600 text-base">
                      ৳ {fmt(monthlyData.summary.currentMonthExpense)}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/70 text-xs text-slate-500">
                    <td className="py-2 px-4 pl-8">
                      └ রিপোর্ট মাসের নীট উদ্বৃত্ত / ঘাটতি (Report Month's Net Balance)
                    </td>
                    <td className={`py-2 px-4 text-right font-bold ${monthlyData.summary.currentMonthNetBalance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      ৳ {fmt(monthlyData.summary.currentMonthNetBalance)}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-medium text-slate-700">
                    <td className="py-2.5 px-4">
                      └ সর্বমোট আয় (বিগত + রানিং)
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-green-700">
                      ৳ {fmt(monthlyData.summary.totalIncome)}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-medium text-slate-700">
                    <td className="py-2.5 px-4">
                      └ সর্বমোট ব্যয় (বিগত + রানিং)
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-red-700">
                      ৳ {fmt(monthlyData.summary.totalExpense)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* ফলাফল কার্ড */}
              <div className={`mt-5 p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${monthlyData.summary.finalBalance >= 0
                ? "bg-green-50 border-green-200 text-green-900"
                : "bg-red-50 border-red-200 text-red-900"
                }`}>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-75">চূড়ান্ত ফলাফল (Final Result)</div>
                  <div className="text-lg font-black mt-0.5">
                    ৫. {monthlyData.summary.finalBalance >= 0 ? "সর্বমোট নীট উদ্বৃত্ত (Net Surplus)" : "সর্বমোট নীট ঘাটতি (Net Deficit)"}
                  </div>
                </div>
                <div className="text-2xl font-black">
                  ৳ {fmt(monthlyData.summary.finalBalance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ——— আয়ের বিবরণী ভিউ ——— */}
      {activeReportTab === "income_statement" && incomeData && (
        <div className="space-y-6">
          {/* প্রিন্ট হেডার */}
          <div className="hidden print:block text-center border-b-2 border-emerald-900 pb-4 mb-6 relative">
            {companyProfile?.logo && (
              <img
                src={`${process.env.API_HOST}${companyProfile.logo}`}
                alt="Logo"
                className="absolute left-0 top-0 h-14 w-14 object-contain"
              />
            )}
            <div className={`inline-block ${companyProfile?.logo ? "pr-14" : ""}`}>
              <div className="org-name text-xl font-bold text-emerald-900">{companyProfile?.name || "সমবায় সমিতি"}</div>
              <div className="report-title text-sm font-semibold text-slate-600">আয়ের বিবরণী (Income Statement)</div>
              {companyProfile?.address && (
                <div className="text-xs text-slate-500 mt-0.5">{companyProfile.address}</div>
              )}
              <div className="text-slate-600 text-xs font-semibold mt-1">
                {incomeData.from || incomeData.to
                  ? `সময়কাল: ${fmtDate(incomeData.from || "")} থেকে ${fmtDate(incomeData.to || "")}`
                  : "সর্বকালের শুরু থেকে আজ পর্যন্ত"}
              </div>
            </div>
          </div>

          {/* স্ক্রিন ব্যানার */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-xl p-6 text-white shadow flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Landmark size={28} className="text-emerald-400" />
                <div>
                  <h3 className="text-xl font-bold">আয়ের বিবরণী (Income Statement)</h3>
                  <p className="text-emerald-200 text-sm">
                    {incomeData.from || incomeData.to
                      ? `সময়কাল: ${fmtDate(incomeData.from || "")} হতে ${fmtDate(incomeData.to || "")}`
                      : "সর্বকালের সমস্ত আয়ের প্রতিবেদন"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-right">
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 border border-white/10">
                <div className="text-xs text-emerald-200">মোট ভাউচার সংখ্যা</div>
                <div className="text-lg font-bold text-white">{incomeData.totalCount} টি</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 border border-white/10">
                <div className="text-xs text-emerald-200">সর্বমোট আয়</div>
                <div className="text-xl font-bold text-emerald-400">৳ {fmt(incomeData.totalIncome)}</div>
              </div>
            </div>
          </div>

          {/* খাতভিত্তিক সারসংক্ষেপ টেবিল */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-emerald-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">খাতভিত্তিক আয়ের সারসংক্ষেপ (Category Breakdown)</h3>
              <span className="text-xs bg-emerald-800/80 px-3 py-1 rounded-full">{incomeData.categorySummary?.length || 0} টি খাত</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-left">আয়ের খাত (Category)</th>
                    <th className="px-6 py-3 font-semibold text-center">ভাউচার সংখ্যা</th>
                    <th className="px-6 py-3 font-semibold text-right text-emerald-700">টাকার পরিমাণ (Amount)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomeData.categorySummary?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-400">কোনো আয়ের বিবরণ পাওয়া যায়নি</td>
                    </tr>
                  ) : (
                    incomeData.categorySummary?.map((cat: any, idx: number) => (
                      <tr key={`inc-cat-${idx}`} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                        <td className="px-6 py-4 text-slate-800 font-semibold">{cat.category}</td>
                        <td className="px-6 py-4 text-center text-slate-600 font-medium">{cat.count} টি</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">৳ {fmt(cat.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {incomeData.categorySummary?.length > 0 && (
                  <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                    <tr>
                      <td className="px-6 py-3 font-bold text-slate-800">সর্বমোট আয়:</td>
                      <td className="px-6 py-3 text-center font-bold text-slate-800">{incomeData.totalCount} টি</td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-700 text-base">৳ {fmt(incomeData.totalIncome)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* আয়ের বিস্তারিত ভাউচার লেনদেন তালিকা */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">আয়ের বিস্তারিত ভাউচার তালিকা (Detailed Transactions)</h3>
              <span className="text-xs bg-slate-700 px-3 py-1 rounded-full">{incomeData.vouchers?.length || 0} টি লেনদেন</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center">ক্র নং</th>
                    <th className="px-4 py-3 font-semibold text-center">তারিখ</th>
                    <th className="px-4 py-3 font-semibold">ভাউচার নং</th>
                    <th className="px-4 py-3 font-semibold">আয়ের খাত</th>
                    <th className="px-4 py-3 font-semibold">সদস্য / বিবরণ</th>
                    <th className="px-6 py-3 font-semibold text-right text-emerald-700">পরিমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomeData.vouchers?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">কোনো লেনদেন পাওয়া যায়নি</td>
                    </tr>
                  ) : (
                    incomeData.vouchers?.map((v: any, idx: number) => (
                      <tr key={`inc-v-${idx}`} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                        <td className="px-4 py-3 text-center text-slate-500 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 text-center text-slate-700 text-xs whitespace-nowrap">{fmtDate(v.date)}</td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-900">{v.voucherNo || "-"}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{v.category}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {v.member ? (
                            <span>
                              <span className="font-semibold text-slate-800">{v.member.name}</span>
                              <span className="text-slate-400 ml-1">({v.member.memberId})</span>
                            </span>
                          ) : (
                            v.description || "-"
                          )}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-emerald-600">৳ {fmt(v.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {incomeData.vouchers?.length > 0 && (
                  <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                    <tr>
                      <td colSpan={5} className="px-6 py-3 font-bold text-slate-800 text-right">সর্বমোট সংগৃহীত আয়:</td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-700 text-base">৳ {fmt(incomeData.totalIncome)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ——— ব্যয়ের বিবরণী ভিউ ——— */}
      {activeReportTab === "expense_statement" && expenseData && (
        <div className="space-y-6">
          {/* প্রিন্ট হেডার */}
          <div className="hidden print:block text-center border-b-2 border-rose-900 pb-4 mb-6 relative">
            {companyProfile?.logo && (
              <img
                src={`${process.env.API_HOST}${companyProfile.logo}`}
                alt="Logo"
                className="absolute left-0 top-0 h-14 w-14 object-contain"
              />
            )}
            <div className={`inline-block ${companyProfile?.logo ? "pr-14" : ""}`}>
              <div className="org-name text-xl font-bold text-rose-900">{companyProfile?.name || "সমবায় সমিতি"}</div>
              <div className="report-title text-sm font-semibold text-slate-600">ব্যয়ের বিবরণী (Expense & Investment Statement)</div>
              {companyProfile?.address && (
                <div className="text-xs text-slate-500 mt-0.5">{companyProfile.address}</div>
              )}
              <div className="text-slate-600 text-xs font-semibold mt-1">
                {expenseData.from || expenseData.to
                  ? `সময়কাল: ${fmtDate(expenseData.from || "")} থেকে ${fmtDate(expenseData.to || "")}`
                  : "সর্বকালের শুরু থেকে আজ পর্যন্ত"}
              </div>
            </div>
          </div>

          {/* স্ক্রিন ব্যানার */}
          <div className="bg-gradient-to-r from-rose-900 via-red-900 to-slate-900 rounded-xl p-6 text-white shadow flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Landmark size={28} className="text-rose-400" />
                <div>
                  <h3 className="text-xl font-bold">ব্যয়ের বিবরণী (Expense Statement)</h3>
                  <p className="text-rose-200 text-sm">
                    {expenseData.from || expenseData.to
                      ? `সময়কাল: ${fmtDate(expenseData.from || "")} হতে ${fmtDate(expenseData.to || "")}`
                      : "সর্বকালের সমস্ত ব্যয়ের প্রতিবেদন"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-right">
              <div className="bg-white/10 backdrop-blur rounded-lg px-3.5 py-2 border border-white/10">
                <div className="text-xs text-rose-200">সাধারণ পরিচালন ব্যয়</div>
                <div className="text-base font-bold text-rose-300">৳ {fmt(expenseData.totalExpense)}</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-3.5 py-2 border border-white/10">
                <div className="text-xs text-blue-200">বিনিয়োগ বাবদ ব্যয়</div>
                <div className="text-base font-bold text-blue-300">৳ {fmt(expenseData.totalInvestment)}</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 border border-white/10">
                <div className="text-xs text-rose-200">সর্বমোট ব্যয় ও বিনিয়োগ</div>
                <div className="text-xl font-bold text-rose-400">৳ {fmt(expenseData.grandTotalExpense)}</div>
              </div>
            </div>
          </div>

          {/* খাতভিত্তিক সারসংক্ষেপ টেবিল */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-rose-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">খাতভিত্তিক ব্যয়ের সারসংক্ষেপ (Category Summary)</h3>
              <span className="text-xs bg-rose-700/80 px-3 py-1 rounded-full">{(expenseData.expenseCategories?.length || 0) + (expenseData.investmentCategories?.length || 0)} টি খাত</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-left">ব্যয়ের খাত (Category)</th>
                    <th className="px-6 py-3 font-semibold text-center">ব্যয়ের ধরন (Type)</th>
                    <th className="px-6 py-3 font-semibold text-center">ভাউচার সংখ্যা</th>
                    <th className="px-6 py-3 font-semibold text-right text-rose-600">টাকার পরিমাণ (Amount)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenseData.expenseCategories?.length === 0 && expenseData.investmentCategories?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">কোনো ব্যয়ের বিবরণ পাওয়া যায়নি</td>
                    </tr>
                  ) : (
                    <>
                      {expenseData.expenseCategories?.map((cat: any, idx: number) => (
                        <tr key={`exp-cat-${idx}`} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                          <td className="px-6 py-4 text-slate-800 font-semibold">{cat.category}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              সাধারণ পরিচালন ব্যয়
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600 font-medium">{cat.count} টি</td>
                          <td className="px-6 py-4 text-right font-bold text-rose-600 text-base">৳ {fmt(cat.amount)}</td>
                        </tr>
                      ))}
                      {expenseData.investmentCategories?.map((cat: any, idx: number) => (
                        <tr key={`inv-cat-${idx}`} className="bg-blue-50/30">
                          <td className="px-6 py-4 text-slate-800 font-semibold">{cat.category}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              বিনিয়োগ বাবদ খরচ
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-600 font-medium">{cat.count} টি</td>
                          <td className="px-6 py-4 text-right font-bold text-blue-600 text-base">৳ {fmt(cat.amount)}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
                {((expenseData.expenseCategories?.length || 0) > 0 || (expenseData.investmentCategories?.length || 0) > 0) && (
                  <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                    <tr>
                      <td colSpan={2} className="px-6 py-3 font-bold text-slate-800">সর্বমোট ব্যয় ও বিনিয়োগ:</td>
                      <td className="px-6 py-3 text-center font-bold text-slate-800">{expenseData.totalCount} টি</td>
                      <td className="px-6 py-3 text-right font-bold text-rose-700 text-base">৳ {fmt(expenseData.grandTotalExpense)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* ব্যয়ের বিস্তারিত ভাউচার লেনদেন তালিকা */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">ব্যয়ের বিস্তারিত ভাউচার তালিকা (Detailed Transactions)</h3>
              <span className="text-xs bg-slate-700 px-3 py-1 rounded-full">{expenseData.vouchers?.length || 0} টি লেনদেন</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center">ক্র নং</th>
                    <th className="px-4 py-3 font-semibold text-center">তারিখ</th>
                    <th className="px-4 py-3 font-semibold">ভাউচার নং</th>
                    <th className="px-4 py-3 font-semibold">খাত</th>
                    <th className="px-4 py-3 font-semibold text-center">ধরন</th>
                    <th className="px-4 py-3 font-semibold">বিবরণ / গ্রহীতা</th>
                    <th className="px-6 py-3 font-semibold text-right text-rose-600">পরিমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenseData.vouchers?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">কোনো লেনদেন পাওয়া যায়নি</td>
                    </tr>
                  ) : (
                    expenseData.vouchers?.map((v: any, idx: number) => (
                      <tr key={`exp-v-${idx}`} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                        <td className="px-4 py-3 text-center text-slate-500 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 text-center text-slate-700 text-xs whitespace-nowrap">{fmtDate(v.date)}</td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-900">{v.voucherNo || "-"}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{v.category}</td>
                        <td className="px-4 py-3 text-center text-xs">
                          <span className={`px-2 py-0.5 rounded font-semibold ${v.type === "INVESTMENT" ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800"}`}>
                            {v.type === "INVESTMENT" ? "বিনিয়োগ" : "সাধারণ ব্যয়"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {v.member ? (
                            <span>
                              <span className="font-semibold text-slate-800">{v.member.name}</span>
                              <span className="text-slate-400 ml-1">({v.member.memberId})</span>
                            </span>
                          ) : (
                            v.description || "-"
                          )}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-rose-600">৳ {fmt(v.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {expenseData.vouchers?.length > 0 && (
                  <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                    <tr>
                      <td colSpan={6} className="px-6 py-3 font-bold text-slate-800 text-right">সর্বমোট ব্যয় ও বিনিয়োগ:</td>
                      <td className="px-6 py-3 text-right font-bold text-rose-700 text-base">৳ {fmt(expenseData.grandTotalExpense)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ——— বিনিয়োগ বিবরণী ভিউ ——— */}
      {activeReportTab === "investment_statement" && investmentData && (
        <div className="space-y-6">
          {/* প্রিন্ট হেডার */}
          <div className="hidden print:block text-center border-b-2 border-indigo-900 pb-4 mb-6 relative">
            {companyProfile?.logo && (
              <img
                src={`${process.env.API_HOST}${companyProfile.logo}`}
                alt="Logo"
                className="absolute left-0 top-0 h-14 w-14 object-contain"
              />
            )}
            <div className={`inline-block ${companyProfile?.logo ? "pr-14" : ""}`}>
              <div className="org-name text-xl font-bold text-indigo-900">{companyProfile?.name || "সমবায় সমিতি"}</div>
              <div className="report-title text-sm font-semibold text-slate-600">বিনিয়োগ বিবরণী (Investment Statement)</div>
              {companyProfile?.address && (
                <div className="text-xs text-slate-500 mt-0.5">{companyProfile.address}</div>
              )}
              <div className="text-slate-600 text-xs font-semibold mt-1">
                {investmentData.from || investmentData.to
                  ? `সময়কাল: ${fmtDate(investmentData.from || "")} থেকে ${fmtDate(investmentData.to || "")}`
                  : "সর্বকালের শুরু থেকে আজ পর্যন্ত"}
              </div>
            </div>
          </div>

          {/* স্ক্রিন ব্যানার */}
          <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-xl p-6 text-white shadow flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Landmark size={28} className="text-indigo-400" />
                <div>
                  <h3 className="text-xl font-bold">বিনিয়োগ বিবরণী (Investment Statement)</h3>
                  <p className="text-indigo-200 text-sm">
                    {investmentData.from || investmentData.to
                      ? `সময়কাল: ${fmtDate(investmentData.from || "")} হতে ${fmtDate(investmentData.to || "")}`
                      : "সর্বকালের সমস্ত বিনিয়োগের প্রতিবেদন"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-right">
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 border border-white/10">
                <div className="text-xs text-indigo-200">মোট বিনিয়োগ ভাউচার</div>
                <div className="text-lg font-bold text-white">{investmentData.totalCount} টি</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 border border-white/10">
                <div className="text-xs text-indigo-200">সর্বমোট বিনিয়োগ বাবদ খরচ</div>
                <div className="text-xl font-bold text-indigo-300">৳ {fmt(investmentData.totalInvestment)}</div>
              </div>
            </div>
          </div>

          {/* খাতভিত্তিক সারসংক্ষেপ টেবিল */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">খাতভিত্তিক বিনিয়োগের সারসংক্ষেপ (Category Breakdown)</h3>
              <span className="text-xs bg-indigo-800/80 px-3 py-1 rounded-full">{investmentData.categorySummary?.length || 0} টি খাত</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-left">বিনিয়োগের খাত (Category)</th>
                    <th className="px-6 py-3 font-semibold text-center">ভাউচার সংখ্যা</th>
                    <th className="px-6 py-3 font-semibold text-right text-indigo-700">টাকার পরিমাণ (Amount)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {investmentData.categorySummary?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-400">কোনো বিনিয়োগের বিবরণ পাওয়া যায়নি</td>
                    </tr>
                  ) : (
                    investmentData.categorySummary?.map((cat: any, idx: number) => (
                      <tr key={`inv-cat-${idx}`} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                        <td className="px-6 py-4 text-slate-800 font-semibold">{cat.category}</td>
                        <td className="px-6 py-4 text-center text-slate-600 font-medium">{cat.count} টি</td>
                        <td className="px-6 py-4 text-right font-bold text-indigo-600 text-base">৳ {fmt(cat.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {investmentData.categorySummary?.length > 0 && (
                  <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                    <tr>
                      <td className="px-6 py-3 font-bold text-slate-800">সর্বমোট বিনিয়োগ:</td>
                      <td className="px-6 py-3 text-center font-bold text-slate-800">{investmentData.totalCount} টি</td>
                      <td className="px-6 py-3 text-right font-bold text-indigo-700 text-base">৳ {fmt(investmentData.totalInvestment)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* বিনিয়োগের বিস্তারিত ভাউচার লেনদেন তালিকা */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">বিনিয়োগের বিস্তারিত ভাউচার তালিকা (Detailed Transactions)</h3>
              <span className="text-xs bg-slate-700 px-3 py-1 rounded-full">{investmentData.vouchers?.length || 0} টি লেনদেন</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center">ক্র নং</th>
                    <th className="px-4 py-3 font-semibold text-center">তারিখ</th>
                    <th className="px-4 py-3 font-semibold">ভাউচার নং</th>
                    <th className="px-4 py-3 font-semibold">বিনিয়োগের খাত</th>
                    <th className="px-4 py-3 font-semibold">বিবরণ / খাত সংশ্লিষ্ট তথ্য</th>
                    <th className="px-6 py-3 font-semibold text-right text-indigo-700">পরিমাণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {investmentData.vouchers?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">কোনো লেনদেন পাওয়া যায়নি</td>
                    </tr>
                  ) : (
                    investmentData.vouchers?.map((v: any, idx: number) => (
                      <tr key={`inv-v-${idx}`} className={idx % 2 === 0 ? "" : "bg-slate-50/40"}>
                        <td className="px-4 py-3 text-center text-slate-500 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 text-center text-slate-700 text-xs whitespace-nowrap">{fmtDate(v.date)}</td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-900">{v.voucherNo || "-"}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{v.category}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {v.member ? (
                            <span>
                              <span className="font-semibold text-slate-800">{v.member.name}</span>
                              <span className="text-slate-400 ml-1">({v.member.memberId})</span>
                            </span>
                          ) : (
                            v.description || "-"
                          )}
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-indigo-600">৳ {fmt(v.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {investmentData.vouchers?.length > 0 && (
                  <tfoot className="border-t-2 border-slate-300 bg-slate-100">
                    <tr>
                      <td colSpan={5} className="px-6 py-3 font-bold text-slate-800 text-right">সর্বমোট বিনিয়োগ বাবদ খরচ:</td>
                      <td className="px-6 py-3 text-right font-bold text-indigo-700 text-base">৳ {fmt(investmentData.totalInvestment)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
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

      {activeReportTab === "monthly_association" && !loadingMonthly && !monthlyData && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <FileText size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">মাসিক সমিতি আয়-ব্যয় বিবরণী</p>
          <p className="text-sm mt-1">রিপোর্ট মাস নির্বাচন করে বিবরণী দেখুন বাটনে ক্লিক করুন</p>
        </div>
      )}

      {activeReportTab === "income_statement" && !loadingIncome && !incomeData && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <FileText size={48} className="mx-auto mb-3 text-emerald-400" />
          <p className="text-lg font-medium text-slate-700">আয়ের বিবরণী (Income Statement)</p>
          <p className="text-sm mt-1">তারিখ সীমা নির্ধারণ করে আয়ের বিবরণী দেখুন বাটনে ক্লিক করুন</p>
        </div>
      )}

      {activeReportTab === "expense_statement" && !loadingExpense && !expenseData && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <FileText size={48} className="mx-auto mb-3 text-rose-400" />
          <p className="text-lg font-medium text-slate-700">ব্যয়ের বিবরণী (Expense Statement)</p>
          <p className="text-sm mt-1">তারিখ সীমা নির্ধারণ করে ব্যয়ের বিবরণী দেখুন বাটনে ক্লিক করুন</p>
        </div>
      )}

      {activeReportTab === "investment_statement" && !loadingInvestment && !investmentData && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <FileText size={48} className="mx-auto mb-3 text-indigo-400" />
          <p className="text-lg font-medium text-slate-700">বিনিয়োগ বিবরণী (Investment Statement)</p>
          <p className="text-sm mt-1">তারিখ সীমা নির্ধারণ করে বিনিয়োগ বিবরণী দেখুন বাটনে ক্লিক করুন</p>
        </div>
      )}
    </div>
  );
}
