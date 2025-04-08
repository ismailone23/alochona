"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { InviteModal } from "./modals/InviteModal";
import SidebarTabs from "./sidebar-tabs";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col">
        <div className="relative flex items-center">
          <Button
            className={cn(
              "absolute top-1 left-1 h-7 w-7 border-0 bg-transparent shadow-none hover:bg-transparent",
            )}
            variant={"outline"}
          >
            <Search />
          </Button>
          <Input className="mr-1 h-9 w-full pl-7 text-gray-700" />
          <InviteModal />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarTabs />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
