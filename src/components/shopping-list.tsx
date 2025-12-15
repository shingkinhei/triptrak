'use client';
import { useRef, useState } from 'react';
import type { ShoppingCategory, ShoppingItem } from '@/lib/types';
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
import { Plus, Camera, DollarSign } from 'lucide-react';
import Image from 'next/image';

const initialShoppingList: ShoppingCategory[] = [
    {
      id: 'essentials',
      name: 'Essentials',
      items: [
        { id: '1', name: 'Passport', checked: true, imageUrl: 'https://picsum.photos/seed/passport/100/100', price: 0 },
        { id: '2', name: 'Flight tickets', checked: true, imageUrl: 'https://picsum.photos/seed/tickets/100/100', price: 850 },
        { id: '3', name: 'Hotel confirmation', checked: false, imageUrl: 'https://picsum.photos/seed/hotel/100/100', price: 1200 },
      ],
    },
    {
      id: 'clothing',
      name: 'Clothing',
      items: [
        { id: '4', name: 'T-shirts (x5)', checked: false, imageUrl: 'https://picsum.photos/seed/tshirt/100/100', price: 100 },
        { id: '5', name: 'Jeans (x2)', checked: false, imageUrl: 'https://picsum.photos/seed/jeans/100/100', price: 150 },
        { id: '6', name: 'Jacket', checked: true, imageUrl: 'https://picsum.photos/seed/jacket/100/100', price: 120 },
      ],
    },
    {
      id: 'toiletries',
      name: 'Toiletries',
      items: [
        { id: '7', name: 'Toothbrush', checked: true, imageUrl: 'https://picsum.photos/seed/toothbrush/100/100', price: 5 },
        { id: '8', name: 'Toothpaste', checked: false, imageUrl: 'https://picsum.photos/seed/toothpaste/100/100', price: 3 },
        { id: '9', name: 'Shampoo', checked: false, imageUrl: 'https://picsum.photos/seed/shampoo/100/100', price: 10 },
      ],
    },
  ];

interface NewItemInputs {
    [categoryId: string]: {
      name: string;
      price: string;
      file: File | null;
      previewUrl?: string;
    };
  }

export function ShoppingList() {
    const [list, setList] = useState<ShoppingCategory[]>(initialShoppingList);
    const [newItems, setNewItems] = useState<NewItemInputs>({});
    const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

    const handleCheckChange = (categoryId: string, itemId: string, checked: boolean) => {
        setList(prevList =>
          prevList.map(category =>
            category.id === categoryId
              ? {
                  ...category,
                  items: category.items.map(item =>
                    item.id === itemId ? { ...item, checked } : item
                  ),
                }
              : category
          )
        );
    };
    
    const handleInputChange = (categoryId: string, field: 'name' | 'price', value: string) => {
        setNewItems(prev => ({
            ...prev,
            [categoryId]: { ...prev[categoryId], [field]: value },
        }));
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

    const calculateTotal = (items: ShoppingItem[]) => {
        return items.reduce((total, item) => total + (item.price || 0), 0);
    }

    const grandTotal = list.reduce((total, category) => total + calculateTotal(category.items), 0);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold font-headline text-foreground">
          Shopping List
        </h1>
        <p className="text-muted-foreground">
          Everything you need for your trip.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardDescription>Grand Total</CardDescription>
          <CardTitle>${grandTotal.toLocaleString()}</CardTitle>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {list.map(category => {
            const categoryTotal = calculateTotal(category.items);
            return (
            <Card key={category.id}>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-headline">{category.name}</CardTitle>
                        <span className="font-semibold text-muted-foreground">${categoryTotal.toLocaleString()}</span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {category.items.map(item => (
                        <div key={item.id} className="flex items-center space-x-3">
                            <Checkbox
                                id={`${category.id}-${item.id}`}
                                checked={item.checked}
                                onCheckedChange={(checked) =>
                                  handleCheckChange(category.id, item.id, !!checked)
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
                                ${item.price?.toLocaleString() || '0'}
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                        {newItems[category.id]?.previewUrl && (
                            <Image src={newItems[category.id]!.previewUrl!} alt="Preview" width={40} height={40} className="rounded-md object-cover" />
                        )}
                         <div className="relative flex-grow">
                            <Input 
                                placeholder="Add new item..." 
                                className="h-9"
                                value={newItems[category.id]?.name || ''}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddItem(category.id)}
                                onChange={(e) => handleInputChange(category.id, 'name', e.target.value)}
                            />
                         </div>
                         <div className="relative w-24">
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
                </CardContent>
            </Card>
        )})}
      </div>
    </div>
  );
}
