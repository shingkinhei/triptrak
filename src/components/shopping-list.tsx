'use client';
import { useState } from 'react';
import type { ShoppingCategory, ShoppingItem } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import Image from 'next/image';

const initialShoppingList: ShoppingCategory[] = [
    {
      id: 'essentials',
      name: 'Essentials',
      items: [
        { id: '1', name: 'Passport', checked: true, imageUrl: 'https://picsum.photos/seed/passport/100/100' },
        { id: '2', name: 'Flight tickets', checked: true, imageUrl: 'https://picsum.photos/seed/tickets/100/100' },
        { id: '3', name: 'Hotel confirmation', checked: false, imageUrl: 'https://picsum.photos/seed/hotel/100/100' },
      ],
    },
    {
      id: 'clothing',
      name: 'Clothing',
      items: [
        { id: '4', name: 'T-shirts (x5)', checked: false, imageUrl: 'https://picsum.photos/seed/tshirt/100/100' },
        { id: '5', name: 'Jeans (x2)', checked: false, imageUrl: 'https://picsum.photos/seed/jeans/100/100' },
        { id: '6', name: 'Jacket', checked: true, imageUrl: 'https://picsum.photos/seed/jacket/100/100' },
      ],
    },
    {
      id: 'toiletries',
      name: 'Toiletries',
      items: [
        { id: '7', name: 'Toothbrush', checked: true, imageUrl: 'https://picsum.photos/seed/toothbrush/100/100' },
        { id: '8', name: 'Toothpaste', checked: false, imageUrl: 'https://picsum.photos/seed/toothpaste/100/100' },
        { id: '9', name: 'Shampoo', checked: false, imageUrl: 'https://picsum.photos/seed/shampoo/100/100' },
      ],
    },
  ];

export function ShoppingList() {
    const [list, setList] = useState<ShoppingCategory[]>(initialShoppingList);
    const [newItemName, setNewItemName] = useState('');

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

    const handleAddItem = (categoryId: string) => {
        if (!newItemName.trim()) return;

        const newItem: ShoppingItem = {
            id: new Date().toISOString(),
            name: newItemName.trim(),
            checked: false,
            imageUrl: `https://picsum.photos/seed/${newItemName.trim()}/100/100`
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
        setNewItemName('');
    }

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

      <div className="space-y-4">
        {list.map(category => (
            <Card key={category.id}>
                <CardHeader>
                    <CardTitle className="text-lg font-headline">{category.name}</CardTitle>
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
                        </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                        <Input 
                            placeholder="Add new item..." 
                            className="h-9"
                            value={newItemName}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddItem(category.id);
                                }
                            }}
                            onChange={(e) => setNewItemName(e.target.value)}
                         />
                        <Button size="icon" className="h-9 w-9 shrink-0" onClick={() => handleAddItem(category.id)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
    </div>
  );
}
