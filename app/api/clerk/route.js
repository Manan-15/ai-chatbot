export const dynamic = "force-dynamic";

import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";


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

  const { data, type } = event;

  console.log("✅ Received Clerk event:", type);
  console.log("📦 Event data:", data);

  // ✅ Prepare user data for DB
  const userData = {
    _id: data.id, // Clerk user ID is used as MongoDB _id
    email: data.email_addresses?.[0]?.email_address ?? "unknown@example.com",
    name: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
    image: data.image_url ?? "",
  };

  // ✅ Connect to DB and perform actions
  await connectDB();
  console.log("✅ Connected to MongoDB");

  try {
    switch (type) {
      case "user.created":
        console.log("➕ Creating user...");
        await User.create(userData);
        break;
      case "user.updated":
        console.log("✏️ Updating user...");
        await User.findByIdAndUpdate(data.id, userData, { new: true });
        break;
      case "user.deleted":
        console.log("🗑️ Deleting user...");
        await User.findByIdAndDelete(data.id);
        break;
      default:
        console.log("ℹ️ Unhandled event type:", type);
        break;
    }
  } catch (err) {
    console.error("❌ DB operation failed:", err);
    return NextResponse.json({ message: "Database error" }, { status: 500 });
  }

  console.log("Received Clerk event:", event.type);
  return NextResponse.json({ message: "Event processed successfully" });

}
