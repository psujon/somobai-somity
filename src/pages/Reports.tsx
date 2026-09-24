import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FileText, Printer, Search, ChevronDown, ArrowDownCircle, ArrowUpCircle, Landmark, Download, Building2 } from "lucide-react";
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
  const [activeReportTab, setActiveReportTab] = useState<"member" | "association" | "monthly_association" | "income_statement" | "expense_statement" | "investment_statement" | "project_summary">("member");
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

  // ——— প্রজেক্ট বিবরণী ———
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [projectReportData, setProjectReportData] = useState<any>(null);
  const [loadingProjectReport, setLoadingProjectReport] = useState(false);
  const [projectVoucherSearch, setProjectVoucherSearch] = useState("");

  // ——— কোম্পানি প্রোফাইল ———
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  // সদস্য তালিকা, কোম্পানি প্রোফাইল ও প্রজেক্ট তালিকা লোড
  useEffect(() => {
    axios.get(`${process.env.API_HOST}/api/members`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setMembers(res.data))
      .finally(() => setLoadingMembers(false));

    axios.get(`${process.env.API_HOST}/api/company-profile`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => setCompanyProfile(res.data)).catch(() => { });

    axios.get(`${process.env.API_HOST}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      if (res.data && res.data.projects) {
        setProjectsList(res.data.projects);
      }
    }).catch(() => { });
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

  // প্রজেক্ট বিবরণী ফেচ
  const fetchProjectReport = async (overrideProjectId?: string) => {
    const projIdToFetch = overrideProjectId !== undefined ? overrideProjectId : selectedProjectId;
    setLoadingProjectReport(true);
    setProjectReportData(null);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      if (projIdToFetch === "ALL") {
        const res = await axios.get(
          `${process.env.API_HOST}/api/projects?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProjectReportData({ mode: "ALL", data: res.data });
      } else {
        const res = await axios.get(
          `${process.env.API_HOST}/api/projects/${projIdToFetch}?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProjectReportData({ mode: "SINGLE", data: res.data });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "প্রজেক্ট বিবরণী লোড করতে ব্যর্থ হয়েছে");
    } finally {
      setLoadingProjectReport(false);
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

  const getMonthlyAssociationReportHTML = (isForPdf: boolean = false) => {
    if (!monthlyData) return "";

    const cellPadding = isForPdf ? "4px 8px" : "8px 12px";
    const cellFontSize = isForPdf ? "10px" : "12px";

    const incomesHtml = monthlyData.incomes.length === 0
      ? `<tr><td colspan="2" style="text-align:center;padding:${isForPdf ? '8px' : '12px'};color:#94a3b8;font-size:${cellFontSize};">কোনো আয়ের বিবরণ পাওয়া যায়নি</td></tr>`
      : monthlyData.incomes.map((inc: any) => `
          <tr>
            <td style="padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};">${inc.category}</td>
            <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;font-weight:600;color:#16a34a;font-size:${cellFontSize};">৳ ${fmt(inc.amount)}</td>
          </tr>
        `).join('');

    const expensesHtml = monthlyData.expenses.length === 0 && (!monthlyData.investments || monthlyData.investments.length === 0)
      ? `<tr><td colspan="2" style="text-align:center;padding:${isForPdf ? '8px' : '12px'};color:#94a3b8;font-size:${cellFontSize};">কোনো ব্যয়ের বিবরণ পাওয়া যায়নি</td></tr>`
      : monthlyData.expenses.map((exp: any) => `
          <tr>
            <td style="padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};">${exp.category}</td>
            <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;font-weight:600;color:#dc2626;font-size:${cellFontSize};">৳ ${fmt(exp.amount)}</td>
          </tr>
        `).join('') +
      (monthlyData.investments && monthlyData.investments.length > 0
        ? `<tr><td colspan="2" style="background:#f1f5f9;font-weight:bold;padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;color:#334155;font-size:${cellFontSize};">বিনিয়োগ বাবদ খরচ (Investments)</td></tr>` +
        monthlyData.investments.map((inv: any) => `
            <tr>
              <td style="padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};">${inv.category}</td>
              <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;font-weight:600;color:#dc2626;font-size:${cellFontSize};">৳ ${fmt(inv.amount)}</td>
            </tr>
          `).join('')
        : '');

    const summary = monthlyData.summary;
    const finalResultLabel = summary.finalBalance >= 0 ? "সর্বমোট নীট উদ্বৃত্ত (Cumulative Net Surplus)" : "সর্বমোট নীট ঘাটতি (Cumulative Net Deficit)";

    return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/>
      <title>মাসিক আয়-ব্যয় বিবরণী — ${fmtMonth(monthlyData.month)}</title>
      <style>
        *{box-sizing:border-box}
        body{width:800px;font-family:Arial,sans-serif;font-size:${isForPdf ? '11px' : '13px'};color:#1e293b;margin:${isForPdf ? '0 auto' : '28px auto'};padding:${isForPdf ? '6px 12px' : '10px'}}
        h1{font-size:${isForPdf ? '18px' : '20px'};color:#1e3a5f;margin:0}h2{font-size:${isForPdf ? '13px' : '14px'};color:#334155;margin:3px 0 0}
        .hdr{display:flex;align-items:center;justify-content:center;gap:16px;border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:18px}
        .table-title{background:#1e3a5f;color:#fff;padding:${isForPdf ? '5px 8px' : '8px 12px'};font-weight:bold;font-size:${isForPdf ? '11px' : '14px'};border-top-left-radius:${isForPdf ? '4px' : '6px'};border-top-right-radius:${isForPdf ? '4px' : '6px'}}
        table{width:100%;border-collapse:collapse;font-size:${cellFontSize}}th{background:#f8fafc;padding:${cellPadding};border:1px solid #e2e8f0;font-weight:600;text-align:left;font-size:${cellFontSize}}td{padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize}}
        .summary-box{background:#f8fafc;border:1px solid #cbd5e1;border-radius:${isForPdf ? '4px' : '6px'};padding:${isForPdf ? '10px 12px' : '16px'};margin-top:${isForPdf ? '14px' : '24px'}}
        @media print{body{width:800px;margin:12px}@page{size:A4 portrait;margin:12mm}}
      </style></head><body>
      <table style="width:100%; border-collapse:collapse; ${isForPdf ? '' : 'border-bottom:2px solid #1e3a5f; margin-bottom:18px; padding-bottom:12px;'}">
        <tr>
          ${companyProfile?.logo ? `
          <td style="width:${isForPdf ? '60px' : '70px'}; vertical-align:middle; border:none; padding:0;">
            <img src="${process.env.API_HOST}${companyProfile.logo}" style="height:${isForPdf ? '50px' : '60px'}; width:${isForPdf ? '50px' : '60px'}; object-fit:contain; display:block;" alt="Logo"/>
          </td>` : ''}
          <td style="vertical-align:middle; text-align:center; border:none; padding:0;">
            <div style="${companyProfile?.logo ? (isForPdf ? 'margin-right:60px;' : 'margin-right:70px;') : ''}">
              <h1 style="font-size:${isForPdf ? '18px' : '20px'}; color:#1e3a5f; margin:0;">${companyProfile?.name || 'সমবায় সমিতি'}</h1>
              ${companyProfile?.address ? `<div style="font-size:${isForPdf ? '10px' : '11px'}; color:#64748b; margin-top:2px;">${companyProfile.address}</div>` : ''}
              <h2 style="font-size:${isForPdf ? '13px' : '14px'}; color:#334155; margin:3px 0 0;">মাসিক আয়-ব্যয় বিবরণী</h2>
              <div style="font-size:${isForPdf ? '11px' : '12px'}; font-weight:bold; color:#1e3a5f; margin-top:3px;">
                রিপোর্ট মাস: ${fmtMonth(monthlyData.month)} (${fmtDate(monthlyData.startDate)} থেকে ${fmtDate(monthlyData.endDate)})
              </div>
              <div style="font-size:${isForPdf ? '10px' : '11px'}; color:#64748b; margin-top:3px; ${isForPdf ? 'margin-bottom:8px; line-height:1.2;' : ''} text-align:right">মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </td>
        </tr>
      </table>
      ${isForPdf ? '<div style="border-bottom:2px solid #1e3a5f; margin:0 0 14px 0; clear:both; width:100%;"></div>' : ''}

      <!-- Table-based Grid layout for side-by-side columns -->
      <table style="width:100%; border-collapse:collapse; border:none; margin-bottom:${isForPdf ? '12px' : '20px'}; table-layout:fixed;">
        <tr>
          <!-- Income Column -->
          <td style="width:50%; vertical-align:top; border:none; padding:0 ${isForPdf ? '6px' : '10px'} 0 0;">
            <div class="table-title">আয় সমূহ (Monthly Incomes)</div>
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:${cellPadding};border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:left;font-size:${cellFontSize};">আয়ের খাত (Category)</th>
                  <th style="padding:${cellPadding};border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:right;font-size:${cellFontSize};">টাকার পরিমাণ (Amount)</th>
                </tr>
              </thead>
              <tbody>${incomesHtml}</tbody>
              <tfoot>
                <tr style="background:#f8fafc;font-weight:bold;">
                  <td style="padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};">মোট রানিং আয় (Total Month Income)</td>
                  <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;color:#16a34a;font-size:${cellFontSize};">৳ ${fmt(summary.currentMonthIncome)}</td>
                </tr>
              </tfoot>
            </table>
          </td>
          <!-- Expense Column -->
          <td style="width:50%; vertical-align:top; border:none; padding:0 0 0 ${isForPdf ? '6px' : '10px'};">
            <div class="table-title">ব্যয় ও বিনিয়োগ (Expenses & Investments)</div>
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="padding:${cellPadding};border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:left;font-size:${cellFontSize};">খাত (Category)</th>
                  <th style="padding:${cellPadding};border:1px solid #cbd5e1;background:#f8fafc;font-weight:600;text-align:right;font-size:${cellFontSize};">টাকার পরিমাণ (Amount)</th>
                </tr>
              </thead>
              <tbody>${expensesHtml}</tbody>
              <tfoot>
                <tr style="background:#f8fafc;font-weight:bold;">
                  <td style="padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};">মোট রানিং ব্যয় ও বিনিয়োগ</td>
                  <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;color:#dc2626;font-size:${cellFontSize};">৳ ${fmt(summary.currentMonthExpense)}</td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>
      </table>

      <!-- ৩টি সারসংক্ষেপ মেট্রিক কার্ড (Metric Cards) -->
      <table style="width:100%; border-collapse:separate; border-spacing:${isForPdf ? '6px' : '10px'} 0; margin-bottom:${isForPdf ? '12px' : '20px'}; table-layout:fixed;">
        <tr>
          <!-- Card 1: বিগত মাসগুলোর হিসাব -->
          <td style="width:33.33%; vertical-align:top; border:1px solid #bfdbfe; background:#eff6ff; border-radius:${isForPdf ? '4px' : '6px'}; padding:${isForPdf ? '6px 8px' : '10px 12px'};">
            <div style="font-weight:bold; font-size:${isForPdf ? '10px' : '12px'}; color:#1e3a5f; border-bottom:1px solid #bfdbfe; padding-bottom:${isForPdf ? '2px' : '4px'}; margin-bottom:${isForPdf ? '4px' : '6px'};">
              <span style="color:#2563eb; font-size:${isForPdf ? '10px' : '12px'}; margin-right:3px;">●</span> বিগত মাসগুলোর হিসাব
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:${isForPdf ? '9.5px' : '11px'};">
              <tr>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; color:#475569;">বিগত মোট আয়:</td>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.previousTotalIncome)}</td>
              </tr>
              <tr>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; color:#475569;">বিগত মোট ব্যয়:</td>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.previousTotalExpense)}</td>
              </tr>
              <tr style="border-top:1px solid #bfdbfe;">
                <td style="padding:${isForPdf ? '3px 0 0 0' : '4px 0 0 0'}; border:none; font-weight:bold; color:#1e3a5f;">বিগত নীট স্থিতি:</td>
                <td style="padding:${isForPdf ? '3px 0 0 0' : '4px 0 0 0'}; border:none; text-align:right; color:${summary.previousNetBalance >= 0 ? '#2563eb' : '#dc2626'}; font-weight:bold;">৳ ${fmt(summary.previousNetBalance)}</td>
              </tr>
            </table>
          </td>

          <!-- Card 2: রিপোর্ট মাসের হিসাব -->
          <td style="width:33.33%; vertical-align:top; border:1px solid #bbf7d0; background:#f0fdf4; border-radius:${isForPdf ? '4px' : '6px'}; padding:${isForPdf ? '6px 8px' : '10px 12px'};">
            <div style="font-weight:bold; font-size:${isForPdf ? '10px' : '12px'}; color:#166534; border-bottom:1px solid #bbf7d0; padding-bottom:${isForPdf ? '2px' : '4px'}; margin-bottom:${isForPdf ? '4px' : '6px'};">
              <span style="color:#16a34a; font-size:${isForPdf ? '10px' : '12px'}; margin-right:3px;">●</span> রিপোর্ট মাসের হিসাব (${fmtMonth(monthlyData.month)})
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:${isForPdf ? '9.5px' : '11px'};">
              <tr>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; color:#475569;">রানিং আয়:</td>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.currentMonthIncome)}</td>
              </tr>
              <tr>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; color:#475569;">রানিং ব্যয়:</td>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.currentMonthExpense)}</td>
              </tr>
              <tr style="border-top:1px solid #bbf7d0;">
                <td style="padding:${isForPdf ? '3px 0 0 0' : '4px 0 0 0'}; border:none; font-weight:bold; color:#166534;">রানিং নীট ফলাফল:</td>
                <td style="padding:${isForPdf ? '3px 0 0 0' : '4px 0 0 0'}; border:none; text-align:right; color:${summary.currentMonthNetBalance >= 0 ? '#16a34a' : '#dc2626'}; font-weight:bold;">৳ ${fmt(summary.currentMonthNetBalance)}</td>
              </tr>
            </table>
          </td>

          <!-- Card 3: সর্বমোট ফলাফল -->
          <td style="width:33.33%; vertical-align:top; border:1px solid #cbd5e1; background:#f8fafc; border-radius:${isForPdf ? '4px' : '6px'}; padding:${isForPdf ? '6px 8px' : '10px 12px'}; color:#1e293b;">
            <div style="font-weight:bold; font-size:${isForPdf ? '10px' : '12px'}; color:#1e293b; border-bottom:1px solid #cbd5e1; padding-bottom:${isForPdf ? '2px' : '4px'}; margin-bottom:${isForPdf ? '4px' : '6px'};">
              <span style="color:#475569; font-size:${isForPdf ? '10px' : '12px'}; margin-right:3px;">●</span> সর্বমোট ফলাফল (Cumulative)
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:${isForPdf ? '9.5px' : '11px'};">
              <tr>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; color:#475569;">সর্বমোট আয়:</td>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.totalIncome)}</td>
              </tr>
              <tr>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; color:#475569;">সর্বমোট ব্যয়:</td>
                <td style="padding:${isForPdf ? '2px 0' : '3px 0'}; border:none; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.totalExpense)}</td>
              </tr>
              <tr style="border-top:1px solid #cbd5e1;">
                <td style="padding:${isForPdf ? '3px 0 0 0' : '4px 0 0 0'}; border:none; font-weight:bold; color:#1e293b;">ফলাফল (স্থিতি):</td>
                <td style="padding:${isForPdf ? '3px 0 0 0' : '4px 0 0 0'}; border:none; text-align:right; color:${summary.finalBalance >= 0 ? '#16a34a' : '#dc2626'}; font-weight:bold; font-size:${isForPdf ? '9.5px' : '11px'};">৳ ${fmt(summary.finalBalance)}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Summary Box with 5 Requested Metrics -->
      <div class="summary-box">
        <div style="font-weight:bold;font-size:${isForPdf ? '11px' : '14px'};color:#1e3a5f;margin-bottom:${isForPdf ? '8px' : '12px'};border-bottom:1px solid #cbd5e1;padding-bottom:${isForPdf ? '4px' : '6px'};">
          আয়-ব্যয় সারসংক্ষেপ ও ফলাফল (Monthly Financial Summary & Final Result)
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:${isForPdf ? '9.5px' : '12px'};">
          <tr style="background:#eff6ff;">
            <td style="padding:${isForPdf ? '4px 8px' : '7px 10px'}; border:1px solid #cbd5e1; font-weight:600; color:#1e3a5f;">১. বিগত মাসগুলোর সর্বমোট আয় (Previous Months' Total Income):</td>
            <td style="padding:${isForPdf ? '4px 8px' : '7px 10px'}; border:1px solid #cbd5e1; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.previousTotalIncome)}</td>
          </tr>
          <tr style="background:#fff;">
            <td style="padding:${isForPdf ? '4px 8px' : '7px 10px'}; border:1px solid #cbd5e1; font-weight:600; color:#1e3a5f;">২. বিগত মাসগুলোর সর্বমোট ব্যয় ও বিনিয়োগ (Previous Months' Total Expense & Investment):</td>
            <td style="padding:${isForPdf ? '4px 8px' : '7px 10px'}; border:1px solid #cbd5e1; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.previousTotalExpense)}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:${isForPdf ? '3px 8px' : '6px 10px'}; border:1px solid #cbd5e1; color:#64748b; padding-left:${isForPdf ? '16px' : '24px'};">└ বিগত মাসগুলোর নীট স্থিতি (Previous Net Balance):</td>
            <td style="padding:${isForPdf ? '3px 8px' : '6px 10px'}; border:1px solid #cbd5e1; text-align:right; color:${summary.previousNetBalance >= 0 ? '#16a34a' : '#dc2626'}; font-weight:600;">৳ ${fmt(summary.previousNetBalance)}</td>
          </tr>
          <tr style="background:#f0fdf4;">
            <td style="padding:${isForPdf ? '4px 8px' : '7px 10px'}; border:1px solid #cbd5e1; font-weight:600; color:#1e3a5f;">৩. আয় (Report Month's Running Income):</td>
            <td style="padding:${isForPdf ? '4px 8px' : '7px 10px'}; border:1px solid #cbd5e1; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.currentMonthIncome)}</td>
          </tr>
          <tr style="background:#fef2f2;">
            <td style="padding:${isForPdf ? '4px 8px' : '7px 10px'}; border:1px solid #cbd5e1; font-weight:600; color:#1e3a5f;">৪. ব্যয় (Report Month's Running Expense & Investment):</td>
            <td style="padding:${isForPdf ? '4px 8px' : '7px 10px'}; border:1px solid #cbd5e1; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.currentMonthExpense)}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:${isForPdf ? '3px 8px' : '6px 10px'}; border:1px solid #cbd5e1; color:#64748b; padding-left:${isForPdf ? '16px' : '24px'};">└ নীট ফলাফল (This Month's Net Balance):</td>
            <td style="padding:${isForPdf ? '3px 8px' : '6px 10px'}; border:1px solid #cbd5e1; text-align:right; color:${summary.currentMonthNetBalance >= 0 ? '#16a34a' : '#dc2626'}; font-weight:600;">৳ ${fmt(summary.currentMonthNetBalance)}</td>
          </tr>
          <tr style="background:#f1f5f9;">
            <td style="padding:${isForPdf ? '3px 8px' : '6px 10px'}; border:1px solid #cbd5e1; color:#334155; font-weight:600;">└ সর্বমোট আয় (বিগত + রানিং):</td>
            <td style="padding:${isForPdf ? '3px 8px' : '6px 10px'}; border:1px solid #cbd5e1; text-align:right; color:#16a34a; font-weight:bold;">৳ ${fmt(summary.totalIncome)}</td>
          </tr>
          <tr style="background:#f1f5f9;">
            <td style="padding:${isForPdf ? '3px 8px' : '6px 10px'}; border:1px solid #cbd5e1; color:#334155; font-weight:600;">└ সর্বমোট ব্যয় (বিগত + রানিং):</td>
            <td style="padding:${isForPdf ? '3px 8px' : '6px 10px'}; border:1px solid #cbd5e1; text-align:right; color:#dc2626; font-weight:bold;">৳ ${fmt(summary.totalExpense)}</td>
          </tr>
          <tr style="background:#1e3a5f; color:#fff;">
            <td style="padding:${isForPdf ? '6px 8px' : '10px'}; border:1px solid #1e3a5f; font-size:${isForPdf ? '11px' : '14px'}; font-weight:bold; color:#fff;">৫. ${finalResultLabel}:</td>
            <td style="padding:${isForPdf ? '6px 8px' : '10px'}; border:1px solid #1e3a5f; text-align:right; font-size:${isForPdf ? '11.5px' : '15px'}; font-weight:bold; color:${summary.finalBalance >= 0 ? '#4ade80' : '#f87171'};">৳ ${fmt(summary.finalBalance)}</td>
          </tr>
        </table>
      </div>

      <!-- Signatures with Table layout -->
      <table style="width:100%; border-collapse:collapse; border:none; margin-top:${isForPdf ? '40px' : '70px'}; text-align:center; font-size:${isForPdf ? '10px' : '12px'}; color:#64748b;">
        <tr>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '150px'};margin:0 auto;padding-top:4px;">প্রস্তুতকারীর স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '150px'};margin:0 auto;padding-top:4px;">কোষাধক্ষের স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '150px'};margin:0 auto;padding-top:4px;">সহ-সভাপতির স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '150px'};margin:0 auto;padding-top:4px;">সভাপতির স্বাক্ষর</div></td>
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

  // ——— প্রজেক্ট বিবরণী HTML জেনারেটর ———
  const getProjectReportHTML = (isForPdf: boolean = false) => {
    if (!projectReportData) return "";

    const cellPadding = isForPdf ? "4px 8px" : "8px 12px";
    const cellFontSize = isForPdf ? "10px" : "12px";

    const reportTimeText = (fromDate || toDate)
      ? `সময়কাল: ${fromDate ? fmtDate(fromDate) : "শুরু"} থেকে ${toDate ? fmtDate(toDate) : "আজ পর্যন্ত"}`
      : "সর্বকালের শুরু থেকে আজ পর্যন্ত";

    // Mode A: সকল প্রজেক্ট (ALL Projects)
    if (projectReportData.mode === "ALL") {
      const summary = projectReportData.data.summary;
      const projects = projectReportData.data.projects || [];
      const totalBudget = projects.reduce((acc: number, p: any) => acc + (p.budget || 0), 0);
      const totalExpAndInv = summary.overallExpense + summary.overallInvestment;

      const projectRows = projects.map((p: any, i: number) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;font-size:${cellFontSize};">${i + 1}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};">
            <strong>${p.name}</strong>
            ${p.code ? `<div style="font-size:9px;color:#64748b;">${p.code}</div>` : ''}
          </td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};">${p.location || '-'}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;font-size:${cellFontSize};">
            ${p.status === 'ONGOING' ? 'চলমান' : p.status === 'COMPLETED' ? 'সম্পন্ন' : p.status === 'PLANNED' ? 'পরিকল্পিত' : 'স্থগিত'}
          </td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;font-size:${cellFontSize};">৳ ${fmt(p.budget || 0)}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;color:#16a34a;font-weight:600;font-size:${cellFontSize};">৳ ${fmt(p.totalIncome)}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;color:#dc2626;font-size:${cellFontSize};">৳ ${fmt(p.totalExpense)}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;color:#2563eb;font-size:${cellFontSize};">৳ ${fmt(p.totalInvestment)}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;font-weight:600;font-size:${cellFontSize};">৳ ${fmt(p.totalExpense + p.totalInvestment)}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;font-weight:bold;color:${p.netBalance >= 0 ? '#16a34a' : '#dc2626'};font-size:${cellFontSize};">৳ ${fmt(p.netBalance)}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;font-size:${cellFontSize};">${p.budgetUtilization}%</td>
        </tr>
      `).join('');

      return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/>
        <title>সকল প্রজেক্টের আর্থিক বিবরণী</title>
        <style>
          *{box-sizing:border-box}
          body{width:1000px;font-family:Arial,sans-serif;font-size:${isForPdf ? '10px' : '11.5px'};color:#1e293b;margin:${isForPdf ? '0 auto' : '20px auto'};padding:${isForPdf ? '6px 12px' : '10px'}}
          h1{font-size:${isForPdf ? '18px' : '20px'};color:#1e3a5f;margin:0}
          h2{font-size:${isForPdf ? '13px' : '14px'};color:#334155;margin:3px 0 0}
          table{width:100%;border-collapse:collapse;font-size:${cellFontSize}}
          th{background:#f1f5f9;padding:${cellPadding};border:1px solid #cbd5e1;font-weight:600;font-size:${cellFontSize};text-align:left;}
          td{padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};}
          @media print{body{width:100%;margin:10px}@page{size:A4 landscape;margin:10mm}}
        </style></head><body>
        <table style="width:100%; border-collapse:collapse; ${isForPdf ? '' : 'border-bottom:2px solid #1e3a5f; margin-bottom:14px; padding-bottom:10px;'}">
          <tr>
            ${companyProfile?.logo ? `
            <td style="width:${isForPdf ? '55px' : '65px'}; vertical-align:middle; border:none; padding:0;">
              <img src="${process.env.API_HOST}${companyProfile.logo}" style="height:${isForPdf ? '45px' : '55px'}; width:${isForPdf ? '45px' : '55px'}; object-fit:contain; display:block;" alt="Logo"/>
            </td>` : ''}
            <td style="vertical-align:middle; text-align:center; border:none; padding:0;">
              <div style="${companyProfile?.logo ? (isForPdf ? 'margin-right:55px;' : 'margin-right:65px;') : ''}">
                <h1 style="font-size:${isForPdf ? '18px' : '20px'}; color:#1e3a5f; margin:0;">${companyProfile?.name || 'সমবায় সমিতি'}</h1>
                ${companyProfile?.address ? `<div style="font-size:${isForPdf ? '10px' : '11px'}; color:#64748b; margin-top:2px;">${companyProfile.address}</div>` : ''}
                <h2 style="font-size:${isForPdf ? '13px' : '14px'}; color:#334155; margin:3px 0 0;">সকল প্রজেক্টের সামগ্রিক আর্থিক বিবরণী (Project Summary Report)</h2>
                <div style="font-size:${isForPdf ? '10.5px' : '11px'}; color:#1e3a5f; font-weight:600; margin-top:3px;">${reportTimeText}</div>
                <div style="font-size:${isForPdf ? '9.5px' : '10.5px'}; color:#64748b; margin-top:2px; ${isForPdf ? 'margin-bottom:8px; line-height:1.2;' : ''} text-align:right;">মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              </div>
            </td>
          </tr>
        </table>
        ${isForPdf ? '<div style="border-bottom:2px solid #1e3a5f; margin:0 0 12px 0; clear:both; width:100%;"></div>' : ''}

        <!-- 4 Top Cards Table -->
        <table style="width:100%; border-collapse:separate; border-spacing:${isForPdf ? '6px' : '8px'} 0; margin-bottom:${isForPdf ? '12px' : '16px'}; table-layout:fixed;">
          <tr>
            <td style="width:25%; border:1px solid #cbd5e1; background:#f8fafc; border-radius:4px; padding:6px 8px; text-align:center;">
              <div style="font-size:9.5px; color:#64748b;">মোট প্রজেক্ট / বাজেট</div>
              <div style="font-size:12px; font-weight:bold; color:#1e3a5f; margin-top:2px;">${summary.totalProjects} টি / ৳ ${fmt(totalBudget)}</div>
            </td>
            <td style="width:25%; border:1px solid #bbf7d0; background:#f0fdf4; border-radius:4px; padding:6px 8px; text-align:center;">
              <div style="font-size:9.5px; color:#166534;">মোট প্রজেক্ট আয়</div>
              <div style="font-size:12px; font-weight:bold; color:#16a34a; margin-top:2px;">৳ ${fmt(summary.overallIncome)}</div>
            </td>
            <td style="width:25%; border:1px solid #fecaca; background:#fef2f2; border-radius:4px; padding:6px 8px; text-align:center;">
              <div style="font-size:9.5px; color:#991b1b;">মোট খরচ (ব্যয় + বিনিয়োগ)</div>
              <div style="font-size:12px; font-weight:bold; color:#dc2626; margin-top:2px;">৳ ${fmt(totalExpAndInv)}</div>
            </td>
            <td style="width:25%; border:1px solid ${summary.overallNet >= 0 ? '#bbf7d0' : '#fecaca'}; background:${summary.overallNet >= 0 ? '#f0fdf4' : '#fef2f2'}; border-radius:4px; padding:6px 8px; text-align:center;">
              <div style="font-size:9.5px; color:#1e293b;">সার্বিক নীট স্থিতি</div>
              <div style="font-size:12px; font-weight:bold; color:${summary.overallNet >= 0 ? '#16a34a' : '#dc2626'}; margin-top:2px;">৳ ${fmt(summary.overallNet)}</div>
            </td>
          </tr>
        </table>

        <!-- All Projects Comparison Table -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
          <thead>
            <tr>
              <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;width:30px;">#</th>
              <th style="padding:${cellPadding};border:1px solid #cbd5e1;">প্রজেক্টের নাম</th>
              <th style="padding:${cellPadding};border:1px solid #cbd5e1;">লোকেশন</th>
              <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;">স্ট্যাটাস</th>
              <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;">বাজেট</th>
              <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;">আয়</th>
              <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;">ব্যয়</th>
              <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;">বিনিয়োগ</th>
              <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;">মোট খরচ</th>
              <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;">নীট স্থিতি</th>
              <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;">বাজেট %</th>
            </tr>
          </thead>
          <tbody>
            ${projectRows}
          </tbody>
          <tfoot>
            <tr style="background:#e2e8f0; font-weight:bold;">
              <td colspan="4" style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;">সর্বমোট:</td>
              <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;">৳ ${fmt(totalBudget)}</td>
              <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;color:#16a34a;">৳ ${fmt(summary.overallIncome)}</td>
              <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;color:#dc2626;">৳ ${fmt(summary.overallExpense)}</td>
              <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;color:#2563eb;">৳ ${fmt(summary.overallInvestment)}</td>
              <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;font-weight:bold;">৳ ${fmt(totalExpAndInv)}</td>
              <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;font-weight:bold;color:${summary.overallNet >= 0 ? '#16a34a' : '#dc2626'};">৳ ${fmt(summary.overallNet)}</td>
              <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;">-</td>
            </tr>
          </tfoot>
        </table>

        <!-- Signatures -->
        <table style="width:100%; border-collapse:collapse; border:none; margin-top:${isForPdf ? '35px' : '55px'}; text-align:center; font-size:${isForPdf ? '9.5px' : '11px'}; color:#64748b;">
          <tr>
            <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '140px'};margin:0 auto;padding-top:4px;">প্রস্তুতকারীর স্বাক্ষর</div></td>
            <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '140px'};margin:0 auto;padding-top:4px;">কোষাধক্ষের স্বাক্ষর</div></td>
            <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '140px'};margin:0 auto;padding-top:4px;">সহ-সভাপতির স্বাক্ষর</div></td>
            <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '140px'};margin:0 auto;padding-top:4px;">সভাপতির স্বাক্ষর</div></td>
          </tr>
        </table>
      </body></html>`;
    }

    // Mode B: একক প্রজেক্ট (SINGLE Project Detailed Report)
    const proj = projectReportData.data.project;
    const metrics = projectReportData.data.metrics;
    const breakdown = projectReportData.data.categoryBreakdown;
    const vouchers = projectReportData.data.vouchers || [];
    const totalExpAndInv = metrics.totalExpense + metrics.totalInvestment;

    const voucherRows = vouchers.length === 0
      ? `<tr><td colspan="7" style="text-align:center;padding:12px;color:#94a3b8;">কোনো ভাউচার পাওয়া যায়নি</td></tr>`
      : vouchers.map((v: any, i: number) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;font-size:${cellFontSize};">${i + 1}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;font-size:${cellFontSize};">${fmtDate(v.date)}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};font-weight:600;">${v.voucherNo || '-'}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;font-size:${cellFontSize};">
            <span style="font-weight:600;color:${v.type === 'INCOME' ? '#16a34a' : v.type === 'INVESTMENT' ? '#2563eb' : '#dc2626'};">
              ${v.type === 'INCOME' ? 'আয়' : v.type === 'INVESTMENT' ? 'বিনিয়োগ' : 'সাধারণ ব্যয়'}
            </span>
          </td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};">${v.category}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};">${v.member ? `${v.member.name} (${v.member.memberId})` : (v.description || '-')}</td>
          <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;font-weight:600;color:${v.type === 'INCOME' ? '#16a34a' : '#dc2626'};font-size:${cellFontSize};">৳ ${fmt(v.amount)}</td>
        </tr>
      `).join('');

    return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/>
      <title>প্রজেক্ট আর্থিক বিবরণী — ${proj.name}</title>
      <style>
        *{box-sizing:border-box}
        body{width:800px;font-family:Arial,sans-serif;font-size:${isForPdf ? '10.5px' : '12px'};color:#1e293b;margin:${isForPdf ? '0 auto' : '20px auto'};padding:${isForPdf ? '6px 12px' : '10px'}}
        h1{font-size:${isForPdf ? '18px' : '20px'};color:#1e3a5f;margin:0}
        h2{font-size:${isForPdf ? '13px' : '14px'};color:#334155;margin:3px 0 0}
        table{width:100%;border-collapse:collapse;font-size:${cellFontSize}}
        th{background:#f1f5f9;padding:${cellPadding};border:1px solid #cbd5e1;font-weight:600;font-size:${cellFontSize};text-align:left;}
        td{padding:${cellPadding};border:1px solid #cbd5e1;font-size:${cellFontSize};}
        @media print{body{width:800px;margin:12px}@page{size:A4 portrait;margin:10mm}}
      </style></head><body>
      <table style="width:100%; border-collapse:collapse; ${isForPdf ? '' : 'border-bottom:2px solid #1e3a5f; margin-bottom:14px; padding-bottom:10px;'}">
        <tr>
          ${companyProfile?.logo ? `
          <td style="width:${isForPdf ? '55px' : '65px'}; vertical-align:middle; border:none; padding:0;">
            <img src="${process.env.API_HOST}${companyProfile.logo}" style="height:${isForPdf ? '45px' : '55px'}; width:${isForPdf ? '45px' : '55px'}; object-fit:contain; display:block;" alt="Logo"/>
          </td>` : ''}
          <td style="vertical-align:middle; text-align:center; border:none; padding:0;">
            <div style="${companyProfile?.logo ? (isForPdf ? 'margin-right:55px;' : 'margin-right:65px;') : ''}">
              <h1 style="font-size:${isForPdf ? '18px' : '20px'}; color:#1e3a5f; margin:0;">${companyProfile?.name || 'সমবায় সমিতি'}</h1>
              ${companyProfile?.address ? `<div style="font-size:${isForPdf ? '10px' : '11px'}; color:#64748b; margin-top:2px;">${companyProfile.address}</div>` : ''}
              <h2 style="font-size:${isForPdf ? '13px' : '14px'}; color:#334155; margin:3px 0 0;">প্রজেক্ট বিবরণী: ${proj.name} ${proj.code ? `(${proj.code})` : ''}</h2>
              <div style="font-size:${isForPdf ? '10.5px' : '11px'}; color:#1e3a5f; font-weight:600; margin-top:3px;">${reportTimeText}</div>
              <div style="font-size:${isForPdf ? '9.5px' : '10.5px'}; color:#64748b; margin-top:2px; ${isForPdf ? 'margin-bottom:8px; line-height:1.2;' : ''} text-align:right;">মুদ্রণের তারিখ: ${new Date().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </td>
        </tr>
      </table>
      ${isForPdf ? '<div style="border-bottom:2px solid #1e3a5f; margin:0 0 12px 0; clear:both; width:100%;"></div>' : ''}

      <!-- Project Info Summary Table -->
      <table style="width:100%; border-collapse:collapse; background:#f8fafc; border:1px solid #cbd5e1; margin-bottom:12px; font-size:${cellFontSize};">
        <tr>
          <td style="padding:${cellPadding}; border:1px solid #cbd5e1; width:25%;"><strong>লোকেশন:</strong> ${proj.location || '-'}</td>
          <td style="padding:${cellPadding}; border:1px solid #cbd5e1; width:25%;"><strong>স্ট্যাটাস:</strong> ${proj.status === 'ONGOING' ? 'চলমান' : proj.status === 'COMPLETED' ? 'সম্পন্ন' : proj.status === 'PLANNED' ? 'পরিকল্পিত' : 'স্থগিত'}</td>
          <td style="padding:${cellPadding}; border:1px solid #cbd5e1; width:25%;"><strong>প্রাক্কলিত বাজেট:</strong> ৳ ${fmt(proj.budget || 0)}</td>
          <td style="padding:${cellPadding}; border:1px solid #cbd5e1; width:25%;"><strong>বাজেট ব্যবহার:</strong> ${metrics.budgetUtilization}%</td>
        </tr>
      </table>

      <!-- 4 Financial Metric Cards -->
      <table style="width:100%; border-collapse:separate; border-spacing:${isForPdf ? '6px' : '8px'} 0; margin-bottom:${isForPdf ? '12px' : '16px'}; table-layout:fixed;">
        <tr>
          <td style="width:25%; border:1px solid #bbf7d0; background:#f0fdf4; border-radius:4px; padding:6px 8px; text-align:center;">
            <div style="font-size:9.5px; color:#166534;">মোট প্রজেক্ট আয়</div>
            <div style="font-size:12px; font-weight:bold; color:#16a34a; margin-top:2px;">৳ ${fmt(metrics.totalIncome)}</div>
          </td>
          <td style="width:25%; border:1px solid #fecaca; background:#fef2f2; border-radius:4px; padding:6px 8px; text-align:center;">
            <div style="font-size:9.5px; color:#991b1b;">সাধারণ ব্যয়</div>
            <div style="font-size:12px; font-weight:bold; color:#dc2626; margin-top:2px;">৳ ${fmt(metrics.totalExpense)}</div>
          </td>
          <td style="width:25%; border:1px solid #bfdbfe; background:#eff6ff; border-radius:4px; padding:6px 8px; text-align:center;">
            <div style="font-size:9.5px; color:#1e40af;">বিনিয়োগ বাবদ খরচ</div>
            <div style="font-size:12px; font-weight:bold; color:#2563eb; margin-top:2px;">৳ ${fmt(metrics.totalInvestment)}</div>
          </td>
          <td style="width:25%; border:1px solid ${metrics.netBalance >= 0 ? '#bbf7d0' : '#fecaca'}; background:${metrics.netBalance >= 0 ? '#f0fdf4' : '#fef2f2'}; border-radius:4px; padding:6px 8px; text-align:center;">
            <div style="font-size:9.5px; color:#1e293b;">নীট ফলাফল / স্থিতি</div>
            <div style="font-size:12px; font-weight:bold; color:${metrics.netBalance >= 0 ? '#16a34a' : '#dc2626'}; margin-top:2px;">৳ ${fmt(metrics.netBalance)}</div>
          </td>
        </tr>
      </table>

      <!-- Category Breakdown side by side (if available) -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:14px; table-layout:fixed;">
        <tr>
          <!-- Incomes Breakdown -->
          <td style="width:33.33%; vertical-align:top; border:none; padding:0 4px 0 0;">
            <div style="background:#16a34a; color:#fff; padding:4px 8px; font-weight:bold; font-size:${cellFontSize}; border-radius:4px 4px 0 0;">আয়ের খাতসমূহ</div>
            <table style="width:100%; border-collapse:collapse;">
              ${breakdown.income.length === 0 ? `<tr><td style="padding:6px; color:#94a3b8; text-align:center;">কোনো আয় নেই</td></tr>` : breakdown.income.map((c: any) => `
                <tr>
                  <td style="padding:${cellPadding}; border:1px solid #cbd5e1; font-size:${cellFontSize};">${c.category}</td>
                  <td style="padding:${cellPadding}; border:1px solid #cbd5e1; text-align:right; color:#16a34a; font-weight:600; font-size:${cellFontSize};">৳ ${fmt(c.amount)}</td>
                </tr>
              `).join('')}
            </table>
          </td>
          <!-- Expenses Breakdown -->
          <td style="width:33.33%; vertical-align:top; border:none; padding:0 2px 0 2px;">
            <div style="background:#dc2626; color:#fff; padding:4px 8px; font-weight:bold; font-size:${cellFontSize}; border-radius:4px 4px 0 0;">ব্যয়ের খাতসমূহ</div>
            <table style="width:100%; border-collapse:collapse;">
              ${breakdown.expense.length === 0 ? `<tr><td style="padding:6px; color:#94a3b8; text-align:center;">কোনো ব্যয় নেই</td></tr>` : breakdown.expense.map((c: any) => `
                <tr>
                  <td style="padding:${cellPadding}; border:1px solid #cbd5e1; font-size:${cellFontSize};">${c.category}</td>
                  <td style="padding:${cellPadding}; border:1px solid #cbd5e1; text-align:right; color:#dc2626; font-weight:600; font-size:${cellFontSize};">৳ ${fmt(c.amount)}</td>
                </tr>
              `).join('')}
            </table>
          </td>
          <!-- Investments Breakdown -->
          <td style="width:33.33%; vertical-align:top; border:none; padding:0 0 0 4px;">
            <div style="background:#2563eb; color:#fff; padding:4px 8px; font-weight:bold; font-size:${cellFontSize}; border-radius:4px 4px 0 0;">বিনিয়োগের খাতসমূহ</div>
            <table style="width:100%; border-collapse:collapse;">
              ${breakdown.investment.length === 0 ? `<tr><td style="padding:6px; color:#94a3b8; text-align:center;">কোনো বিনিয়োগ নেই</td></tr>` : breakdown.investment.map((c: any) => `
                <tr>
                  <td style="padding:${cellPadding}; border:1px solid #cbd5e1; font-size:${cellFontSize};">${c.category}</td>
                  <td style="padding:${cellPadding}; border:1px solid #cbd5e1; text-align:right; color:#2563eb; font-weight:600; font-size:${cellFontSize};">৳ ${fmt(c.amount)}</td>
                </tr>
              `).join('')}
            </table>
          </td>
        </tr>
      </table>

      <!-- Detailed Vouchers List -->
      <div style="font-weight:bold; font-size:${cellFontSize}; margin-bottom:6px; color:#1e3a5f;">বিস্তারিত লেনদেন তালিকা (Transaction List)</div>
      <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
        <thead>
          <tr>
            <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;width:30px;">#</th>
            <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;width:75px;">তারিখ</th>
            <th style="padding:${cellPadding};border:1px solid #cbd5e1;width:80px;">ভাউচার নং</th>
            <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:center;width:65px;">ধরন</th>
            <th style="padding:${cellPadding};border:1px solid #cbd5e1;">খাত</th>
            <th style="padding:${cellPadding};border:1px solid #cbd5e1;">সদস্য / বিবরণ</th>
            <th style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;width:90px;">টাকা</th>
          </tr>
        </thead>
        <tbody>
          ${voucherRows}
        </tbody>
        <tfoot>
          <tr style="background:#e2e8f0; font-weight:bold;">
            <td colspan="6" style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;">মোট খরচ (ব্যয় + বিনিয়োগ):</td>
            <td style="padding:${cellPadding};border:1px solid #cbd5e1;text-align:right;color:#dc2626;">৳ ${fmt(totalExpAndInv)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Signatures -->
      <table style="width:100%; border-collapse:collapse; border:none; margin-top:${isForPdf ? '35px' : '55px'}; text-align:center; font-size:${isForPdf ? '9.5px' : '11px'}; color:#64748b;">
        <tr>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '140px'};margin:0 auto;padding-top:4px;">প্রস্তুতকারীর স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '140px'};margin:0 auto;padding-top:4px;">কোষাধক্ষের স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '140px'};margin:0 auto;padding-top:4px;">সহ-সভাপতির স্বাক্ষর</div></td>
          <td style="width:25%; border:none; padding:0;"><div style="border-top:1px solid #cbd5e1;width:${isForPdf ? '110px' : '140px'};margin:0 auto;padding-top:4px;">সভাপতির স্বাক্ষর</div></td>
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
    else if (activeReportTab === "project_summary") html = getProjectReportHTML(false);

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
      html = getMonthlyAssociationReportHTML(true);
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
    } else if (activeReportTab === "project_summary") {
      html = getProjectReportHTML(true);
      reportName = selectedProjectId === "ALL"
        ? "All_Projects_Summary_Report"
        : `Project_${projectReportData?.data?.project?.name?.replace(/\s+/g, '_') || 'Report'}`;
    }

    if (!html) return;

    const isProjectAll = activeReportTab === "project_summary" && selectedProjectId === "ALL";
    const opt = {
      margin: isProjectAll ? 8 : 10,
      filename: `${reportName}_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: isProjectAll ? 1050 : 800 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: isProjectAll ? ('landscape' as const) : ('portrait' as const) }
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
    setSelectedProjectId("ALL");
    setProjectReportData(null);
    setProjectVoucherSearch("");
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
                      : activeReportTab === "investment_statement"
                        ? "বিনিয়োগ বিবরণী"
                        : "প্রজেক্ট বিবরণী"}
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
                      : activeReportTab === "investment_statement"
                        ? "নির্বাচিত সময়কালের সমস্ত বিনিয়োগের খাতভিত্তিক ও বিস্তারিত লেনদেন তালিকা"
                        : "সকল প্রজেক্টের সামগ্রিক আর্থিক চিত্র অথবা নির্দিষ্ট প্রজেক্টের বিস্তারিত আয়, ব্যয় ও বিনিয়োগ বিবরণী"}
          </p>
        </div>
        <div className="flex gap-3">
          {((activeReportTab === "member" && statement) ||
            (activeReportTab === "association" && associationData) ||
            (activeReportTab === "monthly_association" && monthlyData) ||
            (activeReportTab === "income_statement" && incomeData) ||
            (activeReportTab === "expense_statement" && expenseData) ||
            (activeReportTab === "investment_statement" && investmentData) ||
            (activeReportTab === "project_summary" && projectReportData)) && (
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
        <button
          onClick={() => {
            setActiveReportTab("project_summary");
            resetAllFilters();
          }}
          className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${activeReportTab === "project_summary"
            ? "border-amber-600 text-amber-600"
            : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          প্রজেক্ট বিবরণী
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
        ) : activeReportTab === "project_summary" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">প্রজেক্ট নির্বাচন করুন</label>
              <select
                value={selectedProjectId}
                onChange={e => {
                  setSelectedProjectId(e.target.value);
                  setProjectReportData(null);
                }}
                className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              >
                <option value="ALL">সকল প্রজেক্ট (All Projects Summary)</option>
                {projectsList.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.code ? `(${p.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">শুরুর তারিখ</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">শেষ তারিখ</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
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
            onClick={() => {
              if (activeReportTab === "member") fetchStatement();
              else if (activeReportTab === "association") fetchAssociationReport();
              else if (activeReportTab === "monthly_association") fetchMonthlyAssociationReport();
              else if (activeReportTab === "income_statement") fetchIncomeReport();
              else if (activeReportTab === "expense_statement") fetchExpenseReport();
              else if (activeReportTab === "investment_statement") fetchInvestmentReport();
              else if (activeReportTab === "project_summary") fetchProjectReport();
            }}
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
                        : activeReportTab === "investment_statement"
                          ? loadingInvestment
                          : loadingProjectReport
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
                      : activeReportTab === "investment_statement"
                        ? (loadingInvestment ? "লোড হচ্ছে..." : "বিনিয়োগ বিবরণী দেখুন")
                        : (loadingProjectReport ? "লোড হচ্ছে..." : "প্রজেক্ট বিবরণী দেখুন")}
          </button>
          {(selectedMember || fromDate || toDate || statement || associationData || monthlyData || incomeData || expenseData || investmentData || (activeReportTab === "project_summary" && (selectedProjectId !== "ALL" || projectReportData))) && (
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

      {/* ——— প্রজেক্ট বিবরণী ভিউ (সকল প্রজেক্ট বা সিঙ্গেল প্রজেক্ট) ——— */}
      {activeReportTab === "project_summary" && projectReportData && (
        <div className="space-y-6">
          {/* ========== মোড ১: সকল প্রজেক্টের সামগ্রিক সামারি ========== */}
          {projectReportData.mode === "ALL" && (() => {
            const allData = projectReportData.data;
            const projects = allData?.projects || [];
            const summary = allData?.summary || { totalProjects: 0, overallInvestment: 0, overallIncome: 0, overallExpense: 0, overallNet: 0 };
            const totalBudget = projects.reduce((acc: number, p: any) => acc + (p.budget || 0), 0);
            const totalExpAndInv = (summary.overallExpense || 0) + (summary.overallInvestment || 0);

            return (
              <div className="space-y-6">
                {/* টপ ব্যানার */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Building2 className="text-amber-400" size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        সকল প্রজেক্টের সামগ্রিক আর্থিক বিবরণী
                      </h2>
                      <p className="text-sm text-slate-300 mt-1">
                        {fromDate || toDate
                          ? `সময়সীমা: ${fromDate ? fmtDate(fromDate) : "শুরু"} হতে ${toDate ? fmtDate(toDate) : "বর্তমান"} পর্যন্ত`
                          : "সার্বিক বিবরণী — সকল তারিখের সামগ্রিক তথ্য"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 border border-white/10 text-center">
                      <div className="text-xs text-slate-300 font-medium">মোট প্রজেক্ট</div>
                      <div className="text-xl font-bold text-amber-400">{summary.totalProjects} টি</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 border border-white/10 text-center">
                      <div className="text-xs text-slate-300 font-medium">সার্বিক স্থিতি</div>
                      <div className={`text-xl font-bold ${summary.overallNet >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        ৳ {fmt(summary.overallNet)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ৬টি সামারি মেট্রিক কার্ড */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="text-xs font-semibold text-slate-500 uppercase">মোট বাজেট</div>
                    <div className="text-lg font-bold text-slate-800 mt-1.5">৳ {fmt(totalBudget)}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{summary.totalProjects} টি প্রজেক্টে</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100 bg-emerald-50/20">
                    <div className="text-xs font-semibold text-emerald-700 uppercase">মোট প্রজেক্ট আয়</div>
                    <div className="text-lg font-bold text-emerald-600 mt-1.5">৳ {fmt(summary.overallIncome)}</div>
                    <div className="text-[11px] text-emerald-600/70 mt-0.5">বিক্রয় ও অন্যান্য প্রাপ্তি</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-rose-100 bg-rose-50/20">
                    <div className="text-xs font-semibold text-rose-700 uppercase">মোট সাধারণ ব্যয়</div>
                    <div className="text-lg font-bold text-rose-600 mt-1.5">৳ {fmt(summary.overallExpense)}</div>
                    <div className="text-[11px] text-rose-600/70 mt-0.5">প্রজেক্ট অপারেশনাল খরচ</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100 bg-indigo-50/20">
                    <div className="text-xs font-semibold text-indigo-700 uppercase">মোট প্রজেক্ট বিনিয়োগ</div>
                    <div className="text-lg font-bold text-indigo-600 mt-1.5">৳ {fmt(summary.overallInvestment)}</div>
                    <div className="text-[11px] text-indigo-600/70 mt-0.5">মূলধনী ও সাইট ব্যয়</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 bg-amber-50/20">
                    <div className="text-xs font-semibold text-amber-800 uppercase">মোট খরচ (ব্যয়+বিনিয়োগ)</div>
                    <div className="text-lg font-bold text-amber-700 mt-1.5">৳ {fmt(totalExpAndInv)}</div>
                    <div className="text-[11px] text-amber-700/70 mt-0.5">সর্বমোট অর্থ নির্গমন</div>
                  </div>

                  <div className={`bg-white rounded-xl p-4 shadow-sm border ${summary.overallNet >= 0 ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"}`}>
                    <div className={`text-xs font-semibold uppercase ${summary.overallNet >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
                      সার্বিক নীট স্থিতি
                    </div>
                    <div className={`text-lg font-bold mt-1.5 ${summary.overallNet >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      ৳ {fmt(summary.overallNet)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {summary.overallNet >= 0 ? "উদ্বৃত্ত / লাভ" : "ঘাটতি / ক্যাশফ্লো"}
                    </div>
                  </div>
                </div>

                {/* সকল প্রজেক্টের তুলনামূলক টেবিল */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <h3 className="font-bold text-lg text-white">প্রজেক্টভিত্তিক তুলনামূলক হিসাব বিবরনী</h3>
                      <p className="text-xs text-slate-300 mt-0.5">প্রতিটি প্রজেক্টের বাজেট, আয়, ব্যয়, বিনিয়োগ এবং নীট স্থিতির বিস্তারিত তালিকা</p>
                    </div>
                    <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full font-medium text-amber-300 border border-white/10">
                      {projects.length} টি প্রজেক্ট
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3.5 text-center w-12">#</th>
                          <th className="px-4 py-3.5">প্রজেক্টের নাম ও কোড</th>
                          <th className="px-4 py-3.5">লোকেশন</th>
                          <th className="px-4 py-3.5 text-center">স্ট্যাটাস</th>
                          <th className="px-4 py-3.5 text-right">বাজেট</th>
                          <th className="px-4 py-3.5 text-right text-emerald-700">আয় (+)</th>
                          <th className="px-4 py-3.5 text-right text-rose-700">ব্যয় (-)</th>
                          <th className="px-4 py-3.5 text-right text-indigo-700">বিনিয়োগ (-)</th>
                          <th className="px-4 py-3.5 text-right text-amber-800">মোট খরচ</th>
                          <th className="px-4 py-3.5 text-right">নীট স্থিতি</th>
                          <th className="px-4 py-3.5 text-center">বাজেট ব্যবহার</th>
                          <th className="px-4 py-3.5 text-center">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {projects.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="px-6 py-12 text-center text-slate-400">
                              কোনো প্রজেক্টের তথ্য পাওয়া যায়নি
                            </td>
                          </tr>
                        ) : (
                          projects.map((p: any, idx: number) => {
                            const pTotalCost = (p.totalExpense || 0) + (p.totalInvestment || 0);
                            return (
                              <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3 text-center text-slate-500 text-xs">{idx + 1}</td>
                                <td className="px-4 py-3 font-semibold text-slate-900">
                                  <div>{p.name}</div>
                                  {p.code && <div className="text-xs text-slate-400 font-normal">{p.code}</div>}
                                </td>
                                <td className="px-4 py-3 text-slate-600 text-xs">{p.location || "-"}</td>
                                <td className="px-4 py-3 text-center">
                                  {p.status === "IN_PROGRESS" && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">চলমান</span>
                                  )}
                                  {p.status === "COMPLETED" && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">সম্পন্ন</span>
                                  )}
                                  {p.status === "PLANNING" && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">পরিকল্পনা</span>
                                  )}
                                  {p.status === "ON_HOLD" && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">স্থগিত</span>
                                  )}
                                  {p.status === "CANCELLED" && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">বাতিল</span>
                                  )}
                                  {!["IN_PROGRESS", "COMPLETED", "PLANNING", "ON_HOLD", "CANCELLED"].includes(p.status) && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{p.status || "-"}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-slate-700">
                                  {p.budget > 0 ? `৳ ${fmt(p.budget)}` : "-"}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-emerald-600">
                                  ৳ {fmt(p.totalIncome)}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-rose-600">
                                  ৳ {fmt(p.totalExpense)}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                                  ৳ {fmt(p.totalInvestment)}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-amber-700">
                                  ৳ {fmt(pTotalCost)}
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${p.netBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                  ৳ {fmt(p.netBalance)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {p.budget > 0 ? (
                                    <div className="inline-block text-center">
                                      <span className={`text-xs font-semibold ${p.budgetUtilization > 100 ? "text-rose-600 font-bold" : "text-slate-700"}`}>
                                        {p.budgetUtilization}%
                                      </span>
                                      <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1 mx-auto">
                                        <div
                                          className={`h-full ${p.budgetUtilization > 100 ? "bg-rose-500" : p.budgetUtilization > 80 ? "bg-amber-500" : "bg-blue-500"}`}
                                          style={{ width: `${Math.min(p.budgetUtilization, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => {
                                      setSelectedProjectId(p.id);
                                      fetchProjectReport(p.id);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded border border-indigo-200 transition"
                                  >
                                    সিঙ্গেল রিপোর্ট
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {projects.length > 0 && (
                        <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-800 text-xs">
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-right font-bold text-slate-800 text-sm">
                              সর্বমোট যোগফল:
                            </td>
                            <td className="px-4 py-3 text-right text-slate-900 text-sm">৳ {fmt(totalBudget)}</td>
                            <td className="px-4 py-3 text-right text-emerald-700 text-sm">৳ {fmt(summary.overallIncome)}</td>
                            <td className="px-4 py-3 text-right text-rose-700 text-sm">৳ {fmt(summary.overallExpense)}</td>
                            <td className="px-4 py-3 text-right text-indigo-700 text-sm">৳ {fmt(summary.overallInvestment)}</td>
                            <td className="px-4 py-3 text-right text-amber-800 text-sm">৳ {fmt(totalExpAndInv)}</td>
                            <td className={`px-4 py-3 text-right text-sm ${summary.overallNet >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              ৳ {fmt(summary.overallNet)}
                            </td>
                            <td colSpan={2} className="px-4 py-3 text-center text-slate-500">
                              {totalBudget > 0 ? `${Math.round((totalExpAndInv / totalBudget) * 100)}% ব্যয়িত` : "-"}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========== মোড ২: একক প্রজেক্টের পূর্ণাঙ্গ বিবরণী ========== */}
          {projectReportData.mode === "SINGLE" && (() => {
            const singleData = projectReportData.data;
            const proj = singleData?.project || {};
            const summary = singleData?.summary || { totalInvestment: 0, totalIncome: 0, totalExpense: 0, netBalance: 0, totalCost: 0, budgetUtilization: 0 };
            const breakdown = singleData?.breakdown || { investmentCategories: {}, incomeCategories: {}, expenseCategories: {} };
            const rawVouchers = singleData?.vouchers || [];

            const filteredVouchers = rawVouchers.filter((v: any) => {
              if (!projectVoucherSearch) return true;
              const q = projectVoucherSearch.toLowerCase();
              return (
                (v.voucherNo && v.voucherNo.toLowerCase().includes(q)) ||
                (v.category && v.category.toLowerCase().includes(q)) ||
                (v.description && v.description.toLowerCase().includes(q)) ||
                (v.member && v.member.name && v.member.name.toLowerCase().includes(q))
              );
            });

            return (
              <div className="space-y-6">
                {/* একক প্রজেক্টের হেডার ব্যানার */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-1">
                        <Building2 className="text-amber-400" size={32} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-bold tracking-tight text-white">{proj.name}</h2>
                          {proj.code && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                              {proj.code}
                            </span>
                          )}
                          {proj.status === "IN_PROGRESS" && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">চলমান</span>
                          )}
                          {proj.status === "COMPLETED" && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">সম্পন্ন</span>
                          )}
                          {proj.status === "PLANNING" && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">পরিকল্পনা</span>
                          )}
                          {proj.status === "ON_HOLD" && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">স্থগিত</span>
                          )}
                          {proj.status === "CANCELLED" && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">বাতিল</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mt-1">
                          {proj.location && <span className="mr-3">📍 {proj.location}</span>}
                          {fromDate || toDate
                            ? `সময়সীমা: ${fromDate ? fmtDate(fromDate) : "শুরু"} হতে ${toDate ? fmtDate(toDate) : "বর্তমান"} পর্যন্ত`
                            : "সার্বিক প্রজেক্ট বিবরণী — সকল তারিখ"}
                        </p>
                        {proj.description && (
                          <p className="text-xs text-slate-400 mt-1.5 italic max-w-2xl">{proj.description}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedProjectId("ALL");
                        fetchProjectReport("ALL");
                      }}
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium border border-white/10 transition shrink-0"
                    >
                      ← সকল প্রজেক্টের সামারিতে ফিরুন
                    </button>
                  </div>
                </div>

                {/* একক প্রজেক্টের ৬টি আর্থিক কার্ড */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="text-xs font-semibold text-slate-500 uppercase">প্রজেক্ট বাজেট</div>
                    <div className="text-lg font-bold text-slate-800 mt-1.5">
                      {proj.budget > 0 ? `৳ ${fmt(proj.budget)}` : "অনির্ধারিত"}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">অনুমোদিত বরাদ্দ</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100 bg-emerald-50/20">
                    <div className="text-xs font-semibold text-emerald-700 uppercase">মোট প্রজেক্ট আয়</div>
                    <div className="text-lg font-bold text-emerald-600 mt-1.5">৳ {fmt(summary.totalIncome)}</div>
                    <div className="text-[11px] text-emerald-600/70 mt-0.5">বিক্রয় ও অন্যান্য জমা</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-rose-100 bg-rose-50/20">
                    <div className="text-xs font-semibold text-rose-700 uppercase">সাধারণ খরচ</div>
                    <div className="text-lg font-bold text-rose-600 mt-1.5">৳ {fmt(summary.totalExpense)}</div>
                    <div className="text-[11px] text-rose-600/70 mt-0.5">অপারেশনাল ব্যয়</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100 bg-indigo-50/20">
                    <div className="text-xs font-semibold text-indigo-700 uppercase">বিনিয়োগ খরচ</div>
                    <div className="text-lg font-bold text-indigo-600 mt-1.5">৳ {fmt(summary.totalInvestment)}</div>
                    <div className="text-[11px] text-indigo-600/70 mt-0.5">মূলধনী সাইট খরচ</div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 bg-amber-50/20">
                    <div className="text-xs font-semibold text-amber-800 uppercase">সর্বমোট খরচ</div>
                    <div className="text-lg font-bold text-amber-700 mt-1.5">৳ {fmt(summary.totalCost)}</div>
                    <div className="text-[11px] text-amber-700/70 mt-0.5">ব্যয় + বিনিয়োগ</div>
                  </div>

                  <div className={`bg-white rounded-xl p-4 shadow-sm border ${summary.netBalance >= 0 ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"}`}>
                    <div className={`text-xs font-semibold uppercase ${summary.netBalance >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
                      নীট স্থিতি / লাভ
                    </div>
                    <div className={`text-lg font-bold mt-1.5 ${summary.netBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      ৳ {fmt(summary.netBalance)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {summary.netBalance >= 0 ? "উদ্বৃত্ত ব্যালেন্স" : "ঘাটতি ব্যালেন্স"}
                    </div>
                  </div>
                </div>

                {/* বাজেট ব্যবহার প্রগ্রেস বার */}
                {proj.budget > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="font-semibold text-slate-700">বাজেট ব্যবহার অগ্রগতি (Budget Utilization)</span>
                      <span className={`font-bold ${summary.budgetUtilization > 100 ? "text-rose-600" : "text-indigo-600"}`}>
                        {summary.budgetUtilization}% ({fmt(summary.totalCost)} / {fmt(proj.budget)})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          summary.budgetUtilization > 100
                            ? "bg-rose-500"
                            : summary.budgetUtilization > 85
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(summary.budgetUtilization, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* খাতভিত্তিক সারসংক্ষেপ (আয়, সাধারণ ব্যয়, বিনিয়োগ) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* আয়ের খাতসমূহ */}
                  <div className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
                    <div className="bg-emerald-700 text-white px-5 py-3 flex justify-between items-center">
                      <h4 className="font-bold text-sm">আয়ের খাতসমূহ (Income)</h4>
                      <span className="text-xs bg-emerald-800/80 px-2 py-0.5 rounded-full">
                        {Object.keys(breakdown.incomeCategories || {}).length} টি খাত
                      </span>
                    </div>
                    <div className="p-4">
                      {Object.keys(breakdown.incomeCategories || {}).length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">কোনো আয়ের এন্ট্রি নেই</div>
                      ) : (
                        <div className="space-y-2.5">
                          {Object.entries(breakdown.incomeCategories).map(([cat, item]: any) => (
                            <div key={`inc-${cat}`} className="flex justify-between items-center text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                              <div>
                                <div className="font-semibold text-slate-800">{cat}</div>
                                <div className="text-[11px] text-slate-400">{item.count} টি ভাউচার</div>
                              </div>
                              <div className="font-bold text-emerald-600">৳ {fmt(item.amount)}</div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-xs text-slate-800">
                            <span>মোট আয়:</span>
                            <span className="text-emerald-700">৳ {fmt(summary.totalIncome)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ব্যয়ের খাতসমূহ */}
                  <div className="bg-white rounded-xl shadow-sm border border-rose-100 overflow-hidden">
                    <div className="bg-rose-700 text-white px-5 py-3 flex justify-between items-center">
                      <h4 className="font-bold text-sm">ব্যয়ের খাতসমূহ (Expense)</h4>
                      <span className="text-xs bg-rose-800/80 px-2 py-0.5 rounded-full">
                        {Object.keys(breakdown.expenseCategories || {}).length} টি খাত
                      </span>
                    </div>
                    <div className="p-4">
                      {Object.keys(breakdown.expenseCategories || {}).length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">কোনো সাধারণ ব্যয়ের এন্ট্রি নেই</div>
                      ) : (
                        <div className="space-y-2.5">
                          {Object.entries(breakdown.expenseCategories).map(([cat, item]: any) => (
                            <div key={`exp-${cat}`} className="flex justify-between items-center text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                              <div>
                                <div className="font-semibold text-slate-800">{cat}</div>
                                <div className="text-[11px] text-slate-400">{item.count} টি ভাউচার</div>
                              </div>
                              <div className="font-bold text-rose-600">৳ {fmt(item.amount)}</div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-xs text-slate-800">
                            <span>মোট ব্যয়:</span>
                            <span className="text-rose-700">৳ {fmt(summary.totalExpense)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* বিনিয়োগের খাতসমূহ */}
                  <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
                    <div className="bg-indigo-700 text-white px-5 py-3 flex justify-between items-center">
                      <h4 className="font-bold text-sm">বিনিয়োগ খাতসমূহ (Investment)</h4>
                      <span className="text-xs bg-indigo-800/80 px-2 py-0.5 rounded-full">
                        {Object.keys(breakdown.investmentCategories || {}).length} টি খাত
                      </span>
                    </div>
                    <div className="p-4">
                      {Object.keys(breakdown.investmentCategories || {}).length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">কোনো বিনিয়োগ এন্ট্রি নেই</div>
                      ) : (
                        <div className="space-y-2.5">
                          {Object.entries(breakdown.investmentCategories).map(([cat, item]: any) => (
                            <div key={`inv-${cat}`} className="flex justify-between items-center text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                              <div>
                                <div className="font-semibold text-slate-800">{cat}</div>
                                <div className="text-[11px] text-slate-400">{item.count} টি ভাউচার</div>
                              </div>
                              <div className="font-bold text-indigo-600">৳ {fmt(item.amount)}</div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-xs text-slate-800">
                            <span>মোট বিনিয়োগ:</span>
                            <span className="text-indigo-700">৳ {fmt(summary.totalInvestment)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* একক প্রজেক্টের বিস্তারিত ভাউচার লেনদেন তালিকা */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <h3 className="font-bold text-lg text-white">প্রজেক্টের বিস্তারিত ভাউচার লেনদেন তালিকা</h3>
                      <p className="text-xs text-slate-300 mt-0.5">উক্ত প্রজেক্টে সংঘটিত সকল ভাউচার ট্রানজেকশনের সম্পূর্ণ বিবরণ</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder="ভাউচার, খাত বা বিবরণ দিয়ে খুঁজুন..."
                          value={projectVoucherSearch}
                          onChange={(e) => setProjectVoucherSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-400"
                        />
                      </div>
                      <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full font-medium text-amber-300 border border-white/10 shrink-0">
                        {filteredVouchers.length} টি লেনদেন
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3.5 text-center w-12">ক্র নং</th>
                          <th className="px-4 py-3.5 text-center">তারিখ</th>
                          <th className="px-4 py-3.5 text-center">ভাউচার নং</th>
                          <th className="px-4 py-3.5 text-center">ধরন</th>
                          <th className="px-4 py-3.5">খাত (Category)</th>
                          <th className="px-4 py-3.5">সদস্য / বিবরণ</th>
                          <th className="px-4 py-3.5 text-center">পেমেন্ট মাধ্যম</th>
                          <th className="px-4 py-3.5 text-right">পরিমাণ (টাকা)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredVouchers.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                              কোনো ভাউচার লেনদেন পাওয়া যায়নি
                            </td>
                          </tr>
                        ) : (
                          filteredVouchers.map((v: any, idx: number) => {
                            const isInc = v.type === "INCOME";
                            const isInv = v.type === "INVESTMENT";
                            return (
                              <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-4 py-3 text-center text-slate-500 text-xs">{idx + 1}</td>
                                <td className="px-4 py-3 text-center text-slate-700 text-xs whitespace-nowrap">
                                  {fmtDate(v.date)}
                                </td>
                                <td className="px-4 py-3 text-center font-mono font-semibold text-slate-800 text-xs">
                                  {v.voucherNo || "-"}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {isInc && (
                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">আয়</span>
                                  )}
                                  {v.type === "EXPENSE" && (
                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-700">ব্যয়</span>
                                  )}
                                  {isInv && (
                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700">বিনিয়োগ</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-800 text-xs">
                                  {v.category}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600">
                                  {v.member?.name && (
                                    <span className="font-medium text-slate-800 block">
                                      {v.member.name} {v.member.memberId ? `(${v.member.memberId})` : ""}
                                    </span>
                                  )}
                                  {v.description && <span className="text-slate-500">{v.description}</span>}
                                  {!v.member?.name && !v.description && "-"}
                                </td>
                                <td className="px-4 py-3 text-center text-xs text-slate-600">
                                  {v.paymentMethod || "-"}
                                </td>
                                <td className={`px-4 py-3 text-right font-bold text-sm ${isInc ? "text-emerald-600" : isInv ? "text-indigo-600" : "text-rose-600"}`}>
                                  {isInc ? "+" : "-"} ৳ {fmt(v.amount)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {filteredVouchers.length > 0 && (
                        <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-800 text-xs">
                          <tr>
                            <td colSpan={7} className="px-4 py-3 text-right font-bold text-slate-800 text-sm">
                              প্রজেক্ট নীট ব্যালেন্স:
                            </td>
                            <td className={`px-4 py-3 text-right font-bold text-base ${summary.netBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              ৳ {fmt(summary.netBalance)}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Fallback empty blocks */}
      {activeReportTab === "project_summary" && !loadingProjectReport && !projectReportData && (
        <div className="bg-white rounded-xl p-16 text-center text-slate-400 shadow-sm border border-slate-100">
          <Building2 size={48} className="mx-auto mb-3 text-amber-500" />
          <p className="text-lg font-medium text-slate-700">প্রজেক্ট আয়-ব্যয় ও আর্থিক বিবরণী</p>
          <p className="text-sm mt-1">প্রজেক্ট নির্বাচন করুন (বা সকল প্রজেক্ট) এবং তারিখ সীমা দিয়ে বিবরণী দেখুন বাটনে ক্লিক করুন</p>
        </div>
      )}
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
