
'use client';
import type { LucideIcon } from "lucide-react";

export type Activity = {
  activity_uuid: string;
  day_uuid: string;
  time: string;
  name: string;
  description: string;
  address?: string | null;
  activity_type: string;
  ai_plan?: boolean | false;
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
  weather_icon: string | null;
  temperature: number | null;
  tripDayPhotos: TripDayPhotos[];
};

// export type ExpenseCategory = 'Food' | 'Transport' | 'Shopping' | 'Accommodation' | 'Other';

export type Expenses = {
  expense_uuid: string;
  trip_uuid: string;
  name: string;
  expense_category: string;
  amount: number;
  date: string;
  currency_code: string;
  user_id: string | null;
  created_at?: string | null;
};

export type ShoppingItems = {
  item_uuid: string;
  trip_uuid: string;
  shopping_category: string | null;
  name: string;
  store?: string | null;
  address?: string | null;
  checked: boolean;
  image_url: string | null;
  price: number;
  pcs: number;
  user_id: string | null;
  created_at?: string | null;
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
  trip_id?: number;
  user_id: string;
  name: string;
  destination: string;
  country_code: string;
  currency_code: string;
  start_date: string;
  end_date: string;
  status: TripStatus;
  cover_image_url: string;
  cover_image_hint: string;
  created_at: string;
  // These are now handled separately
  //itinerary: ItineraryItem[];
  //expenses: Expenses[];
  // shoppingItems: ShoppingItems[];
  //checklist: ChecklistItem[];
};

export type ActivityOptions = {
  activity_type: string;
  icon_text: string;
  color_code: string;
  description: string;
  ai_preference: boolean;
};