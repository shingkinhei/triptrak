'use client';
import { useRef, useState } from 'react';
import type { ShoppingCategory, ShoppingItem, CatalogueCategory, CatalogueItem } from '@/lib/types';
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
import { Plus, Camera, DollarSign, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';

interface ShoppingListProps {
  list: ShoppingCategory[];
  setList: React.Dispatch<React.SetStateAction<ShoppingCategory[]>>;
  onCheckChange: (categoryId: string, itemId: string, checked: boolean) => void;
}

interface NewItemInputs {
    [categoryId: string]: {
      name: string;
      price: string;
      file: File | null;
      previewUrl?: string;
    };
  }

  const catalogueData: CatalogueCategory[] = [
    {
      id: 'electronics',
      name: 'Electronics',
      items: [
        { id: 'cat-e-1', name: 'Phone Charger', price: 20, imageUrl: 'https://picsum.photos/seed/charger/100/100' },
        { id: 'cat-e-2', name: 'Power Bank', price: 40, imageUrl: 'https://picsum.photos/seed/powerbank/100/100' },
        { id: 'cat-e-3', name: 'Travel Adapter', price: 25, imageUrl: 'https://picsum.photos/seed/adapter/100/100' },
      ],
    },
    {
      id: 'health',
      name: 'Health & Hygiene',
      items: [
        { id: 'cat-h-1', name: 'First-aid Kit', price: 30, imageUrl: 'https://picsum.photos/seed/firstaid/100/100' },
        { id: 'cat-h-2', name: 'Hand Sanitizer', price: 5, imageUrl: 'https://picsum.photos/seed/sanitizer/100/100' },
        { id: 'cat-h-3', name: 'Sunscreen', price: 15, imageUrl: 'https://picsum.photos/seed/sunscreen/100/100' },
      ],
    },
    {
      id: 'documents',
      name: 'Documents',
      items: [
        { id: 'cat-d-1', name: 'Passport Holder', price: 15, imageUrl: 'https://picsum.photos/seed/passportholder/100/100' },
        { id: 'cat-d-2', name: 'Travel Wallet', price: 25, imageUrl: 'https://picsum.photos/seed/travelwallet/100/100' },
      ],
    },
  ];

  const CatalogueDialog = ({ onAddItems }: { onAddItems: (items: ShoppingItem[]) => void }) => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
    const handleToggleItem = (itemId: string) => {
      setSelectedItems(prev =>
        prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
      );
    };
  
    const handleAdd = () => {
      const itemsToAdd: ShoppingItem[] = [];
      catalogueData.forEach(category => {
        category.items.forEach(item => {
          if (selectedItems.includes(item.id)) {
            itemsToAdd.push({
              id: `cat-item-${new Date().getTime()}-${item.id}`,
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl,
              checked: false,
            });
          }
        });
      });
      onAddItems(itemsToAdd);
      setSelectedItems([]);
    };
  
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Catalogue
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add from Catalogue</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-grow pr-6 -mr-6">
            <div className="space-y-4">
              {catalogueData.map(category => (
                <div key={category.id}>
                  <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                  <div className="space-y-2">
                    {category.items.map(item => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center space-x-3 p-2 rounded-md cursor-pointer border",
                          selectedItems.includes(item.id) ? "bg-accent/50 border-accent" : "bg-transparent"
                        )}
                        onClick={() => handleToggleItem(item.id)}
                      >
                         {item.imageUrl && (
                              <Image 
                                src={item.imageUrl}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="rounded-md object-cover"
                              />
                            )}
                        <label className="text-sm font-medium leading-none flex-grow pointer-events-none">
                          {item.name}
                        </label>
                        <div className="text-sm font-semibold text-foreground">
                          ${item.price.toFixed(2)}
                        </div>
                        <Checkbox checked={selectedItems.includes(item.id)} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogTrigger asChild>
                <Button variant="outline">Cancel</Button>
            </DialogTrigger>
            <DialogTrigger asChild>
                <Button onClick={handleAdd}>Add {selectedItems.length} items</Button>
            </DialogTrigger>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

export function ShoppingList({ list, setList, onCheckChange }: ShoppingListProps) {
    const [newItems, setNewItems] = useState<NewItemInputs>({});
    const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
    const { currency, rate, formatCurrency } = useCurrency();

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

    const handleAddFromCatalogue = (itemsToAdd: ShoppingItem[]) => {
        // For simplicity, adding all items to the 'essentials' category.
        // A more advanced implementation could let the user choose.
        const targetCategoryId = 'essentials'; 
    
        setList(prevList => {
          const newList = [...prevList];
          const categoryIndex = newList.findIndex(c => c.id === targetCategoryId);
    
          if (categoryIndex !== -1) {
            newList[categoryIndex] = {
              ...newList[categoryIndex],
              items: [...newList[categoryIndex].items, ...itemsToAdd],
            };
          } else {
            // Or create a new category if 'essentials' doesn't exist
            newList.push({
              id: targetCategoryId,
              name: 'From Catalogue',
              items: itemsToAdd,
            });
          }
          return newList;
        });
      };

    const calculateTotal = (items: ShoppingItem[]) => {
        return items.reduce((total, item) => total + (item.price || 0), 0);
    }

    const grandTotal = list.reduce((total, category) => total + calculateTotal(category.items), 0) * rate;

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
        <CatalogueDialog onAddItems={handleAddFromCatalogue} />
      </header>

      <Card>
        <CardHeader>
          <CardDescription>Grand Total ({currency})</CardDescription>
          <CardTitle>{formatCurrency(grandTotal)}</CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {list.map(category => {
            const categoryTotal = calculateTotal(category.items) * rate;
            return (
            <Card key={category.id}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-headline">{category.name}</CardTitle>
                        <span className="font-semibold text-muted-foreground">{formatCurrency(categoryTotal)}</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {category.items.map(item => (
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
                                width={40}
                                height={40}
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
                                {formatCurrency((item.price || 0) * rate)}
                            </div>
                        </div>
                    ))}
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
                             <div className="relative w-28 flex-grow">
                                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input 
                                    type="number"
                                    placeholder="Price" 
                                    className="h-9 pl-7"
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
    </div>
  );
}
