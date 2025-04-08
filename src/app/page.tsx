"use server";

import { auth } from "@/server/auth";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await auth();

  if (!user || !user.user) {
    return redirect("/login");
  }
  return redirect("/chat");
}
