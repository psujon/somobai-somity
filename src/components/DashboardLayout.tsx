import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, Users, PiggyBank, CreditCard,
  FileText, Briefcase, Settings, LogOut, Menu, X, ChevronDown, ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import clsx from "clsx";

export default function DashboardLayout() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "সেটিংস": location.pathname.startsWith("/settings")
  });
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  useEffect(() => {
    if (token) {
      axios.get("http://localhost:5000/api/company-profile", {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setCompanyProfile(res.data))
        .catch(err => console.error("Error fetching profile:", err));
    }
  }, [token]);

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // ——— ইনঅ্যাক্টিভিটি অটো-লগআউট (৫ মিনিট) ———
  useEffect(() => {
    let timeoutId: any;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
      }, 5 * 60 * 1000); // ৫ মিনিট
    };

    // ইভেন্ট লিসেনার যুক্ত করা
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(event => document.addEventListener(event, resetTimer));

    // প্রথমবার টাইমার চালু
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user, token]);

  const handleLogout = async () => {
    try {
      if (user?.id) {
        await axios.post("http://localhost:5000/api/auth/logout", { userId: user.id }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Logout logging failed", err);
    }
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "ড্যাশবোর্ড", path: "/", icon: LayoutDashboard },
    { name: "সদস্য ব্যবস্থাপনা", path: "/members", icon: Users },
    { name: "সঞ্চয় ও আমানত", path: "/savings", icon: PiggyBank },
    { name: "ঋণ ব্যবস্থাপনা", path: "/loans", icon: CreditCard },
    { name: "হিসাবরক্ষণ ও ভাউচার", path: "/accounts", icon: Briefcase },
    { name: "রিপোর্টস", path: "/reports", icon: FileText },
    {
      name: "সেটিংস",
      path: "/settings",
      icon: Settings,
      subItems: [
        { name: "কোম্পানী প্রোফাইল", path: "/settings/profile" },
        { name: "মেম্বার ধরন", path: "/settings/member-types" },
        { name: "মেম্বার পদবী", path: "/settings/member-positions" },
        { name: "ইউজার", path: "/settings/users" },
        { name: "ডাটাবেজ ব্যাকআপ", path: "/settings/backup" },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Mobile overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-20 bg-black/50 lg:hidden transition-opacity",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-slate-950">
          <span className="text-sm font-bold text-white tracking-wide truncate pr-2">
            {companyProfile?.name || "সমবায় সমিতি"}
          </span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">মেন্যু</p> */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.subItems && location.pathname.startsWith(item.path));
              const isExpanded = openMenus[item.name];

              return (
                <div key={item.name}>
                  {item.subItems ? (
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={clsx(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-600/10 text-blue-500"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        {item.name}
                      </div>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  ) : (
                    <Link
                      to={item.path!}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon size={18} />
                      {item.name}
                    </Link>
                  )}

                  {/* Sub Menu */}
                  {item.subItems && isExpanded && (
                    <div className="mt-1 space-y-1 pl-9 pr-2">
                      {item.subItems.map(subItem => {
                        const isSubActive = location.pathname === subItem.path;
                        return (
                          <Link
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => setSidebarOpen(false)}
                            className={clsx(
                              "block px-3 py-2 rounded-lg text-sm transition-colors",
                              isSubActive
                                ? "bg-blue-600 text-white font-medium"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                          >
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            লগআউট
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center px-4 lg:px-8 justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-slate-100 text-slate-600"
          >
            <Menu size={24} />
          </button>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 hidden sm:block">
              {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>

        <footer className="py-6 px-4 lg:px-8 bg-white border-t text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} <span className="font-semibold text-slate-700">{companyProfile?.name || "সমবায় সমিতি"}</span>। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="text-[10px] mt-1.5 text-slate-400 uppercase tracking-widest">
            Developed by <span className="text-slate-500 font-medium">SkyTree Technology Limited | Contact: 01646-999065 | </span> <span className="text-slate-500 font-medium lowercase">Email: skytreetechnology@gmail.com</span>
          </p>
        </footer>
      </div>
    </div>
  );
}
