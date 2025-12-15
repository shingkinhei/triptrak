'use client';
import type { FC } from 'react';
import { useState, useEffect, use, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, ArrowLeft, Settings, PlusCircle, Camera } from 'lucide-react';

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Currency, Transaction, ShoppingCategory, Trip, ShoppingItem } from '@/lib/types';
import { mockTrips } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface TripDetailsPageProps {
  params: {
    tripId: string;
  };
}

interface NewItemInput {
    name: string;
    price: string;
    categoryId: string;
    store: string;
    file: File | null;
    previewUrl?: string;
}

interface TabContentProps {
  trip: Trip;
  setTrip: React.Dispatch<React.SetStateAction<Trip | undefined>>;
  activeTab: Tab;
  setActiveTab: React.Dispatch<React.SetStateAction<Tab>>;
}

const TabContent: FC<TabContentProps> = ({ trip, setTrip, activeTab, setActiveTab }) => {
  const { tripCurrency } = useCurrency();

  const handleShoppingItemCheck = (
    categoryId: string,
    itemId: string,
    checked: boolean
  ) => {
    let checkedItemName: string | undefined;
    let checkedItemPrice: number | undefined;

    const newList = trip.shoppingList.map((category) => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: category.items.map((item) => {
            if (item.id === itemId) {
              if (checked && item.price && item.price > 0) {
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

    setTrip((currentTrip) =>
      currentTrip ? { ...currentTrip, shoppingList: newList } : undefined
    );

    if (checkedItemName && checkedItemPrice) {
      const newTransaction: Transaction = {
        id: `shop-${itemId}`,
        name: checkedItemName,
        category: 'Shopping',
        amount: checkedItemPrice,
        date: new Date().toISOString().split('T')[0],
      };

      // Avoid adding duplicates
      if (!trip.transactions.some((t) => t.id === newTransaction.id)) {
        setTrip((currentTrip) =>
          currentTrip
            ? {
                ...currentTrip,
                transactions: [newTransaction, ...currentTrip.transactions],
              }
            : undefined
        );
      }
    }
  };

  const tabComponents: Record<Tab, React.ComponentType<any>> = {
    planner: TripPlanner,
    map: MapView,
    expenses: ExpenseTracker,
    shopping: ShoppingList,
  };

  const setTransactions = (updater: React.SetStateAction<Transaction[]>) => {
    setTrip((currentTrip) => {
      if (!currentTrip) return undefined;
      const newTransactions =
        typeof updater === 'function'
          ? updater(currentTrip.transactions)
          : updater;
      return { ...currentTrip, transactions: newTransactions };
    });
  };

  const setShoppingList = (
    updater: React.SetStateAction<ShoppingCategory[]>
  ) => {
    setTrip((currentTrip) => {
      if (!currentTrip) return undefined;
      const newShoppingList =
        typeof updater === 'function'
          ? updater(currentTrip.shoppingList)
          : updater;
      return { ...currentTrip, shoppingList: newShoppingList };
    });
  };

  const componentProps = {
    planner: {
      itinerary: trip.itinerary,
      setItinerary: (updater: any) =>
        setTrip((currentTrip) =>
          currentTrip
            ? {
                ...currentTrip,
                itinerary:
                  typeof updater === 'function'
                    ? updater(currentTrip.itinerary)
                    : updater,
              }
            : undefined
        ),
    },
    map: {
      locations: trip.itinerary.map((i) => ({
        lat: 35.6895,
        lng: 139.6917,
        name: i.title,
      })),
    }, // Example, needs real coordinates
    expenses: { transactions: trip.transactions, setTransactions, trip },
    shopping: {
      list: trip.shoppingList,
      setList: setShoppingList,
      onCheckChange: handleShoppingItemCheck,
      trip: trip
    },
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
            <ActiveComponent {...componentProps[activeTab]} />
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav activeItem={activeTab} setActiveTab={setActiveTab} />
    </>
  );
};

export default function TripDetailsPage({ params }: TripDetailsPageProps) {
  const resolvedParams = use(params);
  const [trip, setTrip] = useState<Trip | undefined>();
  const [activeTab, setActiveTab] = useState<Tab>('planner');
  const router = useRouter();
  const { setTripCurrencyFromCountry, tripCurrency } = useCurrency();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<NewItemInput>({ name: '', price: '', categoryId: '', store: '', file: null, previewUrl: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const foundTrip = mockTrips.find((t) => t.id === resolvedParams.tripId);
    setTrip(foundTrip);
    if (foundTrip) {
      setTripCurrencyFromCountry(foundTrip.country);
    }
  }, [resolvedParams, setTripCurrencyFromCountry]);

  if (!trip) {
    return (
      <main className="bg-muted flex min-h-screen items-center justify-center p-4 font-body">
        <div>Loading trip...</div>
      </main>
    );
  }

  const setShoppingList = (
    updater: React.SetStateAction<ShoppingCategory[]>
  ) => {
    setTrip((currentTrip) => {
      if (!currentTrip) return undefined;
      const newShoppingList =
        typeof updater === 'function'
          ? updater(currentTrip.shoppingList)
          : updater;
      return { ...currentTrip, shoppingList: newShoppingList };
    });
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
          imageUrl: newItem.previewUrl || `https://picsum.photos/seed/${newItem.name.trim()}/100/100`,
          store: newItem.store,
      };

      setShoppingList(prevList =>
          prevList.map(category =>
            category.id === newItem.categoryId
              ? {
                  ...category,
                  items: [...category.items, newItemData],
                }
              : category
          )
      );
      
      setNewItem({ name: '', price: '', categoryId: '', store: '', file: null, previewUrl: '' });
      setIsAddDialogOpen(false);
  }

  const itineraryLocations = trip.itinerary.map(i => i.title.replace(/arrival in |exploring |day trip to /i, ''));


  return (
    <main className="bg-muted flex min-h-screen items-center justify-center p-4 font-body">
      <div
        className="relative mx-auto h-[800px] w-full max-w-sm max-h-[90vh] rounded-[48px] border-8 border-black bg-background shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-background/80 z-0" />
        <div className="relative z-10 h-full flex flex-col">
            <div className="absolute top-0 left-1/2 z-20 h-7 w-1/3 -translate-x-1/2 bg-black rounded-b-2xl">
              <div className="absolute left-6 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-gray-700"></div>
              <div className="absolute left-1/2 top-1/2 h-4 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800"></div>
            </div>
            <div className="flex h-full flex-col pt-7">
              <TabContent trip={trip} setTrip={setTrip} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            {activeTab === 'shopping' && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                      <Button className="absolute bottom-20 right-8 h-16 w-16 rounded-full shadow-lg z-20">
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
                                      {trip.shoppingList.map(cat => (
                                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="item-store">Store / Location</Label>
                              <Select value={newItem.store} onValueChange={(value) => handleInputChange('store', value)}>
                                  <SelectTrigger id="item-store">
                                      <SelectValue placeholder="Select a store" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {[...new Set(itineraryLocations)].map(loc => (
                                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
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
            )}
        </div>
      </div>
    </main>
  );
}
