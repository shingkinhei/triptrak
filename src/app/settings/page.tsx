
'use client';
import { useState, useEffect } from 'react';
import { Home, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/context/CurrencyContext';
import { BottomNav } from '@/components/bottom-nav';
import type { Currency } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { homeCurrency, setHomeCurrency, rates } = useCurrency();
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleLogout = () => {
        // Mock logout logic
        console.log('Logging out...');
        router.push('/login');
    }

  return (
    <main className="bg-background font-body flex flex-col h-screen">
        <header className="mb-4 flex items-center justify-between px-4 pt-4 shrink-0 mt-4">
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
             <div className="space-y-4">
                 <Button variant="destructive" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
        <BottomNav activeItem="settings" />
    </main>
  );
}
