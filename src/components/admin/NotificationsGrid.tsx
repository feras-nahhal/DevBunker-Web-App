"use client";

import { useState, useEffect, useMemo } from "react";
import NotificationsCard from "./NotificationsCard";
import { useNotifications } from "@/hooks/useNotifications"; // Hook for notifications API
import { useAuth } from "@/hooks/useAuth";
import { createPortal } from "react-dom"; // For centered modal popup

export default function NotificationsGrid() {
  const { notifications, loading, error, markAsRead, markAllAsRead, refetch } = useNotifications();
  const { user: authUser } = useAuth(); // Optional: For current user checks

  // Filters: Only read/unread (top clickable labels – no search/multi-select)
  const [selectedReadStatus, setSelectedReadStatus] = useState<string>(""); // "" = All, "read" = read only, "unread" = unread only

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Popup state (for card click)
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null); // Holds notification for popup

  /** 🧠 Client-side filtering (by read status only – top labels) */
  const filteredData = useMemo(() => {
    let filtered = notifications || [];

    // Filter by selected read status ("" = all)
    if (selectedReadStatus === "read") {
      filtered = filtered.filter((item) => item.read === true);
    } else if (selectedReadStatus === "unread") {
      filtered = filtered.filter((item) => item.read === false);
    }

    return filtered;
  }, [notifications, selectedReadStatus]);

  /** Counts for stats (from full notifications – accurate even if filtered) */
  const totalCount = notifications.length;
  const readCount = notifications.filter((n) => n.read === true).length;
  const unreadCount = notifications.filter((n) => n.read === false).length;

  /** Pagination */
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedReadStatus]);

  /** Popup handlers (card click opens modal) */
  const handleOpenPopup = (notification: any) => {
    setSelectedNotification(notification);
    setIsPopupOpen(true);
  };

  const handleMarkAsReadInPopup = async () => {
    if (!selectedNotification?.id) return;
    try {
      await markAsRead(selectedNotification.id);
      setIsPopupOpen(false); // Close popup after mark
      refetch(); // Refresh grid
    } catch (err: any) {
      console.error("Mark as read failed:", err.message);
      // Optional: Show error in popup
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedNotification(null);
  };

  // Escape key close for popup
  useEffect(() => {
    if (!isPopupOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClosePopup();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isPopupOpen]);

  /** Mark All as Read (footer button) */
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      refetch(); // Refresh grid
    } catch (err: any) {
      console.error("Mark all failed:", err.message);
    }
  };

  /** Pagination Controls */
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToLastPage = () => setCurrentPage(totalPages);

  /** Loading/Error States */
  if (loading)
    return (
      <div className="flex justify-center py-10 text-gray-400 text-lg">
        Loading notifications...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center py-10 text-red-500">
        Error: {error}
      </div>
    );

  if (!notifications || notifications.length === 0)
    return (
      <div className="flex justify-center py-10 text-gray-400">
        No notifications available.
      </div>
    );

  /** Render UI */
  return (
    <>
      <div
        className="flex flex-col items-center justify-start mx-auto"
        style={{
          width: "1200px",
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: "10px",
          border: "1px solid rgba(80,80,80,0.24)",
          boxShadow: "inset 0 0 7px rgba(255,255,255,0.16)",
          backdropFilter: "blur(12px)",
          overflow: "hidden",
        }}
      >
{/* 🧠 Stats Summary Box */}
<div className="w-[1190px] h-[56px] bg-white/[0.05] border border-[rgba(145,158,171,0.2)] rounded-xl flex items-center justify-between px-2 mb-1 mt-1 gap-2">
  {[
    { label: "All", status: "", color: "#9CA3AF", count: totalCount },
      {
      label: "Unread",
      status: "unread",
      color: "rgba(0, 184, 217, 0.16)", // Red for unread
      count: unreadCount,
    },
    {
      label: "Archived",
      status: "read",
      color: "rgba(34, 197, 94, 0.16)", // Green for read
      count: readCount,
    },
  
  ].map((item) => (
    <button
      key={item.label}
      onClick={() => setSelectedReadStatus(item.status)}
      className={`flex-1 h-[40px] flex items-center justify-center gap-2 rounded-xl transition-all duration-200
        ${selectedReadStatus === item.status
          ? "bg-white/[0.15] border border-white/20 text-white scale-[1.02]"
          : "bg-transparent  text-white/70 hover:bg-white/[0.05] hover:text-white"
        }`}
    >
      <span className="text-sm font-medium">{item.label}</span>
      <div
        className="w-6 h-6 flex items-center justify-center rounded-md text-white text-xs font-semibold shadow-sm"
        style={{
          backgroundColor: item.color,
          boxShadow: `0 0 6px ${item.color}80`,
        }}
      >
        {item.count}
      </div>
    </button>
  ))}
</div>




     

        {/* Cards */}
        <div className="flex flex-col w-full min-h-[200px] justify-center items-center">
          {filteredData.length === 0 ? (
            <div className="text-gray-400 py-10 text-center text-sm">
              No notifications found for "{selectedReadStatus || 'All'}" status.
            </div>
          ) : (
            paginatedData.map((notification) => (
              <NotificationsCard
                key={notification.id}
                type={notification.type}
                id={notification.id}
                title={notification.title}
                message={notification.message}
                read={notification.read}
                created_at={notification.created_at}
                user_id={notification.user_id}
                onOpenPopup={() => handleOpenPopup(notification)} // Passes full object
              />
            ))
          )}
        </div>

        {/* Footer (simplified – no bulk delete, just mark all + pagination) */}
        <div className="flex items-center justify-between w-full border-t border-[rgba(145,158,171,0.2)] py-3 px-5 bg-white/[0.05]">
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-3 py-1 bg-green-500/80 hover:bg-green-600 text-white text-[12px] rounded-md transition-all"
              >
                ✅ Mark All as Read
              </button>
            )}
          </div>

          {/* Pagination (right) */}
          <div className="flex items-center gap-3">
            {/* Rows per page */}
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-300">Rows per page:</span>
              <input
                type="number"
                min={1}
                max={filteredData.length}
                value={itemsPerPage}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(Number(e.target.value) || 1, filteredData.length));
                  setItemsPerPage(val);
                  setCurrentPage(1);
                }}
                className="bg-white/[0.1] text-white text-[12px] px-2 py-1 w-14 rounded-md outline-none hover:bg-white/[0.2] transition-all text-center focus:ring-1 focus:ring-green-400"
              />
            </div>

            {/* Page info */}
            <span className="text-white text-[12px] text-center min-w-[100px]">
              Page {totalPages > 0 ? currentPage : 0} of {totalPages} ({filteredData.length} total)
            </span>

            {/* Navigation Buttons (<< < > >>) */}
            <div className="flex items-center gap-2">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1 || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white transition-all ${
                  currentPage === 1 || totalPages === 0
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-white/[0.1] hover:bg-white/[0.2] cursor-pointer"
                }`}
                aria-label="First page"
              >
                &lt;&lt;
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1 || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white transition-all ${
                  currentPage === 1 || totalPages === 0
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-white/[0.1] hover:bg-white/[0.2] cursor-pointer"
                }`}
                aria-label="Previous page"
              >
                &lt;
              </button>
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white transition-all ${
                  currentPage === totalPages || totalPages === 0
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-white/[0.1] hover:bg-white/[0.2] cursor-pointer"
                }`}
                aria-label="Next page"
              >
                &gt;
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`w-8 h-8 flex items-center justify-center rounded-[6px] text-white transition-all ${
                  currentPage === totalPages || totalPages === 0
                    ? "bg-gray-600 cursor-not-allowed opacity-50"
                    : "bg-white/[0.1] hover:bg-white/[0.2] cursor-pointer"
                }`}
                aria-label="Last page"
              >
                &gt;&gt;
              </button>
            </div>
          </div>
        </div>
      </div>

            {/* NEW: Popup Modal (styled like CreateCategoryPopup example) */}
      {isPopupOpen && selectedNotification && typeof window !== "undefined" && createPortal( // FIXED: SSR check (was !== "" – invalid)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div
            className="relative flex flex-col items-start p-[0_0_24px] gap-1.5 bg-white/5 border border-[rgba(80,80,80,0.24)]
                       shadow-[inset_0_0_7px_rgba(255,255,255,0.16)] backdrop-blur-[37px] rounded-[16px] overflow-y-auto" // FIXED: Added overflow-y-auto for long messages
            style={{ width: "465px", height: "320px" }} // FIXED: Matches example dimensions
          >
            {/* Close button (styled like example) */}
            <button
              onClick={handleClosePopup}
              className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition-colors" // FIXED: Completed className + hover transition
              aria-label="Close notification details"
            >
              × {/* NEW: Close symbol (×) */}
            </button>

            {/* Title (styled like example – gradient text) */}
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-green-400 mt-4 ml-6">
              {selectedNotification.title || "Notification Details"} {/* NEW: Dynamic title from notification */}
            </h2>

            {/* Description/Message (read-only display – full content) */}
            <div className="flex flex-col gap-2 w-[90%] mt-4 mx-auto overflow-y-auto max-h-[180px]"> {/* NEW: Scrollable container for long messages */}
              <label className="text-white text-sm">Message</label> {/* NEW: Label like example */}
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap bg-transparent border border-[#918AAB26] rounded p-3"> {/* NEW: Styled like input (border, padding) */}
                {selectedNotification.message || "No message available."} {/* NEW: Full message display */}
              </p>
            </div>

            {/* Mark as Read Button (only if unread – styled like example's save button) */}
            {!selectedNotification.read && (
              <button
                onClick={handleMarkAsReadInPopup}
                disabled={loading}
                className="mt-4 w-[90%] h-9 rounded-full bg-white/5 border border-white/10 shadow-[inset_0_0_4px_rgba(119,237,139,0.25)]
                           backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition-all hover:scale-[1.02] mx-auto disabled:opacity-50 disabled:cursor-not-allowed" // FIXED: Matches example + disabled state
              >
                {loading ? "..." : "Mark as Read"} {/* NEW: Loading spinner (dots) */}
              </button>
            )}

            {/* Read Status Indicator (if already read – subtle message) */}
            {selectedNotification.read && (
              <p className="text-center text-green-400 text-sm mt-4 mx-auto w-[90%]">
                ✓ Already read {/* NEW: Green checkmark message */}
              </p>
            )}
          </div>
        </div>,
        document.body // FIXED: Portal to body (centers on viewport, escapes grid/sidebar)
      )}
    </>
  );
}