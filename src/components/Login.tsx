import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [loginType, setLoginType] = useState<"admin" | "member" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (loginType === "member") {
        if (!showOtpScreen) {
          // Step 1: Send OTP
          await axios.post(`${process.env.API_HOST}/api/auth/member-login`, {
            phone,
          });
          setShowOtpScreen(true);
        } else {
          // Step 2: Verify OTP
          const res = await axios.post(`${process.env.API_HOST}/api/auth/verify-otp`, {
            phone,
            otp,
          });
          login(res.data.token, res.data.user);
          navigate("/member-dashboard");
        }
      } else {
        const res = await axios.post(`${process.env.API_HOST}/api/auth/login`, {
          email,
          password,
        });
        login(res.data.token, res.data.user);
        navigate("/");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || (loginType === "member" ? (showOtpScreen ? "ভুল ওটিপি কোড।" : "লগইন ব্যর্থ হয়েছে। মোবাইল নম্বর যাচাই করুন।") : "লগইন ব্যর্থ হয়েছে। ইমেইল এবং পাসওয়ার্ড যাচাই করুন।"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden p-4">
      {/* Animated Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-blue-300/30 blur-3xl animate-[spin_20s_linear_infinite] origin-bottom-right"></div>
        <div className="absolute top-[40%] -right-[10%] w-[35vw] h-[35vw] rounded-full bg-indigo-300/30 blur-3xl animate-[spin_25s_linear_infinite_reverse] origin-top-left"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-sky-300/30 blur-3xl animate-[spin_30s_linear_infinite] origin-top"></div>
      </div>

      <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden z-10 border border-white/50">


        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {loginType === null
              ? ""
              : (showOtpScreen ? "ওটিপি ভেরিফিকেশন" : (loginType === "admin" ? "অ্যাডমিন লগইন" : "সদস্য লগইন"))}
          </h2>

          {loginType === null ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setLoginType("admin");
                  setError("");
                }}
                className="w-full py-4 px-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 group text-gray-700 hover:text-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="font-bold text-lg">অ্যাডমিন / স্টাফ লগইন</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginType("member");
                  setError("");
                }}
                className="w-full py-4 px-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 group text-gray-700 hover:text-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span className="font-bold text-lg">সদস্য লগইন</span>
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {loginType === "member" ? (
                  showOtpScreen ? (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">ওটিপি কোড (৪ ডিজিট)</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-center tracking-widest text-lg font-bold"
                        placeholder="XXXX"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">আপনার মোবাইলে পাঠানো ৪ ডিজিটের ওটিপি কোডটি লিখুন।</p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">মোবাইল নম্বর</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                  )
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">ইমেইল</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder=""
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">পাসওয়ার্ড</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder=""
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center"
                >
                  {loading
                    ? (loginType === "member"
                      ? (showOtpScreen
                        ? "ওটিপি ভেরিফাই হচ্ছে..."
                        : "ওটিপি পাঠানো হচ্ছে...")
                      : "লগইন হচ্ছে...")
                    : (loginType === "member"
                      ? (showOtpScreen
                        ? "ভেরিফাই ওটিপি"
                        : "ওটিপি পাঠান")
                      : "লগইন")}
                </button>

                <div className="text-center pt-2">
                  {showOtpScreen ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpScreen(false);
                        setOtp("");
                        setError("");
                      }}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                    >
                      ← পিছনে যান (মোবাইল নম্বর পরিবর্তন করুন)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginType(null);
                        setError("");
                      }}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                    >
                      ← লগইন ধরন পরিবর্তন করুন
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
