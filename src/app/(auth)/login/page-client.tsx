"use client";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { redirect } from "next/navigation";
import OauthProvider from "@/app/_components/oauth-providers";
// import { useSession } from "next-auth/react";

export default function PageClient() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Card className="m-2 flex w-full flex-col p-5 xl:m-0 xl:w-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            Alochona
          </CardTitle>
          <CardDescription className="text-center">
            login with your google account to explore chats
          </CardDescription>
        </CardHeader>
        <OauthProvider />
      </Card>
    </div>
  );
}
