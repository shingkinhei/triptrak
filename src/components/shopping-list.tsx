'use client';
import React, { useRef, useState } from 'react';
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
import { ListPlus, MoreVertical, Edit, Trash2, Repeat, Gift, Home, Plane, Shirt, ShoppingBasket, UtensilsCrossed, Luggage, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
                <Button variant="outline">
                    <ListPlus className="mr-2 h-4 w-4" />
                    Add Category
                </Button>
            </DialogTrigger>
            <DialogContent>
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
                            <SelectContent>
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
    const [renamingCategory, setRenamingCategory] = useState<ShoppingCategory | null>(null);
    const [editFormData, setEditFormData] = useState<{name: string; icon: string}>({ name: '', icon: '' });
    const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('trip');
    

    const currentFormatter = displayCurrency === 'trip' ? formatCurrency : formatHomeCurrency;
    const currentCurrency = displayCurrency === 'trip' ? tripCurrency : homeCurrency;

    const toggleCurrency = () => {
        setDisplayCurrency(prev => {
            if (prev === 'trip') return 'home';
            return 'trip';
        });
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
        if (!renamingCategory || !editFormData.name.trim()) return;
        setList(prevList => prevList.map(cat => 
            cat.id === renamingCategory.id ? { ...cat, name: editFormData.name, icon: editFormData.icon } : cat
        ));
        setRenamingCategory(null);
        setEditFormData({ name: '', icon: '' });
    };

    const handleDeleteCategory = (categoryId: string) => {
        setList(prevList => prevList.filter(cat => cat.id !== categoryId));
    };

    const calculateTotal = (items: ShoppingItem[]) => {
        return items.reduce((total, item) => total + (item.price || 0), 0);
    }
    
    const baseGrandTotal = list.reduce((total, category) => total + calculateTotal(category.items), 0);
    
    const grandTotalInCurrent = displayCurrency === 'trip' ? baseGrandTotal : convertToHomeCurrency(baseGrandTotal);

  return (
    <div className="space-y-4 pb-20">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold font-headline text-foreground">
            Shopping List
            </h1>
            <p className="text-muted-foreground">
            Everything you need for your trip.
            </p>
        </div>
        <AddCategoryDialog onAddCategory={handleAddCategory} />
      </header>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardDescription>Grand Total ({currentCurrency})</CardDescription>
                    <CardTitle>{currentFormatter(grandTotalInCurrent)}</CardTitle>
                </div>
                 <Button variant="outline" size="sm" onClick={toggleCurrency}>
                    <Repeat className="h-4 w-4 mr-2" />
                     {displayCurrency === 'trip' ? (
                        <span>{tripCurrency} &harr; {homeCurrency}</span>
                    ) : (
                        <span>{homeCurrency} &harr; {tripCurrency}</span>
                    )}
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
            <Card key={category.id}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-headline text-foreground flex items-center gap-2">
                            {CategoryIcon && <CategoryIcon className="h-5 w-5 text-primary" />}
                            {category.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground">{currentFormatter(categoryTotalInCurrent)}</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setRenamingCategory(category); setEditFormData({ name: category.name, icon: category.icon || 'ShoppingBasket' }); }}>
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
                                        <AlertDialogContent>
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
                                <Card key={item.id} className={cn("overflow-hidden relative", item.checked && "opacity-50")}>
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
                                    <div className="p-2">
                                        <p className={cn(
                                            'text-sm font-medium leading-tight truncate',
                                            item.checked ? 'text-muted-foreground line-through' : 'text-foreground'
                                        )}>
                                            {item.name}
                                        </p>
                                        <p className={cn(
                                            "text-xs font-semibold",
                                            item.checked ? 'text-muted-foreground line-through' : 'text-foreground'
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
            <DialogContent>
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
                            value={editFormData.name}
                            onChange={(e) => setEditFormData(prev => ({...prev, name: e.target.value}))}
                            className="col-span-3"
                            placeholder="New category name"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category-icon-edit" className="text-right">
                            Icon
                        </Label>
                        <Select value={editFormData.icon} onValueChange={(value) => setEditFormData(prev => ({...prev, icon: value}))}>
                            <SelectTrigger id="category-icon-edit" className="col-span-3">
                                <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                            <SelectContent>
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
    </div>
  );
}
