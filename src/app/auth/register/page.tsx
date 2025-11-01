"use client";
import { useEffect, useState } from "react";
import { EyeIcon, EyeSlashIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("error"); // "error" or "success"
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark'); // Add theme state

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };



  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const form = e.currentTarget; // Correct type: HTMLFormElement

  const email = (form.elements.namedItem("email") as HTMLInputElement)?.value || "";
  const password = (form.elements.namedItem("password") as HTMLInputElement)?.value || "";
  const confirmPassword = (form.elements.namedItem("confirm-password") as HTMLInputElement)?.value || "";

  if (password !== confirmPassword) {
    setPopupMessage("❌ Passwords do not match");
    setPopupType("error");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 1500);
    return;
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      setPopupMessage("❌ Registration failed");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1500);
      return;
    }

    setPopupMessage("✅ Registration successful!");
    setPopupType("success");
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
      router.push("/auth/login");
    }, 1500);
  } catch (err) {
    setPopupMessage("❌ Something went wrong");
    setPopupType("error");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 1500);
  }
}


  return (
    <div className={`relative min-h-screen overflow-hidden ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {/* Glow Center - only in dark mode */}
      {theme === 'dark' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-green-500/30 blur-[200px]" />
      )}

      {/* Glow/Grid Photo – Upper Left - only in dark mode */}
      {theme === 'dark' && (
        <div className="absolute top-50 left-80 -translate-x-1/3 -translate-y-1/3 w-[608px] h-[608px] pointer-events-none">
          <Image
            src="/grid-glow.png"
            alt="Grid Glow Upper Left"
            width={608}
            height={608}
            className="object-contain opacity-70"
            priority
          />
        </div>
      )}

      {/* Glow/Grid Photo – Lower Right - only in dark mode */}
      {theme === 'dark' && (
        <div className="absolute bottom-50 right-80 translate-x-1/3 translate-y-1/3 w-[608px] h-[608px] pointer-events-none">
          <Image
            src="/grid-glow.png"
            alt="Grid Glow Lower Right"
            width={608}
            height={608}
            className="object-contain opacity-70"
            priority
          />
        </div>
      )}

      {/* Top Bar */}
      <header className="absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-20">
        <Image
          src="/logo.png"
          alt="Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <div className="flex items-center gap-4">
     
          <a
            href="#"
            className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-green-400' : 'text-gray-700 hover:text-green-600'}`}
          >
            <Image
              src="/setting_logo.png"
              alt="Help Icon"
              width={20}
              height={20}
              className="object-contain"
            />
            Need help?
          </a>
        </div>
      </header>

      {/* Two Columns */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 h-screen">
        {/* Left Side */}
        <div className="flex flex-col items-center justify-center px-6 py-12 md:py-0">
          <h3 className={`font-bold text-[32px] leading-[48px] font-barlow text-center ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            Join Us
          </h3>
          <p className={`mt-2 font-['Public Sans'] text-[16px] leading-[24px] text-center ${theme === 'dark' ? 'text-[#434343]' : 'text-gray-600'}`}>
            Create an account and start collaborating.
          </p>
        </div>

        {/* Right Side */}
        <div className="flex items-center justify-center px-6 py-12 md:py-0">
          {/* Outer Glass Box */}
          <div
            className={`w-full max-w-[420px] md:w-[420px] h-[421px] flex items-center justify-center ${theme === 'dark' ? 'bg-white/[0.05] border-white/10' : 'bg-black/[0.05] border-black/10'} backdrop-blur-[20px] rounded-2xl shadow-lg`} style={{
              boxShadow: "inset 0px 0px 7px rgba(255, 255, 255, 0.16)",
            }}
          >
            {/* Inner Box */}
            <div
              className={`w-[96%] max-w-[404px] md:w-[404px] h-[405px] flex flex-col p-6 gap-6 ${theme === 'dark' ? 'bg-white/[0.05]' : 'bg-black/[0.05]'} rounded-xl`}
            >
              {/* Header */}
              <div>
                <h1 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  Create your account
                </h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className={`font-medium transition-colors ${theme === 'dark' ? 'text-green-500 hover:text-green-400' : 'text-green-600 hover:text-green-500'}`}
                  >
                    Login
                  </Link>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className={`w-full rounded-full border px-4 py-2 placeholder-gray-500 focus:ring-2 ${theme === 'dark' ? 'border-gray-700 bg-transparent text-white focus:border-green-500 focus:ring-green-600/50' : 'border-gray-300 bg-white text-black focus:border-green-500 focus:ring-green-600/50'}`}
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="password" className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="6+ characters"
                      className={`w-full rounded-full border px-4 py-2 pr-10 placeholder-gray-500 focus:ring-2 ${theme === 'dark' ? 'border-gray-700 bg-transparent text-white focus:border-green-500 focus:ring-green-600/50' : 'border-gray-300 bg-white text-black focus:border-green-500 focus:ring-green-600/50'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 right-3 flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    >
                      {showPassword ? (
                        <EyeIcon className="h-5 w-5" />
                      ) : (
                        <EyeSlashIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="confirm-password" className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="6+ characters"
                      className={`w-full rounded-full border px-4 py-2 pr-10 placeholder-gray-500 focus:ring-2 ${theme === 'dark' ? 'border-gray-700 bg-transparent text-white focus:border-green-500 focus:ring-green-600/50' : 'border-gray-300 bg-white text-black focus:border-green-500 focus:ring-green-600/50'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute inset-y-0 right-3 flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="h-5 w-5" />
                      ) : (
                        <EyeSlashIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="relative w-full flex justify-center">
                  <button
                    type="submit"
                    className={`relative w-full md:w-[364px] h-[36px] rounded-full shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden ${theme === 'dark' ? 'bg-white/[0.05] border-white/10 text-white' : 'bg-black/[0.05] border-black/10 text-black'}`}
                  >
                    <span className={`absolute inset-0 rounded-full blur-md ${theme === 'dark' ? 'bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)]' : 'bg-[radial-gradient(circle,rgba(119,237,139,0.3)_0%,transparent_70%)]'}`} />
                    <span className="relative z-10">Register</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div
            className={`w-full max-w-[400px] h-[200px] flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-white/[0.05] border-white/10' : 'bg-black/[0.05] border-black/10'} backdrop-blur-[20px] rounded-2xl shadow-lg p-6`}
          >
            <h2
              className={`text-lg font-bold mb-4 ${
                popupType === "error" ? "text-red-400" : "text-green-400"
              }`}
            >
              {popupMessage}
            </h2>
            <button
              onClick={() => setShowPopup(false)}
              className={`relative w-[120px] h-[36px] rounded-full shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden ${theme === 'dark' ? 'bg-white/[0.05] border-white/10 text-white' : 'bg-black/[0.05] border-black/10 text-black'}`}
            >
              <span
                className={`absolute inset-0 rounded-full blur-md ${
                  popupType === "error"
                    ? "bg-[radial-gradient(circle,rgba(255,99,99,0.5)_0%,transparent_70%)]"
                    : "bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)]"
                }`}
              />
              <span className="relative z-10">OK</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
