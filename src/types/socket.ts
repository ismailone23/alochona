// types/socket.ts
import type { Server as IOServer } from "socket.io";
import type { NextApiResponse } from "next";
import type { Socket as NetSocket } from "net";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: NetSocket & {
    server: {
      io?: IOServer;
    };
  };
};
