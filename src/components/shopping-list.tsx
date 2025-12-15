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
import { useCurrency } from '@/context/CurrencyContext';

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

    const calculateTotal = (items: ShoppingItem[]) => {
        return items.reduce((total, item) => total + (item.price || 0), 0);
    }

    const grandTotal = list.reduce((total, category) => total + calculateTotal(category.items), 0) * rate;

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
