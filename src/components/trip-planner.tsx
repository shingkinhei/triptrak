'use client';
import React, { useState, useRef } from 'react';
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
import { collection, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { useFirestore, useUser, useStorage } from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


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
  itinerary: ItineraryItem[];
  checklist: ChecklistItem[];
}

const PreTripChecklist = ({ trip, checklist }: { trip: Trip, checklist: ChecklistItem[] }) => {
    const firestore = useFirestore();
    const { user } = useUser();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingChecklist, setEditingChecklist] = useState<ChecklistItem[]>([]);
    const [newItemLabel, setNewItemLabel] = useState('');

    const handleCheckChange = (id: string, checked: boolean) => {
        if (!user || !firestore) return;
        const itemRef = doc(firestore, 'users', user.uid, 'trips', trip.id, 'checklist', id);
        updateDocumentNonBlocking(itemRef, { checked });
    };

    const handleEditClick = () => {
        setEditingChecklist([...checklist]);
        setIsEditDialogOpen(true);
    };

    const handleSave = async () => {
        if (!user || !firestore) return;
        
        const batch = writeBatch(firestore);
        const checklistRef = collection(firestore, 'users', user.uid, 'trips', trip.id, 'checklist');

        // Create a map of original items by ID
        const originalItemsMap = new Map(checklist.map(item => [item.id, item]));

        editingChecklist.forEach(item => {
            if (item.id.startsWith('new-')) { // New item
                const newItemRef = doc(checklistRef);
                batch.set(newItemRef, { label: item.label, checked: item.checked });
            } else { // Existing item
                const originalItem = originalItemsMap.get(item.id);
                if (originalItem && originalItem.label !== item.label) {
                    const itemRef = doc(checklistRef, item.id);
                    batch.update(itemRef, { label: item.label });
                }
                originalItemsMap.delete(item.id); // Remove from map to track deletions
            }
        });

        // Any items left in the map were deleted
        for (const id of originalItemsMap.keys()) {
            const itemRef = doc(checklistRef, id);
            batch.delete(itemRef);
        }
        
        await batch.commit();
        setIsEditDialogOpen(false);
    };

    const handleItemLabelChange = (id: string, label: string) => {
        setEditingChecklist(prev => prev.map(item => item.id === id ? { ...item, label } : item));
    };

    const handleAddItem = () => {
        if (newItemLabel.trim()) {
            const newItem: ChecklistItem = {
                id: `new-${new Date().getTime()}`,
                label: newItemLabel.trim(),
                checked: false,
            };
            setEditingChecklist(prev => [...prev, newItem]);
            setNewItemLabel('');
        }
    };

    const handleDeleteItem = (id: string) => {
        setEditingChecklist(prev => prev.filter(item => item.id !== id));
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
                        <div key={item.id} className="flex items-center gap-3">
                            <Checkbox
                                id={item.id}
                                onCheckedChange={(checked) => handleCheckChange(item.id, !!checked)}
                                checked={item.checked}
                            />
                            <Label
                                htmlFor={item.id}
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
                            <div key={item.id} className="flex items-center gap-2">
                                <Input
                                    value={item.label}
                                    onChange={(e) => handleItemLabelChange(item.id, e.target.value)}
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
                                            <AlertDialogAction onClick={() => handleDeleteItem(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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

export function TripPlanner({ trip, itinerary, checklist }: TripPlannerProps) {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<string>('checklist');
  const [viewingPhoto, setViewingPhoto] = useState<UserPhoto | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const handleEditClick = (item: ItineraryItem) => {
    // A short delay to allow the dropdown menu to close before opening the dialog
    setTimeout(() => {
        setEditingItem({
            ...item,
            activities: [...item.activities],
            userPhotos: item.userPhotos ? [...item.userPhotos] : [],
        });
        setIsEditDialogOpen(true);
    }, 150);
  };

  const handleSave = async () => {
    if (!editingItem || !user || !firestore) return;
    
    // Create a copy of the editing item, removing the temporary local-only photo URLs.
    const { userPhotos, ...itemToSave } = editingItem;
    const finalItem = {
      ...itemToSave,
      userPhotos: userPhotos?.filter(p => !p.url.startsWith('blob:'))
    };

    const itemRef = doc(firestore, 'users', user.uid, 'trips', trip.id, 'itinerary', editingItem.id);
    updateDocumentNonBlocking(itemRef, finalItem);
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
  }

  const handleFieldChange = (field: keyof Omit<ItineraryItem, 'activities' | 'userPhotos' | 'checklist'>, value: string) => {
    if (editingItem) {
      setEditingItem({ ...editingItem, [field]: value });
    }
  };

  const handleActivityChange = (actId: string, field: keyof Activity, value: string) => {
    if (editingItem) {
      const updatedActivities = editingItem.activities.map(act =>
        act.id === actId ? { ...act, [field]: value } : act
      );
      setEditingItem({ ...editingItem, activities: updatedActivities });
    }
  };

  const handleAddActivity = () => {
    if (editingItem) {
      const newActivity: Activity = {
        id: `act_${new Date().getTime()}`,
        time: '00:00',
        description: 'New Activity',
        icon: 'Camera',
      };
      setEditingItem({ ...editingItem, activities: [...editingItem.activities, newActivity] });
    }
  };
  
  const handleDeleteActivity = (actId: string) => {
    if (editingItem) {
      const updatedActivities = editingItem.activities.filter(act => act.id !== actId);
      setEditingItem({ ...editingItem, activities: updatedActivities });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !editingItem || !user || !storage) return;
  
    const files = Array.from(e.target.files);
    
    // Create temporary local URLs for immediate preview
    const tempPhotos: UserPhoto[] = files.map(file => ({
      id: `local_${Date.now()}_${Math.random()}`,
      url: URL.createObjectURL(file)
    }));

    setEditingItem(prev => prev ? { ...prev, userPhotos: [...(prev.userPhotos || []), ...tempPhotos] } : null);

    // Process uploads in the background
    for (const file of files) {
      const photoId = `photo_${Date.now()}`;
      const storageRef = ref(storage, `users/${user.uid}/trips/${trip.id}/${photoId}`);
      
      try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        const newPhoto: UserPhoto = { id: photoId, url: downloadURL };
        
        // Update the document in Firestore
        if (editingItem) {
          const itemRef = doc(firestore, 'users', user.uid, 'trips', trip.id, 'itinerary', editingItem.id);
          const updatedPhotos = [...(editingItem.userPhotos || []), newPhoto].filter(p => !p.url.startsWith('blob:'));
          updateDocumentNonBlocking(itemRef, { userPhotos: updatedPhotos });
        }

        // Replace temporary local URL with the final URL in local state
        setEditingItem(prev => {
            if (!prev) return null;
            const updatedPhotos = prev.userPhotos?.map(p => 
                p.url.startsWith('blob:') && p.id.startsWith('local_') ? newPhoto : p
            );
            // This is a bit tricky, find the right local photo to replace. A simple find might not work if multiple are uploaded.
            // For now, let's just add the new one and rely on Firestore sync to clear up blobs.
             return { ...prev, userPhotos: [...(prev.userPhotos?.filter(p => !p.url.startsWith('blob:')) || []), newPhoto] };
        });

      } catch (error) {
        console.error("Error uploading photo:", error);
        // Optionally remove the temporary photo from state on error
        setEditingItem(prev => prev ? { ...prev, userPhotos: prev.userPhotos?.filter(p => !p.url.startsWith('blob:')) } : null);
      }
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (editingItem && user && firestore && storage) {
      const photoToDelete = editingItem.userPhotos?.find(p => p.id === photoId);
      if (!photoToDelete) return;

      const updatedPhotos = editingItem.userPhotos?.filter(p => p.id !== photoId);
      
      // Update state immediately for responsive UI
      setEditingItem({
        ...editingItem,
        userPhotos: updatedPhotos,
      });

      // Update firestore document
      const itemRef = doc(firestore, 'users', user.uid, 'trips', trip.id, 'itinerary', editingItem.id);
      updateDocumentNonBlocking(itemRef, { userPhotos: updatedPhotos });
      
      // Delete from storage
      const storageRef = ref(storage, `users/${user.uid}/trips/${trip.id}/${photoId}`);
      try {
        await deleteObject(storageRef);
      } catch (error) {
        console.error("Error deleting photo from storage:", error);
      }
    }
  };

  const handleAddDay = async () => {
    if (!user || !firestore) return;
    const newDayNumber = itinerary.length > 0 ? Math.max(...itinerary.map(i => i.day)) + 1 : 1;

    // Calculate the date for the new day
    let newDate = new Date();
    if (itinerary.length > 0) {
        const lastDate = new Date(itinerary[itinerary.length - 1].date);
        lastDate.setDate(lastDate.getDate() + 1);
        newDate = lastDate;
    } else if (trip.startDate) {
        newDate = new Date(trip.startDate);
    }
    const newDateString = newDate.toISOString().split('T')[0];

    const newDay: Omit<ItineraryItem, 'id'> = {
      day: newDayNumber,
      title: 'New Destination',
      date: newDateString,
      image: {
        url: 'https://picsum.photos/seed/newday/600/400',
        hint: 'landscape',
      },
      activities: [],
      userPhotos: [],
      remarks: '',
    };
    
    const itineraryRef = collection(firestore, 'users', user.uid, 'trips', trip.id, 'itinerary');
    await addDoc(itineraryRef, newDay);
  };
  
  const activeItineraryItem = itinerary.find(item => `day-${item.day}` === activeView);

  return (
    <div className="space-y-4">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white" onClick={() => router.push('/trips')}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold font-headline text-white">
                Trip Itinerary
            </h1>
        </div>
        <Button onClick={handleAddDay} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
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
              key={item.id}
              variant={activeView === `day-${item.day}` ? 'default' : 'outline'}
              onClick={() => setActiveView(`day-${item.day}`)}
              className={cn("shrink-0", activeView !== `day-${item.day}` && 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white')}
            >
              Day {item.day}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {activeView === 'checklist' && <PreTripChecklist trip={trip} checklist={checklist} />}

      {activeItineraryItem && <WeatherCard location={activeItineraryItem.title.replace(/arrival in |exploring |day trip to /i, '')} />}

      {itinerary.map((item) => (
          <div key={item.id} className={cn(activeView === `day-${item.day}` ? 'block' : 'hidden')}>
            <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-white/20 shadow-lg">
              <div className="relative">
                <div className="relative w-full h-32 rounded-t-lg overflow-hidden">
                  <Image
                    src={item.image.url}
                    alt={item.title}
                    fill
                    className="object-cover"
                    data-ai-hint={item.image.hint}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                    <div className="text-white flex-grow text-left">
                      <h2 className="font-bold text-lg font-headline">
                        Day {item.day}: {item.title}
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
                 {item.remarks && (
                  <div className="prose prose-sm max-w-none text-card-foreground">
                      <p>{item.remarks}</p>
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
                      <li key={activity.id} className="flex items-start gap-4">
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
              <DialogTitle>Edit Day {editingItem.day}</DialogTitle>
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
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea id="remarks" value={editingItem.remarks || ''} onChange={(e) => handleFieldChange('remarks', e.target.value)} placeholder="Write your feelings or reflections..."/>
              </div>

              <div className="space-y-2">
                <Label>Your Photos</Label>
                <Input 
                    type="file" 
                    accept="image/*" 
                    multiple 
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
                    <div key={act.id} className="flex items-center gap-2 p-2 border rounded-lg">
                      <div className="grid gap-2 flex-grow">
                        <div className="flex items-center gap-2">
                            <Select value={act.icon} onValueChange={(val) => handleActivityChange(act.id, 'icon', val)}>
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
                            onChange={(e) => handleActivityChange(act.id, 'time', e.target.value)}
                            className="w-24 h-8"
                          />
                        </div>
                        <Input
                          value={act.description}
                          onChange={(e) => handleActivityChange(act.id, 'description', e.target.value)}
                          placeholder="Activity description"
                          className="h-8"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteActivity(act.id)}>
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
