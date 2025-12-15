'use client';
import type { FC } from 'react';
import { useState, useEffect, use } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, ArrowLeft, Settings } from 'lucide-react';

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
import type { Currency, Transaction, ShoppingCategory, Trip } from '@/lib/types';
import { mockTrips } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface TripDetailsPageProps {
  params: {
    tripId: string;
  };
}

interface TabContentProps {
  trip: Trip;
  setTrip: React.Dispatch<React.SetStateAction<Trip | undefined>>;
}

const TabContent: FC<TabContentProps> = ({ trip, setTrip }) => {
  const [activeTab, setActiveTab] = useState<Tab>('planner');

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

const CurrencySelector = () => {
  const { tripCurrency, setTripCurrency, rates } = useCurrency();
  return (
    <div className="absolute top-2 right-2 z-20">
      <Select
        value={tripCurrency}
        onValueChange={(value) => setTripCurrency(value as Currency)}
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

export default function TripDetailsPage({ params }: TripDetailsPageProps) {
  const resolvedParams = use(params);
  const [trip, setTrip] = useState<Trip | undefined>();
  const router = useRouter();
  const { setTripCurrencyFromCountry } = useCurrency();

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

  return (
    <main className="bg-muted flex min-h-screen items-center justify-center p-4 font-body">
      <div
        className="relative mx-auto h-[800px] w-full max-w-sm max-h-[90vh] rounded-[48px] border-8 border-black bg-cover bg-center shadow-2xl overflow-hidden"
        style={{ backgroundImage: `url(${trip.imageUrl})` }}
      >
        <div className="absolute inset-0 bg-black/50 z-0" />
        <div className="relative z-10 h-full flex flex-col">
            <div className="absolute top-0 left-1/2 z-20 h-7 w-1/3 -translate-x-1/2 bg-black rounded-b-2xl">
              <div className="absolute left-6 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-gray-700"></div>
              <div className="absolute left-1/2 top-1/2 h-4 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800"></div>
            </div>
            <CurrencySelector />
            <div className="flex h-full flex-col pt-7">
              <TabContent trip={trip} setTrip={setTrip} />
            </div>
        </div>
      </div>
    </main>
  );
}
