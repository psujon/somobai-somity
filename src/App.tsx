import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Savings from "./pages/Savings";
import Loans from "./pages/Loans";
import Accounts from "./pages/Accounts";
import Reports from "./pages/Reports";
import CompanyProfile from "./pages/Settings/CompanyProfile";
import MemberTypes from "./pages/Settings/MemberTypes";
import MemberPositions from "./pages/Settings/MemberPositions";
import Users from "./pages/Settings/Users";
import DatabaseBackup from "./pages/Settings/DatabaseBackup";
import AccountCategories from "./pages/Settings/AccountCategories";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Temporary placeholder pages

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে...</div>;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="savings" element={<Savings />} />
          <Route path="loans" element={<Loans />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings">
            <Route path="profile" element={<CompanyProfile />} />
            <Route path="member-types" element={<MemberTypes />} />
            <Route path="member-positions" element={<MemberPositions />} />
            <Route path="users" element={<Users />} />
            <Route path="backup" element={<DatabaseBackup />} />
            <Route path="account-categories" element={<AccountCategories />} />
            <Route index element={<Navigate to="profile" replace />} />
          </Route>
        </Route>
      </Routes>
      <ToastContainer position="top-right" autoClose={2000} />
    </>
  );
}

export default App;
