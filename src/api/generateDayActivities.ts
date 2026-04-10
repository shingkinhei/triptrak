import { createClient } from "@/lib/supabase/client";
import { NextResponse } from 'next/server';


export async function getAiPlan(trip_uuid: string, day_uuid: string, user_preference: string,user_suggestion: string) {
  try{

    const supabase = createClient();

    // 1. get the existing activities for the day 
    const { data: currentActivities } = await supabase
      .from('activities')
      .select('time, description, activity_type, address')
      .eq('day_uuid', day_uuid)
      .order('time', { ascending: true });

    const contextText = currentActivities?.map(a => 
      `time: ${a.time}, type: ${a.activity_type}, content: ${a.description}, address: ${a.address}`
    ).join('\n') || "no existing activities";

    // 2. get the date information for the day
    const { data: dayData } = await supabase
      .from('trip_days')
      .select('date')
      .eq("day_uuid", day_uuid)
      .single();

    const dateInfo = dayData ? `Date: ${dayData.date}` : "Date information not available";

    const { data: tripData } = await supabase
      .from('trips')
      .select('destination')
      .eq("trip_uuid", trip_uuid)
      .single();

    const destination = tripData ? `Destination: ${tripData.destination}` : "Destination information not available";

    // 3. call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        // "HTTP-Referer": `${process.env.SITE_URL}`,
        // "X-Title": `${process.env.SITE_NAME}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openai/gpt-oss-20b:free",
        "messages": [
          {
            "role": "user",
            "content": `You are a professional tour guide. Please provide suggestions based on the user's existing itinerary. Please be sure to return array objects in plain JSON format.\nDestination: ${destination}\nExisting Itinerary:\n${contextText}\n\nDay Information:\n${dateInfo}\n\nUser Preferences: the whole trip not only mainly focus on ${user_preference},but also may be include 'Accommodation','Outdoor','City','Event','Food','Plane','Sightseeing'.\nUser Request: ${user_suggestion}\nPlease provide suggested activities that match the following JSON format:
            [{"time": "HH:mm:ss", "name": "...", "description": "...", "activity_type": "must be one of the activity options", "address": "..."}]`
          }
        ],
        "reasoning": {"enabled": true}
        // "response_format": { "type": "json_object" } 
      })
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("AI_LIMIT: Too many requests. Please wait a moment.");
      if (response.status === 401) throw new Error("AI_AUTH: API Key issue.");
      throw new Error(`AI_ERROR: ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) throw new Error("AI_EMPTY: No suggestions received.");

    
    const cleanJsonString = aiContent.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJsonString);
    
  } catch (error: any) {
    // Re-throw the error so page.tsx can catch it
    throw error;
  }
}