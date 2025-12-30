"use client";

import { useEffect, useState } from "react";

interface CreatePageHeaderProps {
  onSave?: (visibility: "private" | "public") => void; // ✅ updated to accept visibility 
  onSaveAsDraft?: () => void; 
  onCancel?: () => void; 
  saving?: boolean;
  collapsed?: boolean; // ✅ Add collapsed here
  isMobileOpen?: boolean; // NEW: For mobile sidebar state
  onMobileToggle?: (open: boolean) => void; // NEW: For toggling mobile sidebar
}

export default function CreatePageHeader({ 
  onSave, 
  onSaveAsDraft, 
  onCancel, 
  saving = false, 
  collapsed = false,
  isMobileOpen = false, // NEW: Default false
  onMobileToggle, // NEW: Handler
}: CreatePageHeaderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // dropdown state
      useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
      }, []);

  const handlePublish = (visibility: "private" | "public") => {
    onSave?.(visibility);
    setMenuOpen(false); // close menu after selection
  };

  return (
    <>
      <header className={`header ${!isMobile && collapsed ? "collapsed" : ""}`}>
        {/* NEW: Hamburger Button (only on mobile) */}
        {isMobile && (
          <button
            className="hamburger-btn"
            onClick={() => onMobileToggle?.(!isMobileOpen)}
            aria-label="Toggle sidebar"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        )}
        {/* Left: Dev + Banker */}
        <div className="header-left">
          <div className="dev">Dev</div>
          <div className="banker">Banker</div>
        </div>

        {/* Right: Three Buttons */}
        <div className="header-right">
          <button className="button cancel-btn" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="button draft-btn" onClick={onSaveAsDraft} disabled={saving}>
            {saving ? "Saving..." : "Save as Draft"}
          </button>
         {/* Single Publish Button with Dropdown */}
        <div className="publish-dropdown">
          <button
            className="button save-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            disabled={saving}
          >
            <span className="glow-bg" />
            <span className="text">{saving ? "Publishing..." : "Publish"}</span>
          </button>

          {menuOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => handlePublish("private")}>
                Private
              </button>
              <button className="dropdown-item" onClick={() => handlePublish("public")}>
                Public
              </button>
            </div>
          )}
        </div>
        </div>
      </header>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Aclonica&display=swap');

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          gap: 16px;
          width: calc(100% - 270px);
          height: 70px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(80, 80, 80, 0.24);
          box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(75px);
          border-radius: 16px;
          box-sizing: border-box;
          position: fixed;
          top: 12px;
          left: 260px;
          z-index: 10;
          transition: left 0.3s ease, width 0.3s ease; /* smooth animation */
        }

        /* ✅ Header moves when sidebar collapses */
        .header.collapsed {
  left: 80px; /* sidebar collapsed width */
  width: calc(100% - 80px - 12px); /* recalc width to fill remaining space */
  transition: all 0.3s ease;
}

        .header-left { display: flex; gap: 8px; }
        .dev { font-family: 'Aclonica', sans-serif; font-size: 24px; color: #5BE49B; opacity: 0.8; }
        .banker { font-family: 'Aclonica', sans-serif; font-size: 24px; color: #FFFFFF; opacity: 0.8; }

        .header-right { display: flex; gap: 10px; }

        .button {
          display: flex; justify-content: center; align-items: center;
          position: relative; overflow: hidden;
          padding: 0 16px; height: 36px; border-radius: 500px;
          border: 1px solid rgba(145, 158, 171, 0.32);
          font-family: 'Public Sans', sans-serif; font-weight: 700; font-size: 14px;
          color: #FFFFFF; background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px); cursor: pointer;
          transition: transform 0.2s ease;
        }
        .button:hover:not(:disabled) { transform: scale(1.02); }
        .button:disabled { opacity: 0.5; cursor: not-allowed; }

        .save-btn { color: #5BE49B; min-width: 78px; display: flex; justify-content: center; align-items: center; box-shadow: inset 0px 0px 4px rgba(239, 214, 255, 0.25); }
        .save-btn .glow-bg { position: absolute; inset: 0; border-radius: 500px; background: radial-gradient(circle, rgba(119, 237, 139, 0.5) 0%, transparent 70%); filter: blur(8px); z-index: 0; }
        .save-btn .text { position: relative; z-index: 10; }

        .draft-btn { min-width: 113px; padding: 0 12px; height: 36px; display: flex; justify-content: center; align-items: center; }
        .cancel-btn { width: 78px; }

         /* 📱 Mobile & Tablet Responsive */
        @media (max-width: 1024px) {
          .header {
            left: 100px; /* smaller sidebar on medium screens */
            width: calc(100% - 100px - 12px);
            padding: 8px 12px;
          }

          .header-left .dev,
          .header-left .banker {
            font-size: 20px;
          }

          .search-bar {
            max-width: 380px;
            height: 44px;
            gap: 6px;
          }

          .search-bar input {
            font-size: 13px;
          }

          .avatar {
            width: 36px;
            height: 36px;
          }
        }

        /* 📱 Mobile Mode (phones) */
        @media (max-width: 768px) {
          .header {
            left: 10;
            width: 95%;
          
            height: 64px;
            padding: 6px 10px;
            gap: 6px;
          }

          /* Stack logo + search vertically if needed */
          .header-left {
            display: none; /* hide DevBanker text on small screens */
          }

          .search-bar {
            flex: 1;
            max-width: 100%;
            height: 42px;
            padding: 4px 3.5px;
            
          }

          .search-bar .search-photo-btn {
            width: 36px;
            height: 36px;
          }

          .search-bar .ctrl-icon {
            padding-right: 6px;
          }

          .avatar-wrapper {
            margin-left: 6px;
          }

          .avatar {
            width: 34px;
            height: 34px;
          }
        }

        /* 📱 Extra Small (under 480px) */
        @media (max-width: 480px) {
          .header {
            padding: 6px;
            height: 60px;
            justify-content: space-between;
          }

          .search-bar input {
            font-size: 12px;
          }

          .search-bar {
            height: 38px;
            gap: 4px;
          }

          .search-bar .ctrl-icon img {
            width: 20px;
            height: 20px;
          }

          /* Optional: hide ctrl+icon if too tight */
          .search-bar .ctrl-icon {
            display: none;
          }
        }

        /* Hamburger Button (Mobile Only) */
        .hamburger-btn {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(80, 80, 80, 0.24);
          border-radius: 8px;
          cursor: pointer;
          margin-right: 8px; /* Space from logo */
          transition: background 0.2s ease;
        }

        .hamburger-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .hamburger-line {
          width: 20px;
          height: 2px;
          background: white;
          margin: 2px 0;
          transition: all 0.3s ease;
        }

        /* Optional: Animate lines on hover (e.g., to X) */
        .hamburger-btn:hover .hamburger-line:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .hamburger-btn:hover .hamburger-line:nth-child(2) {
          opacity: 0;
        }

        .hamburger-btn:hover .hamburger-line:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }


       .publish-dropdown {
          position: relative;
          display: inline-block;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(80, 80, 80, 0.3);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          margin-top: 4px;
          min-width: 80px; /* ensures consistent width */
          overflow: hidden; /* so hover doesn't overflow rounded corners */
          z-index: 20;
        }

        .dropdown-item {
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: #fff;
          text-align: left;
          cursor: pointer;
          width: 100%; /* fill full width */
          border-radius: 0; /* reset inner border-radius */
          transition: background 0.2s ease;
        }

        .dropdown-item:first-child {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }

        .dropdown-item:last-child {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }

        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.2);
        }

      `}</style>
    </>
  );
}
