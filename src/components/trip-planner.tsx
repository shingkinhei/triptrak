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
import type { ItineraryItem, Activity } from '@/lib/types';
import { cn } from '@/lib/utils';
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
  type LucideIcon,
  Ticket,
  Mountain,
  Building,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
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

const initialItineraryData: ItineraryItem[] = [
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
];

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

export function TripPlanner() {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(initialItineraryData);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  const handleEditClick = (item: ItineraryItem) => {
    setEditingItem({ ...item, activities: [...item.activities] });
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (editingItem) {
      setItinerary(itinerary.map(item => item.day === editingItem.day ? editingItem : item));
      setIsEditDialogOpen(false);
      setEditingItem(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingItem(null);
    }
  };

  const handleFieldChange = (field: keyof ItineraryItem, value: string) => {
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

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold font-headline text-foreground">
          Trip Itinerary
        </h1>
        <p className="text-muted-foreground">Your adventure at a glance.</p>
      </header>

      <Accordion type="single" collapsible defaultValue="item-0" className="w-full space-y-4">
        {itinerary.map((item, index) => {
          const Icon = iconMap[item.activities[0]?.icon] || Train;
          return (
            <Card key={item.day} className="overflow-hidden">
              <AccordionItem value={`item-${index}`} className="border-b-0">
                <div className="relative">
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
                        <div className="text-primary-foreground flex-grow">
                          <h2 className="font-bold text-lg font-headline">
                            Day {item.day}: {item.title}
                          </h2>
                          <p className="text-sm">{item.date}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-primary-foreground ml-auto" />
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(item)}>
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <AccordionContent className="p-4">
                  <ul className="space-y-4">
                    {item.activities.map((activity, actIndex) => {
                      const ActivityIcon = iconMap[activity.icon];
                      return (
                        <li key={actIndex} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                              {ActivityIcon && <ActivityIcon className="h-4 w-4" />}
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
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Card>
          );
        })}
      </Accordion>
      
      {editingItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-h-[90vh] flex flex-col">
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
                                <SelectContent>
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
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
