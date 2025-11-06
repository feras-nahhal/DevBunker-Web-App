// src/types/content.ts
import {
  CONTENT_STATUS,
  CONTENT_TYPES,
  TAG_CATEGORY_STATUS,
  NOTIFICATION_TYPES,
} from "@/lib/enums";

// ---------------------------
// 🧠 USER (light version for relations)
// ---------------------------
export interface Author {
  id: string;
  email: string;
  role?: string;
}

// ---------------------------
// 🏷️ CATEGORY & TAG
// ---------------------------
export interface Category {
  id: string;
  name: string;
  description?: string;
  status: TAG_CATEGORY_STATUS;
  authorEmail?: string;
  created_by?: string;
  created_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  status: TAG_CATEGORY_STATUS;
  authorEmail?: string; // NEW: email of tag creator
  created_by?: string;
  created_at?: string;
}

// ---------------------------
// 📰 CONTENT BASE
// ---------------------------
export interface BaseContent {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  author_id: string;
  authorEmail?: string; // 👈 new field for author email
  categoryName?: string; // 👈 new field for category name
  status: CONTENT_STATUS;
  content_type: CONTENT_TYPES;
  created_at?: string;
  updated_at?: string;
  excalidraw_data?:Record<string, unknown>;
  tags?: string[]; // 👈 Ensure this is here

}

// ---------------------------
// ✍️ POST / RESEARCH / MINDMAP
// ---------------------------
export interface Post extends BaseContent {
  content_type: CONTENT_TYPES.POST;
  content_body: string;
}

export interface Research extends BaseContent {
  content_type: CONTENT_TYPES.RESEARCH;
  content_body: string;
  references?: string[];
  
}

export interface Mindmap extends BaseContent {
  content_type: CONTENT_TYPES.MINDMAP;
  excalidraw_data1?: Record<string, unknown>;
}

// union for all types
export type AnyContent = Post | Research | Mindmap;

// ---------------------------
// 🔖 BOOKMARK & READ LATER (optional support)
// ---------------------------
export interface Bookmark {
  id: string;
  user_id: string;
  content_id: string;
  created_at?: string;
}

export interface ReadLater {
  id: string;
  user_id: string;
  content_id: string;
  created_at?: string;
}

// ---------------------------
// 🔔 NOTIFICATION (for reference)
// ---------------------------
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string; // Use string here; map to NOTIFICATION_TYPES in code
  read: boolean;
  created_at?: string;
}

// ---------------------------
// 💬 COMMENTS
// ---------------------------
export interface Comment {
  id: string;
  content_id: string;
  user_id: string;
  text: string;
  parent_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ---------------------------
// 🔗 REFERENCES (Research links)
// ---------------------------
export interface ReferenceLink {
  id: string;
  content_id: string;
  user_id: string;
  text: string;
  created_at?: string;
  updated_at?: string;
}

export { CONTENT_STATUS };
