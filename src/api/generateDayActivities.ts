import { createClient } from "@/lib/supabase/client";
import { NextResponse } from 'next/server';

export async function getAIPlan(day_uuid: string, user_preference: string,user_suggestion: string) {
  const supabase = createClient();

  // 1. 抓取該日的行程作為上下文
  const { data: currentActivities } = await supabase
    .from('activities')
    .select('time, description, activity_type, address')
    .eq('day_uuid', day_uuid)
    .order('time', { ascending: true });

  const contextText = currentActivities?.map(a => 
    `time: ${a.time}, type: ${a.activity_type}, content: ${a.description}, address: ${a.address}`
  ).join('\n') || "no existing activities";

  // 2. 抓取該日的日期資訊
  const { data: dayData } = await supabase
    .from('trip_days')
    .select('date')
    .eq("day_uuid", day_uuid)
    .single();

  const dateInfo = dayData ? `Date: ${dayData.date}` : "Date information not available";
  // 3. 呼叫 OpenRouter
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
          "content": `You are a professional tour guide. Please provide suggestions based on the user's existing itinerary. Please be sure to return array objects in plain JSON format.\nExisting Itinerary:\n${contextText}\n\nDay Information:\n${dateInfo}\n\nUser Preferences: the day mainly focus on ${user_preference} \n\nUser Request: ${user_suggestion}\n\nactivity_type must be ${user_preference}\n\nPlease provide suggested activities that match the following JSON format:
          [{"time": "HH:mm:ss", "name": "...", "description": "...", "activity_type": "must be one of the activity options", "address": "..."}]`
        }
      ],
      "reasoning": {"enabled": true}
      // "response_format": { "type": "json_object" } 
    })
  });

  const data = await response.json();
  const aiContent = data.choices?.[0]?.message?.content;

  if (!aiContent) {
    console.error("AI response does not contain content:");
    return;
  }
  
  const cleanJsonString = aiContent.replace(/```json|```/g, "").trim();
  // console.log(NextResponse.json(JSON.parse(cleanJsonString)));
  console.log("Cleaned AI Content:", JSON.parse(cleanJsonString));
  return JSON.parse(cleanJsonString);
}