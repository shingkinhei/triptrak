
'use client';
import { useState, useEffect, useRef } from 'react';
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
import Compressor from 'compressorjs';
import { v4 as uuidv4 } from "uuid";
import { useCurrency } from "@/context/CurrencyContext";
// import useLongPress from '@/hooks/use-long-press';
// import { on } from 'events';

type EditableTrip = Partial<
  Pick<
    Trip,
    | "name"
    | "destination"
    | "country_code"
    | "start_date"
    | "end_date"
    | "cover_image_url"
    | "cover_image_hint"
  >
> & {
  cover_image_file?: File | null;
  cover_image_preview?: string | null;
};
type StatusOption = { status: string; description: string | null };
type CountryOption = { country_code: string; name: string };

type NewTripState = {
  name: string;
  destination: string;
  country_code: string;
  currency_code: string;
  start_date: string;
  end_date: string;
  cover_image_file: File | null;
  cover_image_preview: string | null;
};


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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const { getCurrencyByCountryCode, tripCurrency } = useCurrency();
  // const { action, handlers } = useLongPress(
  //   handleOnClick
  // );
  // const { action: otherAction, handlers: otherHandlers } = useLongPress();

  function handleOnClick() {
    console.log('handleOnClick long press triggered');
  }
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
        const statusOrder: Record<TripStatus, number> = { 'A': 1, 'U': 2, 'E': 3 };
        
        const sortedData = data.sort((a, b) => {
          const statusComparison = statusOrder[a.status as TripStatus] - statusOrder[b.status as TripStatus];
          if (statusComparison !== 0) {
            return statusComparison;
          }
          if (a.status === 'E') {
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

  const [newTrip, setNewTrip] = useState<NewTripState>({
    name: '',
    destination: '',
    country_code: '',
    currency_code: '',
    start_date: '',
    end_date: '',
    cover_image_file: null,
    cover_image_preview: null,
  });

  const handleNewTripImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      new Compressor(file, {
        quality: 0.6,
        success: (compressedResult) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setNewTrip(prev => ({...prev, cover_image_file: compressedResult as File, cover_image_preview: reader.result as string }));
          };
          reader.readAsDataURL(compressedResult);
        },
        error: (err) => {
          toast({ title: 'Image compression failed', description: err.message, variant: 'destructive' });
          // Fallback to original file if compression fails
          const reader = new FileReader();
          reader.onloadend = () => {
            setNewTrip(prev => ({...prev, cover_image_file: file, cover_image_preview: reader.result as string }));
          };
          reader.readAsDataURL(file);
        },
      });
    }
  };

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

    let coverImageUrl = `https://picsum.photos/seed/${newTrip.destination}/600/400`;
    let coverImageHint = newTrip.destination;

    if (newTrip.cover_image_file) {
      const file = newTrip.cover_image_file;
      const fileExt = (file.name.split(".").pop() || "jpg").replace(
        /[^a-z0-9]/gi,
        ""
      );
      const filePath = `${user.id}/${newTrip.start_date}-${newTrip.country_code}-${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('trip_cover').upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast({ title: 'Error uploading image', description: uploadError.message, variant: 'destructive' });
        return;
      }

      const { data: urlData } = supabase.storage.from('trip_cover').getPublicUrl(filePath);
      coverImageUrl = urlData.publicUrl;
    }

    const newTripData = {
      user_id: user.id,
      name: newTrip.name,
      destination: newTrip.destination,
      country_code: newTrip.country_code,
      currency_code: getCurrencyByCountryCode(newTrip.country_code),
      start_date: newTrip.start_date,
      end_date: newTrip.end_date,
      status: 'U' as TripStatus,
      cover_image_url: coverImageUrl,
      cover_image_hint: coverImageHint,
    };
    
    const { data, error } = await supabase.from('trips').insert([newTripData]).select().single();

    if (error) {
        toast({ title: 'Error creating trip', description: error.message, variant: 'destructive' });
    } else if (data) {
        fetchTrips();
        setNewTrip({ name: '', destination: '', country_code: '', currency_code: '',start_date: '', end_date: '', cover_image_file: null, cover_image_preview: null });
        setIsAddDialogOpen(false);
        toast({ title: 'Trip Created!', description: `"${data.name}" has been added.` });
    }
  };
  
  const handleSetStatus = async (tripId: string, status: TripStatus) => {
    const originalTrips = [...trips];
    const updatedTrips = trips.map(trip => {
      if (trip.trip_uuid === tripId) return { ...trip, status: status };
      if (status === 'A' && trip.status === 'A') return { ...trip, status: 'U' as TripStatus };
      return trip;
    });
    setTrips(updatedTrips);

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
      cover_image_preview: trip.cover_image_url || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTrip = async () => {
    if (!editingTrip || !tripForm.name || !tripForm.destination || !tripForm.country_code || !tripForm.start_date || !tripForm.end_date) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: 'Not authenticated', description: 'You must be logged in to create a trip.', variant: 'destructive' });
        return;
    }

    let updatedTripData: Partial<Trip> = {
      name: tripForm.name,
      destination: tripForm.destination,
      country_code: tripForm.country_code,
      start_date: tripForm.start_date,
      end_date: tripForm.end_date,
      cover_image_hint: tripForm.cover_image_hint,
      cover_image_url: tripForm.cover_image_url,
    };
    const oldImageUrl = editingTrip.cover_image_url;

    if (tripForm.cover_image_file) {
      const file = tripForm.cover_image_file;
      const fileExt = (file.name.split(".").pop() || "jpg").replace(
        /[^a-z0-9]/gi,
        ""
      );
      const filePath = `${user.id}/${tripForm.start_date}-${tripForm.country_code}-${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('trip_cover').upload(filePath, file, {upsert: true});

      if (uploadError) {
        toast({ title: 'Error uploading image', description: uploadError.message, variant: 'destructive' });
        return;
      }

      const { data: urlData } = supabase.storage.from('trip_cover').getPublicUrl(filePath);
      updatedTripData.cover_image_url = urlData.publicUrl;
    }
    
    if (tripForm.cover_image_file && oldImageUrl) {
      const oldImageKey = oldImageUrl.split('/trip_cover/').pop();
      if (oldImageKey) {
          const { error: deleteError } = await supabase.storage.from('trip_cover').remove([oldImageKey]);
          if (deleteError) {
              toast({ title: 'Could not delete old image', description: deleteError.message, variant: 'destructive' });
          }
      }
    }

    const { error: updateDbError } = await supabase.from('trips').update(updatedTripData).eq('trip_uuid', editingTrip.trip_uuid);
    
    if (updateDbError) {
        toast({ title: 'Error updating trip', description: updateDbError.message, variant: 'destructive' });
    } else {
        
        fetchTrips();
        setIsEditDialogOpen(false);
        setEditingTrip(null);
        setTripForm({});
        toast({ title: 'Trip Updated!', description: 'Your trip details have been saved.' });
    }
  };

  const handleDeleteTrip = async (trip: EditableTrip) => {
    if (!trip.start_date || !trip.country_code) return;

    //prende trip uuid based on unique fields    
    const { data } = await supabase.from('trips').select('trip_uuid').eq('start_date', trip.start_date).eq('country_code', trip.country_code).single();

    if (!data) {
      toast({ title: 'Error', description: 'Trip not found.', variant: 'destructive' });
    } else {
      //delete records

      const { data:dayUuidData , error: dayUuidErr } = await supabase.from("trip_days").select('day_uuid').eq("trip_uuid", data.trip_uuid);
      if (dayUuidErr) {
        toast({ title: "Error fetching trip days", description: dayUuidErr.message, variant: "destructive" });
      }else{
        for (const day of dayUuidData) { 
          const { error: activityDelErr } = await supabase.from("activities").delete().eq("day_uuid", day.day_uuid);
          if (activityDelErr) {
            toast({ title: "Error deleting activities", description: activityDelErr.message, variant: "destructive" });
            return;
          }
        }
      }

      const { error: dayDelErr } = await supabase.from("trip_days").delete().eq("trip_uuid", data.trip_uuid);
      if (dayDelErr) {
        toast({ title: "Error deleting day", description: dayDelErr.message, variant: "destructive" });
        return;
      }

      const { error: shoppingDelErr } = await supabase.from("shopping_items").delete().eq("trip_uuid", data.trip_uuid);
      if (shoppingDelErr) {
        toast({ title: "Error deleting shopping items", description: shoppingDelErr.message, variant: "destructive" });
        return;
      }

      const { error: expenseDelErr } = await supabase.from("expenses").delete().eq("trip_uuid", data.trip_uuid);
      if (expenseDelErr) {
        toast({ title: "Error deleting expenses", description: expenseDelErr.message, variant: "destructive" });
        return;
      }
      
      const { error: deleteRecordsError } = await supabase.from('trip_days').delete().eq('trip_uuid', data.trip_uuid);
      if (deleteRecordsError) {
        toast({ title: 'Error deleting records', description: deleteRecordsError.message, variant: 'destructive' });
      }

      const { error } = await supabase.from('trips').delete().eq('start_date', trip.start_date).eq('country_code', trip.country_code);
      if (error) {
        toast({ title: 'Error deleting trip', description: error.message, variant: 'destructive' });
      } else {
        if (trip.cover_image_url) {
          const imageKey = trip.cover_image_url.split('/trip_cover/').pop();
          if (imageKey) {
            const { error: deleteImageError } = await supabase.storage.from('trip_cover').remove([imageKey]);
            if (deleteImageError) {
              toast({ title: 'Trip deleted, but failed to remove image.', description: deleteImageError.message, variant: 'destructive' });
            }
          }
        }
        setTrips(prev => prev.filter(t =>  t.country_code !== trip.country_code && t.start_date !== trip.start_date));
        toast({ title: 'Trip Deleted', description: 'The trip has been successfully removed.' });
      }
    }
      
  };

  const handleFormChange = (field: keyof EditableTrip, value: string) => {
    setTripForm(prev => ({...prev, [field]: value}));
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (file) {
      new Compressor(file, {
        maxWidth: 1200,
        success: (compressedResult) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setTripForm(prev => ({ ...prev, cover_image_file: compressedResult as File, cover_image_preview: reader.result as string }));
          };
          reader.readAsDataURL(compressedResult);
        },
        error: (err) => {
          toast({ title: 'Image compression failed', description: err.message, variant: 'destructive' });
          // Fallback to original file
          const reader = new FileReader();
          reader.onloadend = () => {
            setTripForm(prev => ({ ...prev, cover_image_file: file, cover_image_preview: reader.result as string }));
          };
          reader.readAsDataURL(file);
        },
      });
    }
  };

  const statusMap: Record<TripStatus, { label: string; color: string }> = {
    A: { label: 'Active', color: 'bg-green-500 text-white' },
    U: { label: 'Upcoming', color: 'bg-blue-500 text-white' },
    E: { label: 'Expired', color: 'bg-gray-500 text-white' },
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
                          {/* <Button {...handlers}>
            Click or Press Me
          </Button> */}
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
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right pt-2">Cover Image</Label>
                      <div className="col-span-3 space-y-2">
                        {newTrip.cover_image_preview && (
                          <Image src={newTrip.cover_image_preview} alt="preview" width={200} height={150} className="rounded-md object-cover w-full aspect-[4/3]"/>
                        )}
                        <Input id="cover-image-upload" type="file" accept="image/*" ref={fileInputRef} onChange={handleNewTripImageChange} className="hidden" />
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="mr-2 h-4 w-4" /> Upload
                        </Button>
                      </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAddTrip}>Create Trip</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </header>

        <ScrollArea className="flex-grow">
            <div className="flex flex-col lg:flex-row px-4 pb-4 gap-4">
            {trips.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                <p>No trips yet. Planyour first adventure!</p>
              </div>
            )}
            {trips.map(trip => (
                <Card key={trip.trip_uuid} className={cn("overflow-hidden w-full transition-all hover:shadow-lg relative", {'border-primary border-2': trip.status === 'A'})}>
                    <CardContent className="p-0">
                        <div className="flex flex-col">
                            <div className="relative h-56 w-full shrink-0 object-fill">
                                <Image
                                    src={trip.cover_image_url || ''}
                                    alt={trip.name || ''}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={trip.cover_image_hint || ''}
                                />
                            </div>
                            <div className="absolute bottom-0 w-full flex flex-col justify-between p-3 flex-grow bg-gradient-to-t from-background to-transparent backdrop-blur-sm">
                                <div>
                                  <h2 className="text-lg font-bold font-headline leading-tight">{trip.name}</h2>
                                  <p className="text-sm text-muted-foreground">{trip.destination}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}</p>
                                </div>
                                <div className='flex items-center justify-between gap-2 mt-2 z-10'>
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
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); handleEditClick(trip); }}>
                                      <Edit className="h-4 w-4" />
                                      <span className="sr-only">Edit Trip</span>
                                    </Button>
                                  </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                     <Link href={`/trip/${trip.trip_uuid}`} className="absolute inset-0 z-0" aria-label={`View trip: ${trip.name}`}></Link>
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
                    {tripForm.cover_image_preview && (
                        <Image
                            src={tripForm.cover_image_preview}
                            alt="Trip cover image preview"
                            width={200}
                            height={150}
                            className="rounded-md object-cover w-full aspect-[4/3]"
                        />
                    )}
                    <Input id="edit-image-upload" type="file" accept="image/*" ref={editFileInputRef} onChange={handleEditImageChange} className="hidden" />
                     <Button variant="outline" onClick={() => editFileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                    </Button>
                 </div>
              </div>
            </div>
            <DialogFooter>
                              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => e.preventDefault()}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete Trip</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your trip "{tripForm.name}" and all of its data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => handleDeleteTrip(tripForm)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateTrip}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

    </main>
  );
}

    

    