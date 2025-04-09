import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { type Metadata } from "next";
import { AppSidebar } from "@/app/_components/app-sidebar";
import { HydrateClient } from "@/trpc/server";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Alochona - Chats",
  description:
    "A app where you can chat with peoples by inviting them or with current user with there emails. ",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function MessageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await auth();

  if (!user || !user.user) {
    return redirect("/login");
  }
  return (
    <HydrateClient>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex h-screen w-full flex-col overflow-hidden">
          <SidebarTrigger className="shrink-0" />
          <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
            {children}
          </div>
          <Toaster />
        </main>
      </SidebarProvider>
    </HydrateClient>
  );
}
