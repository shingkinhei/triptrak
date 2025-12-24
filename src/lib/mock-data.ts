
import type { Trip } from './types';
import { PlaceHolderImages } from './placeholder-images';

const japanTripId = 'japan-2024';
const italyTripId = 'italy-2025';

// This file is becoming less relevant as we move to a DB-first approach.
// It can be kept for testing or as a fallback.
// Note: The structure here must match the `Trip` and related types in `lib/types.ts`

export const mockTrips: Trip[] = [
  // This mock data does not fully represent the new normalized schema
  // and may cause issues if used directly without fetching from Supabase.
  // It is retained for structural reference.
];
