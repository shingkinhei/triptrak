import { createClient } from "@/lib/supabase/client";
import { NextResponse } from 'next/server';

export async function getAiTrip(start_date:string, end_date:string, country_code: string, destination: string, user_preference: string,user_suggestion: string) {
  const supabase = createClient();

  // 3. Call OpenRouter
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
          "content": `You are a professional tour guide. Please provide suggestions based on the user's new itinerary. Please be sure to return array objects in plain JSON format.\nDay Information:${start_date} to ${end_date}\n Country: ${country_code}\nDestination: ${destination}\nUser Preferences: the whole trip not only mainly focus on ${user_preference},but also may be include 'Accommodation','Outdoor','City','Event','Food','Plane','Sightseeing'. \nUser Request: ${user_suggestion || "No further request"}\nPlease provide suggested activities that match the following JSON format:
          [{"day": "YYYY-MM-DD", "time": "HH:mm:ss", "name": "...", "description": "...", "activity_type": "must be one of the activity options", "address": "..."}]`
        }
      ],
      "reasoning": {"enabled": true}
      // "response_format": { "type": "json_object" } 
    })
  });

  if (!response.ok) {
    return response.statusText;
  };

  const data = await response.json();
  const aiContent = data.choices?.[0]?.message?.content;

  if (!aiContent) {
    console.error("AI response does not contain content:");
    return;
  }
  
  const cleanJsonString = aiContent.replace(/```json|```/g, "").trim();
  console.log("Cleaned AI Content:", JSON.parse(cleanJsonString));
  return JSON.parse(cleanJsonString);
}