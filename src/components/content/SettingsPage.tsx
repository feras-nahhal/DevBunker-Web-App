"use client";
import { useAuthContext } from "@/hooks/AuthProvider";
import { useState, useEffect, useRef } from "react";

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // For success message
  const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });
  const { profileImage } = useAuthContext(); // user contains the id
  const { refreshProfileImage } = useAuthContext();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

    // -----------------------------
  // Handle file selection
  // -----------------------------
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // -----------------------------
  // Upload image
  // -----------------------------
  const upload = async () => {
    if (!image) return;
    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", image);

      const res = await fetch("/api/upload-profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        await refreshProfileImage();
        setSuccess("Profile image updated!");
        setPreview(data.url);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };



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
    if (typeof window !== "undefined") {  // Fixed: was `!== ""`, should be `!== "undefined"`
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
      className="custom-scrollbar flex flex-col items-center p-4 gap-4 isolate bg-white/[0.05] border border-[rgba(80,80,80,0.24)] shadow-[inset_0px_0px_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px] overflow-y-auto w-full max-w-[920px]"  
      style={{ maxHeight: "100vh", boxSizing: "border-box", paddingRight: "12px" }}
    >
       {/* Title */}
      <div className="flex justify-center items-center mb-4 w-full">
        <h2
          className="font-publicSans font-bold text-[24px] leading-[36px] flex items-left justify-left w-full max-w-[853px]"  
          style={{
            height: "30px",
            background: "radial-gradient(137.85% 214.06% at 50% 50%, #FFFFFF 0%, #5BE49B 50%, rgba(255, 255, 255, 0.4) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontWeight: 700,
            fontSize: "20px",
            lineHeight: "36px",
            textAlign: "left",
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Image Upload 
        </h2>
      </div>
      {/* Success Message */}
        {success && (
          <div className="w-full max-w-[855px] p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">  
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="w-full max-w-[855px] p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm"> 
            {error}
          </div>
        )}
        {/* Profile Image Upload */}
        <div className="flex flex-col items-center gap-2 w-full max-w-[300px]">
          <div className="w-[150px] h-[150px] rounded-full overflow-hidden border border-white/20 relative group">
            {/* Preview or fallback */}
            <img
              src={preview || profileImage || ""}
              alt="Preview"
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                !preview && !profileImage ? "opacity-0" : "opacity-100"
              }`}
            />
            {!preview && !profileImage && (
              <div className="w-full h-full flex items-center justify-center bg-white/10 text-white/50">
                No Image
              </div>
            )}

            {/* Overlay for "Upload Image" with camera */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <svg width="27" height="24" viewBox="0 0 27 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M13.3333 9.66673C13.5985 9.66673 13.8529 9.77209 14.0404 9.95962C14.228 10.1472 14.3333 10.4015 14.3333 10.6667V12.3334H16C16.2652 12.3334 16.5196 12.4388 16.7071 12.6263C16.8946 12.8138 17 13.0682 17 13.3334C17 13.5986 16.8946 13.853 16.7071 14.0405C16.5196 14.228 16.2652 14.3334 16 14.3334H14.3333V16.0001C14.3333 16.2653 14.228 16.5196 14.0404 16.7072C13.8529 16.8947 13.5985 17.0001 13.3333 17.0001C13.0681 17.0001 12.8138 16.8947 12.6262 16.7072C12.4387 16.5196 12.3333 16.2653 12.3333 16.0001V14.3334H10.6667C10.4015 14.3334 10.1471 14.228 9.95956 14.0405C9.77202 13.853 9.66667 13.5986 9.66667 13.3334C9.66667 13.0682 9.77202 12.8138 9.95956 12.6263C10.1471 12.4388 10.4015 12.3334 10.6667 12.3334H12.3333V10.6667C12.3333 10.4015 12.4387 10.1472 12.6262 9.95962C12.8138 9.77209 13.0681 9.66673 13.3333 9.66673Z" fill="white"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M10.3707 24.0001H16.296C20.4573 24.0001 22.5387 24.0001 24.0333 23.0201C24.6783 22.5974 25.2337 22.0519 25.668 21.4147C26.6667 19.9481 26.6667 17.9041 26.6667 13.8187C26.6667 9.73206 26.6667 7.6894 25.668 6.22273C25.2337 5.58554 24.6783 5.04006 24.0333 4.6174C23.0733 3.98673 21.8707 3.7614 20.0293 3.6814C19.1507 3.6814 18.3947 3.02806 18.2227 2.1814C18.0912 1.56122 17.7497 1.00544 17.2558 0.607997C16.7619 0.21055 16.1459 -0.00419308 15.512 6.20411e-05H11.1547C9.83733 6.20411e-05 8.70267 0.913396 8.444 2.1814C8.272 3.02806 7.516 3.6814 6.63733 3.6814C4.79733 3.7614 3.59467 3.98806 2.63333 4.6174C1.98883 5.04015 1.43383 5.58563 1 6.22273C0 7.6894 0 9.73206 0 13.8187C0 17.9041 7.94729e-08 19.9467 0.998667 21.4147C1.43067 22.0494 1.98533 22.5947 2.63333 23.0201C4.128 24.0001 6.20933 24.0001 10.3707 24.0001ZM18.6667 13.3334C18.6667 14.7479 18.1048 16.1044 17.1046 17.1046C16.1044 18.1048 14.7478 18.6667 13.3333 18.6667C11.9188 18.6667 10.5623 18.1048 9.5621 17.1046C8.5619 16.1044 8 14.7479 8 13.3334C8 11.9189 8.5619 10.5624 9.5621 9.56216C10.5623 8.56197 11.9188 8.00006 13.3333 8.00006C14.7478 8.00006 16.1044 8.56197 17.1046 9.56216C18.1048 10.5624 18.6667 11.9189 18.6667 13.3334ZM21.3333 8.3334C21.0681 8.3334 20.8138 8.43875 20.6262 8.62629C20.4387 8.81383 20.3333 9.06818 20.3333 9.3334C20.3333 9.59861 20.4387 9.85297 20.6262 10.0405C20.8138 10.228 21.0681 10.3334 21.3333 10.3334H22.6667C22.9319 10.3334 23.1862 10.228 23.3738 10.0405C23.5613 9.85297 23.6667 9.59861 23.6667 9.3334C23.6667 9.06818 23.5613 8.81383 23.3738 8.62629C23.1862 8.43875 22.9319 8.3334 22.6667 8.3334H21.3333Z" fill="white"/>
              </svg>

              <span className="text-xs font-semibold">
                {preview || profileImage ? "Update Image" : "Upload Image"}
              </span>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Instructions under photo */}
          <p className="text-[11px] text-white/50 text-center mt-1">
            Allowed: *.jpeg, *.jpg, *.png, *.gif<br />Max size: 3.1 MB
          </p>

          {/* Upload button */}
          <button
            onClick={upload}
            disabled={!image || uploading}
            className="relative w-[200px] h-[45px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-xs flex items-center justify-center transition hover:scale-[1.02] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
            <span className="relative z-10">{uploading ? "Uploading..." : "Upload Image"}</span>
          </button>
        </div>


       {/* Title */}
      <div className="flex justify-center items-center mb-4 w-full">
        <h2
          className="font-publicSans font-bold text-[24px] leading-[36px] flex items-left justify-left w-full max-w-[853px]"  
          style={{
            height: "30px",
            background: "radial-gradient(137.85% 214.06% at 50% 50%, #FFFFFF 0%, #5BE49B 50%, rgba(255, 255, 255, 0.4) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontWeight: 700,
            fontSize: "20px",
            lineHeight: "36px",
            textAlign: "left",
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Password Change  
        </h2>
      </div>

     

      {/* Form */}
      <form ref={formRef} className="w-full flex flex-col items-center gap-6">
        

        {/* Old Password Input */}
        <div className="w-full max-w-[855px] flex flex-col gap-2">  
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
        <div className="w-full max-w-[855px] flex flex-col gap-2">  
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
        <div className="w-full max-w-[855px] flex flex-col gap-2">  
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
        <div className="flex justify-start mt-2 w-full max-w-[855px]">  
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