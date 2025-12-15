'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { mockTrips } from '@/lib/mock-data';
import type { Trip } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch this from a persistent store (e.g., localStorage or an API)
    const activeTrip = mockTrips.find(trip => trip.status === 'active');
    
    if (activeTrip) {
      router.replace(`/trip/${activeTrip.id}`);
    } else {
      router.replace('/trips');
    }
  }, [router]);

  return (
    <main className="bg-muted flex min-h-screen items-center justify-center p-4 font-body">
      <div className="text-center">
        <p>Loading your adventure...</p>
      </div>
    </main>
  );
}
