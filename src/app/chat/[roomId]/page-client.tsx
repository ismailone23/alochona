"use client";
import { useParams } from "next/navigation";

export default function PageClient() {
  const { roomId } = useParams<{ roomId: string }>();
  console.log(roomId);

  return <div>page</div>;
}
