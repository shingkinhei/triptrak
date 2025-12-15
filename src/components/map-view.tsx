'use client';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Pin } from 'lucide-react';

const locations = [
  { lat: 35.6895, lng: 139.6917, name: 'Tokyo' },
  { lat: 35.0116, lng: 135.7681, name: 'Kyoto' },
  { lat: 34.6937, lng: 135.5023, name: 'Osaka' },
];

export function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card p-8 text-center">
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
       <header>
        <h1 className="text-2xl font-bold font-headline text-foreground">
          Trip Map
        </h1>
        <p className="text-muted-foreground">Your points of interest.</p>
      </header>
      <div className="flex-grow rounded-xl overflow-hidden border">
        <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={locations[0]}
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
