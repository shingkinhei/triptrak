'use client';
import { useRef, useState } from 'react';
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
import { Plus, Camera, DollarSign, ListPlus, MoreVertical, Edit, Trash2, Repeat } from 'lucide-react';
import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface ShoppingListProps {
  list: ShoppingCategory[];
  setList: React.Dispatch<React.SetStateAction<ShoppingCategory[]>>;
  onCheckChange: (categoryId: string, itemId: string, checked: boolean) => void;
  trip: Trip;
}

interface NewItemInputs {
    [categoryId: string]: {
      name: string;
      price: string;
      file: File | null;
      previewUrl?: string;
    };
  }

type DisplayCurrency = 'trip' | 'home';

const AddCategoryDialog = ({ onAddCategory }: { onAddCategory: (name: string) => void }) => {
    const [categoryName, setCategoryName] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleAdd = () => {
        if (categoryName.trim()) {
            onAddCategory(categoryName.trim());
            setCategoryName('');
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
    const [newItems, setNewItems] = useState<NewItemInputs>({});
    const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
    const { tripCurrency, tripRate, formatCurrency, homeCurrency, convertToHomeCurrency, formatHomeCurrency } = useCurrency();
    const [renamingCategory, setRenamingCategory] = useState<ShoppingCategory | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('trip');

    const currentRate = displayCurrency === 'trip' ? tripRate : 1;
    const currentFormatter = displayCurrency === 'trip' ? formatCurrency : formatHomeCurrency;
    const currentCurrency = displayCurrency === 'trip' ? tripCurrency : homeCurrency;

    const toggleCurrency = () => {
        setDisplayCurrency(prev => (prev === 'trip' ? 'home' : 'trip'));
    };

    const handleFileChange = (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewItems(prev => ({
                    ...prev,
                    [categoryId]: { ...prev[categoryId], file, previewUrl: reader.result as string },
                }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleInputChange = (categoryId: string, field: 'name' | 'price', value: string) => {
        setNewItems(prev => ({
            ...prev,
            [categoryId]: { ...prev[categoryId], [field]: value },
        }));
    };

    const handleAddItem = (categoryId: string) => {
        const newItemInput = newItems[categoryId];
        if (!newItemInput || !newItemInput.name.trim()) return;

        const newItem: ShoppingItem = {
            id: new Date().toISOString(),
            name: newItemInput.name.trim(),
            checked: false,
            price: parseFloat(newItemInput.price) || 0,
            imageUrl: newItemInput.previewUrl || `https://picsum.photos/seed/${newItemInput.name.trim()}/100/100`
        };

        setList(prevList =>
            prevList.map(category =>
              category.id === categoryId
                ? {
                    ...category,
                    items: [...category.items, newItem],
                  }
                : category
            )
        );
        
        setNewItems(prev => ({
            ...prev,
            [categoryId]: { name: '', price: '', file: null, previewUrl: '' },
        }));

        if(fileInputRefs.current[categoryId]) {
            fileInputRefs.current[categoryId]!.value = '';
        }
    }

    const handleAddCategory = (name: string) => {
        const newCategory: ShoppingCategory = {
            id: `cat-${name.toLowerCase().replace(/\s/g, '-')}-${new Date().getTime()}`,
            name: name,
            items: [],
        };
        setList(prev => [...prev, newCategory]);
    };

    const handleRenameCategory = () => {
        if (!renamingCategory || !newCategoryName.trim()) return;
        setList(prevList => prevList.map(cat => 
            cat.id === renamingCategory.id ? { ...cat, name: newCategoryName } : cat
        ));
        setRenamingCategory(null);
        setNewCategoryName('');
    };

    const handleDeleteCategory = (categoryId: string) => {
        setList(prevList => prevList.filter(cat => cat.id !== categoryId));
    };

    const calculateTotal = (items: ShoppingItem[]) => {
        return items.reduce((total, item) => total + (item.price || 0), 0);
    }
    
    const baseGrandTotal = list.reduce((total, category) => total + calculateTotal(category.items), 0);
    
    const grandTotalInCurrent = displayCurrency === 'trip' ? baseGrandTotal * tripRate : convertToHomeCurrency(baseGrandTotal);

  return (
    <div className="space-y-4">
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
                    <span>{tripCurrency} &harr; {homeCurrency}</span>
                </Button>
            </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {list.map(category => {
            const baseCategoryTotal = calculateTotal(category.items);
            const categoryTotalInCurrent = displayCurrency === 'trip' ? baseCategoryTotal * tripRate : convertToHomeCurrency(baseCategoryTotal);
            return (
            <Card key={category.id}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-headline text-foreground">{category.name}</CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground">{currentFormatter(categoryTotalInCurrent)}</span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setRenamingCategory(category); setNewCategoryName(category.name); }}>
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
                <CardContent className="space-y-3">
                    {category.items.map(item => {
                        const baseItemPrice = item.price || 0;
                        const itemPriceInCurrent = displayCurrency === 'trip' ? baseItemPrice * tripRate : convertToHomeCurrency(baseItemPrice);
                        return (
                            <div key={item.id} className="flex items-center space-x-3">
                                <Checkbox
                                    id={`${category.id}-${item.id}`}
                                    checked={item.checked}
                                    onCheckedChange={(checked) =>
                                      onCheckChange(category.id, item.id, !!checked)
                                    }
                                    className="peer"
                                />
                                {item.imageUrl && (
                                  <Image 
                                    src={item.imageUrl}
                                    alt={item.name}
                                    width={60}
                                    height={60}
                                    className="rounded-md object-cover"
                                  />
                                )}
                                <label
                                    htmlFor={`${category.id}-${item.id}`}
                                    className={cn(
                                    'text-sm font-medium leading-none flex-grow',
                                    'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                                    item.checked ? 'text-muted-foreground line-through' : 'text-foreground'
                                    )}
                                >
                                    {item.name}
                                </label>
                                <div className={cn("text-sm font-semibold", item.checked ? 'text-muted-foreground line-through' : 'text-foreground')}>
                                    {currentFormatter(itemPriceInCurrent)}
                                </div>
                            </div>
                        )
                    })}
                    <div className="space-y-2 pt-2">
                        <Input 
                            placeholder="Add new item..." 
                            className="h-9"
                            value={newItems[category.id]?.name || ''}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem(category.id)}
                            onChange={(e) => handleInputChange(category.id, 'name', e.target.value)}
                        />
                        <div className="flex gap-2 items-center">
                           {newItems[category.id]?.previewUrl && (
                                <Image src={newItems[category.id]!.previewUrl!} alt="Preview" width={40} height={40} className="rounded-md object-cover" />
                            )}
                             <div className="relative flex-grow">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input 
                                    type="number"
                                    placeholder="Price (USD)" 
                                    className="h-9 pl-7 w-full"
                                    value={newItems[category.id]?.price || ''}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem(category.id)}
                                    onChange={(e) => handleInputChange(category.id, 'price', e.target.value)}
                                />
                             </div>
                             <input 
                                type="file" 
                                accept="image/*"
                                className="hidden" 
                                ref={(el) => fileInputRefs.current[category.id] = el}
                                onChange={(e) => handleFileChange(category.id, e)}
                             />
                            <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => fileInputRefs.current[category.id]?.click()}>
                                <Camera className="h-4 w-4" />
                            </Button>
                            <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => handleAddItem(category.id)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )})}
      </div>

       {renamingCategory && (
        <Dialog open={!!renamingCategory} onOpenChange={(isOpen) => !isOpen && setRenamingCategory(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Category</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category-name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="category-name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="col-span-3"
                            placeholder="New category name"
                        />
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
