
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // In a real app, you would check for an active session.
    // For this prototype, we'll just redirect to the login page.
    router.replace('/login');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4 font-body bg-background">
      <div className="text-center">
        <p>Loading...</p>
      </div>
    </main>
  );
}
