'use client';
import type { FC } from 'react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe } from 'lucide-react';

import { BottomNav, type Tab } from '@/components/bottom-nav';
import { ExpenseTracker } from '@/components/expense-tracker';
import { MapView } from '@/components/map-view';
import { ShoppingList } from '@/components/shopping-list';
import { TripPlanner } from '@/components/trip-planner';
import { CurrencyProvider, useCurrency } from '@/context/CurrencyContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Currency, Transaction, ShoppingCategory, TransactionCategory } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const initialShoppingList: ShoppingCategory[] = [
    {
      id: 'essentials',
      name: 'Essentials',
      items: [
        { id: '1', name: 'Passport', checked: true, imageUrl: PlaceHolderImages.find(p=>p.id === 'tokyo')?.imageUrl, price: 0 },
        { id: '2', name: 'Flight tickets', checked: true, imageUrl: PlaceHolderImages.find(p=>p.id === 'kyoto')?.imageUrl, price: 850 },
        { id: '3', name: 'Hotel confirmation', checked: false, imageUrl: PlaceHolderImages.find(p=>p.id === 'osaka')?.imageUrl, price: 1200 },
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

  const mockTransactions: Transaction[] = [
    { id: '1', name: 'Ichiran Ramen', category: 'Food', amount: 15, date: '2024-10-26' },
    { id: '2', name: 'Train to Shinjuku', category: 'Transport', amount: 25, date: '2024-10-26' },
    { id: '3', name: 'Park Hyatt Tokyo', category: 'Accommodation', amount: 450, date: '2024-10-26' },
    { id: '4', name: 'Fushimi Inari Souvenir', category: 'Shopping', amount: 45, date: '2024-10-27' },
    { id: '5', name: 'Kaiseki Dinner', category: 'Food', amount: 120, date: '2024-10-27' },
    { id: '6', name: 'Dotonbori Takoyaki', category: 'Food', amount: 10, date: '2024-10-28' },
  ];

interface TabContentProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  shoppingList: ShoppingCategory[];
  setShoppingList: React.Dispatch<React.SetStateAction<ShoppingCategory[]>>;
}

const TabContent: FC<TabContentProps> = ({ transactions, setTransactions, shoppingList, setShoppingList }) => {
  const [activeTab, setActiveTab] = useState<Tab>('planner');

  const handleShoppingItemCheck = (categoryId: string, itemId: string, checked: boolean) => {
    let checkedItemName: string | undefined;
    let checkedItemPrice: number | undefined;

    const newList = shoppingList.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: category.items.map(item => {
            if (item.id === itemId) {
              if(checked && item.price && item.price > 0) {
                checkedItemName = item.name;
                checkedItemPrice = item.price;
              }
              return { ...item, checked };
            }
            return item;
          }),
        };
      }
      return category;
    });

    setShoppingList(newList);

    if (checkedItemName && checkedItemPrice) {
      const newTransaction: Transaction = {
        id: `shop-${itemId}`,
        name: checkedItemName,
        category: 'Shopping',
        amount: checkedItemPrice,
        date: new Date().toISOString().split('T')[0],
      };
      
      // Avoid adding duplicates
      if (!transactions.some(t => t.id === newTransaction.id)) {
        setTransactions(prev => [newTransaction, ...prev]);
      }
    }
  };
  
  const tabComponents: Record<Tab, FC> = {
    planner: TripPlanner,
    map: MapView,
    expenses: () => <ExpenseTracker transactions={transactions} setTransactions={setTransactions} />,
    shopping: () => <ShoppingList list={shoppingList} setList={setShoppingList} onCheckChange={handleShoppingItemCheck} />,
  };
  
  const ActiveComponent = tabComponents[activeTab];

  return (
    <>
      <div className="flex-grow overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full overflow-y-auto px-4 pb-4"
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
};

const CurrencySelector = () => {
  const { currency, setCurrency, rates } = useCurrency();
  return (
    <div className="absolute top-2 right-2 z-20">
      <Select
        value={currency}
        onValueChange={(value) => setCurrency(value as Currency)}
      >
        <SelectTrigger className="h-8 w-28 bg-black/20 text-white border-white/30">
          <Globe className="h-4 w-4 mr-1" />
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(rates).map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [shoppingList, setShoppingList] = useState<ShoppingCategory[]>(initialShoppingList);

  return (
    <main className="bg-muted flex min-h-screen items-center justify-center p-4 font-body">
      <div className="relative mx-auto h-[800px] w-full max-w-sm max-h-[90vh] rounded-[48px] border-8 border-black bg-background shadow-2xl overflow-hidden">
        <CurrencyProvider>
          <div className="absolute top-0 left-1/2 z-20 h-7 w-1/3 -translate-x-1/2 bg-black rounded-b-2xl">
            <div className="absolute left-6 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-gray-700"></div>
            <div className="absolute left-1/2 top-1/2 h-4 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800"></div>
          </div>
          <CurrencySelector />
          <div className="flex h-full flex-col pt-7">
            <TabContent 
              transactions={transactions} 
              setTransactions={setTransactions} 
              shoppingList={shoppingList}
              setShoppingList={setShoppingList}
            />
          </div>
        </CurrencyProvider>
      </div>
    </main>
  );
}
