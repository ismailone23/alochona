import { authRouter } from "./routers/auth";
import { chatRouter } from "./routers/chat";
import { createTRPCRouter } from "./trpc";

const appRouter = createTRPCRouter({
  auth: authRouter,
  chat: chatRouter,
});

// export type definition of API
type AppRouter = typeof appRouter;

export { type AppRouter, appRouter };
