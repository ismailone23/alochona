"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Home() {
  const user = useSession();
  if (user.status !== "loading" && user.status === "unauthenticated") {
    return redirect("/login");
  }
  return redirect("/chat");
}
