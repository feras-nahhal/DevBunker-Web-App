// src/lib/enums.ts

export enum USER_ROLES {
  CONSUMER = "consumer",
  CREATOR = "creator",
  ADMIN = "admin",
}

export enum USER_STATUS {
  ACTIVE = "active",
  BANNED = "banned",
  PENDING = "pending",
}

export enum CONTENT_TYPES {
  POST = "post",
  MINDMAP = "mindmap",
  RESEARCH = "research",
}

export enum CONTENT_STATUS {
  DRAFT = "draft",
  PUBLISHED = "published",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum TAG_CATEGORY_STATUS {
  APPROVED = "approved",
  PENDING = "pending",
  REJECTED = "rejected",
}

export enum NOTIFICATION_TYPES {
  APPROVAL = "approval",
  SYSTEM = "system",
  CONTENT = "content",
}


export enum VOTE_TYPE {
  LIKE = "like",
  DISLIKE = "dislike",
}
