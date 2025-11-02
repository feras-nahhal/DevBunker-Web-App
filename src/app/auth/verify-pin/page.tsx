"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function VerifyPinPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [email, setEmail] = useState<string | null>(null);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("error");
  const router = useRouter();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);


  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Save theme changes
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Get email from URL query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email"));
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // only digits
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const pinValue = pin.join("");
    if (pinValue.length !== 4) {
      setPopupMessage("❌ Enter all 4 digits of the PIN");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1500);
      return;
    }
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin: pinValue }),
      });
      const data = await res.json();

      if (!data.success) {
        setPopupMessage(`❌ ${data.error || "Invalid or expired PIN"}`);
        setPopupType("error");
      } else {
        setPopupMessage("✅ PIN verified!");
        setPopupType("success");
        setTimeout(() => router.push(`/auth/reset?email=${encodeURIComponent(email)}`), 1500);
      }
    } catch {
      setPopupMessage("❌ Network error");
      setPopupType("error");
    } finally {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1500);
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${theme === "dark" ? "bg-black" : "bg-white"}`}>
      {/* Glow Effects */}
      {theme === "dark" && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-green-500/30 blur-[200px]" />
          <div className="absolute top-50 left-80 -translate-x-1/3 -translate-y-1/3 w-[608px] h-[608px] opacity-70 pointer-events-none">
            <Image src="/grid-glow.png" alt="Grid Glow Upper" width={608} height={608} />
          </div>
        </>
      )}

      {/* Top Bar */}
      <header className="absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-20">
        <Image src="/logo.png" alt="Logo" width={40} height={40} />
        <div className="flex items-center gap-4">
          <a
            href="#"
            className={`flex items-center gap-2 text-sm ${
              theme === "dark" ? "text-gray-300 hover:text-green-400" : "text-gray-700 hover:text-green-600"
            }`}
          >
            <Image src="/setting_logo.png" alt="Help" width={20} height={20} />
            Need help?
          </a>
        </div>
      </header>

      {/* Layout */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 h-screen">
        {/* Left Side */}
        <div className="flex flex-col items-center justify-center px-6 py-12 md:py-0">
          <h3 className={`font-bold text-[32px] leading-[48px] text-center ${theme === "dark" ? "text-white" : "text-black"}`}>
            Hi, Welcome back
          </h3>
          <p className={`mt-2 text-[16px] text-center ${theme === "dark" ? "text-[#434343]" : "text-gray-600"}`}>
            Enter the PIN sent to your email to reset your password.
          </p>
        </div>

        {/* Right Side */}
        <div className="flex items-center justify-center px-6 py-12 md:py-0">
          <div
            className={`relative flex items-center justify-center w-full max-w-[420px] h-[325px] rounded-2xl backdrop-blur-[37px] border border-[rgba(80,80,80,0.24)] shadow-lg ${
              theme === "dark" ? "bg-white/[0.05]" : "bg-black/[0.05]"
            }`}
          >
            <div className={`w-[95%] md:w-[404px] h-[305px] flex flex-col p-6 gap-6 ${theme === "dark" ? "bg-white/[0.05]" : "bg-black/[0.05]"} rounded-xl`}>
              <div className="text-center">
                <h1 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}>Verify PIN</h1>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  {email ? `PIN sent to ${email}` : "Email missing"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6 items-center">
                <div className="flex gap-3">
                  {pin.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}

                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-14 h-14 text-center rounded-lg text-xl font-bold border focus:ring-2 ${
                        theme === "dark"
                          ? "border-gray-700 bg-transparent text-white focus:border-green-500 focus:ring-green-600/50"
                          : "border-gray-300 bg-white text-black focus:border-green-500 focus:ring-green-600/50"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`relative w-full h-[36px] rounded-full font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden ${
                    theme === "dark"
                      ? "bg-white/[0.05] border-white/10 text-white"
                      : "bg-black/[0.05] border-black/10 text-black"
                  }`}
                >
                  <span
                    className={`absolute inset-0 rounded-full blur-md ${
                      theme === "dark"
                        ? "bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)]"
                        : "bg-[radial-gradient(circle,rgba(119,237,139,0.3)_0%,transparent_70%)]"
                    }`}
                  />
                  <span className="relative z-10">{loading ? "Verifying..." : "Verify PIN"}</span>
                </button>

                <div className="flex justify-center">
                  <Link
                    href="/auth/password-reset"
                    className={`flex items-center gap-2 text-sm ${theme === "dark" ? "text-white hover:text-green-400" : "text-black hover:text-green-600"}`}
                  >
                    Resend PIN
                  </Link>
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
            className={`w-full max-w-[400px] h-[200px] flex flex-col items-center justify-center ${
              theme === "dark" ? "bg-white/[0.05] border-white/10" : "bg-black/[0.05] border-black/10"
            } backdrop-blur-[20px] rounded-2xl shadow-lg p-6`}
          >
            <h2 className={`text-lg font-bold mb-4 ${popupType === "error" ? "text-red-400" : "text-green-400"}`}>
              {popupMessage}
            </h2>
            <button
              onClick={() => setShowPopup(false)}
              className={`relative w-[120px] h-[36px] rounded-full font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden ${
                theme === "dark" ? "bg-white/[0.05] border-white/10 text-white" : "bg-black/[0.05] border-black/10 text-black"
              }`}
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
