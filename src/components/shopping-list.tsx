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

const initialShoppingList: ShoppingCategory[] = [
    {
      id: 'essentials',
      name: 'Essentials',
      items: [
        { id: '1', name: 'Passport', checked: true },
        { id: '2', name: 'Flight tickets', checked: true },
        { id: '3', name: 'Hotel confirmation', checked: false },
      ],
    },
    {
      id: 'clothing',
      name: 'Clothing',
      items: [
        { id: '4', name: 'T-shirts (x5)', checked: false },
        { id: '5', name: 'Jeans (x2)', checked: false },
        { id: '6', name: 'Jacket', checked: true },
      ],
    },
    {
      id: 'toiletries',
      name: 'Toiletries',
      items: [
        { id: '7', name: 'Toothbrush', checked: true },
        { id: '8', name: 'Toothpaste', checked: false },
        { id: '9', name: 'Shampoo', checked: false },
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
                            />
                            <label
                                htmlFor={`${category.id}-${item.id}`}
                                className={cn(
                                'text-sm font-medium leading-none',
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddItem(category.id);
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
