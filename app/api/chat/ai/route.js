export const maxDuration=60;
import OpenAI from "openai";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Chat from "@/models/Chat";
import connectDB from "@/config/db";

//initialise openai client with deepseek api key and base url
const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: process.env.DEEPSEEK_API_KEY
});

export async function POST(req) {
    try {
        const{userId}=getAuth(req);
        
        //extract chatid and prompt from req body
        const{chatId,prompt}=await req.json();
        if(!userId){
            return NextResponse.json({success:false, message:"User not Authenticated",});
        }

        //find chat in database based on userid and chatid
        await connectDB();
        const data=await Chat.findOne({userId,_id:chatId})

        //create user message object
        const userPrompt={
            role: "user",
            content: prompt,
            timestamp:Date.now(),
        }

        data.messages.push(userPrompt);

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt}],
            model: "deepseek-chat",
            store:true,
        });

        const message=completion.choices[0].message;
        message.timestamp=Date.now();
        data.messages.push(message);
        data.save();

        return NextResponse.json({success:true,data:message})

    } catch (error) {
        return NextResponse.json({success:false, error:error.message})  
    }
}