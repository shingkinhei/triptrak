'use client';
import { Sun, Cloud, CloudRain, Thermometer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type WeatherCondition = 'Sunny' | 'Cloudy' | 'Rainy';

interface WeatherData {
  condition: WeatherCondition;
  temperature: number; // in Celsius
}

// Mock weather data for different cities
const mockWeatherData: Record<string, WeatherData> = {
  tokyo: { condition: 'Sunny', temperature: 25 },
  kyoto: { condition: 'Cloudy', temperature: 22 },
  osaka: { condition: 'Rainy', temperature: 20 },
  'new destination': { condition: 'Sunny', temperature: 28 },
};

const weatherIcons: Record<WeatherCondition, React.ElementType> = {
  Sunny: Sun,
  Cloudy: Cloud,
  Rainy: CloudRain,
};

interface WeatherCardProps {
  location: string;
}

export function WeatherCard({ location }: WeatherCardProps) {
  const locationKey = location.toLowerCase().split(' ').pop() || 'tokyo';
  const weather = mockWeatherData[locationKey] || mockWeatherData.tokyo;
  const WeatherIcon = weatherIcons[weather.condition];

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-white/20">
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WeatherIcon className="h-8 w-8 text-yellow-400" />
          <div>
            <p className="font-semibold text-card-foreground">Weather in {location}</p>
            <p className="text-sm text-muted-foreground">{weather.condition}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-card-foreground">{weather.temperature}°C</p>
        </div>
      </CardContent>
    </Card>
  );
}
