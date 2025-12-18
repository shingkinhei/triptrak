'use client';
import React, { useRef, useState, useMemo } from 'react';
import type { ShoppingCategory, ShoppingItem, Trip } from '@/lib/types';
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
  list: ShoppingCategory[];
  setList: React.Dispatch<React.SetStateAction<ShoppingCategory[]>>;
  onCheckChange: (categoryId: string, itemId: string, checked: boolean) => void;
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

const AddCategoryDialog = ({ onAddCategory }: { onAddCategory: (name: string, icon: string) => void }) => {
    const [categoryName, setCategoryName] = useState('');
    const [icon, setIcon] = useState('ShoppingBasket');
    const [isOpen, setIsOpen] = useState(false);

    const handleAdd = () => {
        if (categoryName.trim()) {
            onAddCategory(categoryName.trim(), icon);
            setCategoryName('');
            setIcon('ShoppingBasket');
            setIsOpen(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                    <ListPlus className="mr-2 h-4 w-4" />
                    Add Category
                </Button>
            </DialogTrigger>
            <DialogContent className="shadow-lg">
                <DialogHeader>
                    <DialogTitle>Create New Category</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category-name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="category-name"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g. Toiletries"
                        />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category-icon" className="text-right">
                            Icon
                        </Label>
                        <Select value={icon} onValueChange={setIcon}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                            <SelectContent className="shadow-lg">
                                {iconOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        <div className="flex items-center gap-2">
                                            {React.createElement(iconMap[opt.value], { className: "h-4 w-4" })}
                                            <span>{opt.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                     <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd}>Add Category</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export function ShoppingList({ list, setList, onCheckChange, trip }: ShoppingListProps) {
    const { tripCurrency, tripRate, formatCurrency, homeCurrency, convertToHomeCurrency, formatHomeCurrency } = useCurrency();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for main dialogs
    const [renamingCategory, setRenamingCategory] = useState<ShoppingCategory | null>(null);
    
    // State for editing items
    const [editingItem, setEditingItem] = useState<{ categoryId: string; item: ShoppingItem; } | null>(null);
    const [editItemFormData, setEditItemFormData] = useState<Partial<ShoppingItem> & { file?: File | null, previewUrl?: string | null }>({});

    // Other state
    const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('trip');
    const [editCategoryFormData, setEditCategoryFormData] = useState<{name: string; icon: string}>({ name: '', icon: '' });


    const itineraryLocations = useMemo(() => {
        if (!trip) return [];
        return [...new Set(trip.itinerary.map(i => i.title.replace(/arrival in |exploring |day trip to /i, '')))];
    }, [trip]);

    const pointsOfInterest = useMemo(() => {
        if (!trip) return [];
        const allPois = trip.itinerary.flatMap(day => 
            day.activities.map(activity => ({
                name: activity.description,
                location: day.title.replace(/arrival in |exploring |day trip to /i, '')
            }))
        );
        return allPois.filter(poi => 
            editingItem ? poi.location === editItemFormData.location : true
        );
    }, [trip, editingItem, editItemFormData.location]);


    const currentFormatter = displayCurrency === 'trip' ? formatCurrency : formatHomeCurrency;
    const currentCurrency = displayCurrency === 'trip' ? tripCurrency : homeCurrency;

    const toggleCurrency = () => {
        setDisplayCurrency(prev => (prev === 'trip' ? 'home' : 'trip'));
    };

    const handleAddCategory = (name: string, icon: string) => {
        const newCategory: ShoppingCategory = {
            id: `cat-${name.toLowerCase().replace(/\s/g, '-')}-${new Date().getTime()}`,
            name: name,
            icon: icon,
            items: [],
        };
        setList(prev => [...prev, newCategory]);
    };

    const handleRenameCategory = () => {
        if (!renamingCategory || !editCategoryFormData.name.trim()) return;
        setList(prevList => prevList.map(cat => 
            cat.id === renamingCategory.id ? { ...cat, name: editCategoryFormData.name, icon: editCategoryFormData.icon } : cat
        ));
        setRenamingCategory(null);
        setEditCategoryFormData({ name: '', icon: '' });
    };

    const handleDeleteCategory = (categoryId: string) => {
        setList(prevList => prevList.filter(cat => cat.id !== categoryId));
    };

    const handleEditItemClick = (categoryId: string, item: ShoppingItem) => {
      setEditingItem({ categoryId, item });
      setEditItemFormData({ ...item, previewUrl: item.imageUrl });
    };

    const handleUpdateItem = () => {
        if (!editingItem) return;

        const updatedItem = {
            ...editingItem.item,
            ...editItemFormData,
            price: parseFloat(String(editItemFormData.price || 0)) || 0,
            imageUrl: editItemFormData.previewUrl || editingItem.item.imageUrl,
        };
        // remove temporary fields
        delete updatedItem.file;
        delete updatedItem.previewUrl;


        setList(prevList => prevList.map(category => {
            if (category.id === editingItem.categoryId) {
                return {
                    ...category,
                    items: category.items.map(item => item.id === editingItem.item.id ? updatedItem : item)
                };
            }
            return category;
        }));
        
        setEditingItem(null);
        setEditItemFormData({});
    };

    const handleDeleteItem = (categoryId: string, itemId: string) => {
        setList(prevList => prevList.map(category => {
            if (category.id === categoryId) {
                return {
                    ...category,
                    items: category.items.filter(item => item.id !== itemId)
                };
            }
            return category;
        }));
    };
    
    const handleEditItemFormChange = (field: keyof typeof editItemFormData, value: string | File | null) => {
        if (field === 'file' && value instanceof File) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditItemFormData(prev => ({ ...prev, file: value, previewUrl: reader.result as string }));
            }
            reader.readAsDataURL(value);
        } else if (typeof value === 'string') {
             if (field === 'location') {
                setEditItemFormData(prev => ({...prev, location: value, store: ''}));
            } else {
                setEditItemFormData(prev => ({ ...prev, [field]: value }));
            }
        }
    };


    const calculateTotal = (items: ShoppingItem[]) => {
        return items.reduce((total, item) => total + (item.price || 0), 0);
    }
    
    const baseGrandTotal = list.reduce((total, category) => total + calculateTotal(category.items), 0);
    
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
        <AddCategoryDialog onAddCategory={handleAddCategory} />
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
        {list.map(category => {
            const baseCategoryTotal = calculateTotal(category.items);
            const categoryTotalInCurrent = displayCurrency === 'trip' ? baseCategoryTotal : convertToHomeCurrency(baseCategoryTotal);
            const CategoryIcon = category.icon ? iconMap[category.icon] : ShoppingBasket;
            return (
            <Card key={category.id} className="bg-card/80 backdrop-blur-sm border-white/20 shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-headline text-card-foreground flex items-center gap-2">
                            {CategoryIcon && <CategoryIcon className="h-5 w-5 text-primary" />}
                            {category.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-card-foreground">{currentFormatter(categoryTotalInCurrent)}</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="shadow-lg">
                                    <DropdownMenuItem onClick={() => { setRenamingCategory(category); setEditCategoryFormData({ name: category.name, icon: category.icon || 'ShoppingBasket' }); }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Rename
                                    </DropdownMenuItem>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="shadow-lg">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the "{category.name}" category and all its items. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteCategory(category.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {category.items.map(item => {
                            const baseItemPrice = item.price || 0;
                            const itemPriceInCurrent = displayCurrency === 'trip' ? baseItemPrice : convertToHomeCurrency(baseItemPrice);
                            return (
                                <Card key={item.id} className={cn("overflow-hidden relative bg-card/80 backdrop-blur-sm border-white/20 shadow-lg", item.checked && "opacity-50")}>
                                     <div className="absolute top-2 left-2 z-10">
                                         <Checkbox
                                            id={`${category.id}-${item.id}`}
                                            checked={item.checked}
                                            onCheckedChange={(checked) =>
                                            onCheckChange(category.id, item.id, !!checked)
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
                                            <DropdownMenuItem onClick={() => handleEditItemClick(category.id, item)}>
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
                                                        <AlertDialogAction onClick={() => handleDeleteItem(category.id, item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <div className="relative aspect-square w-full">
                                        {item.imageUrl && (
                                            <Image 
                                                src={item.imageUrl}
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
                                            {item.location && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{item.location}</span>
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

       {renamingCategory && (
        <Dialog open={!!renamingCategory} onOpenChange={(isOpen) => !isOpen && setRenamingCategory(null)}>
            <DialogContent className="shadow-lg">
                <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category-name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="category-name"
                            value={editCategoryFormData.name}
                            onChange={(e) => setEditCategoryFormData(prev => ({...prev, name: e.target.value}))}
                            className="col-span-3"
                            placeholder="New category name"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category-icon-edit" className="text-right">
                            Icon
                        </Label>
                        <Select value={editCategoryFormData.icon} onValueChange={(value) => setEditCategoryFormData(prev => ({...prev, icon: value}))}>
                            <SelectTrigger id="category-icon-edit" className="col-span-3">
                                <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                            <SelectContent className="shadow-lg">
                                {iconOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        <div className="flex items-center gap-2">
                                            {React.createElement(iconMap[opt.value], { className: "h-4 w-4" })}
                                            <span>{opt.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setRenamingCategory(null)}>Cancel</Button>
                    <Button onClick={handleRenameCategory}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
       )}
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
                            <Select value={editItemFormData.location || ''} onValueChange={(value) => handleEditItemFormChange('location', value)}>
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
                            <Select value={editItemFormData.store || ''} onValueChange={(value) => handleEditItemFormChange('store', value)} disabled={!editItemFormData.location}>
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
