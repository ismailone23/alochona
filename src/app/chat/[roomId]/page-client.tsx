"use client";

import { MessageForm } from "@/app/_components/send-message";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { useRef, useEffect, useState, useCallback } from "react";
import Chats from "@/app/_components/chats";
import { useSocket, type receiveMessageData } from "@/context/socket-provider";

export default function PageClient() {
  const { roomId } = useParams<{ roomId: string }>();
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = api.chat.getMessages.useInfiniteQuery(
    { roomId, limit: 15 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!roomId,
    },
  );
  const hasAutoScrolled = useRef(false);

  useEffect(() => {
    if (!hasAutoScrolled.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
      hasAutoScrolled.current = true;
    }
  }, [data?.pages.length]);

  useEffect(() => {
    if (!hasNextPage || !topRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting) {
        fetchNextPage();
      }
    });

    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const [messages, setMessages] = useState<receiveMessageData[]>([]);

  useEffect(() => {
    if (data) {
      setMessages(data.pages.flatMap((page) => page.items) ?? []);
    }
  }, [data]);
  const handleReceiveMessage = (newMessage: receiveMessageData) => {
    if (!newMessage.message || !newMessage.user) {
      console.error("Invalid message format", newMessage);
      return;
    }
    setMessages((prev) => {
      if (prev.some((msg) => msg.message.id === newMessage.message.id)) {
        return prev;
      }
      return [newMessage, ...prev];
    });
  };
  useEffect(() => {
    if (!roomId || !socket) return;
    socket.connect();
    socket.emit("join_room", roomId);
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.disconnect();
    };
  }, [roomId, socket]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden pr-6">
      {isLoading ? (
        <p className="m-auto">Loading messages...</p>
      ) : isError ? (
        <p className="m-auto text-red-500">{error.message}</p>
      ) : (
        <>
          <div className="min-h flex-1 overflow-y-auto px-2">
            {messages.length < 1 ? (
              <div className="flex h-full flex-1 items-center justify-center">
                <p className="text-muted-foreground text-center">
                  No messages found
                </p>
              </div>
            ) : (
              <div className="flex flex-col-reverse">
                <div ref={bottomRef} />
                {messages.map(({ message, user }, i) => (
                  <Chats message={message} user={user} key={i} />
                ))}
                <div ref={topRef} />
                {isFetchingNextPage && (
                  <p className="text-center text-xs text-gray-400">
                    Loading more...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Message Form at bottom */}
          <div className="my-2 shrink-0 px-2">
            <MessageForm />
          </div>
        </>
      )}
    </div>
  );
}
