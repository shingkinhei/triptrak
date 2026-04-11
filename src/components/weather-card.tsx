'use client';
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTranslations } from "next-intl";
// Define the mapping locally to avoid extra DB calls for every card
const WMO_MAP: Record<string, { label: string; icon: string; colorClass: string; bgClass: string }> = {
  "0": { 
    label: "clearSky", 
    icon: "Sun", 
    colorClass: "text-amber-600", 
    bgClass: "bg-gradient-to-br from-amber-50 to-orange-100" 
  },
  "1": { 
    label: "mainlyClear", 
    icon: "CloudSun", 
    colorClass: "text-slate-500", 
    bgClass: "bg-gradient-to-br from-slate-50 to-blue-100" 
  },
  "2": { 
    label: "partlyCloudy", 
    icon: "CloudSun", 
    colorClass: "text-slate-500", 
    bgClass: "bg-gradient-to-br from-slate-50 to-blue-100" 
  },
  "3": { 
    label: "overcast", 
    icon: "Cloud", 
    colorClass: "text-slate-600", 
    bgClass: "bg-gradient-to-br from-gray-300 to-gray-400" 
  },
  "45": { 
    label: "foggy", 
    icon: "CloudFog", 
    colorClass: "text-zinc-500", 
    bgClass: "bg-gradient-to-br from-zinc-50 to-slate-200" 
  },
  "48": { 
    label: "depositingRimeFog", 
    icon: "CloudFog", 
    colorClass: "text-zinc-700", 
    bgClass: "bg-gradient-to-br from-zinc-100 to-zinc-300" 
  },
  "51": { 
    label: "lightDrizzle", 
    icon: "CloudDrizzle", 
    colorClass: "text-blue-600", 
    bgClass: "bg-gradient-to-br from-blue-50 to-indigo-100" 
  },
  "53": { 
    label: "moderateDrizzle", 
    icon: "CloudDrizzle", 
    colorClass: "text-blue-600", 
    bgClass: "bg-gradient-to-br from-blue-50 to-indigo-100" 
  },
  "55": { 
    label: "denseDrizzle", 
    icon: "CloudDrizzle", 
    colorClass: "text-blue-700", 
    bgClass: "bg-gradient-to-br from-blue-100 to-indigo-200" 
  },
  "61": { 
    label: "slightRain", 
    icon: "CloudRain", 
    colorClass: "text-blue-600", 
    bgClass: "bg-gradient-to-br from-blue-100 to-indigo-200" 
  },
  "63": { 
    label: "moderateRain", 
    icon: "CloudRain", 
    colorClass: "text-blue-700", 
    bgClass: "bg-gradient-to-br from-blue-200 to-blue-400" 
  },
  "65": { 
    label: "heavyRain", 
    icon: "CloudRain", 
    colorClass: "text-blue-800", 
    bgClass: "bg-gradient-to-br from-blue-300 to-blue-500" 
  },
  "71": { 
    label: "slightSnowfall", 
    icon: "CloudSnow", 
    colorClass: "text-sky-400", 
    bgClass: "bg-gradient-to-br from-sky-50 to-blue-100" 
  },
  "73": { 
    label: "moderateSnowfall", 
    icon: "CloudSnow", 
    colorClass: "text-sky-500", 
    bgClass: "bg-gradient-to-br from-sky-100 to-blue-200" 
  },
  "75": { 
    label: "heavySnowfall", 
    icon: "CloudSnow", 
    colorClass: "text-sky-600", 
    bgClass: "bg-gradient-to-br from-blue-100 to-sky-300" 
  },
  "80": { 
    label: "slightRainShowers", 
    icon: "CloudRain", 
    colorClass: "text-indigo-600", 
    bgClass: "bg-gradient-to-br from-indigo-50 to-blue-200" 
  },
  "81": { 
    label: "moderateRainShowers", 
    icon: "CloudRain", 
    colorClass: "text-indigo-700", 
    bgClass: "bg-gradient-to-br from-indigo-100 to-blue-300" 
  },
  "82": { 
    label: "violentRainShowers", 
    icon: "CloudRain", 
    colorClass: "text-indigo-800", 
    bgClass: "bg-gradient-to-br from-indigo-200 to-blue-400" 
  },
  "95": { 
    label: "thunderstorm", 
    icon: "CloudLightning", 
    colorClass: "text-violet-600", 
    bgClass: "bg-gradient-to-br from-violet-50 to-slate-300" 
  },
  "96": { 
    label: "thunderstormWithSlightHail", 
    icon: "CloudLightning", 
    colorClass: "text-violet-600", 
    bgClass: "bg-gradient-to-br from-violet-100 to-slate-400" 
  },
  "99": { 
    label: "thunderstormWithHeavyHail", 
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
  const t = useTranslations('weatherCard');
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
            {t(weatherInfo.label)}
          </p>
        </div>)}
    </div>
  );
}