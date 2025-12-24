
'use client';
import type { LucideIcon } from "lucide-react";

export type Activity = {
  activity_uuid: string;
  day_uuid: string;
  time: string;
  description: string;
  icon: string; // Now a string to match icon map keys
};

export type UserPhoto = {
    id: string;
    url: string;
};

export type ChecklistItem = {
    id: string;
    label: string;
    checked: boolean;
};

export type ItineraryItem = {
  day_uuid: string;
  trip_uuid: string;
  day_number: number;
  title: string;
  date: string;
  feedback: string | null;
  cover_image_url: string | null;
  cover_image_hint: string | null;
  activities: Activity[];
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

export type TripStatus = 'A' | 'U' | 'E'; // Active, Upcoming, Expried

export type Trip = {
  trip_uuid: string;
  trip_id: number;
  user_id: string;
  name: string;
  destination: string;
  country_code: string;
  start_date: string;
  end_date: string;
  status: TripStatus;
  cover_image_url: string;
  cover_image_hint: string;
  created_at: string;
  itinerary: ItineraryItem[];
  transactions: Transaction[];
  shopping_list: ShoppingCategory[];
  checklist: ChecklistItem[];
};
