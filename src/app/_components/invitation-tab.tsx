import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { api } from "@/trpc/react";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import React from "react";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
export default function InvitationTab() {
  const connections = api.chat.checkConnections.useQuery();
  const apictx = api.useContext();
  const acceptConnection = api.chat.acceptConnections.useMutation({
    onMutate: () => {
      const toastId = toast.loading("accepting connection ...");
      return { toastId };
    },
    onError: (error, _var, ctx) => {
      toast.error("Connection Request acception failed", {
        description: error.message,
        id: ctx?.toastId,
      });
    },
    onSuccess: async (_data, _var, ctx) => {
      await apictx.chat.checkConnections.invalidate();
      await apictx.chat.getAllRooms.invalidate();
      toast.success("connection request accepted", { id: ctx.toastId });
    },
  });
  const removeConnection = api.chat.removeConnection.useMutation({
    onMutate: () => {
      const toastId = toast.loading("removing connection ...");
      return { toastId };
    },
    onError: (error, _var, ctx) => {
      toast.error("Connection remove failed", {
        description: error.message,
        id: ctx?.toastId,
      });
    },
    onSuccess: async (_data, _var, ctx) => {
      await apictx.chat.checkConnections.invalidate();
      toast.success("connection removed", { id: ctx.toastId });
    },
  });
  const handleConnect = async (cid: string) => {
    acceptConnection.mutate({ cid });
  };
  const handleConnectr = async (cid: string) => {
    removeConnection.mutate({ connectedUser: cid });
  };
  const { data } = useSession();
  return (
    <div>
      {connections.isLoading ? (
        <p>loading connections...</p>
      ) : connections.isError ? (
        <p>{connections.error.message}</p>
      ) : !connections.data || connections.data.length < 1 ? (
        <p>no connection found</p>
      ) : (
        connections.data.map(({ connection, user }, i) => (
          <div
            key={i}
            className="flex w-full items-center justify-between gap-2 rounded p-2 hover:bg-gray-100"
          >
            <Avatar>
              {user?.image && <AvatarImage src={user.image} />}
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex w-full flex-col justify-between">
              <div className="flex w-full flex-col items-start">
                <p>{user.name}</p>
              </div>
              {data?.user.id === connection.currentuserId ? (
                <div>
                  <p className="text-sm">
                    sent{" "}
                    {dayjs(connection.createdAt, { locale: "en" }).fromNow()}
                  </p>
                  <Button
                    size={"sm"}
                    variant={"destructive"}
                    onClick={() => handleConnectr(connection.connectedUserId)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex w-full flex-col">
                  <p className="text-sm">
                    received{" "}
                    {dayjs(connection.createdAt, { locale: "en" }).fromNow()}
                  </p>
                  <div className="grid w-full grid-cols-2 gap-2">
                    <Button
                      size={"sm"}
                      variant={"destructive"}
                      onClick={() => handleConnectr(user.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      size={"sm"}
                      variant={"outline"}
                      onClick={() => handleConnect(user.id)}
                    >
                      Acceot
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
