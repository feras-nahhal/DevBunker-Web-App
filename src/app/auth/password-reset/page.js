"use client";
import Image from "next/image";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Glow Center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-green-500/30 blur-[200px]" />

      {/* Glow/Grid Photo – Upper Left */}
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

      {/* Glow/Grid Photo – Lower Right */}
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
        <Image
          src="/logo.png"
          alt="Logo"
          width={40}
          height={40}
          className="object-contain"
        />
        <a
          href="#"
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-green-400"
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
      </header>

      {/* Two Columns */}
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
          {/* Outer Glass Box */}
          <div
            className="w-[420px] h-[312px] flex items-center justify-center 
              bg-white/[0.05] border border-white/10 
              backdrop-blur-[20px] rounded-2xl shadow-lg"
          >
            {/* Inner Box */}
            <div
              className="w-[404px] h-[296px] flex flex-col p-6 gap-2 
              bg-white/[0.05] rounded-xl"
            >
              {/* Header */}
              <div className="text-center">
                <h1 className="text-xl font-bold text-white mb-2">
                  Forgot your password?
                </h1>
                <p className="text-gray-400 text-sm mb-4">
                  We've sent a 6-digit confirmation email to your email. 
                  Please enter the code in below box to verify your email.
                </p>
              </div>

              {/* Form */}
              <form className="flex flex-col gap-4">
                {/* Email Address */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-sm text-gray-400">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-full border border-gray-700 bg-transparent 
                      px-4 py-2 text-white placeholder-gray-500 focus:border-green-500 
                      focus:ring-2 focus:ring-green-600/50"
                  />
                </div>

                {/* Submit Button */}
                <div className="relative w-full flex justify-center">
                  <button
                    type="submit"
                    className="relative w-[364px] h-[36px] rounded-full 
                      bg-white/[0.05] border border-white/10 
                      shadow-[inset_0_0_4px_rgba(239,214,255,0.25)]
                      backdrop-blur-[10px] text-white font-bold text-sm 
                      flex items-center justify-center transition hover:scale-[1.02]
                      overflow-hidden"
                  >
                    {/* Inner glow */}
                    <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
                    <span className="relative z-10">Send reset link</span>
                  </button>
                </div>

                {/* Return to Login */}
                <div className="flex justify-center">
                  <Link
                    href="/auth/login"
                    className="flex items-center gap-2 text-sm text-white hover:text-green-400 transition-colors"
                  >
                    {/* Left arrow icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                     Return to sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
