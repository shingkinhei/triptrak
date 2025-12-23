
'use client';
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/trips');
      } else {
        router.replace('/login');
      }
    };

    checkSession();
  }, [router, supabase]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4 font-body bg-background">
      <div className="text-center">
        <p>Loading...</p>
      </div>
    </main>
  );
}
