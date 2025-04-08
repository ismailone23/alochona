import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import dayjs from "dayjs";
import type { Message, User } from "@/server/db/schema";

export default function Chats({
  user,
  message,
}: {
  user: User;
  message: Message;
}) {
  return (
    <div className="mb-2 flex w-full items-start">
      <Avatar>
        <AvatarImage src={user.image as string} />
        <AvatarFallback>{user.name?.charAt(0) ?? "U"}</AvatarFallback>
      </Avatar>
      <div className="ml-2 w-auto rounded bg-gray-100 p-2 text-gray-800">
        <p className="text-sm font-medium">
          {user.name?.split(" ")[0]}
          <span className="pl-2 text-xs font-light text-gray-500">
            {dayjs(message.updatedAt).format("M/D/YYYY h:mm A")}
          </span>
        </p>
        <p className="break-all">{message.text}</p>
      </div>
    </div>
  );
}
