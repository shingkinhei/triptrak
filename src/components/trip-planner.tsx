'use client';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { ItineraryItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  BedDouble,
  Camera,
  ChevronDown,
  Plane,
  Train,
  UtensilsCrossed,
} from 'lucide-react';

const itineraryData: ItineraryItem[] = [
  {
    day: 1,
    title: 'Arrival in Tokyo',
    date: '2024-10-26',
    image: {
        url: PlaceHolderImages.find(p => p.id === 'tokyo')?.imageUrl || '',
        hint: PlaceHolderImages.find(p => p.id === 'tokyo')?.imageHint || ''
    },
    activities: [
      {
        time: '14:00',
        description: 'Land at Narita Airport (NRT)',
        icon: Plane,
      },
      { time: '16:00', description: 'Train to Shinjuku', icon: Train },
      {
        time: '17:00',
        description: 'Check-in at Park Hyatt Tokyo',
        icon: BedDouble,
      },
      {
        time: '19:00',
        description: 'Dinner at Ichiran Ramen',
        icon: UtensilsCrossed,
      },
    ],
  },
  {
    day: 2,
    title: 'Exploring Kyoto',
    date: '2024-10-27',
    image: {
        url: PlaceHolderImages.find(p => p.id === 'kyoto')?.imageUrl || '',
        hint: PlaceHolderImages.find(p => p.id === 'kyoto')?.imageHint || ''
    },
    activities: [
      {
        time: '09:00',
        description: 'Visit Fushimi Inari Shrine',
        icon: Camera,
      },
      { time: '12:00', description: 'Lunch near Gion', icon: UtensilsCrossed },
      {
        time: '14:00',
        description: 'Walk through Arashiyama Bamboo Grove',
        icon: Camera,
      },
      {
        time: '18:00',
        description: 'Traditional Kaiseki Dinner',
        icon: UtensilsCrossed,
      },
    ],
  },
  {
    day: 3,
    title: 'Day trip to Osaka',
    date: '2024-10-28',
    image: {
        url: PlaceHolderImages.find(p => p.id === 'osaka')?.imageUrl || '',
        hint: PlaceHolderImages.find(p => p.id === 'osaka')?.imageHint || ''
    },
    activities: [
      {
        time: '10:00',
        description: 'Explore Osaka Castle',
        icon: Camera,
      },
      { time: '13:00', description: 'Street food at Dotonbori', icon: UtensilsCrossed },
      {
        time: '17:00',
        description: 'Return to Kyoto',
        icon: Train,
      },
    ],
  },
];

export function TripPlanner() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold font-headline text-foreground">
          Trip Itinerary
        </h1>
        <p className="text-muted-foreground">Your adventure at a glance.</p>
      </header>

      <Accordion type="single" collapsible defaultValue="item-0" className="w-full space-y-4">
        {itineraryData.map((item, index) => (
          <Card key={item.day} className="overflow-hidden">
              <AccordionItem value={`item-${index}`} className="border-b-0">
                  <AccordionTrigger className="p-0 hover:no-underline">
                      <div className="relative w-full h-32">
                        <Image
                            src={item.image.url}
                            alt={item.title}
                            fill
                            className="object-cover"
                            data-ai-hint={item.image.hint}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                           <div className="text-primary-foreground">
                             <h2 className="font-bold text-lg font-headline">
                                Day {item.day}: {item.title}
                             </h2>
                             <p className="text-sm">{item.date}</p>
                           </div>
                        </div>
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4">
                      <ul className="space-y-4">
                      {item.activities.map((activity, actIndex) => (
                          <li key={actIndex} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                              <activity.icon className="h-4 w-4" />
                              </div>
                              {actIndex < item.activities.length - 1 && (
                                <div className="w-px h-6 bg-border mt-1"></div>
                              )}
                          </div>
                          <div>
                              <p className="font-semibold">{activity.time}</p>
                              <p className="text-muted-foreground">
                              {activity.description}
                              </p>
                          </div>
                          </li>
                      ))}
                      </ul>
                  </AccordionContent>
              </AccordionItem>
          </Card>
        ))}
      </Accordion>
    </div>
  );
}
