'use client';
import { useState, useEffect } from 'react';
import { Home, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/context/CurrencyContext';
import { BottomNav } from '@/components/bottom-nav';
import type { Currency } from '@/lib/types';

export default function SettingsPage() {
    const { homeCurrency, setHomeCurrency, rates } = useCurrency();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

  return (
    <main className="bg-muted flex min-h-screen items-center justify-center p-4 font-body">
       <div className="relative mx-auto h-[800px] w-full max-w-sm max-h-[90vh] rounded-[48px] border-8 border-black bg-background shadow-2xl overflow-hidden flex flex-col">
        <div className="absolute top-0 left-1/2 z-20 h-7 w-1/3 -translate-x-1/2 bg-black rounded-b-2xl">
            <div className="absolute left-6 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-gray-700"></div>
            <div className="absolute left-1/2 top-1/2 h-4 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-800"></div>
        </div>

        <div className="flex h-full flex-col pt-7 flex-grow overflow-hidden">
            <header className="mb-4 flex items-center justify-between px-4 pt-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold font-headline text-foreground">
                        Settings
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your app preferences.
                    </p>
                </div>
            </header>

            <div className="flex-grow px-4 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="home-currency">Home Currency</Label>
                    <p className="text-sm text-muted-foreground">
                        This is your primary currency for reference.
                    </p>
                    {isClient && (
                         <Select value={homeCurrency} onValueChange={(value) => setHomeCurrency(value as Currency)}>
                            <SelectTrigger id="home-currency">
                                <SelectValue placeholder="Select your home currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(rates).map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>
        </div>
        <BottomNav activeItem="settings" />
      </div>
    </main>
  );
}
