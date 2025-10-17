"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // For success message
  const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });
  const formRef = useRef<HTMLFormElement>(null);

  // Handle Enter key to submit (if focused on inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isSubmitting && formRef.current) {
        e.preventDefault();
        handleSubmit();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [oldPassword, newPassword, confirmPassword, isSubmitting]);

  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // SSR-safe way to get token from localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  const validateForm = () => {
    if (!oldPassword.trim()) {
      setError("Old password is required.");
      return false;
    }
    if (!newPassword.trim()) {
      setError("New password is required.");
      return false;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return false;
    }
    if (!confirmPassword.trim()) {
      setError("Please confirm your new password.");
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError("");
    setSuccess(""); // Clear previous success

    const token = getToken();
    if (!token) {
      setError("Please log in first to change your password.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Direct API call to /api/auth/change-password
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword, // confirmPassword is validated client-side only
        }),
      });

      const result = await response.json(); // Assumes { success: boolean; error?: string; message?: string }
      if (result.success) {
        // Success: Clear form and show message
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess(result.message || "Password updated successfully!");
      } else {
        setError(result.error || "Failed to update password. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Password update error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (type: "old" | "new" | "confirm") => {
    setShowPassword((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div
      className="custom-scrollbar flex flex-col items-center p-4 gap-4 isolate bg-white/[0.05] border border-[rgba(80,80,80,0.24)] shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px] overflow-y-auto"
      style={{ width: "920px", maxHeight: "90vh", boxSizing: "border-box", paddingRight: "12px",marginLeft:"190px" }}
    >
      {/* Title */}
      <div className="flex justify-center items-center mb-4 w-full">
        <h2
          className="font-publicSans font-bold text-[24px] leading-[36px] flex items-center justify-center"
          style={{
            width: "853px",
            height: "72px",
            background: "radial-gradient(137.85% 214.06% at 50% 50%, #FFFFFF 0%, #5BE49B 50%, rgba(255, 255, 255, 0.4) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontWeight: 700,
            fontSize: "24px",
            lineHeight: "36px",
            textAlign: "center",
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Change Password
        </h2>
      </div>

      {/* Form */}
      <form ref={formRef} className="w-full flex flex-col items-center gap-6">
        {/* Success Message */}
        {success && (
          <div className="w-[855px] p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="w-[855px] p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Old Password Input */}
        <div className="w-[855px] flex flex-col gap-2">
          <label className="text-white font-bold text-[16px] leading-[22px] font-public-sans">
            Old Password
          </label>
          <div className="relative">
            <input
              type={showPassword.old ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter your old password"
              className="w-full h-[48px] p-3 bg-transparent border border-[#918AAB26] rounded-[4px] text-white text-sm focus:outline-none focus:border-white/50 pr-10"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("old")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-sm"
              disabled={isSubmitting}
            >
              {showPassword.old ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* New Password Input */}
        <div className="w-[855px] flex flex-col gap-2">
          <label className="text-white font-bold text-[16px] leading-[22px] font-public-sans">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword.new ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password (min 6 characters)"
              className="w-full h-[48px] p-3 bg-transparent border border-[#918AAB26] rounded-[4px] text-white text-sm focus:outline-none focus:border-white/50 pr-10"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-sm"
              disabled={isSubmitting}
            >
              {showPassword.new ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Confirm Password Input */}
        <div className="w-[855px] flex flex-col gap-2">
          <label className="text-white font-bold text-[16px] leading-[22px] font-public-sans">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPassword.confirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className="w-full h-[48px] p-3 bg-transparent border border-[#918AAB26] rounded-[4px] text-white text-sm focus:outline-none focus:border-white/50 pr-10"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-sm"
              disabled={isSubmitting}
            >
              {showPassword.confirm ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-start mt-2 w-[855px]">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !oldPassword || !newPassword || !confirmPassword}
            className="relative w-[120px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-xs flex items-center justify-center transition hover:scale-[1.02] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
            <span className="relative z-10">{isSubmitting ? "..." : "Save Changes"}</span>
          </button>
        </div>
      </form>

      <style jsx>{`
        .custom-scrollbar {
          width: 100%;
          box-sizing: border-box;
          border-radius: 16px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}