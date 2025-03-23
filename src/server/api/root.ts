import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import { createCallerFactory, createTRPCContext } from "./trpc";
import { appRouter, type AppRouter } from ".";

const createCaller = createCallerFactory(appRouter);

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export { createCaller, createTRPCContext };
export type { RouterInputs, RouterOutputs };
