'use client';
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

// Define the mapping locally to avoid extra DB calls for every card
const WMO_MAP: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  "0": { label: "Clear sky", icon: "Sun", color: "amber-600", bg: "bg-amber-50" },
  "1": { label: "Mainly clear", icon: "CloudSun", color: "slate-500", bg: "bg-slate-100"},
  "2": { label: "Partly cloudy", icon: "CloudSun", color: "slate-500", bg: "bg-slate-100" },
  "3": { label: "Overcast", icon: "Cloud", color: "slate-600", bg: "bg-slate-200" },
  "45": { label: "Foggy", icon: "CloudFog", color: "zinc-500", bg: "bg-zinc-100" },
  "48": { label: "Depositing rime fog", icon: "CloudFog", color: "zinc-500", bg: "bg-zinc-100" },
  "51": { label: "Light drizzle", icon: "CloudDrizzle", color: "blue-600", bg: "bg-blue-50" },
  "53": { label: "Moderate drizzle", icon: "CloudDrizzle", color: "blue-600", bg: "bg-blue-50" },
  "55": { label: "Dense drizzle", icon: "CloudDrizzle", color: "blue-600", bg: "bg-blue-50" },
  "61": { label: "Slight rain", icon: "CloudRain", color: "blue-600", bg: "bg-blue-50" },
  "63": { label: "Moderate rain", icon: "CloudRain", color: "blue-600", bg: "bg-blue-50" },
  "65": { label: "Heavy rain", icon: "CloudRain", color: "blue-600", bg: "bg-blue-50" },
  "71": { label: "Slight snowfall", icon: "CloudSnow", color: "sky-300", bg: "bg-sky-50" },
  "73": { label: "Moderate snowfall", icon: "CloudSnow", color: "sky-400", bg: "bg-sky-100" },
  "75": { label: "Heavy snowfall", icon: "CloudSnow", color: "sky-500", bg: "bg-sky-200" },
  "80": { label: "Slight rain showers", icon: "CloudRain", color: "indigo-400", bg: "bg-indigo-50" },
  "81": { label: "Moderate rain showers", icon: "CloudRain", color: "indigo-500", bg: "bg-indigo-100"},
  "82": { label: "Violent rain showers", icon: "CloudRain", color: "indigo-600", bg: "bg-indigo-200" },
  "95": { label: "Thunderstorm", icon: "CloudLightning", color: "violet-600", bg: "bg-violet-50" },
  "96": { label: "Thunderstorm with slight hail", icon: "CloudLightning", color: "violet-600", bg: "bg-violet-50" },
  "99": { label: "Thunderstorm with heavy hail", icon: "CloudLightning", color: "violet-700", bg: "bg-violet-100" },
};

interface WeatherCardProps {
  temperature: number | null;
  wmoCode: string | null;
}
export function WeatherCard({ temperature, wmoCode }: WeatherCardProps) {
  if (temperature === null || wmoCode === null) return null;

  const weatherInfo = WMO_MAP[wmoCode] || { 
    label: "Cloudy", 
    icon: "Cloud", 
    color: "text-slate-500", 
    bg: "bg-slate-100" 
  };
  
  const LucideIcon = (Icons as any)[weatherInfo.icon] || Icons.HelpCircle;

  return (
    // Use the full class name from the mapping for reliability
    <div className={`w-full h-full relative ${weatherInfo.bg} rounded-xl overflow-hidden`}>
        {/* Decorative glass-style circle for the icon */}
        <div className="absolute -bottom-2 -right-2 p-6 rounded-full bg-white/40 blur-2xl" />
        
        <div className="absolute z-10 top-3 right-10 bg-white rounded-full p-3">
          <LucideIcon className={`h-14 w-14 ${weatherInfo.color} opacity-80`} />
        </div>
        
        <div className="absolute bottom-4 right-4 z-20">
          <p className={`text-2xl font-black tracking-tighter text-right ${weatherInfo.color}`}>
            {Math.round(temperature)}°C
          </p>
          <p className={`text-[10px] font-bold uppercase tracking-widest text-right ${weatherInfo.color}`}>
            {weatherInfo.label}
          </p>
        </div>
    </div>
  );
}