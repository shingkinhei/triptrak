'use client';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Pin, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

interface MapViewProps {
  locations: { lat: number; lng: number, name: string }[];
}

export function MapView({ locations }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const defaultCenter = locations.length > 0 ? locations[0] : { lat: 35.6895, lng: 139.6917 };
  const router = useRouter();

  if (!apiKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card/50 p-8 text-center">
        <h2 className="text-lg font-semibold">Map Unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The Google Maps API key is missing. Please add it to your
          environment variables to enable the map feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
       <header className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" onClick={() => router.push('/trips')}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold font-headline text-white">
            Trip Map
            </h1>
        </div>
      </header>
      <div className="flex-grow rounded-xl overflow-hidden border border-border">
        <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={defaultCenter}
              defaultZoom={6}
              mapId="triptrak_map"
              gestureHandling={'greedy'}
              disableDefaultUI={true}
            >
              {locations.map((loc) => (
                <AdvancedMarker key={loc.name} position={loc}>
                  <div className="transform -translate-y-1/2">
                    <Pin className="h-8 w-8 text-primary fill-primary/30" />
                  </div>
                </AdvancedMarker>
              ))}
            </Map>
        </APIProvider>
      </div>
    </div>
  );
}
