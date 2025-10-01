export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin" | "moderator";
  createdAt: Date;
}

export interface JwtPayload {
  id: string;
  role: string;
  email: string;
  exp: number;
  iat: number;
}
