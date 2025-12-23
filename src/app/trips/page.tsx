
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Edit, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Trip, TripStatus } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BottomNav } from '@/components/bottom-nav';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type EditableTrip = Partial<Pick<Trip, 'name' | 'destination' | 'country_code' | 'start_date' | 'end_date' | 'cover_image_url' | 'cover_image_hint'>>;
type StatusOption = { status: string; description: string | null };
type CountryOption = { country_code: string; name: string };

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [tripForm, setTripForm] = useState<EditableTrip>({});
  const [userName, setUserName] = useState<string | null>(null);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchTrips = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        toast({ title: 'Error fetching trips', description: error.message, variant: 'destructive' });
      } else if (data) {
        const statusOrder: Record<TripStatus, number> = { 'A': 1, 'U': 2, 'P': 3 };
        
        const sortedData = data.sort((a, b) => {
          const statusComparison = statusOrder[a.status as TripStatus] - statusOrder[b.status as TripStatus];
          if (statusComparison !== 0) {
            return statusComparison;
          }
          if (a.status === 'P') {
            return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
          }
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        });

        setTrips(sortedData as Trip[]);
      }
    }
  };

  const fetchStatusOptions = async () => {
    const { data, error } = await supabase.from('trip_status_setup').select('status, description');
    if (error) {
      toast({ title: 'Error fetching statuses', description: error.message, variant: 'destructive'});
    } else {
      setStatusOptions(data as StatusOption[]);
    }
  };

  const fetchCountryOptions = async () => {
    const { data, error } = await supabase.from('countries_setup').select('country_code, name');
    if (error) {
      toast({ title: 'Error fetching countries', description: error.message, variant: 'destructive'});
    } else {
      setCountryOptions(data as CountryOption[]);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName = user.user_metadata.full_name;
        setUserName(fullName ? fullName.split(' ')[0] : 'My');
      }
    };
    fetchUser();
    fetchTrips();
    fetchStatusOptions();
    fetchCountryOptions();
  }, []);

  const [newTrip, setNewTrip] = useState({
    name: '',
    destination: '',
    country_code: '',
    start_date: '',
    end_date: '',
  });

  const handleAddTrip = async () => {
    if (!newTrip.name || !newTrip.destination || !newTrip.country_code || !newTrip.start_date || !newTrip.end_date) {
      toast({ title: 'Missing Information', description: 'Please fill out all fields to create a trip.', variant: 'destructive' });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: 'Not authenticated', description: 'You must be logged in to create a trip.', variant: 'destructive' });
        return;
    }

    const newTripData = {
      user_id: user.id,
      name: newTrip.name,
      destination: newTrip.destination,
      country_code: newTrip.country_code,
      start_date: newTrip.start_date,
      end_date: newTrip.end_date,
      status: 'U' as TripStatus,
      cover_image_url: `https://picsum.photos/seed/${newTrip.destination}/600/400`,
      cover_image_hint: newTrip.destination,
      itinerary: [],
      transactions: [],
      shopping_list: [],
      checklist: [],
    };
    
    const { data, error } = await supabase.from('trips').insert([newTripData]).select().single();

    if (error) {
        toast({ title: 'Error creating trip', description: error.message, variant: 'destructive' });
    } else if (data) {
        fetchTrips();
        setNewTrip({ name: '', destination: '', country_code: '', start_date: '', end_date: '' });
        setIsAddDialogOpen(false);
        toast({ title: 'Trip Created!', description: `"${data.name}" has been added.` });
    }
  };
  
  const handleSetStatus = async (tripId: string, status: TripStatus) => {
    const originalTrips = [...trips];
    const updatedTrips = trips.map(trip => {
      if (trip.trip_uuid === tripId) return { ...trip, status: status as TripStatus };
      if (status === 'A' && trip.status === 'A') return { ...trip, status: 'U' as TripStatus };
      return trip;
    });
    setTrips(updatedTrips);

    // If we're setting a new trip to active, we need to deactivate the old one.
    if (status === 'A') {
        const oldActiveTrip = originalTrips.find(t => t.status === 'A' && t.trip_uuid !== tripId);
        if (oldActiveTrip) {
            const { error: deactivateError } = await supabase.from('trips').update({ status: 'U' }).eq('trip_uuid', oldActiveTrip.trip_uuid);
            if (deactivateError) {
                toast({ title: 'Error updating old active trip', description: deactivateError.message, variant: 'destructive' });
                setTrips(originalTrips);
                return;
            }
        }
    }

    const { error } = await supabase.from('trips').update({ status }).eq('trip_uuid', tripId);
    if (error) {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
      setTrips(originalTrips);
    }
    await fetchTrips();
  };

  const handleEditClick = (trip: Trip) => {
    setEditingTrip(trip);
    setTripForm({
      name: trip.name || '',
      destination: trip.destination || '',
      country_code: trip.country_code || '',
      start_date: trip.start_date || '',
      end_date: trip.end_date || '',
      cover_image_url: trip.cover_image_url || '',
      cover_image_hint: trip.cover_image_hint || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTrip = async () => {
    if (!editingTrip || !tripForm.name || !tripForm.destination || !tripForm.country_code || !tripForm.start_date || !tripForm.end_date) return;

    const { error } = await supabase.from('trips').update(tripForm).eq('trip_uuid', editingTrip.trip_uuid);
    
    if (error) {
        toast({ title: 'Error updating trip', description: error.message, variant: 'destructive' });
    } else {
        fetchTrips();
        setIsEditDialogOpen(false);
        setEditingTrip(null);
        setTripForm({});
        toast({ title: 'Trip Updated!', description: 'Your trip details have been saved.' });
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    const { error } = await supabase.from('trips').delete().eq('trip_uuid', tripId);
    if (error) {
      toast({ title: 'Error deleting trip', description: error.message, variant: 'destructive' });
    } else {
      setTrips(prev => prev.filter(t => t.trip_uuid !== tripId));
      toast({ title: 'Trip Deleted', description: 'The trip has been successfully removed.' });
    }
  };

  const handleFormChange = (field: keyof EditableTrip, value: string) => {
    setTripForm(prev => ({...prev, [field]: value}));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleFormChange('cover_image_url', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const statusMap: Record<TripStatus, { label: string; color: string }> = {
    A: { label: 'Active', color: 'bg-green-500 text-white' },
    U: { label: 'Upcoming', color: 'bg-blue-500 text-white' },
    P: { label: 'Past', color: 'bg-gray-500 text-white' },
  };

  return (
    <main className="flex h-screen flex-col bg-background font-body">
        <header className="mb-4 flex items-center justify-between px-4 pt-4 shrink-0 mt-4">
            <div>
                <h1 className="text-2xl font-bold font-headline text-foreground">
                  {userName ? `${userName}'s Trips` : 'My Trips'}
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
                    <Input id="destination" value={newTrip.destination} onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})} className="col-span-3" placeholder="e.g. Rome, Florence, Venice" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="country" className="text-right">Country</Label>
                        <Select value={newTrip.country_code} onValueChange={(value) => setNewTrip({...newTrip, country_code: value})}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                            <SelectContent>
                                {countryOptions.map(option => (
                                    <SelectItem key={option.country_code} value={option.country_code}>{option.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="start-date" className="text-right">Start Date</Label>
                    <Input id="start-date" type="date" value={newTrip.start_date} onChange={(e) => setNewTrip({...newTrip, start_date: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="end-date" className="text-right">End Date</Label>
                    <Input id="end-date" type="date" value={newTrip.end_date} onChange={(e) => setNewTrip({...newTrip, end_date: e.target.value})} className="col-span-3" />
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
            {trips.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                <p>No trips yet. Plan your first adventure!</p>
              </div>
            )}
            {trips.map(trip => (
                <Card key={trip.trip_uuid} className={cn("overflow-hidden transition-all hover:shadow-lg", {'border-primary border-2': trip.status === 'A'})}>
                    <CardContent className="p-0">
                        <div className="flex">
                            <div className="relative h-32 w-28 shrink-0">
                                <Link href={`/trip/${trip.trip_uuid}`} passHref>
                                    <Image
                                        src={trip.cover_image_url || ''}
                                        alt={trip.name || ''}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={trip.cover_image_hint || ''}
                                    />
                                </Link>
                            </div>
                            <div className="flex flex-col justify-between p-3 flex-grow">
                                <div>
                                  <h2 className="text-lg font-bold font-headline leading-tight">{trip.name}</h2>
                                  <p className="text-sm text-muted-foreground">{trip.destination}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}</p>
                                </div>
                                <div className='flex items-center justify-between gap-2 mt-2'>
                                  <Select value={trip.status} onValueChange={(value) => handleSetStatus(trip.trip_uuid, value as TripStatus)}>
                                      <SelectTrigger className={cn("h-7 text-xs w-auto capitalize focus:ring-0 border-none", statusMap[trip.status]?.color)}>
                                          <SelectValue placeholder="Set status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {statusOptions.map((option) => (
                                            <SelectItem key={option.status} value={option.status}>{option.description || option.status}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                                  <div className="flex items-center">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(trip)}>
                                      <Edit className="h-4 w-4" />
                                      <span className="sr-only">Edit Trip</span>
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Delete Trip</span>
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete your trip "{trip.name}" and all of its data.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-destructive hover:bg-destructive/90"
                                            onClick={() => handleDeleteTrip(trip.trip_uuid)}>
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            </div>
        </ScrollArea>
        <BottomNav activeItem="trips" />
        
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Trip: {editingTrip?.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input id="edit-name" value={tripForm.name || ''} onChange={(e) => handleFormChange('name', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-destination" className="text-right">Destination</Label>
                <Input id="edit-destination" value={tripForm.destination || ''} onChange={(e) => handleFormChange('destination', e.target.value)} className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-country" className="text-right">Country</Label>
                <Select value={tripForm.country_code || ''} onValueChange={(value) => handleFormChange('country_code', value)}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                        {countryOptions.map(option => (
                            <SelectItem key={option.country_code} value={option.country_code}>{option.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-start-date" className="text-right">Start Date</Label>
                <Input id="edit-start-date" type="date" value={tripForm.start_date || ''} onChange={(e) => handleFormChange('start_date', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-end-date" className="text-right">End Date</Label>
                <Input id="edit-end-date" type="date" value={tripForm.end_date || ''} onChange={(e) => handleFormChange('end_date', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-image-hint" className="text-right">Image Hint</Label>
                <Input id="edit-image-hint" value={tripForm.cover_image_hint || ''} onChange={(e) => handleFormChange('cover_image_hint', e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                 <Label className="text-right pt-2">Cover Image</Label>
                 <div className="col-span-3 space-y-2">
                    {tripForm.cover_image_url && (
                        <Image
                            src={tripForm.cover_image_url}
                            alt="Trip cover image preview"
                            width={200}
                            height={150}
                            className="rounded-md object-cover w-full aspect-[4/3]"
                        />
                    )}
                    <Input id="edit-image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <Button asChild variant="outline">
                      <Label htmlFor="edit-image-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </Label>
                    </Button>
                 </div>
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateTrip}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </main>
  );
}

    