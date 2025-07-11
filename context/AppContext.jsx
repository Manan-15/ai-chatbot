"use client";

import { useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';
import { createContext,useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast';

export const AppContext=createContext();

export const useAppContext=()=>{
    return useContext(AppContext)
}

export const AppContextProvider=({children})=>{
    const {user}=useUser()

    const{getToken}=useAuth()

    const[chats,setChats]=useState([]);
    const[selectedChat,setSelectedChat]=useState(null);
    
    const createNewChat=async()=>{
        try{
            if(!user)return null;

            const token=await getToken();

            await axios.post('/api/chat/create',{},{headers:{
                Authorization:`Bearer ${token}`
            }})
            fetchUsersChats();
        } 
        catch(error){
            toast.error(error.message)
        }

    }

    const fetchUsersChats=async()=>{
        console.log("🚀 fetchUsersChats() called");
        try {
            const token=await getToken();

            const {data}=await axios.get('/api/chat/get',{headers:{
                Authorization:`Bearer ${token}`
            }})

            if(data.success){
                console.log("✅ Chats fetched:", data.data); // <- Add this
                setChats(data.data)

                //if user has no chats then create one
                if(data.data.length===0){
                    await createNewChat();
                    return await fetchUsersChats();
                }
                else{
                    //sort the chat data by date
                    data.data.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
                    console.log("✅ Setting selectedChat to:", data.data[0])

                    //set recently updated chat as selected chat
                    setSelectedChat(data.data[0])
                    console.log(data.data[0]);
                }
            }
            else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        if(user){
            console.log("✅ User available. Fetching user chats...");
            fetchUsersChats();
        }
    },[user])

    const value={
        user,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        fetchUsersChats,
        createNewChat,
    }
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}