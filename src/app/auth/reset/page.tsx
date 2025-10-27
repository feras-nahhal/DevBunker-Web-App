"use client";
import { useEffect, useState } from "react";
import { EyeIcon, EyeSlashIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("error");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const router = useRouter();

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    if (saved) setTheme(saved);
  }, []);

  // Save theme when changed
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement)?.value || "";
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement)?.value || "";

    if (newPassword !== confirmPassword) {
      setPopupMessage("❌ Passwords do not match");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1500);
      return;
    }

    if (!email) {
      setPopupMessage("❌ Invalid or missing reset link");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1500);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/change-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();

      if (!data.success) {
        setPopupMessage(`❌ ${data.error || "Failed to reset password"}`);
        setPopupType("error");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 1500);
        return;
      }

      setPopupMessage("✅ Password reset successfully!");
      setPopupType("success");
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        router.push("/auth/login");
      }, 1500);
    } catch {
      setPopupMessage("❌ Something went wrong");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`relative min-h-screen overflow-hidden ${theme === "dark" ? "bg-black" : "bg-white"}`}>
      {/* Glow Center */}
      {theme === "dark" && (
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/30 blur-[200px]" />
      )}

      {/* Glow/Grid Photo Upper Left */}
      {theme === "dark" && (
        <div className="absolute top-50 left-80 -translate-x-1/3 -translate-y-1/3 w-[608px] h-[608px] pointer-events-none">
          <Image src="/grid-glow.png" alt="Grid Glow Upper Left" width={608} height={608} className="opacity-70" priority />
        </div>
      )}

      {/* Glow/Grid Photo Lower Right */}
      {theme === "dark" && (
        <div className="absolute bottom-50 right-80 translate-x-1/3 translate-y-1/3 w-[608px] h-[608px] pointer-events-none">
          <Image src="/grid-glow.png" alt="Grid Glow Lower Right" width={608} height={608} className="opacity-70" priority />
        </div>
      )}

      {/* Top Bar */}
      <header className="absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-20">
        <Image src="/logo.png" alt="Logo" width={40} height={40} />
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 text-sm ${theme === "dark"
              ? "text-gray-300 hover:text-green-400"
              : "text-gray-700 hover:text-green-600"}`}
          >
            {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <a
            href="#"
            className={`flex items-center gap-2 text-sm ${theme === "dark"
              ? "text-gray-300 hover:text-green-400"
              : "text-gray-700 hover:text-green-600"}`}
          >
            <Image src="/setting_logo.png" alt="Help Icon" width={20} height={20} />
            Need help?
          </a>
        </div>
      </header>

      {/* Two Columns Layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 h-screen">
        {/* Left Column */}
        <div className="flex flex-col items-center justify-center px-6 py-12 md:py-0">
          <h3 className={`font-bold text-[32px] leading-[48px] font-barlow text-center ${theme === "dark" ? "text-white" : "text-black"}`}>
            Reset Password
          </h3>
          <p className={`mt-2 text-[16px] text-center ${theme === "dark" ? "text-[#434343]" : "text-gray-600"}`}>
            Choose a new password to regain access.
          </p>
        </div>

        {/* Right Column */}
        <div className="flex items-center justify-center px-6 py-12 md:py-0">
          {/* Outer Box */}
         <div className={`w-full max-w-[420px] md:w-[420px] h-[380px] flex items-center justify-center ${theme === 'dark' ? 'bg-white/[0.05] border-white/10' : 'bg-black/[0.05] border-black/10'} backdrop-blur-[20px] rounded-2xl shadow-lg`}style={{
              boxShadow: "inset 0px 0px 7px rgba(255, 255, 255, 0.16)",
            }}>
            {/* Inner Box */}
             <div className={`w-full max-w-[404px] md:w-[404px] h-[360px] flex flex-col p-6 gap-6 ${theme === 'dark' ? 'bg-white/[0.05]' : 'bg-black/[0.05]'} rounded-xl`}>
              {/* Header */}
              <div>
                <h1 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}>
                  Reset your password
                </h1>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {email ? `Resetting password for ${email}` : "Invalid or missing reset link"}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* New Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="newPassword" className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="6+ characters"
                      className={`w-full rounded-full border px-4 py-2 pr-10 focus:ring-2 ${theme === "dark"
                        ? "border-gray-700 bg-transparent text-white focus:border-green-500 focus:ring-green-600/50"
                        : "border-gray-300 bg-white text-black focus:border-green-500 focus:ring-green-600/50"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 right-3 flex items-center ${theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-black"}`}
                    >
                      {showPassword ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="confirmPassword" className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="6+ characters"
                      className={`w-full rounded-full border px-4 py-2 pr-10 focus:ring-2 ${theme === "dark"
                        ? "border-gray-700 bg-transparent text-white focus:border-green-500 focus:ring-green-600/50"
                        : "border-gray-300 bg-white text-black focus:border-green-500 focus:ring-green-600/50"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute inset-y-0 right-3 flex items-center ${theme === "dark"
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-black"}`}
                    >
                      {showConfirmPassword ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="relative w-full flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`relative w-full md:w-[364px] h-[36px] rounded-full shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden ${theme === "dark"
                      ? "bg-white/[0.05] border-white/10 text-white"
                      : "bg-black/[0.05] border-black/10 text-black"}`}
                  >
                    <span className={`absolute inset-0 rounded-full blur-md ${theme === "dark"
                      ? "bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)]"
                      : "bg-[radial-gradient(circle,rgba(119,237,139,0.3)_0%,transparent_70%)]"}`} />
                    <span className="relative z-10">{loading ? "Resetting..." : "Reset Password"}</span>
                  </button>
                </div>

                {/* Back to Login */}
                <p className={`text-center text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Remembered your password?{" "}
                  <Link
                    href="/auth/login"
                    className={`font-medium ${theme === "dark" ? "text-green-500 hover:text-green-400" : "text-green-600 hover:text-green-500"}`}
                  >
                    Login
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div
            className={`w-full max-w-[400px] h-[200px] flex flex-col items-center justify-center ${theme === "dark"
              ? "bg-white/[0.05] border-white/10"
              : "bg-black/[0.05] border-black/10"} backdrop-blur-[20px] rounded-2xl shadow-lg p-6`}
          >
            <h2 className={`text-lg font-bold mb-4 ${popupType === "error" ? "text-red-400" : "text-green-400"}`}>
              {popupMessage}
            </h2>
            <button
              onClick={() => setShowPopup(false)}
              className={`relative w-[120px] h-[36px] rounded-full shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden ${theme === "dark"
                ? "bg-white/[0.05] border-white/10 text-white"
                : "bg-black/[0.05] border-black/10 text-black"}`}
            >
              <span
                className={`absolute inset-0 rounded-full blur-md ${popupType === "error"
                  ? "bg-[radial-gradient(circle,rgba(255,99,99,0.5)_0%,transparent_70%)]"
                  : "bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)]"}`}
              />
              <span className="relative z-10">OK</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
