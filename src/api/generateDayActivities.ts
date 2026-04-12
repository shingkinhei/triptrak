import { createClient } from "@/lib/supabase/client";
import { NextResponse } from 'next/server';


export async function getAiPlan(trip_uuid: string, day_uuid: string, user_preference: string, user_suggestion: string) {
  try {
    const supabase = createClient();

    // 1. Fetch ALL activities for the entire trip to prevent duplicates
    const { data: allTripActivities } = await supabase
      .from('activities')
      .select('name, description, day_uuid')
      .eq('trip_uuid', trip_uuid); // Note: You might need to ensure trip_uuid is indexed

    // Separate today's stuff from other days
    const todaysActivities = allTripActivities?.filter(a => a.day_uuid === day_uuid) || [];
    const otherDaysActivities = allTripActivities?.filter(a => a.day_uuid !== day_uuid) || [];

    const todaysContext = todaysActivities.map(a => 
      `- ${a.name} (${a.description})`
    ).join('\n') || "Empty";

    const alreadyPlannedContext = otherDaysActivities.map(a => 
      `- ${a.name}`
    ).join('\n') || "None";

    // 2. Get Metadata (Destination & Date)
    const [{ data: dayData }, { data: tripData }] = await Promise.all([
      supabase.from('trip_days').select('date').eq("day_uuid", day_uuid).single(),
      supabase.from('trips').select('destination').eq("trip_uuid", trip_uuid).single()
    ]);

    const destination = tripData?.destination || "Unknown";
    const dateInfo = dayData?.date || "Unknown Date";

    // 3. Updated Prompt with "Avoid List"
    const prompt = `You are an expert travel assistant.
Destination: ${destination}
Today's Date: ${dateInfo}

CURRENT ITINERARY FOR TODAY:
${todaysContext}

ALREADY PLANNED ON OTHER DAYS (DO NOT DUPLICATE THESE):
${alreadyPlannedContext}

USER PREFERENCE: the whole trip not only mainly focus on ${user_preference}, but also maybe include 'Accommodation','Outdoor','City','Event','Food','Plane','Sightseeing'.Each activity should be one of the following: 'Accommodation','Outdoor','City','Event','Food','Plane','Sightseeing'.
User Request: ${user_suggestion || "No further request"}

Provide NEW activity suggestions for TODAY.
Return ONLY a plain JSON array of objects:
[{"time": "HH:mm:ss", "name": "...", "description": "...", "activity_type": "...", "address": "..."}]`;

    // 4. Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openai/gpt-oss-20b:free",
        "messages": [{ "role": "user", "content": prompt }]
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

    try {
      const cleanJsonString = aiContent.replace(/```json|```/g, "").trim();
      return { data: JSON.parse(cleanJsonString), error: null };
    } catch (parseErr) {
      console.error("Failed to parse AI JSON:", aiContent);
      throw new Error("AI_PARSE: The AI returned an invalid format. Please try again.");
    }
  } catch (error: any) {
    console.error("Internal AI Error:", error);
    return {
        data: null,
        error: error.message || "Failed to fetch AI plan"
    };
  }
}