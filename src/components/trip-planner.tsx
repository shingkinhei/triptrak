
'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ItineraryItem, Activity, UserPhoto, ChecklistItem, Trip } from '@/lib/types';
import {
  BedDouble,
  Camera,
  ChevronDown,
  Plane,
  Train,
  UtensilsCrossed,
  MoreVertical,
  PlusCircle,
  Trash2,
  Upload,
  X,
  type LucideIcon,
  Ticket,
  Mountain,
  Building,
  ArrowLeft,
  CheckCircle2,
  Edit,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { WeatherCard } from './weather-card';
import { Textarea } from './ui/textarea';
import { useRouter } from 'next/navigation';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const iconOptions = [
  { value: 'Plane', label: 'Plane' },
  { value: 'Train', label: 'Train' },
  { value: 'BedDouble', label: 'Accommodation' },
  { value: 'UtensilsCrossed', label: 'Food' },
  { value: 'Camera', label: 'Sightseeing' },
  { value: 'Ticket', label: 'Event' },
  { value: 'Mountain', label: 'Activity' },
  { value: 'Building', label: 'City' },
];

interface TripPlannerProps {
  trip: Trip;
}

type EditableItineraryItem = ItineraryItem & {
    cover_image_file?: File | null;
    cover_image_preview?: string | null;
}

const PreTripChecklist = ({ checklist: initialChecklist, tripId }: { checklist: ChecklistItem[], tripId: string }) => {
    const [checklist, setChecklist] = useState(initialChecklist);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingChecklist, setEditingChecklist] = useState<ChecklistItem[]>([]);
    const [newItemLabel, setNewItemLabel] = useState('');
    const supabase = createClient();
    const { toast } = useToast();

    useEffect(() => {
        setChecklist(initialChecklist);
    }, [initialChecklist]);


    const handleCheckChange = async (item: ChecklistItem, checked: boolean) => {
        const originalState = [...checklist];
        setChecklist(prev => prev.map(i => i.checklist_uuid === item.checklist_uuid ? { ...i, checked } : i));

        const { error } = await supabase.from('pre_trip_checklist').update({ checked: checked }).eq('checklist_uuid', item.checklist_uuid);

        if (error) {
            toast({ title: "Error", description: "Failed to update checklist item.", variant: "destructive" });
            setChecklist(originalState);
        }
    };

    const handleEditClick = () => {
        setEditingChecklist([...checklist]);
        setIsEditDialogOpen(true);
    };

    const handleSave = async () => {
        const originalChecklist = [...checklist];
        setChecklist(editingChecklist);
        setIsEditDialogOpen(false);

        const newItems = editingChecklist.filter(item => item.checklist_uuid.startsWith('new-'));
        const updatedItems = editingChecklist.filter(item => !item.checklist_uuid.startsWith('new-') && JSON.stringify(item) !== JSON.stringify(originalChecklist.find(i => i.checklist_uuid === item.checklist_uuid)));
        const deletedItems = originalChecklist.filter(item => !editingChecklist.some(i => i.checklist_uuid === item.checklist_uuid));
        
        if (deletedItems.length > 0) {
            const { error } = await supabase.from('pre_trip_checklist').delete().in('checklist_uuid', deletedItems.map(i => i.checklist_uuid));
            if (error) toast({ title: "Error Deleting Items", description: error.message, variant: "destructive" });
        }

        if (updatedItems.length > 0) {
            const { error } = await supabase.from('pre_trip_checklist').upsert(updatedItems.map(({trip_uuid, ...rest}) => rest));
            if (error) toast({ title: "Error Updating Items", description: error.message, variant: "destructive" });
        }
        
        if (newItems.length > 0) {
            const { error } = await supabase.from('pre_trip_checklist').insert(newItems.map(item => ({ trip_uuid: tripId, label: item.label, checked: item.checked })));
            if (error) toast({ title: "Error Adding New Items", description: error.message, variant: "destructive" });
        }

        const { data, error } = await supabase.from('pre_trip_checklist').select('*').eq('trip_uuid', tripId);
        if (!error && data) {
            setChecklist(data as ChecklistItem[]);
        } else {
            setChecklist(originalChecklist);
        }
    };

    const handleItemLabelChange = (id: string, label: string) => {
        setEditingChecklist(prev => prev.map(item => item.checklist_uuid === id ? { ...item, label } : item));
    };

    const handleAddItem = () => {
        if (newItemLabel.trim()) {
            const newItem: ChecklistItem = {
                checklist_uuid: `new-${new Date().getTime()}`,
                trip_uuid: tripId,
                label: newItemLabel.trim(),
                checked: false,
            };
            setEditingChecklist(prev => [...prev, newItem]);
            setNewItemLabel('');
        }
    };

    const handleDeleteItem = (id: string) => {
        setEditingChecklist(prev => prev.filter(item => item.checklist_uuid !== id));
    };

    return (
        <Card className="bg-card/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-headline text-card-foreground">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Pre-Trip Checklist
                    </CardTitle>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-card-foreground" onClick={handleEditClick}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Checklist</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {checklist.map(item => (
                        <div key={item.checklist_uuid} className="flex items-center gap-3">
                            <Checkbox
                                id={item.checklist_uuid}
                                onCheckedChange={(checked) => handleCheckChange(item, !!checked)}
                                checked={item.checked}
                            />
                            <Label
                                htmlFor={item.checklist_uuid}
                                className={cn(
                                    "text-sm font-normal text-card-foreground transition-colors",
                                    item.checked && "text-muted-foreground line-through"
                                )}
                            >
                                {item.label}
                            </Label>
                        </div>
                    ))}
                </div>
            </CardContent>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="shadow-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Pre-Trip Checklist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto py-4 pr-2">
                        {editingChecklist.map(item => (
                            <div key={item.checklist_uuid} className="flex items-center gap-2">
                                <Input
                                    value={item.label}
                                    onChange={(e) => handleItemLabelChange(item.checklist_uuid, e.target.value)}
                                    className="flex-grow"
                                />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete the item "{item.label}".</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteItem(item.checklist_uuid)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                         <div className="flex items-center gap-2 pt-4 border-t">
                            <Input
                                placeholder="Add new item..."
                                value={newItemLabel}
                                onChange={(e) => setNewItemLabel(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            />
                            <Button onClick={handleAddItem} className="shrink-0">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

export function TripPlanner({ trip }: TripPlannerProps) {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(trip.itinerary);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(trip.checklist);
  const [editingItem, setEditingItem] = useState<EditableItineraryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<string>('checklist');
  const [viewingPhoto, setViewingPhoto] = useState<UserPhoto | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const dayCoverInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  
  useEffect(() => {
    setItinerary(trip.itinerary);
    setChecklist(trip.checklist);
  }, [trip]);

  const handleEditClick = (item: ItineraryItem) => {
    setTimeout(() => {
        setEditingItem({
            ...item,
            activities: item.activities ? [...item.activities.map(a => ({...a}))] : [],
            cover_image_preview: item.cover_image_url
        });
        setIsEditDialogOpen(true);
    }, 150);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: 'Not Authenticated', description: 'You must be logged in to save changes.', variant: 'destructive' });
        return;
    }

    const itemToSave = { ...editingItem };
    const originalItinerary = [...itinerary];
    const originalDay = originalItinerary.find(d => d.day_uuid === itemToSave.day_uuid);
    const oldImageUrl = originalDay?.cover_image_url;

    const dayUpdatePayload: Partial<ItineraryItem> = {
        title: itemToSave.title,
        date: itemToSave.date,
        feedback: itemToSave.feedback,
        cover_image_hint: itemToSave.cover_image_hint,
    };
    
    let newImageUrl: string | null = itemToSave.cover_image_url;

    if (itemToSave.cover_image_file) {
        const file = itemToSave.cover_image_file;
        const filePath = `${user.id}/${trip.trip_uuid}/${itemToSave.day_uuid}-${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage.from('day_cover').upload(filePath, file, { upsert: true });

        if (uploadError) {
            toast({ title: 'Error uploading day cover', description: uploadError.message, variant: 'destructive' });
            return;
        }
        
        const { data: urlData } = supabase.storage.from('day_cover').getPublicUrl(filePath);
        newImageUrl = urlData.publicUrl;

        if (oldImageUrl && oldImageUrl !== newImageUrl) {
            const oldImageKey = oldImageUrl.split('/day_cover/').pop();
            if (oldImageKey) await supabase.storage.from('day_cover').remove([oldImageKey]);
        }
    } 
    else if (!itemToSave.cover_image_preview && oldImageUrl) {
        const oldImageKey = oldImageUrl.split('/day_cover/').pop();
        if (oldImageKey) {
            const { error: deleteError } = await supabase.storage.from('day_cover').remove([oldImageKey]);
            if (deleteError) toast({ title: 'Could not delete old day cover', description: deleteError.message, variant: 'destructive' });
        }
        newImageUrl = null;
    }

    dayUpdatePayload.cover_image_url = newImageUrl;

    const { error: dayError } = await supabase
        .from('trip_days')
        .update(dayUpdatePayload)
        .eq('day_uuid', itemToSave.day_uuid);

    if (dayError) {
        toast({ title: 'Error saving day', description: dayError.message, variant: 'destructive'});
        return;
    }

    const originalActivities = originalDay?.activities || [];
    
    const newActivities = itemToSave.activities.filter(act => act.activity_uuid.startsWith('act_'));
    const updatedActivities = itemToSave.activities.filter(act => !act.activity_uuid.startsWith('act_') && JSON.stringify(act) !== JSON.stringify(originalActivities.find(oa => oa.activity_uuid === act.activity_uuid)));
    const deletedActivities = originalActivities.filter(oa => !itemToSave.activities.some(ea => ea.activity_uuid === oa.activity_uuid));
    
    if (deletedActivities.length > 0) {
        const { error } = await supabase.from('activities').delete().in('activity_uuid', deletedActivities.map(a => a.activity_uuid));
        if (error) toast({ title: 'Error Deleting Activities', description: error.message, variant: 'destructive' });
    }

    if (updatedActivities.length > 0) {
        const { error } = await supabase.from('activities').upsert(updatedActivities.map(({day_uuid, ...rest}) => ({...rest, day_uuid: itemToSave.day_uuid})));
        if (error) toast({ title: 'Error Updating Activities', description: error.message, variant: 'destructive' });
    }

    if (newActivities.length > 0) {
        const { error } = await supabase.from('activities').insert(newActivities.map(act => ({ day_uuid: itemToSave.day_uuid, time: act.time, description: act.description, icon: act.icon })));
        if (error) toast({ title: 'Error Adding New Activities', description: error.message, variant: 'destructive' });
    }

    toast({ title: 'Day Saved!', description: `Changes to Day ${itemToSave.day_number} have been saved.`});

    handleCancelEdit();
    const { data: refreshedDay, error: refreshError } = await supabase
        .from('trip_days')
        .select(`*, activities:activities(*)`)
        .eq('day_uuid', itemToSave.day_uuid)
        .single();
    
    if (!refreshError && refreshedDay) {
        setItinerary(prev => prev.map(item => item.day_uuid === refreshedDay.day_uuid ? ({...refreshedDay, activities: refreshedDay.activities } as ItineraryItem) : item));
    }
  };


  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
  }

  const handleFieldChange = (field: keyof Omit<EditableItineraryItem, 'activities' | 'userPhotos' | 'checklist'>, value: string | null) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, [field]: value });
    }
  };

  const handleActivityChange = (actId: string, field: keyof Activity, value: string) => {
    if (editingItem) {
      const updatedActivities = editingItem.activities.map(act =>
        act.activity_uuid === actId ? { ...act, [field]: value } : act
      );
      setEditingItem({ ...editingItem, activities: updatedActivities });
    }
  };

  const handleAddActivity = () => {
    if (editingItem) {
      const newActivity: Activity = {
        activity_uuid: `act_${new Date().getTime()}`,
        day_uuid: editingItem.day_uuid,
        time: '00:00',
        description: 'New Activity',
        icon: 'Camera',
      };
      setEditingItem({ ...editingItem, activities: [...editingItem.activities, newActivity] });
    }
  };
  
  const handleDeleteActivity = (actId: string) => {
    if (editingItem) {
      const updatedActivities = editingItem.activities.filter(act => act.activity_uuid !== actId);
      setEditingItem({ ...editingItem, activities: updatedActivities });
    }
  };

  const handleDayCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !editingItem) return;
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setEditingItem(prev => prev ? {...prev, cover_image_file: file, cover_image_preview: reader.result as string} : null);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleRemoveDayCoverImage = () => {
      if (editingItem) {
          setEditingItem(prev => prev ? {...prev, cover_image_file: null, cover_image_preview: null} : null);
      }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !editingItem) return;
    toast({ title: 'Feature not implemented', description: 'Uploading user photos is not yet supported in this version.', variant: 'default'});
  };

  const handleDeletePhoto = (photoId: string) => {
     if (editingItem) {
      toast({ title: 'Feature not implemented', description: 'Deleting user photos is not yet supported in this version.', variant: 'default'});
    }
  };

  const handleAddDay = async () => {
    const newDayNumber = itinerary.length > 0 ? Math.max(...itinerary.map(i => i.day_number)) + 1 : 1;

    let newDate = new Date();
    if (itinerary.length > 0) {
        const lastDate = new Date(itinerary[itinerary.length - 1].date);
        lastDate.setDate(lastDate.getDate() + 1);
        newDate = lastDate;
    } else if (trip.start_date) {
        newDate = new Date(trip.start_date);
    }
    const newDateString = newDate.toISOString().split('T')[0];

    const newDayData = {
      trip_uuid: trip.trip_uuid,
      day_number: newDayNumber,
      title: 'New Destination',
      date: newDateString,
      cover_image_url: `https://picsum.photos/seed/${new Date().getTime()}/600/400`,
      cover_image_hint: 'landscape',
    };

    const { data, error } = await supabase.from('trip_days').insert(newDayData).select().single();
    
    if (error) {
        toast({ title: 'Error adding day', description: error.message, variant: 'destructive'});
    } else if (data) {
        const newDay: ItineraryItem = { ...data, activities: [], userPhotos: [] };
        setItinerary(prev => [...prev, newDay].sort((a,b) => a.day_number - b.day_number));
        toast({ title: 'Day Added!', description: `Day ${newDayNumber} has been successfully added.`});
    }
  };
  
  const activeItineraryItem = itinerary.find(item => `day-${item.day_number}` === activeView);

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground" onClick={() => router.push('/trips')}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold font-headline text-primary-foreground truncate">
                {trip.name}
            </h1>
        </div>
        <Button onClick={handleAddDay} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white shrink-0">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Day
        </Button>
      </header>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-2">
          <Button
            variant={activeView === 'checklist' ? 'default' : 'outline'}
            onClick={() => setActiveView('checklist')}
            className={cn("shrink-0", activeView !== 'checklist' && 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white')}
          >
            Checklist
          </Button>
          {itinerary.map((item) => (
            <Button
              key={item.day_uuid}
              variant={activeView === `day-${item.day_number}` ? 'default' : 'outline'}
              onClick={() => setActiveView(`day-${item.day_number}`)}
              className={cn("shrink-0", activeView !== `day-${item.day_number}` && 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white')}
            >
              Day {item.day_number}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {activeView === 'checklist' && <PreTripChecklist checklist={checklist} tripId={trip.trip_uuid} />}

      {activeItineraryItem && <WeatherCard location={activeItineraryItem.title.replace(/arrival in |exploring |day trip to /i, '')} />}

      {itinerary.map((item) => (
          <div key={item.day_uuid} className={cn(activeView === `day-${item.day_number}` ? 'block' : 'hidden')}>
            <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-white/20 shadow-lg">
              <div className="relative">
                <div className="relative w-full h-32 rounded-t-lg overflow-hidden">
                  {item.cover_image_url && 
                    <Image
                      src={item.cover_image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                      data-ai-hint={item.cover_image_hint || ''}
                    />
                  }
                  <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                    <div className="text-white flex-grow text-left">
                      <h2 className="font-bold text-lg font-headline">
                        Day {item.day_number}: {item.title}
                      </h2>
                      <p className="text-sm">{item.date}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 right-2 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="shadow-lg">
                      <DropdownMenuItem onSelect={() => handleEditClick(item)}>
                        <Edit className="mr-2 h-4 w-4"/>
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="p-4 space-y-4">
                 {item.feedback && (
                  <div className="prose prose-sm max-w-none text-card-foreground">
                      <p>{item.feedback}</p>
                  </div>
                )}

                {item.userPhotos && item.userPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                      {item.userPhotos.map((photo) => (
                          <button key={photo.id} onClick={() => setViewingPhoto(photo)} className="relative block w-full aspect-square rounded-md overflow-hidden cursor-pointer">
                              <Image src={photo.url} alt="User photo" fill className="object-cover" />
                          </button>
                      ))}
                  </div>
                )}
                <ul className="space-y-4">
                  {item.activities.map((activity, actIndex) => {
                    const ActivityIcon = iconMap[activity.icon];
                    return (
                      <li key={activity.activity_uuid} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {ActivityIcon && <ActivityIcon className="h-4 w-4" />}
                          </div>
                          {actIndex < item.activities.length - 1 && (
                            <div className="w-px h-6 bg-primary/30 mt-1"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-card-foreground">{activity.time}</p>
                          <p className="text-muted-foreground">
                            {activity.description}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          </div>
      ))}
      
      {editingItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) handleCancelEdit(); }}>
          <DialogContent className="max-h-[90vh] flex flex-col shadow-lg">
            <DialogHeader>
              <DialogTitle>Edit Day {editingItem.day_number}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-6 -mr-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={editingItem.title} onChange={(e) => handleFieldChange('title', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={editingItem.date} onChange={(e) => handleFieldChange('date', e.target.value)} />
              </div>

                <div className="space-y-2">
                    <Label>Day Cover Image</Label>
                    {editingItem.cover_image_preview && (
                        <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden">
                            <Image src={editingItem.cover_image_preview} alt="Day cover preview" fill className="object-cover"/>
                        </div>
                    )}
                    <div className="flex gap-2">
                         <Input 
                            type="file" 
                            accept="image/*" 
                            ref={dayCoverInputRef}
                            onChange={handleDayCoverImageChange}
                            className="hidden"
                        />
                        <Button variant="outline" size="sm" onClick={() => dayCoverInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Upload
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleRemoveDayCoverImage} disabled={!editingItem.cover_image_preview}>
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
                    </div>
                </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Feedback</Label>
                <Textarea id="remarks" value={editingItem.feedback || ''} onChange={(e) => handleFieldChange('feedback', e.target.value)} placeholder="Write your feelings or reflections..."/>
              </div>

              <div className="space-y-2">
                <Label>Your Photos</Label>
                <Input 
                    type="file" 
                    accept="image/*" 
                    ref={photoInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                />
                <div className="grid grid-cols-3 gap-2">
                  {(editingItem.userPhotos || []).map((photo) => (
                    <div key={photo.id} className="relative aspect-square">
                      <Image src={photo.url} alt="User upload" fill className="rounded-md object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 z-10"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="aspect-square flex-col gap-1" onClick={() => photoInputRef.current?.click()}>
                      <Upload className="h-6 w-6" />
                      <span className="text-xs">Upload</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Activities</h3>
                  <Button variant="ghost" size="sm" onClick={handleAddActivity}><PlusCircle className="mr-2 h-4 w-4"/>Add Activity</Button>
                </div>
                <div className="space-y-4">
                  {editingItem.activities.map((act) => (
                    <div key={act.activity_uuid} className="flex items-center gap-2 p-2 border rounded-lg">
                      <div className="grid gap-2 flex-grow">
                        <div className="flex items-center gap-2">
                            <Select value={act.icon} onValueChange={(val) => handleActivityChange(act.activity_uuid, 'icon', val)}>
                                <SelectTrigger className="w-16 h-8">
                                    <SelectValue>
                                        {iconMap[act.icon] && React.createElement(iconMap[act.icon], {className: "h-4 w-4"})}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="shadow-lg">
                                    {iconOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex items-center gap-2">
                                                {React.createElement(iconMap[opt.value], {className: "h-4 w-4"})}
                                                <span>{opt.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          <Input
                            type="time"
                            value={act.time}
                            onChange={(e) => handleActivityChange(act.activity_uuid, 'time', e.target.value)}
                            className="w-24 h-8"
                          />
                        </div>
                        <Input
                          value={act.description}
                          onChange={(e) => handleActivityChange(act.activity_uuid, 'description', e.target.value)}
                          placeholder="Activity description"
                          className="h-8"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteActivity(act.activity_uuid)}>
                        <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {viewingPhoto && (
        <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
            <DialogContent className="max-w-3xl p-2 bg-transparent border-0 shadow-none">
                 <DialogHeader>
                    <DialogTitle className="sr-only">Full screen user photo</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-auto">
                    <Image
                        src={viewingPhoto.url}
                        alt="Full screen user photo"
                        width={1920}
                        height={1080}
                        className="rounded-lg object-contain w-full h-auto max-h-[80vh]"
                    />
                </div>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
