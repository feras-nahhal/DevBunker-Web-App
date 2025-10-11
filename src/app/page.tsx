"use client";
// app/page.js
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth/login");
}
