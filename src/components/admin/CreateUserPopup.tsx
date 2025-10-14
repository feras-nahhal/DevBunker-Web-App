"use client";

import { useState } from "react";
import { USER_ROLES } from "@/lib/enums";
import { useUsers } from "@/hooks/useUsers";

interface CreateUserPopupProps {
  onClose: () => void;
}

export default function CreateUserPopup({ onClose }: CreateUserPopupProps) {
  const { createUser, loading } = useUsers();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<USER_ROLES>(USER_ROLES.CONSUMER);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password || !confirmPassword) return alert("All fields are required");
    if (password !== confirmPassword) return alert("Passwords do not match");

    try {
      const success = await createUser(email, password, role);
      if (success) onClose();
      else alert("Failed to create user");
    } catch (err) {
      console.error(err);
      alert("Error creating user");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative flex flex-col items-start p-[0_0_24px] gap-1.5 bg-white/5 border border-[rgba(80,80,80,0.24)] shadow-[inset_0_0_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px]"
        style={{ width: "465px", height: "304px" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition"
        >
          ×
        </button>

        {/* Title aligned left */}
        <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 mt-4 ml-6">
          Create New User
        </h2>

        <div className="flex flex-col gap-2 w-[90%] mt-2 mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 bg-transparent border border-[#918AAB26] rounded text-white text-sm focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 bg-transparent border border-[#918AAB26] rounded text-white text-sm focus:outline-none"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className="w-full p-2 bg-transparent border border-[#918AAB26] rounded text-white text-sm focus:outline-none"
          />
        </div>

        {/* Custom Dropdown */}
        <div className="relative w-[90%] mt-2 mx-auto">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex justify-between items-center p-2 bg-white/5 border border-[#918AAB26] rounded text-white text-sm cursor-pointer"
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
            <span className="ml-2">▼</span>
          </div>
          {dropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white/5 backdrop-blur-[37px] border border-[#918AAB26] rounded z-50 max-h-40 overflow-auto">
              {Object.values(USER_ROLES).map((r) => (
                <div
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setDropdownOpen(false);
                  }}
                  className="p-2 text-white text-sm hover:bg-white/10 cursor-pointer"
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-3 w-[90%] h-9 rounded-full bg-white/5 border border-white/10 shadow-[inset_0_0_4px_rgba(119,237,139,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] mx-auto"
        >
          {loading ? "..." : "Create User"}
        </button>
      </div>
    </div>
  );
}
