import connectDB from "@/config/db";
import Chat from "@/models/Chat";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        console.log("📥 GET /api/chat/get triggered");

        const{userId}=getAuth(req);

        if(!userId){
            return NextResponse.json({success:false, message:"User not Authenticated",});
        }
        //conenct to database and fetch all chats for user
        await connectDB();
        const data=await Chat.find({ userId });
        console.log("📦 Chats returned for user", userId, ":", data);
        return NextResponse.json({success:true, data})

    } catch (error) {
        console.error("❌ Error in /api/chat/get:", error);
        return NextResponse.json({success:false, error:error.message});
    }
}