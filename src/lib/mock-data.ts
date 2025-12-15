import type { Trip } from './types';
import { PlaceHolderImages } from './placeholder-images';

const japanTripId = 'japan-2024';
const italyTripId = 'italy-2025';

export const mockTrips: Trip[] = [
  {
    id: japanTripId,
    name: "Autumn in Japan",
    destination: "Japan",
    country: "JP",
    startDate: "2024-10-26",
    endDate: "2024-11-05",
    status: 'active',
    imageUrl: PlaceHolderImages.find(p=>p.id === 'tokyo')?.imageUrl || '',
    imageHint: PlaceHolderImages.find(p=>p.id === 'tokyo')?.imageHint || '',
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Tokyo',
        date: '2024-10-26',
        image: {
          url: PlaceHolderImages.find((p) => p.id === 'tokyo')?.imageUrl || '',
          hint: PlaceHolderImages.find((p) => p.id === 'tokyo')?.imageHint || '',
        },
        activities: [
          {
            id: 'act1',
            time: '14:00',
            description: 'Land at Narita Airport (NRT)',
            icon: 'Plane',
          },
          { id: 'act2', time: '16:00', description: 'Train to Shinjuku', icon: 'Train' },
          {
            id: 'act3',
            time: '17:00',
            description: 'Check-in at Park Hyatt Tokyo',
            icon: 'BedDouble',
          },
          {
            id: 'act4',
            time: '19:00',
            description: 'Dinner at Ichiran Ramen',
            icon: 'UtensilsCrossed',
          },
        ],
      },
      {
        day: 2,
        title: 'Exploring Kyoto',
        date: '2024-10-27',
        image: {
          url: PlaceHolderImages.find((p) => p.id === 'kyoto')?.imageUrl || '',
          hint: PlaceHolderImages.find((p) => p.id === 'kyoto')?.imageHint || '',
        },
        activities: [
          {
            id: 'act5',
            time: '09:00',
            description: 'Visit Fushimi Inari Shrine',
            icon: 'Camera',
          },
          { id: 'act6', time: '12:00', description: 'Lunch near Gion', icon: 'UtensilsCrossed' },
          {
            id: 'act7',
            time: '14:00',
            description: 'Walk through Arashiyama Bamboo Grove',
            icon: 'Camera',
          },
          {
            id: 'act8',
            time: '18:00',
            description: 'Traditional Kaiseki Dinner',
            icon: 'UtensilsCrossed',
          },
        ],
      },
      {
        day: 3,
        title: 'Day trip to Osaka',
        date: '2024-10-28',
        image: {
          url: PlaceHolderImages.find((p) => p.id === 'osaka')?.imageUrl || '',
          hint: PlaceHolderImages.find((p) => p.id === 'osaka')?.imageHint || '',
        },
        activities: [
          {
            id: 'act9',
            time: '10:00',
            description: 'Explore Osaka Castle',
            icon: 'Camera',
          },
          { id: 'act10', time: '13:00', description: 'Street food at Dotonbori', icon: 'UtensilsCrossed' },
          {
            id: 'act11',
            time: '17:00',
            description: 'Return to Kyoto',
            icon: 'Train',
          },
        ],
      },
    ],
    transactions: [
        { id: '1', name: 'Ichiran Ramen', category: 'Food', amount: 15, date: '2024-10-26' },
        { id: '2', name: 'Train to Shinjuku', category: 'Transport', amount: 25, date: '2024-10-26' },
        { id: '3', name: 'Park Hyatt Tokyo', category: 'Accommodation', amount: 450, date: '2024-10-26' },
        { id: '4', name: 'Fushimi Inari Souvenir', category: 'Shopping', amount: 45, date: '2024-10-27' },
        { id: '5', name: 'Kaiseki Dinner', category: 'Food', amount: 120, date: '2024-10-27' },
        { id: '6', name: 'Dotonbori Takoyaki', category: 'Food', amount: 10, date: '2024-10-28' },
    ],
    shoppingList: [
      {
        id: 'essentials',
        name: 'Essentials',
        icon: 'Luggage',
        items: [
          { id: '1', name: 'Passport', checked: true, imageUrl: PlaceHolderImages.find(p=>p.id === 'tokyo')?.imageUrl, price: 0 },
          { id: '2', name: 'Flight tickets', checked: true, imageUrl: PlaceHolderImages.find(p=>p.id === 'kyoto')?.imageUrl, price: 850 },
          { id: '3', name: 'Hotel confirmation', checked: false, imageUrl: PlaceHolderImages.find(p=>p.id === 'osaka')?.imageUrl, price: 1200 },
        ],
      },
      {
        id: 'clothing',
        name: 'Clothing',
        icon: 'Shirt',
        items: [
          { id: '4', name: 'T-shirts (x5)', checked: false, imageUrl: 'https://picsum.photos/seed/tshirt/100/100', price: 100 },
          { id: '5', name: 'Jeans (x2)', checked: false, imageUrl: 'https://picsum.photos/seed/jeans/100/100', price: 150 },
          { id: '6', name: 'Jacket', checked: true, imageUrl: 'https://picsum.photos/seed/jacket/100/100', price: 120 },
        ],
      },
    ]
  },
  {
    id: italyTripId,
    name: "Renaissance Wonders",
    destination: "Italy",
    country: "IT",
    startDate: "2025-06-10",
    endDate: "2025-06-20",
    status: 'upcoming',
    imageUrl: "https://picsum.photos/seed/italy/600/400",
    imageHint: "colosseum rome",
    itinerary: [],
    transactions: [],
    shoppingList: []
  }
];
