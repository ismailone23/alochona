"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { SendIcon } from "lucide-react";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { useSocket } from "@/context/socket-provider";

const FormSchema = z.object({
  message: z.string().min(2, {
    message: "Message must be at least 2 characters.",
  }),
});

export function MessageForm() {
  const socket = useSocket();
  const { roomId } = useParams<{ roomId: string }>();
  const apictx = api.useContext();
  const sendMessageApi = api.chat.sendMessage.useMutation({
    onMutate: () => {
      const toastId = toast.loading("Sending message...");
      return { toastId };
    },
    onError: (error, _var, ctx) => {
      toast.error("Failed to send message", {
        description: error.message,
        id: ctx?.toastId,
      });
    },
    onSuccess: async (_data, _var, ctx) => {
      await apictx.chat.getMessages.invalidate();
      await apictx.chat.getAllRooms.invalidate();
      toast.success("Message sent.", { id: ctx.toastId });

      // Emit message through Socket.IO to update other clients
      if (roomId && socket && _data.user) {
        socket.emit("send_message", {
          roomId,
          message: _data.message,
          user: _data.user,
        });
      }
    },
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    defaultValues: {
      message: "",
    },
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    sendMessageApi.mutate({ roomId, text: data.message, type: "text" });
    form.reset();
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit(onSubmit)(); // manually trigger submit
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-full items-end"
      >
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="w-full px-2">
              <FormControl>
                <Textarea
                  onKeyDown={handleKey}
                  className="hide-scrollbar h-12"
                  placeholder="Send Message"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button variant={"outline"} type="submit">
          <SendIcon />
        </Button>
      </form>
    </Form>
  );
}
