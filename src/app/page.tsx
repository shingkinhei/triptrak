'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/trips');
  }, [router]);

  return (
    <main className="bg-muted flex min-h-screen items-center justify-center p-4 font-body">
      <div className="text-center">
        <p>Redirecting to your trips...</p>
      </div>
    </main>
  );
}
