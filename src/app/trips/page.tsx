'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockTrips } from '@/lib/mock-data';
import type { Trip, TripStatus } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BottomNav } from '@/components/bottom-nav';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
      status: 'upcoming',
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
  
  const handleSetStatus = (tripId: string, status: TripStatus) => {
    setTrips(currentTrips => 
      currentTrips.map(trip => {
        if (trip.id === tripId) {
          return { ...trip, status: status };
        }
        // if we are setting a trip to active, deactivate the previous active one.
        if (status === 'active' && trip.status === 'active') {
          return { ...trip, status: 'upcoming' };
        }
        return trip;
      })
    );
  };

  const statusColors: Record<TripStatus, string> = {
    active: 'bg-green-500 text-white',
    upcoming: 'bg-blue-500 text-white',
    archived: 'bg-gray-500 text-white',
  }

  return (
    <main className="bg-muted flex min-h-screen items-center justify-center p-4 font-body">
       <div className="relative mx-auto h-[800px] w-full max-w-sm max-h-[90vh] rounded-[48px] border-8 border-black bg-background shadow-2xl overflow-hidden flex flex-col">
        <div className="absolute top-0 left-1/2 z-20 h-7 w-1/3 -translate-x-1/2 bg-black rounded-b-2xl">
            <div className="absolute left-6 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-gray-700"></div>
            <div className="absolute left-1/2 top-1/2 h-4 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800"></div>
        </div>

        <div className="flex h-full flex-col pt-7 flex-grow overflow-hidden">
            <header className="mb-4 flex items-center justify-between px-4 pt-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold font-headline text-foreground">
                    My Trips
                    </h1>
                    <p className="text-sm text-muted-foreground">
                    All your adventures in one place.
                    </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                    <Button size="icon" className="h-9 w-9">
                        <PlusCircle className="h-5 w-5" />
                        <span className="sr-only">New Trip</span>
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

            <ScrollArea className="flex-grow">
                <div className="space-y-4 px-4 pb-4">
                {trips.map(trip => (
                    <Card key={trip.id} className={cn("overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg", {'border-primary border-2': trip.status === 'active'})}>
                        <CardContent className="p-0">
                            <div className="flex">
                                <div className="relative h-28 w-28">
                                    <Link href={`/trip/${trip.id}`} passHref>
                                        <Image
                                            src={trip.imageUrl}
                                            alt={trip.name}
                                            fill
                                            className="object-cover"
                                            data-ai-hint={trip.imageHint}
                                        />
                                    </Link>
                                </div>
                                <div className="flex flex-col justify-center p-3 flex-grow">
                                    <h2 className="text-lg font-bold font-headline">{trip.name}</h2>
                                    <p className="text-sm text-muted-foreground">{trip.destination}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</p>
                                    <div className='flex items-center gap-2 mt-2'>
                                      <Select value={trip.status} onValueChange={(value) => handleSetStatus(trip.id, value as TripStatus)}>
                                          <SelectTrigger className={cn("h-7 text-xs w-auto capitalize focus:ring-0 border-none", statusColors[trip.status])}>
                                              <SelectValue placeholder="Set status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="active">Active</SelectItem>
                                              <SelectItem value="upcoming">Upcoming</SelectItem>
                                              <SelectItem value="archived">Archived</SelectItem>
                                          </SelectContent>
                                      </Select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                </div>
            </ScrollArea>
        </div>
        <BottomNav activeItem="trips" />
      </div>
    </main>
  );
}
