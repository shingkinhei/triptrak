'use client';
import type { LucideIcon } from "lucide-react";

export type Activity = {
  id: string;
  time: string;
  description: string;
  icon: string; // Now a string to match icon map keys
};

export type UserPhoto = {
    id: string;
    url: string;
};

export type ItineraryItem = {
  day: number;
  title: string;
  date: string;
  image: {
    url: string;
    hint: string;
  }
  activities: Activity[];
  remarks?: string;
  userPhotos?: UserPhoto[];
};

export type TransactionCategory = 'Food' | 'Transport' | 'Shopping' | 'Accommodation' | 'Other';

export type Transaction = {
  id: string;
  name: string;
  category: TransactionCategory;
  amount: number;
  date: string;
};

export type ShoppingItem = {
  id: string;
  name:string;
  checked: boolean;
  imageUrl?: string;
  price?: number;
  location?: string;
  store?: string;
};

export type ShoppingCategory = {
  id: string;
  name: string;
  icon?: string;
  items: ShoppingItem[];
};

export type Currency = 'USD' | 'JPY' | 'EUR' | 'HKD';

export type ExchangeRates = {
  [key in Currency]: number;
};

export type TripStatus = 'active' | 'upcoming' | 'archived';

export type Trip = {
  id: string;
  name: string;
  destination: string;
  country: string; // e.g., 'JP', 'IT'
  startDate: string;
  endDate: string;
  status: TripStatus;
  imageUrl: string;
  imageHint: string;
  itinerary: ItineraryItem[];
  transactions: Transaction[];
  shoppingList: ShoppingCategory[];
};
