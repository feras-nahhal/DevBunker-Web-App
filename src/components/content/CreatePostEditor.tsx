"use client";
import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link1 from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline1 from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image1 from "next/image";
import { useCategories } from "@/hooks/useCategories";
import { useTags } from "@/hooks/useTags";
import { useContentTags } from "@/hooks/useContentTags";
import { useReferences } from "@/hooks/useReferences";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  ListTodo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Code,
  SquareCode,
  Undo,
  Redo,
  X,
  Maximize,
  Minimize,
} from "lucide-react";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface Category {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  created_by?: string;
  created_at?: Date;
}

interface Tag {
  id: string;
  name: string;
}

// -----------------------------


interface CreatePostEditorProps {
  title: string;
  body: string;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
  onTagsChange?: (tags: Tag[]) => void;
  onCategoryChange?: (categoryId: string | null) => void;
  initialCategoryId?: string | null; // NEW
  researchId?: string | null;
  initialTags?: Tag[];  // NEW: Initial tags from parent
 
}

export default function CreatePostEditor({
  title,
  body,
  onTitleChange,
  onBodyChange,
  onTagsChange,
  onCategoryChange,
  initialCategoryId,
  researchId,
  initialTags = [],  // NEW: Default to empty array


}: CreatePostEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // ===== CATEGORY STATE =====
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [showCategoryPopup, setShowCategoryPopup] = useState(false);
    const [categoryId, setCategoryId] = useState<string | null>(null);

  // ===== TAG STATE =====
    const { tags: allTags = [] } = useTags(); // fetch all tags
    const [tagQuery, setTagQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [showTagSelector, setShowTagSelector] = useState(false); 
  

// ===== REFERENCE STATE (NEW) =====
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);
  const [showReferencePopup, setShowReferencePopup] = useState(false);
  const [referenceInput, setReferenceInput] = useState(""); // Temp input for popup
  const [referenceError, setReferenceError] = useState<string | null>(null); // Optional: For validation errors


  const { tags: fetchedTags, fetchTags } = useContentTags();
  const { references: fetchedReferences, refresh: refreshReferences } = useReferences(researchId || "");




  // Search filter
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagQuery(value);

    if (value.trim()) {
      const filteredTags = allTags.filter((tag) =>
        tag.name.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(filteredTags);
    } else {
      setSearchResults([]);
    }
  };

  // Add tag
  const addTag = (tagId: string) => {
    const selected = allTags.find((t) => t.id === tagId);
    if (!selected || selectedTags.some((t) => t.id === tagId)) return;

    const updated = [...selectedTags, selected];
    setSelectedTags(updated);
    onTagsChange?.(updated);
    // ✅ clear search input + results after selecting
    setTagQuery("");
    setSearchResults([]);
  };

  // Remove tag
  const removeTag = (tagId: string) => {
    const updated = selectedTags.filter((t) => t.id !== tagId);
    setSelectedTags(updated);
    onTagsChange?.(updated);
  };

    

  // ===== MOUNT CHECK =====

  useEffect(() => {
    setMounted(true);
  }, []);

  // ===== FETCH HOOKS =====
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { tags, loading: tagsLoading, error: tagsError } = useTags();

  // Initialize local category state from parent
  useEffect(() => {
    if (initialCategoryId && categories.length > 0) {
      const cat = categories.find(c => c.id === initialCategoryId) || null;
      setSelectedCategory(cat);
      setCategoryId(cat?.id || null);
    }
  }, [initialCategoryId, categories]);


   // ===== Fetch tags on mount or researchId change ===== (unchanged, but now it can override initialTags if needed)
  useEffect(() => {
    if (researchId) fetchTags(researchId);
  }, [researchId]);
  // ===== Populate selected tags when fetched ===== (unchanged)
  useEffect(() => {
    if (fetchedTags.length > 0) {
      setSelectedTags(fetchedTags);
      onTagsChange?.(fetchedTags);
    }
  }, [fetchedTags]);
  // ===== Populate selected references when fetched ===== (unchanged)
  

  

  // ===== TIPTAP EDITOR =====
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Link1,
      Image,
      Underline1,
      Highlight,
      TaskList,
      TaskItem,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: body,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onBodyChange(editor.getHTML());
    },
  });

  if (!mounted || !editor) return null;

  const hasContent = editor.getText().trim().length > 0;



  // ===== CATEGORY HELPER =====
  const handleCategoryChange = (value: string) => {
    if (value === "0") {
      setSelectedCategory(null);
      setCategoryId(null);
      console.log("❌ No category selected");
      if (onCategoryChange) onCategoryChange(null); // ✅ pass up
    } else {
      const selected = categories.find((cat) => cat.id === value);
      if (selected) {
        setSelectedCategory(selected);
        setCategoryId(selected.id);
        console.log("✅ Selected Category:", selected);
        if (onCategoryChange) onCategoryChange(selected.id); // ✅ pass up
      }
    }
  };


  
   

  
  

  return (
    <div className={`editor-container ${fullscreen ? "fullscreen-mode" : ""}`}>
      {/* ===== TITLE INPUT ===== */}
      <textarea
        placeholder="Write title here: ex. New AI tools release for Video generation"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="post-title"
      />

      {/* ===== TOOLBAR ===== */}
      <div className={`toolbar ${hasContent ? "visible" : "hidden"}`}>
        <select
          className="toolbar-select1"
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (value === 0) editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: value as HeadingLevel }).run();
          }}
        >
          <option value="0">Normal</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>

        <span className="toolbar-separator" />

        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "active" : ""}><Bold size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "active" : ""}><Italic size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? "active" : ""}><Underline size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? "active" : ""}><Strikethrough size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive("highlight") ? "active" : ""}><Highlighter size={18} /></button>

        <span className="toolbar-separator" />
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleTaskList().run()}><ListTodo size={18} /></button>

        <span className="toolbar-separator" />
        <button onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify size={18} /></button>

        <span className="toolbar-separator" />
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={18} /></button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={18} /></button>

        <span className="toolbar-separator" />
        <button
          onClick={() => {
            const url = prompt("Enter URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        ><LinkIcon size={18} /></button>
        <button onClick={() => editor.chain().focus().unsetLink().run()}><Unlink size={18} /></button>

        <span className="toolbar-separator" />
        <button
          onClick={() => {
            const url = prompt("Enter image URL");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
        ><ImageIcon size={18} /></button>

        <span className="toolbar-separator" />
        <button onClick={() => editor.chain().focus().toggleCode().run()}><Code size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}><SquareCode size={18} /></button>

        <span className="toolbar-separator" />
        <button onClick={() => editor.chain().focus().undo().run()}><Undo size={18} /></button>
        <button onClick={() => editor.chain().focus().redo().run()}><Redo size={18} /></button>
        <button onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><X size={18} /></button>

        <span className="toolbar-separator" />
        <button onClick={() => setFullscreen(!fullscreen)}>
          {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>

      {/* ===== EDITOR ===== */}
      <div className="editor-wrapper">
        {!hasContent && <div className="fake-placeholder">Write your post content here...</div>}
        <EditorContent editor={editor} className="editor" />
      </div>

      {/* ===== ACTIONS BOX ===== */}
      <div className="action-box">


        
       


        {/* TAGS */}
        <div className="tag-button-wrapper">
          <button
            className="btn publish"
            onClick={() => setShowTagSelector(!showTagSelector)}
          >
            <Image1 src="/pluslogo.png" alt="Add" width={15} height={15} /> Add Tag
          </button>

          {showTagSelector && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                width: "100%",
                marginTop: "8px",
              }}
            >
              <label style={{ fontSize: "16px", fontWeight: 500 }}>Tags</label>

              <div
                style={{
                  position: "relative",
                  width: "663px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(80, 80, 80, 0.24)",
                  borderRadius: "16px",
                  padding: "8px",
                  minHeight: "44px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Pills + Input */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  {/* Selected tags */}
                  {selectedTags.map((tag) => (
                    <div
                      key={tag.id}
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "20px",
                        height: "32px",
                        padding: "4px 8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.9)",
                        maxWidth: "200px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <span style={{ fontWeight: 500, flex: 1 }}>{tag.name}</span>
                      <button
                        style={{
                          background: "white",
                          border: "none",
                          fontSize: "16px",
                          cursor: "pointer",
                          padding: "0",
                          borderRadius: "50%",
                          width: "15px",
                          height: "15px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "black",
                        }}
                        onClick={() => removeTag(tag.id)}
                        title="Remove tag"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Search input */}
                  <input
                    type="text"
                    value={tagQuery}
                    onChange={handleTagInputChange}
                    placeholder={selectedTags.length > 0 ? "" : "Search tags..."}
                    style={{
                      flex: 1,
                      minWidth: "120px",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "white",
                      fontSize: "14px",
                      padding: "4px 0",
                      margin: "0 4px 4px 0",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagQuery.trim()) {
                        const matchedTag = searchResults.find(
                          (t) =>
                            t.name.toLowerCase() ===
                            tagQuery.toLowerCase().trim()
                        );
                        if (matchedTag) addTag(matchedTag.id);
                        e.preventDefault();
                      }
                    }}
                  />
                </div>

                {/* Dropdown */}
                {tagQuery && searchResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "rgba(0,0,0,0.8)",
                      color: "white",
                      maxHeight: "150px",
                      overflowY: "auto",
                      borderRadius: "6px",
                      zIndex: 1000,
                      border: "1px solid rgba(255,255,255,0.1)",
                      marginTop: "4px",
                    }}
                  >
                    {searchResults.map((tag) => (
                      <div
                        key={tag.id}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}
                        onClick={() => addTag(tag.id)}
                      >
                        {tag.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CATEGORY */}
        <div className="category-button-wrapper">
          <button
            className="btn publish"
            onClick={() => setShowCategoryPopup(!showCategoryPopup)}
          >
            <Image1 src="/pluslogo.png" alt="Add" width={15} height={15} /> Add Category
          </button>

          {showCategoryPopup && (
            <div
              style={{
                marginTop: "8px",
                width: "855px",
                height: "92px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(80, 80, 80, 0.24)",
                borderRadius: "16px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              {categoriesLoading ? (
                <div className="popup-loading">Loading...</div>
              ) : categoriesError ? (
                <div className="popup-error">Error loading categories</div>
              ) : (
                <>
                  <label
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.8)",
                      marginBottom: "6px",
                    }}
                  >
                    Category
                  </label>

                  <select
                    className="toolbar-select"
                    value={selectedCategory?.id || "0"}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      handleCategoryChange(selectedValue);
                      if (selectedValue === "0") setShowCategoryPopup(false);
                    }}
                    style={{
                      width: "823px",
                      height: "40px",
                      background: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "white",
                      padding: "8px 10px",
                      fontSize: "14px",
                      outline: "none",
                      appearance: "none",
                    }}
                  >
                    <option value="0">No Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          )}
        </div>

              </div>
              
            <style jsx>{`
        .editor-container {
          position: absolute;
          left: 208px;
          top: 61px;
          width: 855px;
          display: flex;
          flex-direction: column;
          font-family: "Public Sans", sans-serif;
          color: #f5f5f5;
        }
        .fullscreen-mode {
          position: fixed;
          inset: 0;
          background: #000;
          z-index: 9999;
          padding: 40px;
          width: 100%;
          height: 100%;
          max-width: none;
          left: 0;
          top: 0;
          display: flex;
          flex-direction: column;
        }
        .post-title {
          width: 100%;
          min-height: calc(64px * 3);
          max-height: calc(64px * 3);
          resize: none;
          overflow: hidden;
          font-family: "Barlow", sans-serif;
          font-weight: 800;
          font-size: 48px;
          line-height: 64px;
          border: none;
          outline: none;
          background: transparent;
          color: transparent;
          -webkit-background-clip: text;
        }
        .post-title::placeholder {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.12));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .post-title:not(:placeholder-shown) {
          background: radial-gradient(137.85% 214.06% at 50% 50%, #5be49b 0%, #ffffff 50%, #5be49b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .fullscreen-mode .post-title {
          font-size: 36px; /* Slightly smaller in fullscreen for better fit */
          line-height: 48px;
          min-height: calc(48px * 2); /* Adjust height accordingly */
          max-height: calc(48px * 2);
        }
        .toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px;
          margin: 12px 0;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-10px);
          transition: all 0.3s ease;
        }
        .fullscreen-mode .toolbar {
          max-width: 100%; /* Ensure toolbar doesn't overflow */
          overflow-x: auto; /* Horizontal scroll if too many buttons */
          padding: 12px;
        }
        .toolbar.visible {
          opacity: 1;
          pointer-events: all;
          transform: translateY(0);
        }
        .toolbar-select1 {
          padding: 6px 8px;
          border: none;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          color: #ddd;
          font-size: 14px;
          cursor: pointer;
          outline: none;
          transition: background 0.2s, color 0.2s;
          
          background-repeat: no-repeat;
          background-position: right 6px center;
          padding-right: 22px;
        }
        .toolbar-select1:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #5be49b;
        }
        .toolbar button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
          color: #ddd;
          transition: background 0.2s, color 0.2s;
        }
        .toolbar button:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .toolbar button.active {
          position: relative;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: inset 0 0 4px rgba(239, 214, 255, 0.25);
          backdrop-filter: blur(10px);

          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        /* Bottom glow */
        .toolbar button.active::after {
          content: "";
          position: absolute;
          bottom: 0; /* stick to the bottom */
          left: 0;
          width: 100%;
          height: 50%; /* cover only bottom half */
          border-radius: 0 0 6px 6px; /* rounded bottom corners only */
          background: radial-gradient(circle at 50% 100%, rgba(91, 228, 155, 0.5) 0%, transparent 80%);
          filter: blur(6px);
          z-index: 0; /* behind the content */
        }

        .toolbar-separator {
          width: 1px;
          height: 20px;
          background: rgba(255, 255, 255, 0.15);
          margin: 0 6px;
        }
        .editor-wrapper {
          position: relative;
          flex: 1; /* Allow it to grow in flex container */
        }
        .fake-placeholder {
          position: absolute;
          top: 4px;
          left: 20px;
          pointer-events: none;
          font-size: 16px;
          font-family: "Barlow", sans-serif;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.12));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .editor {
          min-height: 400px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          font-size: 16px;
          line-height: 1.6;
          box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.04);
          transition: border-color 0.2s ease;
          width: 100%;
          box-sizing: border-box;
        }
        .editor:focus-within {
          border-color: #5be49b;
        }
        .fullscreen-mode .editor {
          min-height: calc(100vh - 300px); /* Adjust for title + toolbar + actions + padding */
          border-radius: 0; /* Remove rounded corners in fullscreen for edge-to-edge */
        }

        /* Force TipTap list items to behave as proper list items */
        .editor ul,
        .editor ol {
          padding-left: 1.5em;
          margin-left: 0;
          list-style-position: inside;
          color: #fff; /* bullet/number color */
        }

        .editor li {
          display: list-item; /* ensure bullets/numbers appear */
          color: #fff;
          margin: 0.25em 0;
        }

        /* Make markers visible */
        .editor ul li::marker,
        .editor ol li::marker {
          color: #5be49b;
          font-size: 16px;
        }

        /* Nested lists */
        .editor ul ul,
        .editor ol ol {
          padding-left: 1.5em;
        }

        /* Task list checkboxes */
        .editor li[data-type="taskItem"] {
          list-style: none; /* remove default bullet, handled by checkbox */
        }

        /* Ensure editor content shows images correctly */
        .editor img {
          display: block;        /* images should be block */
          max-width: 100%;       /* responsive width */
          height: auto;          /* preserve aspect ratio */
          margin: 12px 0;
          border-radius: 8px;
          box-shadow: 0 0 12px rgba(91, 228, 155, 0.2);
        }

        /* TipTap sometimes wraps images in a div
                /* TipTap sometimes wraps images in a div/figure */
        .editor figure {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center; /* center images */
        }

        .editor figure img {
          max-width: 100%;
          height: auto;
        }

        .action-box {
          margin-top: 250px;
          margin-bottom: 160px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 24px;
        }
        .fullscreen-mode .action-box {
          margin-top: auto;
          margin-bottom: 20px;
          align-self: stretch; /* Full width in fullscreen */
          flex-direction: row; /* Change to row for better space usage in fullscreen */
          justify-content: space-between;
        }
        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 99px;
          background: rgba(145, 158, 171, 0.12);
          border: 1px solid rgba(145, 158, 171, 0.32);
          font-size: 12px;
          color: #7b7b7b;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn:hover {
          background: rgba(145, 158, 171, 0.18);
          border-color: rgba(145, 158, 171, 0.4);
          color: #fff;
        }
          // -------------------------------
    // 🟢 Category Popup Styles (Fixed)
    // -------------------------------
    .category-popup-container {
      
        position: absolute; /* FIXED: Proper absolute positioning relative to parent */
        top: 85%; /* FIXED: Position directly below the button */
        buttom: 40px; /* FIXED: Remove bottom positioning */
        left: 0; /* FIXED: Align to left edge of button wrapper */
        z-index: 1000; /* FIXED: Ensure it layers above other elements */
        width: 300px; /* FIXED: Responsive width (adjust as needed; fits most buttons) */
    }

    .category-popup {
        background: rgba(255, 255, 255, 0.03); /* UPDATED: Same as toolbar background */
        border: 1px solid rgba(255, 255, 255, 0.08); /* UPDATED: Same as toolbar border */
        border-radius: 12px; /* Matches toolbar radius */
        padding: 12px; /* Matches toolbar padding */
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); /* Subtle shadow */
        color: #ddd; /* Light text like toolbar */
        font-size: 14px;
        min-width: 250px; /* FIXED: Reduced min-width to prevent overflow */
        max-width: 300px; /* FIXED: Cap width for responsiveness */
        max-height: 200px; /* Limit height for scroll if many categories */
        overflow-y: auto; /* Scroll if needed */
        transition: opacity 0.2s ease, transform 0.2s ease; /* Smooth appear */
        opacity: 1;
        transform: translateY(0);
    }

    /* Hover effect for popup (like toolbar) */
    .category-popup:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .popup-title { /* NEW: Styled h3 for popup title */
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        text-align: left;
        padding-bottom: 4px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* UPDATED: .toolbar-select - Ensure it fits dark theme in popup */
    .toolbar-select {
        width: 100%;
        padding: 8px 12px; /* Slightly more padding */
        margin-bottom: 0; /* No margin in popup */
        border: 1px solid rgba(255, 255, 255, 0.08); /* Dark border */
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.03); /* Dark background */
        color: #ddd; /* Light text */
        font-size: 14px;
        cursor: pointer;
        outline: none;
        transition: background 0.2s, color 0.2s;
        appearance: none; /* Remove default dropdown arrow */
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ddd' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e"); /* Custom dark arrow */
        background-repeat: no-repeat;
        background-position: right 8px center;
        padding-right: 30px; /* Space for arrow */
    }

    .toolbar-select:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #5be49b; /* Accent color on hover */
    }

    .toolbar-select:focus {
        border-color: #5be49b; /* Focus border like editor */
        box-shadow: 0 0 0 2px rgba(91, 228, 155, 0.2);
    }

    /* NEW: Persistent Selected Category Label - Under button; stays visible after selection */
    .category-button-wrapper {
        position: relative; /* Anchor for absolute popup */
        display: flex;
        width:132px;
        flex-direction: column;
        gap: 8px; /* Space between button and label */
    }

    .selected-category-label {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: rgba(91, 228, 155, 0.1); /* Green tint for success */
        border: 1px solid rgba(91, 228, 155, 0.3);
        border-radius: 20px; /* Pill shape */
        font-size: 12px;
        color: #5be49b; /* Green text */
        max-width: 200px; /* Prevent overflow */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .selected-icon {
        font-size: 12px;
        font-weight: bold;
    }

    .clear-selection-btn { /* NEW: Small X button to clear selection */
        background: none;
        border: none;
        color: #5be49b;
        font-size: 14px;
        cursor: pointer;
        padding: 0;
        margin-left: auto; /* Push to right */
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
    }

    .clear-selection-btn:hover {
        background: rgba(91, 228, 155, 0.2);
    }

    /* UPDATED: Loading/Error in Popup - Dark theme */
    .loading, .error {
        padding: 10px;
        text-align: center;
        font-size: 12px;
    }

    .loading {
        color: #888; /* Darker gray */
    }

    .error {
        color: #ff6b6b; /* Red for errors */
    }

    /* Fullscreen Adjustments for Popup/Label - FIXED: Prevent right overflow and button overlap */
    .fullscreen-mode .category-popup-container {
        position: fixed; /* In fullscreen, make it fixed to viewport */
        top: auto;
        bottom: 150px; /* FIXED: Higher positioning to avoid overlapping "Add Category" button */
        left: auto;
        right: 30; /* FIXED: Reduced from 40px to prevent right-edge overflow */
        width: 220px; /* FIXED: Narrower width to fit smaller fullscreen space */
        max-width: 220px; /* FIXED: Enforce no horizontal overflow */
        z-index: 1000; /* FIXED: High layer to float above buttons */
    }

    .fullscreen-mode .category-popup {
        min-width: 220px; /* FIXED: Match container */
        max-width: 220px;
    }

    .fullscreen-mode .selected-category-label {
        color: #fff; /* Ensure visibility in dark fullscreen */
        background: rgba(91, 228, 155, 0.2);
        border-color: rgba(91, 228, 155, 0.4);
    }
.selected-tags-box {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(80, 80, 80, 0.24);
    border-radius: 16px;
    padding: 16px;
    margin: 12px 0;
    width: 855px; /* Fixed width */
    height: 64px; /* Fixed height */
    display: flex; /* Keep flex for tag alignment */
    flex-wrap: nowrap; /* Prevent wrapping to a new line; tags will stay in one row */
    /* NEW: Horizontally center the pills */
    align-items: flex-start; /* NEW: Vertically center the pills */
    gap: 14px; /* Keep spacing */
    overflow-x: auto; /* Horizontal scroll if tags exceed width */
    overflow-y: hidden; /* Prevent vertical growth */
}

.tag-pill {
    background: rgba(255, 255, 255, 0.1); /* Semi-transparent white for pill background */
    border: 1px solid rgba(255, 255, 255, 0.15); /* Subtle border */
    border-radius: 20px; /* Rounded pill shape */
   
    height: 32px; /* Fixed height */
    padding: 2px 6px; /* ADJUSTED: Slightly reduced for tighter text alignment without offset */
    display: flex; /* Align name and button inline */
    align-items: center; /* Vertical center */
    gap: 2px; /* Space between name and button - kept as is */
    font-size: 14px; /* Readable text size */
    color: rgba(255, 255, 255, 0.9); /* Light text color */
    max-width: fit-content; /* Prevents pill from stretching */
}

.tag-name {
    font-weight: 500; /* Semi-bold for emphasis */
    white-space: nowrap; /* Prevent text wrapping inside pill */
    overflow: hidden; /* Hide overflow if tag name is too long */
    text-overflow: ellipsis; /* Add ellipsis for long names */
    /* No changes: Text alignment is flex-driven, should now align flush without offset */
}

.remove-tag-btn {
    background: none; /* No background */
    border: none; /* No border */
    font-size: 18px; /* Larger for easy clicking */
    cursor: pointer; /* Hand cursor on hover */
    padding: 0 4px; /* Small padding around × */
    border-radius: 50%; /* Circular hover effect */
    transition: all 0.2s ease; /* Smooth hover */
    min-width: 20px; /* Ensure consistent size */
    min-height: 20px; /* Ensure consistent size */
    display: flex;
    align-items: center;
    justify-content: center;
}

.remove-tag-btn:hover {
 
}



/* ===== REFERENCE POPUP STYLES (NEW) ===== */
/* Container: Positions popup below the "Add Reference" button */
.reference-popup-container {
  position: absolute;
  top: 100%; /* Positions directly below the button */
  left: 0;
  z-index: 1000;
  width: 300px; /* Same as category popup */
}

/* Popup: Dark theme, similar to category */
.reference-popup {
  margin-bottom: 35px; /* Space from button */
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: #ddd;
  font-size: 14px;
  min-width: 250px;
  max-width: 300px;
  max-height: 250px; /* Allow space for textarea */
  overflow-y: auto;
  transition: opacity 0.2s ease, transform 0.2s ease;
  opacity: 1;
  transform: translateY(0);
}

.reference-popup:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* Textarea: Multi-line input like comments */
.reference-textarea {
  width: 100%;
  min-height: 80px; /* Enough for multi-line text */
  padding: 8px 12px;
  margin: 8px 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  color: #ddd;
  font-size: 14px;
  font-family: inherit;
  resize: vertical; /* Allow vertical resize only */
  outline: none;
  transition: border-color 0.2s;
}

.reference-textarea:hover,
.reference-textarea:focus {
  border-color: #5be49b;
  box-shadow: 0 0 0 2px rgba(91, 228, 155, 0.2);
}

/* Add Button: Matches your + icon style */
.add-reference-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(91, 228, 155, 0.1);
  border: 1px solid rgba(91, 228, 155, 0.3);
  color: #5be49b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-reference-btn:hover:not(:disabled) {
  background: rgba(91, 228, 155, 0.2);
  border-color: #5be49b;
  color: #fff;
}

.add-reference-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Reference Pills/Box: Below the button, like tags */
.reference-button-wrapper {
  position: relative; /* Anchor for popup */
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-references-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(80, 80, 80, 0.24);
  border-radius: 16px;
  padding: 8px; /* Smaller padding than tags */
  margin: 8px 0;
  width: 100%; /* Full width of wrapper */
  min-height: 40px; /* Space for pills */
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
}

.reference-pill {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  height: 32px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px; /* Smaller for longer text */
  color: rgba(255, 255, 255, 0.9);
  max-width: 200px; /* Limit pill width */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reference-text {
  font-weight: 500;
  flex: 1; /* Take available space */
}

.remove-reference-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  min-width: 20px;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff6b6b; /* Red for remove */
}

.remove-reference-btn:hover {
  background: rgba(255, 107, 107, 0.2);
  color: #fff;
}

/* Fullscreen Adjustments for Reference Popup */
.fullscreen-mode .reference-popup-container {
  position: fixed;
  top: auto;
  bottom: 200px; /* Adjust to avoid overlap with other buttons */
  left: auto;
  right: 40px; /* Position on right in fullscreen */
  width: 280px;
}

.fullscreen-mode .reference-popup {
  min-width: 280px;
  max-width: 280px;
}

.fullscreen-mode .selected-references-box {
  width: auto; /* Flexible in fullscreen */
  max-width: 300px;
}

/* Reuse existing error class for referenceError */
.popup-error {
  color: #ff6b6b;
  font-size: 12px;
  margin: 4px 0;
  padding: 4px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 4px;
}



      `}</style>
    </div>
  );
}
