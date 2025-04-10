"use client";

import { MessageForm } from "@/app/_components/send-message";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import Chats from "@/app/_components/chats";
import { useSocket, type receiveMessageData } from "@/context/socket-provider";

export default function PageClient() {
  const { roomId } = useParams<{ roomId: string }>();
  const topRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const socket = useSocket();
  const [autoScroll, setAutoScroll] = useState(true);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);

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

  const [messages, setMessages] = useState<receiveMessageData[]>([]);

  // Initialize messages from query data
  useEffect(() => {
    if (data) {
      const allMessages = data.pages.flatMap((page) => page.items) ?? [];
      setMessages(allMessages);
    }
  }, [data]);

  // Auto-scroll to bottom when new messages arrive and autoScroll is true
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, autoScroll]);

  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const atBottom =
      element.scrollHeight - element.scrollTop === element.clientHeight;
    setAutoScroll(atBottom);
  };

  // Infinite scroll observer for loading older messages
  useEffect(() => {
    if (!hasNextPage || !topRef.current || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) {
          // Save current scroll height before fetching
          if (scrollContainerRef.current) {
            setPrevScrollHeight(scrollContainerRef.current.scrollHeight);
          }
          fetchNextPage().catch(console.error);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  // Maintain scroll position after loading older messages
  useEffect(() => {
    if (
      isFetchingNextPage ||
      !scrollContainerRef.current ||
      prevScrollHeight === 0
    )
      return;

    const scrollContainer = scrollContainerRef.current;
    const newScrollHeight = scrollContainer.scrollHeight;
    const scrollDifference = newScrollHeight - prevScrollHeight;

    if (scrollDifference > 0) {
      scrollContainer.scrollTop = scrollDifference;
    }

    setPrevScrollHeight(0); // Reset after adjustment
  }, [isFetchingNextPage, prevScrollHeight]);

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
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-2"
            onScroll={handleScroll}
            style={{ display: "flex", flexDirection: "column-reverse" }}
          >
            {/* <div> */}
            <div ref={messagesEndRef} />
            {messages.map(({ message, user }) => (
              <Chats message={message} user={user} key={message.id} />
            ))}

            {isFetchingNextPage && (
              <p className="text-center text-xs text-gray-400">
                Loading more...
              </p>
            )}
            <div ref={topRef} />
          </div>
          {/* </div> */}

          <div className="my-2 shrink-0 px-2">
            <MessageForm />
          </div>
        </>
      )}
    </div>
  );
}
