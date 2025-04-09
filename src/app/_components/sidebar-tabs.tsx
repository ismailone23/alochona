import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DisplayRooms from "./display-rooms";
import InvitationTab from "./invitation-tab";

export default function SidebarTabs() {
  return (
    <Tabs defaultValue="rooms" className="w-full">
      <TabsList className="grid w-full grid-cols-2 gap-2">
        <TabsTrigger value="rooms">Rooms</TabsTrigger>
        <TabsTrigger value="invitation">Invitations</TabsTrigger>
      </TabsList>
      <TabsContent value="rooms">
        <DisplayRooms />
      </TabsContent>
      <TabsContent value="invitation">
        <InvitationTab />
      </TabsContent>
    </Tabs>
  );
}
