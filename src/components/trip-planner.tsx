'use client';
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import type { ItineraryItem, Activity, UserPhoto } from '@/lib/types';
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
  itinerary: ItineraryItem[];
  setItinerary: React.Dispatch<React.SetStateAction<ItineraryItem[]>>;
}

export function TripPlanner({ itinerary, setItinerary }: TripPlannerProps) {
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<string>('item-0');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const handleEditClick = (item: ItineraryItem) => {
    setEditingItem({
        ...item,
        activities: [...item.activities],
        userPhotos: item.userPhotos ? [...item.userPhotos] : [],
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (editingItem) {
      setItinerary(itinerary.map(item => item.day === editingItem.day ? editingItem : item));
      setEditingItem(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setIsEditDialogOpen(false);
  }

  const handleFieldChange = (field: keyof Omit<ItineraryItem, 'activities' | 'userPhotos'>, value: string) => {
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && editingItem) {
      const files = Array.from(e.target.files);
      const newPhotos: UserPhoto[] = [];

      files.forEach(file => {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  newPhotos.push({ id: `photo_${new Date().getTime()}_${Math.random()}`, url: event.target.result as string });
                  if (newPhotos.length === files.length) {
                      setEditingItem({
                          ...editingItem,
                          userPhotos: [...(editingItem.userPhotos || []), ...newPhotos],
                      });
                  }
              }
          };
          reader.readAsDataURL(file);
      });
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        userPhotos: editingItem.userPhotos?.filter(p => p.id !== photoId),
      });
    }
  };

  const handleAddDay = () => {
    const newDay: ItineraryItem = {
      day: itinerary.length + 1,
      title: 'New Destination',
      date: new Date().toISOString().split('T')[0],
      image: {
        url: 'https://picsum.photos/seed/newday/600/400',
        hint: 'landscape',
      },
      activities: [],
    };
    setItinerary([...itinerary, newDay]);
  };
  
  const activeItineraryItem = itinerary[parseInt(activeDay.split('-')[1] || '0')];

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
        <Button onClick={handleAddDay} variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Day
        </Button>
      </header>

      {activeItineraryItem && <WeatherCard location={activeItineraryItem.title.replace(/arrival in |exploring |day trip to /i, '')} />}

      <Accordion type="single" collapsible defaultValue="item-0" value={activeDay} onValueChange={setActiveDay} className="w-full space-y-4">
        {itinerary.map((item, index) => {
          return (
            <Card key={item.day} className="overflow-hidden bg-transparent border-0 shadow-none">
              <AccordionItem value={`item-${index}`} className="border-b-0">
                <div className="relative">
                  <AccordionTrigger className="p-0 hover:no-underline rounded-lg overflow-hidden">
                    <div className="relative w-full h-32">
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
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-white ml-auto" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="shadow-lg">
                        <DropdownMenuItem onClick={() => handleEditClick(item)}>
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <AccordionContent className="p-4 bg-card/80 backdrop-blur-sm rounded-b-lg space-y-4">
                   {item.remarks && (
                    <div className="prose prose-sm max-w-none text-card-foreground">
                        <p>{item.remarks}</p>
                    </div>
                  )}

                  {item.userPhotos && item.userPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                        {item.userPhotos.map((photo) => (
                            <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden">
                                <Image src={photo.url} alt="User photo" fill className="object-cover" />
                            </div>
                        ))}
                    </div>
                  )}
                  <ul className="space-y-4">
                    {item.activities.map((activity, actIndex) => {
                      const ActivityIcon = iconMap[activity.icon];
                      return (
                        <li key={actIndex} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                              {ActivityIcon && <ActivityIcon className="h-4 w-4" />}
                            </div>
                            {actIndex < item.activities.length - 1 && (
                              <div className="w-px h-6 bg-primary mt-1"></div>
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
                </AccordionContent>
              </AccordionItem>
            </Card>
          );
        })}
      </Accordion>
      
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) handleCancelEdit(); }}>
          <DialogContent className="max-h-[90vh] flex flex-col shadow-lg">
            {editingItem && (
              <>
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
              </>
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
}
