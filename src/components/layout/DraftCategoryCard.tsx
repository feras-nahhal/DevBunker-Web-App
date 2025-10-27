"use client";

import React, { ChangeEvent, KeyboardEvent, useState } from "react";
import Image from "next/image";

interface DraftCategoryCardProps {
  draftValue?: string;
  categoryValue?: string;
  onDraftChange?: (value: string) => void; // Trigger on Enter
  onCategoryChange?: (value: string) => void; // Trigger on Enter
  onClose?: () => void;
  onDraftTagClick?: () => void;
  onCategoryClick?: () => void;
  disabled?: boolean; // New: For loading state
}

export default function DraftCategoryCard({
  draftValue = "",
  categoryValue = "",
  onDraftChange,
  onCategoryChange,
  onClose,
  onDraftTagClick,
  onCategoryClick,
  disabled = false,
}: DraftCategoryCardProps) {
  const [draftInput, setDraftInput] = useState(draftValue);
  const [categoryInput, setCategoryInput] = useState(categoryValue);

  const handleDraftChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setDraftInput(e.target.value);
  };

  const handleCategoryChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setCategoryInput(e.target.value);
  };

  const handleDraftKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled) {
      onDraftChange?.(draftInput);
      setDraftInput(""); // Optional: clear after submit
    }
  };

  const handleCategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled) {
      onCategoryChange?.(categoryInput);
      setCategoryInput(""); // Optional: clear after submit
    }
  };

  return (
    <div className="draft-category-card">
      {/* Outer Card & Shapes remain unchanged */}
      <div className="outer-card">
        <div className="secondary-shape" style={{ visibility: "hidden" }}></div>
        <div className="primary-shape"></div>

        {/* Header */}
        <div className="card-header">
          <div className="header-stack">
            <div className="avatar" style={{ display: "none" }}></div>
            <div className="header-text">
              <div className="title">{"Request tag or Category"}</div>
              <div className="subtitle" style={{ display: "none" }}>Subtitle here</div>
            </div>
            <button
            onClick={onClose}
            className="absolute top-4 right-1 w-[20px] h-[20px] flex items-center justify-center rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition"
          >
            ×
          </button>
          </div>
        </div>

        {/* Body */}
        <div className="body-frame">
          <div className="inner-frame">
            {/* Draft Card */}
            <div className="sub-card draft-card">
              <div className="sub-card-content">
                <div className="icon-section">
                  <div className="hashtag-icon" onClick={onDraftTagClick} role="button" tabIndex={0}>
                    <Image src="/taglogo.png" alt="Add" width={24} height={24} />
                  </div>
                </div>
                <div className="tag-text" onClick={onDraftTagClick} role="button" tabIndex={0}>{"Tag"}</div>
                <div className="textfield-section">
                  <div className="textfield-wrap">
                    <input
                      type="text"
                      className="input-value"
                      placeholder="Write here"
                      value={draftInput}
                      onChange={handleDraftChange}
                      onKeyDown={handleDraftKeyDown} // Enter submits
                      disabled={disabled}
                    />
                  </div>
                  <button
                className="relative w-[170px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                onClick={() =>{
                  if (disabled) return;
                   onDraftChange?.(draftInput);
                  setDraftInput(""); // ✅ clear input after click
                }}
                disabled={disabled} 
              >
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">Submit Tag</span>
                
              </button>
                </div>
              </div>
            </div>

            {/* Category Card */}
            <div className="sub-card category-card">
              <div className="sub-card-content">
                <div className="icon-section">
                  <div className="category-icon" onClick={onCategoryClick} role="button" tabIndex={0}>
                    <Image src="/catogrylogo.png" alt="Add" width={24} height={24} />
                  </div>
                </div>
                <div className="category-text" onClick={onCategoryClick} role="button" tabIndex={0}>{"Category"}</div>
                <div className="textfield-section">
                  <div className="textfield-wrap">
                    <input
                      type="text"
                      className="input-value"
                      placeholder="Write here"
                      value={categoryInput}
                      onChange={handleCategoryChange}
                      onKeyDown={handleCategoryKeyDown} // Enter submits
                      disabled={disabled}
                    />
                  </div>

                  <button
                className="relative w-[170px] h-[36px] rounded-full bg-white/[0.05] border border-white/10 shadow-[inset_0_0_4px_rgba(239,214,255,0.25)] backdrop-blur-[10px] text-white font-bold text-sm flex items-center justify-center transition hover:scale-[1.02] overflow-hidden"
                onClick={() => {
                  if (disabled) return;
                  onCategoryChange?.(categoryInput);
                  setCategoryInput(""); // ✅ clear input after click
                }}
                disabled={disabled}
              >
                <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(119,237,139,0.5)_0%,transparent_70%)] blur-md" />
                <span className="relative z-10">Submit Category</span>
                
              </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <style jsx>{`
  .draft-category-card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0px 24px 24px;
    gap: 4px;
    width: 651px;
    height: 280px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(80, 80, 80, 0.24);
    box-shadow: inset 0px 0px 7px rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(37px);
    border-radius: 16px;
    flex: none;
    order: 0;
    flex-grow: 0;
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; /* Fallback if Public Sans not loaded */
  }

  .outer-card {
    width: 100%;
    height: 100%;
    position: relative;
  }

  /* Card Header */
  .card-header {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    padding: 24px 0px;
    gap: 16px;
    width: 603px;
    height: 76px;
    flex: none;
    order: 0;
    align-self: stretch;
    flex-grow: 0;
  }

  .header-stack {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px;
    gap: 16px;
    width: 567px;
    height: 28px;
    flex: none;
    order: 0;
    flex-grow: 1;
  }

  .avatar {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 0px;
    width: 40px;
    height: 40px;
    border-radius: 500px;
    flex: none;
    order: 0;
    flex-grow: 0;
  }

  .header-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    gap: 4px;
    width: 567px;
    height: 28px;
    flex: none;
    order: 1;
    flex-grow: 1;
  }

  .title {
    width: 567px;
    height: 28px;
    font-style: normal;
    font-weight: 600;
    font-size: 18px;
    line-height: 28px;
    color: #FFFFFF;
    flex: none;
    order: 0;
    align-self: stretch;
    flex-grow: 0;
  }

  .subtitle {
    width: 600px;
    height: 22px;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 22px;
    color: #434343;
    flex: none;
    order: 1;
    align-self: stretch;
    flex-grow: 0;
  }

  .close-icon {
    width: 20px;
    height: 20px;
    flex: none;
    order: 1;
    flex-grow: 0;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .close-icon:hover {
    opacity: 0.7;
  }

  /* Shapes */
  .secondary-shape {
    position: absolute;
    left: 0%;
    right: 0%;
    top: 0%;
    bottom: 0%;
    background: #919EAB;
    opacity: 0.32;
  }



  /* Body Frame */
  .body-frame {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 0px;
    gap: 16px;
    width: 603px;
    height: 176px;
    flex: none;
    order: 1;
    align-self: stretch;
    flex-grow: 1;
  }

  .inner-frame {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px;
    gap: 23px;
    width: 603px;
    height: 176px;
    flex: none;
    order: 0;
    align-self: stretch;
    flex-grow: 1;
  }

  /* Sub-Cards */
  .sub-card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px;
    gap: 14px;
    width: 290px;
    height: 185px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(80, 80, 80, 0.24);
    border-radius: 16px;
    flex: none;
    align-self: stretch;
    flex-grow: 1;
  }

  .draft-card {
    order: 0;
  }

  .category-card {
    order: 1;
  }

  .sub-card-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0px;
    gap: 14px;
    margin: 0 auto;
    width: 258px;
    flex: none;
    order: 0;
    align-self: stretch;
    flex-grow: 0;
  }

  /* Icon Sections */
  .icon-section {
    flex: none;
    order: 0;
    flex-grow: 0;
  }

  .hashtag-icon,
  .category-icon {
    width: 24px;
    height: 24px;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .hashtag-icon:hover,
  .category-icon:hover {
    opacity: 0.7;
  }

 

  /* Category Vectors */
  .category-icon {
    position: relative;
  }

  .vector-1 {
    box-sizing: border-box;
    position: absolute;
    left: 12.5%;
    right: 53.75%;
    top: 12.5%;
    bottom: 53.75%;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: inset 0px -5.4px 9px rgba(255, 255, 255, 0.18), inset 0px 0px 3.6px rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(90px);
    border-radius: 3px;
  }

  .vector-2 {
    box-sizing: border-box;
    position: absolute;
    left: 53.75%;
    right: 12.5%;
    top: 12.5%;
    bottom: 53.75%;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: inset 0px -5.4px 9px rgba(255, 255, 255, 0.18), inset 0px 0px 3.6px rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(90px);
    border-radius: 3px;
  }

  .vector-3 {
    box-sizing: border-box;
    position: absolute;
    left: 12.5%;
    right: 53.75%;
    top: 53.75%;
    bottom: 12.5%;
    background: rgba(255, 255, 255, 0.05);
    box-shadow: inset 0px -5.4px 9px rgba(255, 255, 255, 0.18), inset 0px 0px 3.6px rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(90px);
    border-radius: 3px;
  }

  .vector-4 {
    position: absolute;
    left: 53.75%;
    right: 12.5%;
    top: 53.75%;
    bottom: 12.5%;
    background: #FFFFFF;
    border-radius: 3px;
  }

  /* Text Elements */
  .tag-text,
  .category-text {
    width: 258px;
    height: 24px;
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    color: #FFFFFF;
    flex: none;
    order: 1;
    align-self: stretch;
    flex-grow: 0;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .tag-text:hover,
  .category-text:hover {
    opacity: 0.7;
  }

  /* TextField Sections */
  .textfield-section {
    display: flex;
    flex-direction: column;
    align-items: center; 
    padding: 0px;
    margin: 0 auto;
    width: 258px;
    height: 100px;
    gap:7.5px;
    flex: none;
    order: 1;
    align-self: stretch;
    flex-grow: 0;
  }

  .textfield-wrap {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px 14px;
    isolation: isolate;
    width: 258px;
    height: 40px;
    border: 1px solid rgba(145, 158, 171, 0.2);
    border-radius: 8px;
    flex: none;
    order: 0;
    align-self: stretch;
    flex-grow: 0;
    position: relative;
  }

  .start-adornment {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px 8px 0px 0px;
    width: 32px;
    height: 24px;
    flex: none;
    order: 0;
    flex-grow: 0;
    z-index: 0;
  }

  .input-value {
    width: 230px;
    height: 22px;
    font-style: normal;
    font-weight: 400;
    font-size: 15px;
    line-height: 22px;
    color: #7B7B7B;
    flex: none;
    order: 1;
    flex-grow: 1;
    z-index: 1;
    background: none;
    border: none;
    outline: none;
    font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .input-value::placeholder {
    color: #7B7B7B;
  }

  .end-adornment {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 0px;
    position: absolute;
    width: 40px;
    height: 40px;
    right: 0px;
    top: calc(50% - 40px / 2);
    flex: none;
    order: 2;
    flex-grow: 0;
    z-index: 2;
  }

  .end-icon {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 0px;
    width: 40px;
    height: 40px;
    border-radius: 500px;
    flex: none;
    order: 0;
    flex-grow: 0;
  }

  .select-arrow {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0px 10px 0px 0px;
    position: absolute;
    width: 30px;
    height: 20px;
    right: 0px;
    top: calc(50% - 20px / 2);
    flex: none;
    order: 3;
    flex-grow: 0;
    z-index: 3;
  }

  .helper-text {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 8px 0px 0px 12px;
    gap: 4px;
    width: 320px;
    height: 26px;
    flex: none;
    order: 1;
    align-self: stretch;
    flex-grow: 0;
  }
`}</style>

    </div>

    
  );
}







