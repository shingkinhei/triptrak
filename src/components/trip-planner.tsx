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
import type { ItineraryItem, Activity, UserPhoto, ChecklistItem } from '@/lib/types';
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
  checklist: ChecklistItem[];
  setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
}

const PreTripChecklist = ({ checklist, setChecklist }: { checklist: ChecklistItem[], setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[]>> }) => {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingChecklist, setEditingChecklist] = useState<ChecklistItem[]>([]);
    const [newItemLabel, setNewItemLabel] = useState('');

    const handleCheckChange = (id: string, checked: boolean) => {
        setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked } : item));
    };

    const handleEditClick = () => {
        setEditingChecklist([...checklist]);
        setIsEditDialogOpen(true);
    };

    const handleSave = () => {
        setChecklist(editingChecklist);
        setIsEditDialogOpen(false);
    };

    const handleItemLabelChange = (id: string, label: string) => {
        setEditingChecklist(prev => prev.map(item => item.id === id ? { ...item, label } : item));
    };

    const handleAddItem = () => {
        if (newItemLabel.trim()) {
            const newItem: ChecklistItem = {
                id: `check-${new Date().getTime()}`,
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

export function TripPlanner({ itinerary, setItinerary, checklist, setChecklist }: TripPlannerProps) {
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<string>('checklist');
  const [viewingPhoto, setViewingPhoto] = useState<UserPhoto | null>(null);
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
    }
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
              key={item.day}
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

      {activeView === 'checklist' && <PreTripChecklist checklist={checklist} setChecklist={setChecklist} />}

      {activeItineraryItem && <WeatherCard location={activeItineraryItem.title.replace(/arrival in |exploring |day trip to /i, '')} />}

      {itinerary.map((item, index) => (
          <div key={item.day} className={cn(activeView === `day-${item.day}` ? 'block' : 'hidden')}>
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
                      <DropdownMenuItem onClick={() => handleEditClick(item)}>
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
                      <li key={actIndex} className="flex items-start gap-4">
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
