import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { type Metadata } from "next";
import { AppSidebar } from "@/app/_components/app-sidebar";

export const metadata: Metadata = {
  title: "Alochona - Chats",
  description:
    "A app where you can chat with peoples by inviting them or with current user with there emails. ",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function MessageLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
