"use client";
import { env } from "@/env";
import type { Message, User } from "@/server/db/schema";
import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export type sendMessageData = {
  roomId: string;
  message: Message;
  user: User;
};
export type receiveMessageData = {
  message: Message;
  user: User;
};
interface ServerToClientEvents {
  receive_message: (data: receiveMessageData) => void;
  room_joined: (roomId: string) => void;
  user_typing: (data: {
    userId: string;
    roomId: string;
    isTyping: boolean;
  }) => void;
}
interface ClientToServerEvents {
  send_message: (data: sendMessageData) => void;
  join_room: (roomId: string) => void;
  typing: (data: { roomId: string; isTyping: boolean }) => void;
}

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

const SocketContext = createContext<SocketType | null>(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<SocketType | null>(null);

  useEffect(() => {
    const newSocket: SocketType = io(env.NEXT_PUBLIC_SOCKET_IO_API, {
      autoConnect: false,
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
