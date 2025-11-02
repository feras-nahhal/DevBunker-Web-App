// src/lib/tables.ts
import { pgTable, serial, uuid, varchar, text, timestamp, jsonb, uniqueIndex,integer, } from "drizzle-orm/pg-core";
import { USER_ROLES, USER_STATUS, CONTENT_TYPES, CONTENT_STATUS, TAG_CATEGORY_STATUS, NOTIFICATION_TYPES,VOTE_TYPE } from "./enums";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default(USER_ROLES.CONSUMER).notNull(),
  status: varchar("status", { length: 20 }).default(USER_STATUS.PENDING).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default(TAG_CATEGORY_STATUS.PENDING),
  created_by: uuid("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// Tags table
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).default(TAG_CATEGORY_STATUS.PENDING),
  created_by: uuid("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// Content table
export const content = pgTable("content", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content_body: text("content_body"),
  content_type: varchar("content_type", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default(CONTENT_STATUS.DRAFT),
  author_id: uuid("author_id").references(() => users.id),
  category_id: uuid("category_id").references(() => categories.id),
  excalidraw_data: jsonb("excalidraw_data"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Content Tags (many-to-many)
export const content_tags = pgTable(
  "content_tags",
  {
    content_id: uuid("content_id").references(() => content.id),
    tag_id: uuid("tag_id").references(() => tags.id),
  },
  (table) => ({
    pk: uniqueIndex("content_tags_pkey").on(table.content_id, table.tag_id),
  })
);

// Bookmarks table
export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id),
    content_id: uuid("content_id").references(() => content.id),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    user_content_unique: uniqueIndex("user_content_unique").on(table.user_id, table.content_id),
  })
);

// Read Later table
export const read_later = pgTable(
  "read_later",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id),
    content_id: uuid("content_id").references(() => content.id),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    user_content_unique: uniqueIndex("user_content_unique").on(table.user_id, table.content_id),
  })
);


// Notifications table
import { boolean } from "drizzle-orm/pg-core"; 

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  read: boolean("read").default(false), // <-- corrected
  created_at: timestamp("created_at").defaultNow(),
});


// Tag Requests
export const tag_requests = pgTable("tag_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id),
  tag_name: varchar("tag_name", { length: 50 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default(TAG_CATEGORY_STATUS.PENDING),
  created_at: timestamp("created_at").defaultNow(),
});

// Category Requests
export const category_requests = pgTable("category_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => users.id),
  category_name: varchar("category_name", { length: 100 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default(TAG_CATEGORY_STATUS.PENDING),
  created_at: timestamp("created_at").defaultNow(),
});

// comments table
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  content_id: uuid("content_id").references(() => content.id).notNull(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  text: text("text").notNull(),
  parent_id: uuid("parent_id"), // <-- just remove `.default(null)`
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});


// references_link table
export const references_link = pgTable("references_link", {
  id: uuid("id").primaryKey().defaultRandom(),
  content_id: uuid("content_id").references(() => content.id).notNull(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  text: text("text").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});


// votes table
export const votes = pgTable(
  "votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id),
    content_id: uuid("content_id").references(() => content.id),
    vote_type: varchar("vote_type", { length: 10 }).default(VOTE_TYPE.LIKE).notNull(),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    user_content_unique: uniqueIndex("user_content_unique").on(table.user_id, table.content_id),
  })
);

export const password_reset_pins = pgTable("password_reset_pins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  pin: integer("pin").notNull(),
  expires_at: timestamp("expires_at").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});