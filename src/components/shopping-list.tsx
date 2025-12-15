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
import { Plus, Camera, DollarSign, ListPlus, MoreVertical, Edit, Trash2, Repeat, PlusCircle } from 'lucide-react';
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

interface NewItemInput {
    name: string;
    price: string;
    categoryId: string;
    file: File | null;
    previewUrl?: string;
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

const MOCK_RATES = {
    USD: 1,
    JPY: 157,
    EUR: 0.92,
    HKD: 7.8,
};

export function ShoppingList({ list, setList, onCheckChange, trip }: ShoppingListProps) {
    const { tripCurrency, tripRate, formatCurrency, homeCurrency, convertToHomeCurrency, formatHomeCurrency } = useCurrency();
    const [renamingCategory, setRenamingCategory] = useState<ShoppingCategory | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('trip');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newItem, setNewItem] = useState<NewItemInput>({ name: '', price: '', categoryId: '', file: null, previewUrl: '' });
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const currentFormatter = displayCurrency === 'trip' ? formatCurrency : formatHomeCurrency;
    const currentCurrency = displayCurrency === 'trip' ? tripCurrency : homeCurrency;

    const toggleCurrency = () => {
        setDisplayCurrency(prev => (prev === 'trip' ? 'home' : 'trip'));
    };
    
    const handleInputChange = (field: keyof NewItemInput, value: string | File | null) => {
        if (field === 'file' && value instanceof File) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewItem(prev => ({ ...prev, file: value, previewUrl: reader.result as string }));
            }
            reader.readAsDataURL(value);
        } else {
            setNewItem(prev => ({ ...prev, [field]: value as string }));
        }
    };

    const handleAddItem = () => {
        if (!newItem.name.trim() || !newItem.categoryId) return;

        const newItemData: ShoppingItem = {
            id: new Date().toISOString(),
            name: newItem.name.trim(),
            checked: false,
            price: parseFloat(newItem.price) || 0,
            imageUrl: newItem.previewUrl || `https://picsum.photos/seed/${newItem.name.trim()}/100/100`
        };

        setList(prevList =>
            prevList.map(category =>
              category.id === newItem.categoryId
                ? {
                    ...category,
                    items: [...category.items, newItemData],
                  }
                : category
            )
        );
        
        setNewItem({ name: '', price: '', categoryId: '', file: null, previewUrl: '' });
        setIsAddDialogOpen(false);
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
    
    const grandTotalInCurrent = displayCurrency === 'trip' ? baseGrandTotal : convertToHomeCurrency(baseGrandTotal);

  return (
    <div className="space-y-4 relative pb-20 h-full">
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
                        const itemPriceInCurrent = displayCurrency === 'trip' ? baseItemPrice : convertToHomeCurrency(baseItemPrice);
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

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                 <Button className="fixed bottom-24 right-8 h-16 w-16 rounded-full shadow-lg z-20">
                    <PlusCircle className="h-8 w-8" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Shopping Item</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="item-name">Item Name</Label>
                        <Input id="item-name" value={newItem.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g. Japanese KitKats" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="item-price">Price ({tripCurrency})</Label>
                        <Input id="item-price" type="number" value={newItem.price} onChange={(e) => handleInputChange('price', e.target.value)} placeholder="e.g. 15.00" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="item-category">Category</Label>
                        <Select value={newItem.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                            <SelectTrigger id="item-category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {list.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Image (Optional)</Label>
                        <div className="flex items-center gap-4">
                            {newItem.previewUrl && <Image src={newItem.previewUrl} alt="preview" width={60} height={60} className="rounded-md object-cover" />}
                            <Input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef} 
                                onChange={(e) => handleInputChange('file', e.target.files ? e.target.files[0] : null)}
                                className="hidden"
                            />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <Camera className="mr-2 h-4 w-4" />
                                Upload
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddItem}>Add Item</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
