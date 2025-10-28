"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useEditor, EditorContent} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Heading, { Level } from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Code from "@tiptap/extension-code";
import CodeBlock from "@tiptap/extension-code-block";

// Icons
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Highlighter,
  List, ListOrdered, ListTodo,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Quote, Minus, Link as LinkIcon, Unlink, Image as ImageIcon,
  Code as CodeIcon, SquareCode, Undo, Redo, X,
} from "lucide-react";

export default function TiptapEditor() {
  const [htmlOutput, setHtmlOutput] = useState("<p>Hello <strong>world</strong></p>");

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem,
      Underline,
      Link.configure({ openOnClick: true }),
      Highlight,
      Image,
      Code,
      CodeBlock,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: htmlOutput,
    editable: true,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setHtmlOutput(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(htmlOutput, { emitUpdate: false });
    }
  }, [editor]);

  if (!editor) return null;
  const toggleHeading = (level: Level) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: Number(value) as Level }).run();
    }
  };


  return (
    <div className="p-4">
      {/* ✅ Bubble Menu — all tools */}
      <BubbleMenu
        className="bg-white border shadow-lg p-2 rounded-lg flex flex-wrap gap-2 z-50"
        editor={editor}
         options={{placement: 'top-start',flip: true,}}
      >

      {/* Heading Dropdown */}
        <select
          onChange={handleHeadingChange}
          defaultValue="paragraph"
          className="border rounded px-2 py-1 text-sm bg-white"
        >
          <option value="paragraph">Normal text</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
        {/* Text styles */}
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "text-blue-600" : ""}><Bold size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "text-blue-600" : ""}><Italic size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? "text-blue-600" : ""}><UnderlineIcon size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? "text-blue-600" : ""}><Strikethrough size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive("highlight") ? "text-blue-600" : ""}><Highlighter size={18} /></button>

        {/* Lists */}
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleTaskList().run()}><ListTodo size={18} /></button>

        {/* Alignment */}
        <button onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={18} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign("justify").run()}><AlignJustify size={18} /></button>

        {/* Quotes and lines */}
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={18} /></button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={18} /></button>
       

        {/* Links */}
        <button
          onClick={() => {
            const url = prompt("Enter URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        ><LinkIcon size={18} /></button>
        <button onClick={() => editor.chain().focus().unsetLink().run()}><Unlink size={18} /></button>

        {/* Media */}
        <button
          onClick={() => {
            const url = prompt("Enter image URL");
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
        ><ImageIcon size={18} /></button>

        {/* Code */}
        <button onClick={() => editor.chain().focus().toggleCode().run()}><CodeIcon size={18} /></button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}><SquareCode size={18} /></button>

        {/* Undo / Redo / Clear */}
        <button onClick={() => editor.chain().focus().undo().run()}><Undo size={18} /></button>
        <button onClick={() => editor.chain().focus().redo().run()}><Redo size={18} /></button>
        <button onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><X size={18} /></button>
      </BubbleMenu>

      {/* Editor */}
      <div className="border rounded p-3 min-h-[200px] mb-6 bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Output HTML */}
      <h3 className="text-lg font-bold mb-2">Output HTML</h3>
      <pre className="bg-gray-100 p-2 rounded mb-4 overflow-x-auto text-sm">
        {htmlOutput}
      </pre>

      {/* Preview */}
      <h3 className="text-md font-semibold mb-2">Preview:</h3>
      <div
        className="border p-3 rounded bg-white"
        style={{ lineHeight: "1.6", fontSize: "1rem" }}
        dangerouslySetInnerHTML={{ __html: htmlOutput }}
      />

      {/* Styles */}
      <style jsx>{`
        div :global(ul) {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        div :global(ol) {
          list-style-type: decimal;
          padding-left: 1.5rem;
        }
         div :global(h1) {
          font-size: 1.5rem;
          font-weight: bold;
        }
        div :global(h2) {
          font-size: 1.25rem;
          font-weight: bold;
        }
        div :global(h3) {
          font-size: 1.1rem;
          font-weight: bold;
        }

      `}</style>
    </div>
  );
}
