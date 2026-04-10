'use client';
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
// Define the mapping locally to avoid extra DB calls for every card
const WMO_MAP: Record<string, { label: string; icon: string; colorClass: string; bgClass: string }> = {
  "0": { 
    label: "Clear sky", 
    icon: "Sun", 
    colorClass: "text-amber-600", 
    bgClass: "bg-gradient-to-br from-amber-50 to-orange-100" 
  },
  "1": { 
    label: "Mainly clear", 
    icon: "CloudSun", 
    colorClass: "text-slate-500", 
    bgClass: "bg-gradient-to-br from-slate-50 to-blue-100" 
  },
  "2": { 
    label: "Partly cloudy", 
    icon: "CloudSun", 
    colorClass: "text-slate-500", 
    bgClass: "bg-gradient-to-br from-slate-50 to-blue-100" 
  },
  "3": { 
    label: "Overcast", 
    icon: "Cloud", 
    colorClass: "text-slate-600", 
    bgClass: "bg-gradient-to-br from-gray-300 to-gray-400" 
  },
  "45": { 
    label: "Foggy", 
    icon: "CloudFog", 
    colorClass: "text-zinc-500", 
    bgClass: "bg-gradient-to-br from-zinc-50 to-slate-200" 
  },
  "48": { 
    label: "Depositing rime fog", 
    icon: "CloudFog", 
    colorClass: "text-zinc-700", 
    bgClass: "bg-gradient-to-br from-zinc-100 to-zinc-300" 
  },
  "51": { 
    label: "Light drizzle", 
    icon: "CloudDrizzle", 
    colorClass: "text-blue-600", 
    bgClass: "bg-gradient-to-br from-blue-50 to-indigo-100" 
  },
  "53": { 
    label: "Moderate drizzle", 
    icon: "CloudDrizzle", 
    colorClass: "text-blue-600", 
    bgClass: "bg-gradient-to-br from-blue-50 to-indigo-100" 
  },
  "55": { 
    label: "Dense drizzle", 
    icon: "CloudDrizzle", 
    colorClass: "text-blue-700", 
    bgClass: "bg-gradient-to-br from-blue-100 to-indigo-200" 
  },
  "61": { 
    label: "Slight rain", 
    icon: "CloudRain", 
    colorClass: "text-blue-600", 
    bgClass: "bg-gradient-to-br from-blue-100 to-indigo-200" 
  },
  "63": { 
    label: "Moderate rain", 
    icon: "CloudRain", 
    colorClass: "text-blue-700", 
    bgClass: "bg-gradient-to-br from-blue-200 to-blue-400" 
  },
  "65": { 
    label: "Heavy rain", 
    icon: "CloudRain", 
    colorClass: "text-blue-800", 
    bgClass: "bg-gradient-to-br from-blue-300 to-blue-500" 
  },
  "71": { 
    label: "Slight snowfall", 
    icon: "CloudSnow", 
    colorClass: "text-sky-400", 
    bgClass: "bg-gradient-to-br from-sky-50 to-blue-100" 
  },
  "73": { 
    label: "Moderate snowfall", 
    icon: "CloudSnow", 
    colorClass: "text-sky-500", 
    bgClass: "bg-gradient-to-br from-sky-100 to-blue-200" 
  },
  "75": { 
    label: "Heavy snowfall", 
    icon: "CloudSnow", 
    colorClass: "text-sky-600", 
    bgClass: "bg-gradient-to-br from-blue-100 to-sky-300" 
  },
  "80": { 
    label: "Slight rain showers", 
    icon: "CloudRain", 
    colorClass: "text-indigo-600", 
    bgClass: "bg-gradient-to-br from-indigo-50 to-blue-200" 
  },
  "81": { 
    label: "Moderate rain showers", 
    icon: "CloudRain", 
    colorClass: "text-indigo-700", 
    bgClass: "bg-gradient-to-br from-indigo-100 to-blue-300" 
  },
  "82": { 
    label: "Violent rain showers", 
    icon: "CloudRain", 
    colorClass: "text-indigo-800", 
    bgClass: "bg-gradient-to-br from-indigo-200 to-blue-400" 
  },
  "95": { 
    label: "Thunderstorm", 
    icon: "CloudLightning", 
    colorClass: "text-violet-600", 
    bgClass: "bg-gradient-to-br from-violet-50 to-slate-300" 
  },
  "96": { 
    label: "Thunderstorm with slight hail", 
    icon: "CloudLightning", 
    colorClass: "text-violet-600", 
    bgClass: "bg-gradient-to-br from-violet-100 to-slate-400" 
  },
  "99": { 
    label: "Thunderstorm with heavy hail", 
    icon: "CloudLightning", 
    colorClass: "text-violet-700", 
    bgClass: "bg-gradient-to-br from-violet-200 to-slate-500" 
  },
};

interface WeatherCardProps {
  temperature: number | null;
  wmoCode: string | '0';
}
export function WeatherCard({ temperature, wmoCode }: WeatherCardProps) {
  const weatherInfo = WMO_MAP[wmoCode] || { 
    label: "Clear sky", 
    icon: "Sun", 
    colorClass: "text-amber-600", 
    bgClass: "bg-gradient-to-br from-amber-50 to-orange-200" 
  };
  
  const LucideIcon = (Icons as any)[weatherInfo.icon] || Icons.HelpCircle;

  return (
    // Use the full class name from the mapping for reliability
    <div className={`w-full h-full relative ${weatherInfo.bgClass} overflow-hidden`}>
        {/* Decorative glass-style circle for the icon */}
        <div className="absolute -bottom-2 -right-2 p-6 rounded-full bg-white/40 blur-2xl" />
        <div className="absolute z-10 top-3 right-10 bg-white rounded-full p-3">
          <LucideIcon className={`h-14 w-14 ${weatherInfo.colorClass} opacity-80`} />
        </div>
        
        {temperature && wmoCode &&(<div className="absolute bottom-4 right-4 z-20">
          <p className={`text-2xl font-black tracking-tighter text-right ${weatherInfo.colorClass}`}>
            {Math.round(temperature)}°C
          </p>
          <p className={`text-[10px] font-bold uppercase tracking-widest text-right ${weatherInfo.colorClass}`}>
            {weatherInfo.label}
          </p>
        </div>)}
    </div>
  );
}