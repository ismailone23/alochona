import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/trpc/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function DisplayRooms() {
  const rooms = api.chat.getAllRooms.useQuery();
  const pathname = usePathname().replace("/chat/", "");

  return (
    <div>
      {rooms.isLoading ? (
        <p>loading rooms...</p>
      ) : rooms.isError ? (
        <p>{rooms.error.message}</p>
      ) : !rooms.data || rooms.data.length < 1 ? (
        <p>no connection found</p>
      ) : (
        rooms.data.map((room, i) => (
          <Link
            href={`/chat/${room.id}`}
            key={i}
            className={`flex w-full items-center justify-between gap-2 rounded p-2 hover:bg-gray-100 ${pathname === room.id ? "bg-gray-100" : ""}`}
          >
            <Avatar>
              {room.rImage && <AvatarImage src={room.rImage} />}
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex w-full flex-col justify-between">
              <div className="flex w-full flex-col items-start">
                <p>{room.rName}</p>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
