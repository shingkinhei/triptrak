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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-headline">Weather in {location}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <WeatherIcon className="h-12 w-12 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold">{weather.condition}</p>
              <CardDescription>Feels like a beautiful day</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-muted-foreground" />
            <p className="text-3xl font-bold">{weather.temperature}°C</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
