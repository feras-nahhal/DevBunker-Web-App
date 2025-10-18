"use client";

interface CreatePageHeaderProps {
  onSave?: () => void; 
  onSaveAsDraft?: () => void; 
  onCancel?: () => void; 
  saving?: boolean;
  collapsed?: boolean; // ✅ Add collapsed here
}

export default function CreatePageHeader({ 
  onSave, 
  onSaveAsDraft, 
  onCancel, 
  saving = false, 
  collapsed = false, 
}: CreatePageHeaderProps) {
  return (
    <>
      <header className={`header ${collapsed ? "collapsed" : ""}`}>
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
          <button className="button save-btn" onClick={onSave} disabled={saving}>
            <span className="glow-bg" />
            <span className="text">{saving ? "Publishing..." : "Publish"}</span>
          </button>
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
      `}</style>
    </>
  );
}
