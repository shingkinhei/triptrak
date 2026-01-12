'use client';
import React, { useRef, useState, useMemo } from 'react';
import type { ShoppingItems, Trip } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ListPlus, MoreVertical, Edit, Trash2, Repeat, Gift, Home, Plane, Shirt, ShoppingBasket, UtensilsCrossed, Luggage, type LucideIcon, Store, MapPin, ArrowLeft, Camera, Upload } from 'lucide-react';
import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useRouter } from 'next/navigation';

interface ShoppingListProps {
    list: ShoppingItems[];
    setList: React.Dispatch<React.SetStateAction<ShoppingItems[]>>;
    onCheckChange: (itemId: string, checked: boolean) => void;
    trip: Trip;
}

const iconMap: Record<string, LucideIcon> = {
  Gift,
  Home,
  Plane,
  Shirt,
  ShoppingBasket,
  UtensilsCrossed,
  Luggage,
};

const iconOptions = [
  { value: 'ShoppingBasket', label: 'General' },
  { value: 'Gift', label: 'Souvenirs' },
  { value: 'UtensilsCrossed', label: 'Food' },
  { value: 'Shirt', label: 'Clothing' },
  { value: 'Luggage', label: 'Essentials' },
  { value: 'Home', label: 'Household' },
  { value: 'Plane', label: 'Travel' },
];


type DisplayCurrency = 'trip' | 'home';

