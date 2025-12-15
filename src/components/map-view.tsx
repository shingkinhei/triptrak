'use client';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Pin } from 'lucide-react';

interface MapViewProps {
  locations: { lat: number; lng: number, name: string }[];
}

export function MapView({ locations }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const defaultCenter = locations.length > 0 ? locations[0] : { lat: 35.6895, lng: 139.6917 };

  if (!apiKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card/50 p-8 text-center text-white">
        <h2 className="text-lg font-semibold">Map Unavailable</h2>
        <p className="mt-2 text-sm text-primary-foreground/80">
          The Google Maps API key is missing. Please add it to your
          environment variables to enable the map feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
       <header>
        <h1 className="text-2xl font-bold font-headline text-primary-foreground">
          Trip Map
        </h1>
        <p className="text-primary-foreground/80">Your points of interest.</p>
      </header>
      <div className="flex-grow rounded-xl overflow-hidden border border-white/20">
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
