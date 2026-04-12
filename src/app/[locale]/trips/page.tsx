
'use client';
import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  PlusCircle,
  Edit, 
  Upload, 
  Trash2, 
  Brain,
  BedDouble,
  Camera,
  Plane,
  Train, 
  UtensilsCrossed,
  X,
  type LucideIcon,
  Ticket,
  Mountain,
  Building,
  } from 'lucide-react';
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
import { getAiTrip } from "@/api/generateTrip";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useTranslations } from 'next-intl';
import { set } from 'lodash';
import { root } from 'postcss';
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

type ActivityOptions = {
  activity_type: string;
  icon_text: string;
  color_code: string;
  description: string;
  ai_preference: boolean;
};
export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
  const [ isAiTripLoading, setIsAiTripLoading ] = useState(false);
  const [ isAiTripDialogOpen, setIsAiTripDialogOpen ] = useState(false);
  const [ localAiRate, setLocalAiRate] = useState(0);
  const [ localAiRateLimit, setLocalAiRateLimit ] = useState(10);
  const [ aiPreferencesOptions, setAiPreferencesOptions ] = useState<ActivityOptions[]>([]);
  const [ aiPreferences, setAiPreferences ] = useState({
    preferences: null,
    suggestions: null,
  });

  const t = useTranslations('tripsPage');
  const ct = useTranslations('common');
  // const { action, handlers } = useLongPress(
  //   handleOnClick
  // );
  // const { action: otherAction, handlers: otherHandlers } = useLongPress();
  const iconMap: Record<string, LucideIcon> = {
    Plane,
    Train,
    BedDouble,
    UtensilsCrossed,
    Camera,
    Ticket,
    Mountain,
    Building,
  };

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

  const fetchAiActivityOptions = async () => {
    const { data, error } = await supabase
      .from("activities_option_setup")
      .select("activity_type, icon_text, color_code, description, ai_preference")
      .eq("ai_preference", true);
    if (error) {
      toast({
        title: "Error fetching statuses",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAiPreferencesOptions(data as ActivityOptions[]);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: usersInfoData, error: usersInfoError } = await supabase
          .from('users_info')
          .select('display_name').eq('user_id', user.id).single();
         const displayName = usersInfoData?.display_name || user.user_metadata.full_name;
         setUserName(displayName ? displayName : 'My');
      }
    };
    fetchUser();
    fetchTrips();
    fetchStatusOptions();
    fetchCountryOptions();
    fetchAiActivityOptions();
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
        maxWidth: 1200,
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

  const validateTripForm = (): { valid: boolean; message?: string } => {
    if (!newTrip.destination || !newTrip.country_code || !newTrip.start_date || !newTrip.end_date) {
      return { valid: false, message: 'Please fill out all fields to create a trip.' };
    }
    if (new Date(newTrip.start_date) > new Date(newTrip.end_date)) {
      return { valid: false, message: 'Start date must be before end date.' };
    }
    if (new Date(newTrip.start_date) < new Date()) {
      return { valid: false, message: 'Start date must be in the future.' };
    }
    return { valid: true };
  };


  const handleCreateTrip = async (user) => {
    let coverImageUrl = ``;
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
      name: newTrip.destination + ' in ' + newTrip.start_date.split('-')[0],
      destination: newTrip.destination,
      country_code: newTrip.country_code,
      currency_code: getCurrencyByCountryCode(newTrip.country_code),
      start_date: newTrip.start_date,
      end_date: newTrip.end_date,
      status: 'U' as TripStatus,
      cover_image_url: coverImageUrl || null,
    };
    
    const { data, error } = await supabase.from('trips').insert([newTripData]).select().single();

    return { data, error };
  }
  const handleAddTrip = async () => {
    const { valid, message } = validateTripForm();
    if (!valid) {
      toast({ title: 'Invalid Information', description: message, variant: 'destructive' });
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: 'Not authenticated', description: 'You must be logged in to create a trip.', variant: 'destructive' });
        return;
    }

    const { data, error } = await handleCreateTrip(user);

    if (error) {
        toast({ title: 'Error creating trip', description: error.message, variant: 'destructive' });
    } else if (data) {
        fetchTrips();
        setNewTrip({ name: '', destination: '', country_code: '', currency_code: '',start_date: '', end_date: '', cover_image_file: null, cover_image_preview: null });
        setIsAddDialogOpen(false);
        toast({ title: 'Trip Created!', description: `"${data.name}" has been added.` });
        router.push(`/trip/${data.trip_uuid}`);
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
      cover_image_url: tripForm.cover_image_url || null,
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
        fetchTrips();
        setIsDeleteDialogOpen(false);
        setEditingTrip(null);
        setIsEditDialogOpen(false);
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
    A: { label: 'Active', color: 'bg-green-500/50 text-white' },
    U: { label: 'Upcoming', color: 'bg-blue-500/50 text-white' },
    E: { label: 'Expired', color: 'bg-gray-500/50 text-white' },
  };

  //AI Trip Planning
  const handleCancelAiTrip = () => {
    setIsAiTripDialogOpen(false);
    setAiPreferences({
      preferences: null,
      suggestions: null,
    });
  }
  const handleOpenAiTrip = async () => {
    const { valid, message } = validateTripForm();
    if (!valid) {
      toast({ title: 'Invalid Information', description: message, variant: 'destructive' });
      return;
    }

    // Refresh AI rate from database
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from("users_info")
        .select("ai_rate_count, ai_rate_limit")
        .eq("user_id", user.id)
        .single();

      if (error) {
        toast({
          title: "Error refreshing AI rate",
          description: error.message,
          variant: "destructive",
        });
      } else if (data) {
        setLocalAiRate(data.ai_rate_count || 0);
        setLocalAiRateLimit(data.ai_rate_limit || 0);
      }
    }
    setIsAiTripDialogOpen(true);
  };

  const handleAiTripChange = (field: "preferences" | "suggestions", value: string | null) => {
    setAiPreferences(prev => ({ ...prev, [field]: value }));
  }

  const handleApplyAiTrip = async () => {
    setIsAiTripDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsAiTripLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not found");
      }
      // Make Sure latest AI rate is checked before applying plan
      const { data: usersInfoData, error: usersInfoError } = await supabase
        .from('users_info')
        .select('ai_rate_count, ai_rate_limit')
        .eq('user_id', user.id).single();
      const aiRateCheck = usersInfoData?.ai_rate_count || localAiRate;
      const aiRateLimitCheck = usersInfoData?.ai_rate_limit || localAiRateLimit;
      if (aiRateCheck >= aiRateLimitCheck) {
        throw new Error('AI Rate Limit Reached');
      }

      // Validate preferences input
      if (!aiPreferences.preferences) {
        throw new Error('Please provide your preferences.');
      }

      // set loading state and toast
      const loadingToastId = toast({
        title: "Generating AI plan...",
        description: "Please wait while we generate your itinerary suggestions.",
      });
      
      let aiResult;

      const { data: aiResponse, error: aiError } = await getAiTrip(
      newTrip.start_date,
      newTrip.end_date,
      countryOptions.find(country => country.country_code === newTrip.country_code)?.name || newTrip.country_code,
      newTrip.destination,
      aiPreferences.preferences || '',
      aiPreferences.suggestions || ''
      );
    
      if (aiError || !aiResponse) {
        throw new Error(aiError || 'Error generating AI plan');
      }

      aiResult = [...aiResponse];
      
      // Insert Trip (Trigger creates trip_days automatically)
      const { data: newTripData, error: newTripError } = await handleCreateTrip(user);

      if (newTripError || !newTripData) {
        throw new Error(newTripError?.message || 'Error creating trip');
      } 

      // Fetch the newly created trip's day ID to link with activities
      const tripId = newTripData.trip_uuid;
      const { data: days, error: daysErr } = await supabase
      .from('trip_days')
      .select('day_uuid, date')
      .eq('trip_uuid', tripId);

      if (daysErr || !days) {
        throw new Error(daysErr?.message || 'Error fetching trip days');
      };      
      const activitiesToInsert = await aiResult.map(activity => {
      // Find the day_uuid where the date matches the activity date
        const targetDay = days.find(d => d.date === activity.day);

        return {
              day_uuid: targetDay?.day_uuid,
              time: activity.time, // Ensure format is 'HH:MM:SS'
              description: activity.description || '',
              user_id: user.id,
              address: activity.address || '',
              name: activity.name || 'Untitled Activity',
              activity_type: activity.activity_type, // Must exist in activities_option_setup
              ai_plan: true,
            };
      }).filter(act => act.day_uuid); // Ensure we don't insert orphans

      const { error: actErr } = await supabase
        .from('activities')
        .insert(activitiesToInsert);

        if (actErr) {
          toast({
            title: "Error inserting AI activities",
            description: actErr.message,
            variant: "destructive",
          });
        }

      toast({
        title: "AI Trip Generated!",
        description: "Your AI-generated itinerary has been created. You can view and customize it in your trips.",
      });

      // Ai rate count update
      const { error: rateErr } = await supabase
        .from('users_info')
        .update({ ai_rate_count: aiRateCheck + 1 })
        .eq('user_id', user.id);

      if (rateErr) {
        toast({
          title: "Error updating AI rate",
          description: rateErr.message,
          variant: "destructive",
        });
      } else {
        setLocalAiRate(prev => prev + 1);
      };

    } catch (error) {
      toast({
        title: "Error generating AI trip",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAiTripLoading(false);
      setIsAiTripDialogOpen(false);
      setAiPreferences({
        preferences: null,
        suggestions: null,
      });
      fetchTrips();
      setNewTrip({ name: '', destination: '', country_code: '', currency_code: '',start_date: '', end_date: '', cover_image_file: null, cover_image_preview: null });
      setIsAddDialogOpen(false);
      // Navigate to the trip after successful creation
      // Get the latest trip to navigate to it
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: latestTrip } = await supabase
          .from('trips')
          .select('trip_uuid')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (latestTrip) {
          router.push(`/trip/${latestTrip.trip_uuid}`);
        }
      }
    }
  };

  return (
    <main className="flex h-screen mx-0 lg:mx-24 flex-col bg-background font-body">
        <header className="mb-4 flex items-center justify-between px-4 pt-4 shrink-0 mt-4">
            <div>
                <h1 className="text-2xl font-bold font-headline text-foreground">
                  {userName ? t("titleWithName", { userName: userName }) : t("title")}
                </h1>
                          {/* <Button {...handlers}>
            Click or Press Me
          </Button> */}
            </div>
            <Button size="icon" className="h-9 w-9" onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">{t("createTrip")}</span>
            </Button>
        </header>

        <ScrollArea className="flex-grow">
            <div className="flex flex-col lg:flex-row px-4 pb-4 gap-4">
            {trips.length === 0 && (
              <div className="py-10 flex items-center justify-center flex-col gap-4 w-[100%] h-[100vh]">
                <p className='text-center text-muted-foreground'>
                  {t("noTrips")}
                </p>
                {/* <div className=""><Button onClick={() => setIsOpen(true)}>Plan a New Trip</Button></div> */}
              </div>
            ) ||
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8 overflow-y-scroll w-full pb-16">
            {trips.map(trip => (
<Card 
  key={trip.trip_uuid} 
  className={cn(
    "overflow-hidden w-full h-[20rem] lg:h-[30rem] bg-white transition-all relative group border-none", 
    {'border-primary border-2': trip.status === 'A'}
  )}
>
  <CardContent className="p-0 h-full w-full relative">
    
    {/* 1. THE MAIN LINK (Entire Surface) */}
    <Link 
      href={`/trip/${trip.trip_uuid}`} 
      className="absolute inset-0 z-0 block overflow-hidden" 
    >
      {/* BACKGROUND: The Clear Image (Top is visible) */}
      <Image
        src={trip.cover_image_url || '/images/trip_cover_sample.jpg'}
        alt={trip.name}
        fill
        className="object-cover z-0"
      />

      {/* BLUR LAYER: Only at the bottom */}
      <div className="absolute inset-0 z-10 flex items-end overflow-hidden pointer-events-none">
        {/* This container defines the height of the blur zone (e.g., bottom 50%) */}
        <div className="relative w-full h-[50%] lg:h-[35%] flex items-end overflow-hidden blur-[5px] scale-x-110 scale-y-120 origin-bottom">
           <div className="absolute bottom-0 left-0 w-full h-[200%] flex items-end overflow-hidden">
              <img
                src={trip.cover_image_url || '/images/trip_cover_sample.jpg'}
                className="object-cover w-full h-[20rem] lg:h-[30rem]"
                alt=""
              />
           </div>
        </div>
        {/* Subtle Gradient to smooth the transition between clear top and blurry bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/40 z-20" />
      </div>
    </Link>

    {/* 2. EXTERNAL GLOW (Behind the card) */}
    <img
      src={trip.cover_image_url || '/images/trip_cover_sample.jpg'}
      className="object-cover absolute z-[-1] left-0 top-[4%] blur-[12px] opacity-25 rotate-3 scale-105 pointer-events-none"
      alt=""
      style={{ width: '100%', height: '100%' }}
    />

    {/* 3. UI CONTENT (Text & Buttons) */}
    <div className="absolute inset-0 z-30 flex flex-col justify-end p-4 pointer-events-none">
      <div className="mb-4 text-white">
        <h2 className="text-2xl font-bold leading-tight drop-shadow-md">
          {trip.name}
        </h2>
        <p className="opacity-80 text-sm mt-1 font-medium tracking-wide">
          {countryOptions.find(c => c.country_code === trip.country_code)?.name || trip.country_code}
        </p>
        <p className="opacity-80 text-sm mt-1 font-medium tracking-wide">
          {trip.start_date} - {trip.end_date}        
        </p>
      </div>

      <div className="flex items-center justify-between pointer-events-auto">
        <Select 
          value={trip.status} 
          onValueChange={(v) => handleSetStatus(trip.trip_uuid, v as TripStatus)}
          
        >
          <SelectTrigger 
          
            className={cn("h-8 w-auto bg-black/50 backdrop-blur-lg border-none text-white rounded-full px-4 focus:ring-0",(statusMap[trip.status]?.color))}
            onClick={(e) => e.stopPropagation()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.status} value={opt.status}>{opt.description}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full bg-white text-black shadow-lg hover:bg-white/90 transition-transform active:scale-95"
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            handleEditClick(trip); 
          }}
        >
          <Edit className="h-4.5 w-4.5" />
        </Button>
      </div>
    </div>
  </CardContent>
</Card>)
                // <Card key={trip.trip_uuid} className={cn("overflow-hidden w-full h-[16rem] lg:h-[30rem] bg-white transition-all hover:shadow-lg relative", {'border-primary border-2': trip.status === 'A'})}>
                //     <CardContent className="p-0">
                //         <div className="flex flex-col">
                //             <Link href={`/trip/${trip.trip_uuid}`} className="relative w-full h-[16rem] lg:h-[30rem] shrink-0 object-fill block hover:opacity-90 transition-opacity " aria-label={`View trip: ${trip.name}`}>
                //                 <Image
                //                     src={trip.cover_image_url || 'https://rodtfkraukblqbshlazo.supabase.co/storage/v1/object/public/trip_cover/trip_cover_sample.jpg'}
                //                     alt={trip.name || ''}
                //                     fill
                //                     sizes="100%"
                //                     className="object-cover h-[16rem] lg:h-[30rem] w-full"
                //                     data-ai-hint={trip.name|| ''}
                //                 />
                //             </Link>
                //             <div className="absolute bottom-0 z-10 w-full flex flex-col justify-between p-3 flex-grow bg-gradient-to-b from-black/0 to-black/60">
                //                 <Link href={`/trip/${trip.trip_uuid}`} className="flex-grow flex flex-col justify-start cursor-pointer hover:opacity-80 transition-opacity" aria-label={`View trip: ${trip.name}`}>
                //                   <div>
                //                     <h2 className="text-white text-lg font-bold font-headline leading-tight">{trip.name}</h2>
                //                     <p className="text-white text-sm text-muted-foreground">{countryOptions.find(country => country.country_code === trip.country_code)?.name || trip.country_code}</p>
                //                     <p className="text-white text-xs text-muted-foreground mt-1">{trip.start_date||` - `||trip.end_date}</p>
                //                   </div>
                //                 </Link>
                //                 <div className='flex items-center justify-between gap-2 mt-2 z-20 pointer-events-auto'>
                //                   <Select value={trip.status} onValueChange={(value) => handleSetStatus(trip.trip_uuid, value as TripStatus)}>
                //                       <SelectTrigger className={cn("h-7 text-xs w-auto capitalize focus:ring-0 border-none", statusMap[trip.status]?.color)}>
                //                           <SelectValue placeholder="Set status" />
                //                       </SelectTrigger>
                //                       <SelectContent>
                //                           {statusOptions.map((option) => (
                //                             <SelectItem key={option.status} value={option.status}>{option.description || option.status}</SelectItem>
                //                           ))}
                //                       </SelectContent>
                //                   </Select>
                //                   <div className="flex items-center">
                //                     <Button variant="ghost" size="icon" className="h-7 w-7 pointer-events-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(trip); }}>
                //                       <Edit className="h-4 w-4" color="white"/>
                //                       <span className="sr-only">Edit Trip</span>
                //                     </Button>
                //                   </div>
                //                 </div>
                //             </div>
                //             {/* g-gradient-to-t from-yellow/600/0 to-black/40 */}
                //             <div className="absolute z-2 left-1/2 top-0 transform -translate-x-1/2 w-full h-full overflow-hidden pointer-events-none ">
                //               <div
                //                 className="absolute z-2 w-full h-[120%] bottom-0 flex items-end overflow-hidden blur-[4px] scale-x-100 scale-y-110 "
                //               >
                //                 <div
                //                   className="absolute z-2 bottom-0 left-0 w-full h-[45%] lg:h-[25%] flex items-end overflow-hidden pointer-events-none "
                //                 >
                //                   <img
                //                     src={trip.cover_image_url || 'https://rodtfkraukblqbshlazo.supabase.co/storage/v1/object/public/trip_cover/trip_cover_sample.jpg'}
                //                     alt={trip.name || ''}
                //                     className="object-cover h-[16rem] lg:h-[30rem] w-full"
                //                     data-ai-hint={trip.name || ''}
                //                   />
                //                 </div>
                //               </div>
                //                <Image
                //                 src={trip.cover_image_url || 'https://rodtfkraukblqbshlazo.supabase.co/storage/v1/object/public/trip_cover/trip_cover_sample.jpg'}
                //                 alt={trip.name || ''}
                //                 fill
                //                 sizes="100%"
                //                 className="object-cover absolute z-1 left-0 top-[4%] blur-[8px] h-[16rem] lg:h-[30rem] w-full opacity-20 rotate-4 scale-102 rounded-[30px] elchi"
                //                 data-ai-hint={trip.name || ''}
                //               />
                //             </div>

                //         </div>
                //     </CardContent>
                // </Card>
                // )
              )
            }
            </div>
            }
            </div>
        </ScrollArea>
        <BottomNav activeItem="trips" />
        
        {isAddDialogOpen || <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Trip: {editingTrip?.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[70vh] pl-1 pr-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input id="edit-name" value={tripForm.name || ''} onChange={(e) => handleFormChange('name', e.target.value)} className="col-span-3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-destination" className="text-right">Destination</Label>
                <Input id="edit-destination" value={tripForm.destination || ''} onChange={(e) => handleFormChange('destination', e.target.value)} className="col-span-3" />
              </div>
               <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="edit-start-date" className="text-right">Start Date</Label>
                <Input id="edit-start-date" type="date" value={tripForm.start_date || ''} onChange={(e) => handleFormChange('start_date', e.target.value)} className="col-span-3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-date" className="text-right">End Date</Label>
                <Input id="edit-end-date" type="date" value={tripForm.end_date || ''} onChange={(e) => handleFormChange('end_date', e.target.value)} className="col-span-3" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-items-start gap-2">
                 <Label className="text-right pt-2">Cover Image</Label>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-4">
                      <Image
                          src={tripForm.cover_image_preview || '/images/trip_cover_sample.jpg'}
                          alt="Trip cover image preview"
                          width={200}
                          height={150}
                          className="rounded-md object-cover w-full aspect-[4/3]"
                      />
                    <Input id="edit-image-upload" type="file" accept="image/*" ref={editFileInputRef} onChange={handleEditImageChange} className="hidden" />
                 </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-col sm:justify-between sm:space-x-0 gap-2">
              <div className="flex gap-2"> 
                {/* <Button variant="outline" onClick={handleOpenAIPlan} className="w-full">
                  <Brain className="h-4 w-4" />
                  AI Plan
                </Button> */}
              </div>
              <div className="flex gap-2 justify-around">
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="" onClick={() => setIsDeleteDialogOpen(true)}>
                      <Trash2 className="h-4 w-4" />
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
                {/* <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button> */}
              <Button onClick={handleUpdateTrip} className="w-full">Save Changes</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>}

        {isAddDialogOpen && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("createTrip")}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 overflow-y-auto max-h-[70vh] pl-1 pr-4">
              {/* <div className="space-y-2">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={newTrip.name} onChange={(e) => setNewTrip({...newTrip, name: e.target.value})} className="col-span-3" placeholder="e.g. Summer in Italy" />
              </div> */}
              <div className="space-y-2">
              <Label htmlFor="destination" className="text-right">{t("destination")}*</Label>
              <Input id="destination" value={newTrip.destination} onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})} className="col-span-3" placeholder={t("destinationPlaceholder")} />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-right">{t("country")}*</Label>
                  <Select value={newTrip.country_code} onValueChange={(value) => setNewTrip({...newTrip, country_code: value})}>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder={t("countryPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                          {countryOptions.map(option => (
                              <SelectItem key={option.country_code} value={option.country_code}>{option.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
              <Label htmlFor="start-date" className="text-right">{t("startDate")}*</Label>
              <Input id="start-date" type="date" value={newTrip.start_date} onChange={(e) => setNewTrip({...newTrip, start_date: e.target.value})} className="col-span-3" />
              </div>
              <div className="space-y-2">
              <Label htmlFor="end-date" className="text-right">{t("endDate")}*</Label>
              <Input id="end-date" type="date" value={newTrip.end_date} onChange={(e) => setNewTrip({...newTrip, end_date: e.target.value})} className="col-span-3" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-items-start gap-2">
                <Label className="text-right pt-2">{t("coverImage")}</Label>                        
                <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                </Button>
                </div>
                <div className="">
                    <Image src={newTrip.cover_image_preview || 'https://rodtfkraukblqbshlazo.supabase.co/storage/v1/object/public/trip_cover/trip_cover_sample.jpg'} 
                      alt="preview" 
                      width={200} height={150} 
                      className="rounded-md object-cover w-full aspect-[4/3]"/>
                  <Input id="cover-image-upload" type="file" accept="image/*" ref={fileInputRef} onChange={handleNewTripImageChange} className="hidden" />
                </div>
              </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-col items-center justify-around gap-2">
            
            <Button variant="outline" className="w-full" onClick={handleOpenAiTrip}>
              <Brain className="h-4 w-4" />
              {t("aiTrip")}
            </Button>
            <Button onClick={handleAddTrip} className="w-full" style={{ margin: 0 }}>
              {t("createTrip")}
            </Button>
          </DialogFooter>
          </DialogContent>
      </Dialog> )}

      {( isAiTripDialogOpen || isAiTripLoading ) && <Dialog
        open={isAiTripDialogOpen}
        onOpenChange={(isOpen) => {
          handleCancelAiTrip();
          setIsAiTripLoading(false);
          setIsAiTripDialogOpen(isOpen);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("aiTripPreferences")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t("aiTripPreferencesDescription")}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-900">
                {ct("remainingAiRequests")} <span className="text-lg font-bold text-blue-600">{Math.max(0, localAiRateLimit - localAiRate)}/{localAiRateLimit}</span>
              </p>
              {localAiRateLimit - localAiRate <= 0 && (
                <p className="text-xs text-red-600 mt-1">{ct("reacheAILimitTmr")}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center gap-2 justify-center">
                  <div className="grid grid-cols-2 gap-4 p-2 ">
                  {aiPreferencesOptions.map((opt) => (
                    <Button
                      className="flex items-center gap-2 h-[8rem] w-[8rem]"
                      key={opt.icon_text}
                      variant={
                        aiPreferences?.preferences === opt.activity_type
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        handleAiTripChange("preferences", opt.activity_type)
                      }
                    >
                      <div className="flex flex-col items-center justify-center gap-2 h-[8rem] w-full">
                        {React.createElement(
                          iconMap[opt.icon_text],
                          { className: "h-8 w-8" }
                        )}
                        <span>{opt.activity_type}</span>
                      </div>
                    </Button>
                  ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className='w-1/6'>{ct("suggestions")}</Label>
                  <Input
                    id="ai-suggestions"
                    type="text"
                    placeholder={ct("suggestionsPlaceholder")}
                     value= {aiPreferences?.suggestions || ""}
                    onChange={(e) =>
                      handleAiTripChange("suggestions", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
                
          </div>
          <DialogFooter className="flex justify-end gap-2">
             <Button 
              onClick={handleApplyAiTrip}
              disabled={isAiTripLoading || (localAiRateLimit - localAiRate <= 0)}
              title={localAiRateLimit - localAiRate <= 0 ? t("reacheAILimit") : ""}
            >
              {isAiTripLoading ? ct("aiIsThinking") : localAiRateLimit - localAiRate <= 0 ? ct("limitReached") : ct("Apply")}
            </Button> 
          </DialogFooter>
        </DialogContent>
      </Dialog>}

      {isAiTripLoading &&
        <LoadingOverlay
          isLoading={isAiTripLoading}
          message="aiIsThinking"
        /> 
      }
    </main>
  );
}