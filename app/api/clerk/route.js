export const dynamic = "force-dynamic";

import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  const secret = process.env.SIGNING_SECRET;

  // ✅ Short-circuit before svix logic if missing
  if (!secret || secret === "") {
    console.warn("SIGNING_SECRET missing or empty");
    return NextResponse.json({ message: "Missing SIGNING_SECRET" });
  }

  const wh = new Webhook(secret);

  const headerList = headers();
  const svixHeaders = {
    "svix-id": headerList.get("svix-id"),
    "svix-timestamp": headerList.get("svix-timestamp"),
    "svix-signature": headerList.get("svix-signature"),
  };

  const body = JSON.stringify(await req.json());

  let event;
  try {
    event = wh.verify(body, svixHeaders);
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ message: "Invalid webhook signature" }, { status: 400 });
  }

  console.log("Received Clerk event:", event.type);
  return NextResponse.json({ message: "Webhook received" });
}
