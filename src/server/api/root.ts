import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { createCallerFactory, createTRPCContext, createTRPCRouter } from "./trpc";
import { postRouter } from "./routers/post";

/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
 const appRouter = createTRPCRouter({
  post:postRouter
});

// export type definition of API
type AppRouter = typeof appRouter;


const createCaller = createCallerFactory(appRouter);

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 **/
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 **/
type RouterOutputs = inferRouterOutputs<AppRouter>;

export { appRouter, createCaller, createTRPCContext };
export type { AppRouter, RouterInputs, RouterOutputs };