export function ShoppingList({ list, setList, onCheckChange, trip }: ShoppingListProps) {
    const { tripCurrency, tripRate, formatCurrency, homeCurrency, convertToHomeCurrency, formatHomeCurrency } = useCurrency();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for main dialogs
    // State for editing items
    const [editingItem, setEditingItem] = useState<{ item: ShoppingItems; } | null>(null);
    const [editItemFormData, setEditItemFormData] = useState<Partial<ShoppingItems> & { file?: File | null, previewUrl?: string | null }>({});

    // Other state
    const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('trip');


    const itineraryLocations = useMemo(() => {
        if (!trip) return [];
        return [...new Set(trip.itinerary.map(i => i.title.replace(/arrival in |exploring |day trip to /i, '')))];
    }, [trip]);

    const pointsOfInterest = useMemo(() => {
        if (!trip) return [];
        const allPois = trip.itinerary.flatMap(day => 
            day.activities.map(activity => ({
                name: activity.description,
                address: activity.address || '',
            }))
        );
        return allPois.filter(poi => 
            editingItem ? poi.address === editItemFormData.address : true
        );
    }, [trip, editingItem, editItemFormData]);


    const currentFormatter = displayCurrency === 'trip' ? formatCurrency : formatHomeCurrency;
    const currentCurrency = displayCurrency === 'trip' ? tripCurrency : homeCurrency;

    const toggleCurrency = () => {
        setDisplayCurrency(prev => (prev === 'trip' ? 'home' : 'trip'));
    };

    // Category operations removed: categories are derived from items' `shopping_category`

        const handleEditItemClick = (item: ShoppingItems) => {
            setEditingItem({ item });
            setEditItemFormData({ ...item, previewUrl: item.image_url });
        };

    const handleUpdateItem = () => {
        if (!editingItem) return;

        const updatedItem = {
            ...editingItem.item,
            ...editItemFormData,
            price: parseFloat(String(editItemFormData.price || 0)) || 0,
            image_url: editItemFormData.previewUrl || editingItem.item.image_url,
        } as ShoppingItems;
        delete (updatedItem as any).file;
        delete (updatedItem as any).previewUrl;

        setList(prevList => prevList.map(item => item.item_uuid === editingItem.item.item_uuid ? updatedItem : item));
        
        setEditingItem(null);
        setEditItemFormData({});
    };

    const handleDeleteItem = (itemId: string) => {
        setList(prevList => prevList.filter(item => item.item_uuid !== itemId));
    };
    
    const handleEditItemFormChange = (field: keyof typeof editItemFormData, value: string | File | null) => {
        if (field === 'file' && value instanceof File) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditItemFormData(prev => ({ ...prev, file: value, previewUrl: reader.result as string }));
            }
            reader.readAsDataURL(value);
        } else if (typeof value === 'string') {
             if (field === 'store') {
                setEditItemFormData(prev => ({...prev, store: value, address: ''}));
            } else {
                setEditItemFormData(prev => ({ ...prev, [field]: value }));
            }
        }
    };


    const calculateTotal = (items: ShoppingItems[]) => {
        return items.reduce((total, item) => total + (item.price || 0), 0);
    }

    const baseGrandTotal = (list ?? []).reduce(
    (total, item) => total + (item.price || 0),
    0
    );

    const grouped = useMemo(() => {
        const map: Record<string, ShoppingItems[]> = {};
       (list ?? []).forEach(i => {
            const key = i.shopping_category || 'General';
            if (!map[key]) map[key] = [];
            map[key].push(i);
        });
        return Object.keys(map).map(k => ({ name: k, items: map[k] }));
    }, [list]);
    
    const grandTotalInCurrent = displayCurrency === 'trip' ? baseGrandTotal : convertToHomeCurrency(baseGrandTotal);
    
    const currencyButtonLabel = displayCurrency === 'trip' 
    ? `${tripCurrency} \u2194 ${homeCurrency}`
    : `${homeCurrency} \u2194 ${tripCurrency}`;


  return (
    <div className="space-y-4 pb-20">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground" onClick={() => router.push('/trips')}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline text-primary-foreground">
                Shopping List
                </h1>
            </div>
        </div>
        <div />
      </header>

      <Card className="shadow-lg bg-card/80 backdrop-blur-sm border-white/20">
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardDescription>Grand Total ({currentCurrency})</CardDescription>
                    <CardTitle className="text-card-foreground">{currentFormatter(grandTotalInCurrent)}</CardTitle>
                </div>
                 <Button variant="outline" size="sm" onClick={toggleCurrency}>
                    <Repeat className="h-4 w-4 mr-2" />
                    <span>{currencyButtonLabel}</span>
                </Button>
            </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {grouped.map(group => {
            const baseCategoryTotal = calculateTotal(group.items);
            const categoryTotalInCurrent = displayCurrency === 'trip' ? baseCategoryTotal : convertToHomeCurrency(baseCategoryTotal);
            const CategoryIcon = iconMap[group.name] || ShoppingBasket;
            return (
            <Card key={group.name} className="bg-card/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-headline text-card-foreground flex items-center gap-2">
                            {CategoryIcon && <CategoryIcon className="h-5 w-5 text-primary" />}
                            {group.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-card-foreground">{currentFormatter(categoryTotalInCurrent)}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {group.items.map(item => {
                            const baseItemPrice = item.price || 0;
                            const itemPriceInCurrent = displayCurrency === 'trip' ? baseItemPrice : convertToHomeCurrency(baseItemPrice);
                            return (
                                <Card key={item.item_uuid} className={cn("overflow-hidden relative bg-card/80 backdrop-blur-sm border-white/20 shadow-lg", item.checked && "opacity-50")}>
                                     <div className="absolute top-2 left-2 z-10">
                                         <Checkbox
                                            id={`${group.name}-${item.item_uuid}`}
                                            checked={item.checked}
                                            onCheckedChange={(checked) =>
                                            onCheckChange(item.item_uuid, !!checked)
                                            }
                                            className="h-5 w-5 bg-background border-2"
                                        />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 z-10 bg-black/30 text-white hover:bg-black/50 hover:text-white">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger> 
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleEditItemClick(item)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete "{item.name}".</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteItem(item.item_uuid)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <div className="relative aspect-square w-full">
                                        {item.image_url && (
                                            <Image  
                                                src={item.image_url}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                        {item.checked && <div className="absolute inset-0 bg-background/60"></div>}
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <p className={cn(
                                            'text-sm font-medium leading-tight truncate text-card-foreground',
                                            item.checked ? 'text-muted-foreground line-through' : 'text-card-foreground'
                                        )}>
                                            {item.name}
                                        </p>
                                        <div className="space-y-1 text-xs text-muted-foreground">
                                            {item.store && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{item.store}</span>
                                                </div>
                                            )}
                                            {item.store && (
                                                <div className="flex items-center gap-1">
                                                    <Store className="h-3 w-3" />
                                                    <span className="truncate">{item.store}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className={cn(
                                            "text-xs font-semibold pt-1 text-card-foreground",
                                            item.checked ? 'text-muted-foreground line-through' : 'text-card-foreground'
                                        )}>
                                            {currentFormatter(itemPriceInCurrent)}
                                        </p>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        )})}
      </div>

       
       {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={(isOpen) => !isOpen && setEditingItem(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit: {editingItem.item.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                          <Label htmlFor="item-name">Item Name</Label>
                          <Input id="item-name" value={editItemFormData.name || ''} onChange={(e) => handleEditItemFormChange('name', e.target.value)} placeholder="e.g. Japanese KitKats" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="item-price">Price ({tripCurrency})</Label>
                          <Input id="item-price" type="number" value={editItemFormData.price || ''} onChange={(e) => handleEditItemFormChange('price', e.target.value)} placeholder="e.g. 15.00" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="item-location">Location</Label>
                            <Select value={editItemFormData.store || ''} onValueChange={(value) => handleEditItemFormChange('address', value)}>
                                <SelectTrigger id="item-location">
                                    <SelectValue placeholder="Select a location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {itineraryLocations.map(loc => (
                                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="item-store">Store / POI</Label>
                            <Select value={editItemFormData.store || ''} onValueChange={(value) => handleEditItemFormChange('store', value)} disabled={!editItemFormData.address}>
                                <SelectTrigger id="item-store">
                                    <SelectValue placeholder="Select a store" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pointsOfInterest.map(poi => (
                                        <SelectItem key={poi.name} value={poi.name}>{poi.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                          <Label>Image (Optional)</Label>
                          <div className="flex items-center gap-4">
                              {editItemFormData.previewUrl && <Image src={editItemFormData.previewUrl} alt="preview" width={60} height={60} className="rounded-md object-cover" />}
                              <Input 
                                  type="file" 
                                  accept="image/*" 
                                  ref={fileInputRef} 
                                  onChange={(e) => handleEditItemFormChange('file', e.target.files ? e.target.files[0] : null)}
                                  className="hidden"
                              />
                              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                  <Camera className="mr-2 h-4 w-4" />
                                  Change
                              </Button>
                               <Button variant="outline" onClick={() => handleEditItemFormChange('previewUrl', null)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                              </Button>
                          </div>
                      </div>
                  </div>
                  <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
                      <Button onClick={handleUpdateItem}>Save Changes</Button>
                  </DialogFooter>
            </DialogContent>
        </Dialog>
       )}
    </div>
  );
}
