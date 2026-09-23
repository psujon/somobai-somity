import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Phone, Mail, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberLoginMethod, setMemberLoginMethod] = useState<"phone" | "email">("phone");
  const [otp, setOtp] = useState("");
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [loginType, setLoginType] = useState<"admin" | "member" | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendMemberOtp = async () => {
    const payload = memberLoginMethod === "email"
      ? { email: memberEmail.trim(), method: "email" }
      : { phone: phone.trim(), method: "phone" };

    const res = await axios.post(`${process.env.API_HOST}/api/auth/member-login`, payload);
    return res.data;
  };

  const handleResendOtp = async () => {
    setError("");
    setResendingOtp(true);
    try {
      await handleSendMemberOtp();
      setOtp("");
    } catch (err: any) {
      setError(err.response?.data?.message || "ওটিপি পুনরায় পাঠাতে সমস্যা হয়েছে।");
    } finally {
      setResendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (loginType === "member") {
        if (!showOtpScreen) {
          // Step 1: Send OTP via Phone or Email
          await handleSendMemberOtp();
          setShowOtpScreen(true);
        } else {
          // Step 2: Verify OTP
          const identifier = memberLoginMethod === "email" ? memberEmail.trim() : phone.trim();
          const res = await axios.post(`${process.env.API_HOST}/api/auth/verify-otp`, {
            identifier,
            phone: memberLoginMethod === "phone" ? phone.trim() : undefined,
            email: memberLoginMethod === "email" ? memberEmail.trim() : undefined,
            otp: otp.trim(),
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
      if (loginType === "member") {
        if (showOtpScreen) {
          setError(err.response?.data?.message || "ভুল ওটিপি কোড। অনুগ্রহ করে সঠিক কোড দিন।");
        } else {
          setError(err.response?.data?.message || (memberLoginMethod === "email" ? "লগইন ব্যর্থ হয়েছে। ইমেইল অ্যাড্রেস যাচাই করুন।" : "লগইন ব্যর্থ হয়েছে। মোবাইল নম্বর যাচাই করুন।"));
        }
      } else {
        setError(err.response?.data?.message || "লগইন ব্যর্থ হয়েছে। ইমেইল এবং পাসওয়ার্ড যাচাই করুন।");
      }
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

      <div className="max-w-md w-full bg-white/85 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden z-10 border border-white/60">
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
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {loginType === "member" ? (
                  showOtpScreen ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                        <ShieldCheck size={28} />
                      </div>
                      <label className="block text-sm font-semibold text-gray-700 text-center">৪ ডিজিটের ওটিপি কোড লিখুন</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={4}
                        autoFocus
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-center tracking-widest text-2xl font-bold bg-slate-50"
                        placeholder="XXXX"
                      />
                      <p className="text-xs text-gray-500 text-center">
                        {memberLoginMethod === "email" ? (
                          <>আপনার নিবন্ধিত ইমেইল <strong className="text-blue-600 font-semibold">{memberEmail}</strong>-এ পাঠানো কোডটি লিখুন।</>
                        ) : (
                          <>আপনার নিবন্ধিত মোবাইল নম্বর <strong className="text-blue-600 font-semibold">{phone}</strong>-এ পাঠানো কোডটি লিখুন।</>
                        )}
                      </p>

                      {/* Resend OTP button */}
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendingOtp}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 transition"
                        >
                          <RefreshCw size={12} className={resendingOtp ? "animate-spin" : ""} />
                          {resendingOtp ? "ওটিপি পাঠানো হচ্ছে..." : "ওটিপি পুনরায় পাঠান"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* মোবাইল / ইমেইল মেথড সিলেক্টর ট্যাব */}
                      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            setMemberLoginMethod("phone");
                            setError("");
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition flex items-center justify-center gap-1.5 ${
                            memberLoginMethod === "phone"
                              ? "bg-white text-blue-700 shadow-sm font-semibold"
                              : "text-slate-600 hover:text-slate-800"
                          }`}
                        >
                          <Phone size={15} />
                          মোবাইল নম্বর
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMemberLoginMethod("email");
                            setError("");
                          }}
                          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition flex items-center justify-center gap-1.5 ${
                            memberLoginMethod === "email"
                              ? "bg-white text-blue-700 shadow-sm font-semibold"
                              : "text-slate-600 hover:text-slate-800"
                          }`}
                        >
                          <Mail size={15} />
                          ইমেইল আইডি
                        </button>
                      </div>

                      {memberLoginMethod === "phone" ? (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">সদস্যের মোবাইল নম্বর</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Phone size={16} />
                            </div>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                              placeholder="01XXXXXXXXX"
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">আপনার সমিতির নিবন্ধিত মোবাইল নম্বর দিন।</p>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">সদস্যের ইমেইল অ্যাড্রেস</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                              <Mail size={16} />
                            </div>
                            <input
                              type="email"
                              value={memberEmail}
                              onChange={(e) => setMemberEmail(e.target.value)}
                              required
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                              placeholder="example@gmail.com"
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">আপনার সমিতির প্রোফাইলে যুক্ত ইমেইল আইডি দিন।</p>
                        </div>
                      )}
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
                        placeholder="admin@example.com"
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
                        placeholder="••••••••"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-70 flex justify-center items-center shadow-md hover:shadow-lg"
                >
                  {loading
                    ? (loginType === "member"
                      ? (showOtpScreen
                        ? "ওটিপি ভেরিফাই হচ্ছে..."
                        : "ওটিপি কোড পাঠানো হচ্ছে...")
                      : "লগইন হচ্ছে...")
                    : (loginType === "member"
                      ? (showOtpScreen
                        ? "ভেরিফাই ও লগইন করুন"
                        : "ওটিপি কোড পাঠান")
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
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                    >
                      <ArrowLeft size={14} />
                      পিছনে যান ({memberLoginMethod === "email" ? "ইমেইল পরিবর্তন করুন" : "মোবাইল নম্বর পরিবর্তন করুন"})
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginType(null);
                        setError("");
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                    >
                      <ArrowLeft size={14} />
                      লগইন ধরন পরিবর্তন করুন
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

