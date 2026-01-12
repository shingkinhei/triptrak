
'use client';
import type { LucideIcon } from "lucide-react";

export type Activity = {
  activity_uuid: string;
  day_uuid: string;
  time: string;
  description: string;
  activity_type: string;
};

export type TripDayPhotos = {
    photo_uuid: string;
    day_uuid: string;
    seq: number;
    url: string;
    trip_day_photo?: File | null; 
    trip_day_photo_preview?: string | null;
  pending_delete?: boolean;
};

export type ChecklistItem = {
    checklist_uuid: string;
    // checklist_id: number |null;
    trip_uuid: string;
    label: string;
    checked: boolean;
    seq:number | null;
    created_at: string;
    user_id: string |null;
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
  tripDayPhotos: TripDayPhotos[];
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
  item_uuid: string;
  item_id: number;
  shopping_category: string | null;
  name: string | null;
  checked: boolean | null;
  image_url: string | null;
  price: number | null;
  user_id: string | null;
  created_at?: string | null;
};

export type ShoppingCategory = {
  id: string;
  name: string;
  icon?: string;
  items: ShoppingItem[];
};

export type Currency = string;

export type CurrencySetup = {
  currency_code: Currency;
  rate: number;
  name: string;
  symbol: string;
  country_code: string;
}

export type ExchangeRates = {
  [key: string]: number;
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
  // These are now handled separately
  itinerary: ItineraryItem[];
  transactions: Transaction[];
  shopping_list: ShoppingCategory[];
  checklist: ChecklistItem[];
};
