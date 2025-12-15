'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockTrips } from '@/lib/mock-data';
import type { Trip } from '@/lib/types';

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>(mockTrips);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
  });

  const handleAddTrip = () => {
    if (!newTrip.name || !newTrip.destination || !newTrip.startDate || !newTrip.endDate) {
      return;
    }
    const newTripData: Trip = {
      id: `trip-${new Date().getTime()}`,
      name: newTrip.name,
      destination: newTrip.destination,
      startDate: newTrip.startDate,
      endDate: newTrip.endDate,
      imageUrl: `https://picsum.photos/seed/${newTrip.destination}/600/400`,
      imageHint: newTrip.destination,
      itinerary: [],
      transactions: [],
      shoppingList: [],
    };
    setTrips(prev => [newTripData, ...prev]);
    setNewTrip({ name: '', destination: '', startDate: '', endDate: '' });
    setIsAddDialogOpen(false);
  };

  return (
    <main className="bg-muted flex min-h-screen flex-col items-center p-4 font-body">
      <div className="w-full max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">
              My Trips
            </h1>
            <p className="text-muted-foreground">
              All your adventures in one place.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Trip
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Plan a New Trip</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" value={newTrip.name} onChange={(e) => setNewTrip({...newTrip, name: e.target.value})} className="col-span-3" placeholder="e.g. Summer in Italy" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="destination" className="text-right">Destination</Label>
                  <Input id="destination" value={newTrip.destination} onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})} className="col-span-3" placeholder="e.g. Italy" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start-date" className="text-right">Start Date</Label>
                  <Input id="start-date" type="date" value={newTrip.startDate} onChange={(e) => setNewTrip({...newTrip, startDate: e.target.value})} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="end-date" className="text-right">End Date</Label>
                  <Input id="end-date" type="date" value={newTrip.endDate} onChange={(e) => setNewTrip({...newTrip, endDate: e.target.value})} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTrip}>Create Trip</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="space-y-4">
          {trips.map(trip => (
            <Link key={trip.id} href={`/trip/${trip.id}`} passHref>
              <Card className="overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="relative h-40 w-1/3">
                      <Image
                        src={trip.imageUrl}
                        alt={trip.name}
                        fill
                        className="object-cover"
                        data-ai-hint={trip.imageHint}
                      />
                    </div>
                    <div className="flex flex-col justify-center p-6">
                      <h2 className="text-xl font-bold font-headline">{trip.name}</h2>
                      <p className="text-muted-foreground">{trip.destination}</p>
                       <p className="text-sm text-muted-foreground mt-2">{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
