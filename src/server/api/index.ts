import { postRouter } from "./routers/post";
import { createTRPCRouter } from "./trpc";

const appRouter = createTRPCRouter({
  post: postRouter,
});

// export type definition of API
type AppRouter = typeof appRouter;

export { type AppRouter, appRouter };
