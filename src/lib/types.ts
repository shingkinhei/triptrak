import type { LucideIcon } from "lucide-react";

export type ItineraryItem = {
  day: number;
  title: string;
  date: string;
  image: {
    url: string;
    hint: string;
  }
  activities: {
    time: string;
    description: string;
    icon: LucideIcon;
  }[];
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
};

export type ShoppingCategory = {
  id: string;
  name: string;
  items: ShoppingItem[];
};
