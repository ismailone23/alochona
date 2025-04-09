"use server";

import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await auth();

  if (!user || !user.user) {
    return redirect("/login");
  }
  return redirect("/chat");
}
