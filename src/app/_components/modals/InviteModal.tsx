import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { toast } from "@/components/ui/sonner";

export function InviteModal() {
  const [searchText, setSearchText] = useState<string | undefined>();
  const debounceText = useDebounceValue(searchText, 300)[0];
  const searchResult = api.chat.searchMember.useQuery({ query: debounceText });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size={"icon"} variant="outline">
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search Member</DialogTitle>
          <DialogDescription>
            You can search members exists in our website for chat with there
            name or email
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 items-center gap-1">
          <Label htmlFor="query" className="text-right">
            Query
          </Label>
          <Input
            id="query"
            onChangeCapture={(e) => setSearchText(e.currentTarget.value)}
            className="col-span-4"
          />
        </div>
        <DialogFooter>
          {searchResult.isLoading ? (
            <p className="w-full">loading...</p>
          ) : searchResult.isError ? (
            <p className="w-full">{searchResult.error.message}</p>
          ) : !searchResult.data || searchResult.data.length < 1 ? (
            <p className="w-full">Nothing to show</p>
          ) : (
            <div className="flex w-full flex-col">
              {searchResult.data.map((member) => (
                <UserCard
                  key={member.id}
                  email={member.email}
                  name={member.name}
                  image={member.image}
                  connectedUser={member.id}
                />
              ))}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UserCardProps {
  image: string | null;
  name: string | null;
  email: string;
  connectedUser: string;
}

const UserCard: React.FC<UserCardProps> = ({
  image,
  name,
  email,
  connectedUser,
}) => {
  const addConnection = api.chat.sendConnection.useMutation({
    onMutate: () => {
      const toastId = toast.loading("Revoking invitation...");
      return { toastId };
    },
    onError: (error, _var, ctx) => {
      toast.error("Connection Request failed", {
        description: error.message,
        id: ctx?.toastId,
      });
    },
    onSuccess: (_data, _var, ctx) => {
      toast.success("connection request send", { id: ctx.toastId });
    },
  });
  const handleConnect = async () => {
    addConnection.mutate({ connectedUser });
  };
  return (
    <div className="flex w-full items-center justify-between gap-2 rounded p-2 hover:bg-gray-100">
      <Avatar>
        <AvatarImage src={image as string} />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <div className="flex w-full justify-between">
        <div className="flex w-full flex-col items-start">
          <p>{name}</p>
          <p className="text-xs font-light text-gray-500">{email}</p>
        </div>
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                onClick={handleConnect}
                className="rounded-sm border px-2 py-1"
              >
                Connect
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to Connection</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
