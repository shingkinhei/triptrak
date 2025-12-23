
'use client';
import type { FC } from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusCircle, Camera } from 'lucide-react';

import { BottomNav, type Tab } from '@/components/bottom-nav';
import { ExpenseTracker } from '@/components/expense-tracker';
import { MapView } from '@/components/map-view';
import { ShoppingList } from '@/components/shopping-list';
import { TripPlanner } from '@/components/trip-planner';
import { useCurrency } from '@/context/CurrencyContext';
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
import type { Currency, Transaction, ShoppingCategory, Trip, ShoppingItem, ItineraryItem, Activity, ChecklistItem } from '@/lib/types';
import { mockTrips } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface NewItemInput {
    name: string;
    price: string;
    categoryId: string;
    location: string;
    store: string;
    file: File | null;
    previewUrl?: string;
}

interface TabContentProps {
  trip: Trip;
  setTrip: React.Dispatch<React.SetStateAction<Trip | undefined>>;
  activeTab: Tab;
}

const TabContent: FC<TabContentProps> = ({ trip, setTrip, activeTab }) => {
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
      trip: trip,
      itinerary: trip.itinerary,
      setItinerary: (updater: React.SetStateAction<ItineraryItem[]>) => {
        setTrip((currentTrip) => {
          if (!currentTrip) return undefined;
          const newItinerary =
            typeof updater === 'function'
              ? updater(currentTrip.itinerary)
              : updater;
          return { ...currentTrip, itinerary: newItinerary };
        });
      },
      checklist: trip.checklist,
      setChecklist: (updater: React.SetStateAction<ChecklistItem[]>) => {
        setTrip((currentTrip) => {
            if (!currentTrip) return undefined;
            const newChecklist = typeof updater === 'function' ? updater(currentTrip.checklist) : updater;
            return { ...currentTrip, checklist: newChecklist };
        });
      },
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
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="h-full overflow-y-auto px-4 pb-4 pt-8"
      >
        <ActiveComponent {...componentProps[activeTab]} />
      </motion.div>
    </AnimatePresence>
  );
};

export default function TripDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tripId = pathname.split('/').pop();
  
  const [trip, setTrip] = useState<Trip | undefined>();
  const [activeTab, setActiveTab] = useState<Tab>('planner');
  const { setTripCurrencyFromCountry, tripCurrency } = useCurrency();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<NewItemInput>({ name: '', price: '', categoryId: '', location: '', store: '', file: null, previewUrl: '' });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const foundTrip = mockTrips.find((t) => t.id === tripId);
    setTrip(foundTrip);
    if (foundTrip) {
      setTripCurrencyFromCountry(foundTrip.country);
    }
  }, [tripId, setTripCurrencyFromCountry]);

  const itineraryLocations = useMemo(() => {
      if (!trip) return [];
      return [...new Set(trip.itinerary.map(i => i.title.replace(/arrival in |exploring |day trip to /i, '')))];
  }, [trip]);

  const pointsOfInterest = useMemo(() => {
      if (!trip) return [];
      const allPois = trip.itinerary.flatMap(day => 
          day.activities.map(activity => ({
              name: activity.description,
              location: day.title.replace(/arrival in |exploring |day trip to /i, '')
          }))
      );
      return allPois.filter(poi => 
          newItem.location ? poi.location === newItem.location : true
      );
  }, [trip, newItem.location]);

  if (!trip) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 font-body bg-background">
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
        if (field === 'location') {
            setNewItem(prev => ({...prev, location: value as string, store: ''}));
        } else {
            setNewItem(prev => ({ ...prev, [field]: value as string }));
        }
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
          location: newItem.location,
          store: newItem.store,
      };

      const categoryExists = trip.shoppingList.some(category => category.id === newItem.categoryId);

      if(categoryExists) {
        const updatedList = trip.shoppingList.map(category =>
            category.id === newItem.categoryId
              ? {
                  ...category,
                  items: [...category.items, newItemData],
                }
              : category
        );
        setShoppingList(updatedList);
      } else {
         // This case should ideally not happen if the UI is correct, but as a fallback:
         const newCategory: ShoppingCategory = {
           id: newItem.categoryId,
           name: newItem.categoryId, // Consider a better way to get category name
           items: [newItemData]
         };
         setShoppingList(prev => [...prev, newCategory]);
      }
      
      setNewItem({ name: '', price: '', categoryId: '', location: '', store: '', file: null, previewUrl: '' });
      setIsAddDialogOpen(false);
  }


  return (
    <main className="flex h-screen w-full flex-col bg-background font-body">
      <div
        className="relative flex-grow bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url(${trip.imageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/60 z-0" />
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex-grow overflow-hidden">
            <TabContent trip={trip} setTrip={setTrip} activeTab={activeTab} />
          </div>
          <BottomNav activeItem={activeTab} setActiveTab={setActiveTab} />
        </div>

        {activeTab === 'shopping' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                  <Button className="absolute bottom-24 right-8 h-16 w-16 rounded-full shadow-lg z-20">
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="item-location">Location</Label>
                            <Select value={newItem.location} onValueChange={(value) => handleInputChange('location', value)}>
                                <SelectTrigger id="item-location">
                                    <SelectValue placeholder="Select a location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {itineraryLocations.map(loc => (
                                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="item-store">Store / POI</Label>
                            <Select value={newItem.store} onValueChange={(value) => handleInputChange('store', value)} disabled={!newItem.location}>
                                <SelectTrigger id="item-store">
                                    <SelectValue placeholder="Select a store" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pointsOfInterest.map(poi => (
                                        <SelectItem key={poi.name} value={poi.name}>{poi.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
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
    </main>
  );
}
