"use client";
import { useState } from "react";
import { EyeIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; // Adjust the path if needed

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const { login, error } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = form.email.value;
    const password = form.password.value;

    const success = await login(email, password);
    if (success) {
      router.push("/dashboard/explore");
    } else {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1500);
    }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Glow Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-green-500/30 blur-[200px]" />

      {/* Upper Left Glow */}
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

      {/* Lower Right Glow */}
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

      {/* Top Bar */}
      <header className="absolute top-0 left-0 w-full flex items-center justify-between px-6 py-4 z-20">
        <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" />
        <a href="#" className="flex items-center gap-2 text-sm text-gray-300 hover:text-green-400">
          <Image src="/setting_logo.png" alt="Help Icon" width={20} height={20} className="object-contain" />
          Need help?
        </a>
      </header>

      <div className="relative z-10 grid grid-cols-2 h-screen">
        {/* Left Side */}
        <div className="flex flex-col items-center justify-center px-6">
          <h3 className="text-white font-bold text-[32px] leading-[48px] font-barlow text-center">
            Hi, Welcome back
          </h3>
          <p className="mt-2 text-[#434343] font-['Public Sans'] text-[16px] leading-[24px] text-center">
            More effectively with optimized workflows.
          </p>
        </div>

        {/* Right Side */}
        <div className="flex items-center justify-center px-6">
          <div className="w-[420px] h-[371px] flex items-center justify-center bg-white/[0.05] border border-white/10 backdrop-blur-[20px] rounded-2xl shadow-lg">
            <div className="w-[404px] h-[355px] flex flex-col p-6 gap-6 bg-white/[0.05] rounded-xl">
              {/* Header */}
              <div>
                <h1 className="text-xl font-bold text-white mb-2">Sign in to your account</h1>
                <p className="text-sm text-gray-400">
                  Don’t have an account?{" "}
                  <Link href="/auth/register" className="text-green-500 font-medium hover:text-green-400 transition-colors">
                    Get started
                  </Link>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-sm text-gray-400">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-full border border-gray-700 bg-transparent px-4 py-2 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-600/50"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="password" className="text-sm text-gray-400">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="6+ characters"
                      className="w-full rounded-full border border-gray-700 bg-transparent px-4 py-2 pr-10 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-600/50"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white">
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link href="/auth/password-reset" className="flex items-center gap-2 text-sm text-white hover:text-green-400 transition-colors">
                    Forgot password?
                  </Link>
                </div>

                <div className="relative w-full flex justify-center">
                  <button type="submit" className="relative w-[364px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden">
                    <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
                    <span className="relative z-10">Sign In</span>
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
          <div className="w-[400px] h-[200px] flex flex-col items-center justify-center bg-white/[0.05] border border-white/10 backdrop-blur-[20px] rounded-2xl shadow-lg p-6">
            <h2 className="text-red-400 text-lg font-bold mb-4">
              ❌ {error || "Wrong email or password"}
            </h2>
            <button onClick={() => setShowPopup(false)} className="relative w-[120px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden">
              <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,99,99,0.5)_0%,transparent_70%)] blur-md" />
              <span className="relative z-10">OK</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
