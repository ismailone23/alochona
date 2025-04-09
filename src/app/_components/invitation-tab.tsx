import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { api } from "@/trpc/react";
import React from "react";

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

  return (
    <div>
      {connections.isLoading ? (
        <p>loading connections...</p>
      ) : connections.isError ? (
        <p>{connections.error.message}</p>
      ) : !connections.data || connections.data.length < 1 ? (
        <p>no connection found</p>
      ) : (
        connections.data.map(({ user }, i) => (
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
              <div className="grid w-full grid-cols-2 gap-2">
                <Button
                  size={"sm"}
                  variant={"destructive"}
                  onClick={() => handleConnectr(user.id)}
                >
                  remove
                </Button>
                <Button
                  size={"sm"}
                  variant={"outline"}
                  onClick={() => handleConnect(user.id)}
                >
                  connect
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
