import { useState, useEffect } from "react";
import axios from "axios";
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
import MemberDashboard from "./pages/MemberDashboard";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Temporary placeholder pages

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === "MEMBER") return <Navigate to="/member-dashboard" />;

  return <>{children}</>;
};

const MemberProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">লোড হচ্ছে...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "MEMBER") return <Navigate to="/" />;

  return <>{children}</>;
};

function App() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${process.env.API_HOST}/api/company-profile`);
        if (res.data) {
          setProfile(res.data);
          
          // Set dynamic title
          if (res.data.name) {
            document.title = res.data.name;
          }

          // Set dynamic favicon
          if (res.data.logo) {
            const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
            if (favicon) {
              favicon.href = `${process.env.API_HOST}${res.data.logo}`;
              
              // Set icon type based on file type extension
              const logoPath = res.data.logo.toLowerCase();
              if (logoPath.endsWith(".png")) {
                favicon.type = "image/png";
              } else if (logoPath.endsWith(".jpg") || logoPath.endsWith(".jpeg")) {
                favicon.type = "image/jpeg";
              } else if (logoPath.endsWith(".ico")) {
                favicon.type = "image/x-icon";
              } else if (logoPath.endsWith(".svg")) {
                favicon.type = "image/svg+xml";
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching company profile on startup:", error);
      }
    };
    fetchProfile();
  }, []);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Member Dashboard Route */}
        <Route path="/member-dashboard" element={<MemberProtectedRoute><MemberDashboard /></MemberProtectedRoute>} />

        {/* Admin/Staff Dashboard Routes */}
        <Route path="/" element={<AdminProtectedRoute><DashboardLayout /></AdminProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="savings" element={<Savings />} />
          <Route path="loans" element={<Loans />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="backup" element={<DatabaseBackup />} />
          <Route path="settings">
            <Route path="profile" element={<CompanyProfile />} />
            <Route path="member-types" element={<MemberTypes />} />
            <Route path="member-positions" element={<MemberPositions />} />
            <Route path="users" element={<Users />} />
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
