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
  const [isMember, setIsMember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isMember) {
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
      setError(err.response?.data?.message || (isMember ? (showOtpScreen ? "ভুল ওটিপি কোড।" : "লগইন ব্যর্থ হয়েছে। মোবাইল নম্বর যাচাই করুন।") : "লগইন ব্যর্থ হয়েছে। ইমেইল এবং পাসওয়ার্ড যাচাই করুন।"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">সমবায় সমিতি</h1>
          <p className="text-blue-100">ম্যানেজমেন্ট সফটওয়্যার</p>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {showOtpScreen ? "ওটিপি ভেরিফিকেশন" : "লগইন করুন"}
          </h2>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isMember ? (
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
                    placeholder="admin@coop.com"
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
                    placeholder="******"
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
                ? (isMember
                    ? (showOtpScreen
                        ? "ওটিপি ভেরিফাই হচ্ছে..."
                        : "ওটিপি পাঠানো হচ্ছে...")
                    : "লগইন হচ্ছে...")
                : (isMember
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
                    setIsMember(!isMember);
                    setError("");
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
                >
                  {isMember ? "অ্যাডমিন/স্টাফ লগইন" : "সদস্য লগইন"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
