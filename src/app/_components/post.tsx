"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LatestPost() {
  const user = useSession();
  const router = useRouter();
  if (!user.data) {
    return router.replace("/login");
  }
  return router.replace("/chat");
}
