'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Facebook } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { generateGuestMockTrip } from '@/lib/mock-data';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const supabase = createClient();
    const { toast } = useToast();
    const t = useTranslations('auth');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast({
                title: 'Error logging in',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            router.push(`/${locale}/trips`);
            router.refresh();
        }
    };

     const handleGuestLogin = async () => {
        const { data: { user }, error } = await supabase.auth.signInAnonymously();
        
        if (user && !error) {
            // Generate the local mock structure
            const { trip, activities, expenses, shoppingList} = generateGuestMockTrip(user.id);

            // Batch insert into Supabase
            // Note: Ensure your RLS allows 'authenticated' (which includes anonymous) to insert
            const { error: tripErr } = await supabase.from('trips').insert(trip);

            //get day_uuid
            const { data: dayUuidData, error: dayUuidErr } = await supabase.from("trip_days").select('day_uuid').eq("trip_uuid", trip.trip_uuid);
            //resort activities
            activities.forEach((activity: any) => {
                activity.day_uuid = dayUuidData[0].day_uuid
            })
            const { error: actErr } = await supabase.from('activities').upsert(activities);
            const { error: expErr } = await supabase.from('expenses').upsert(expenses);
            const { error: listErr } = await supabase.from('shopping_items').upsert(shoppingList);

            if (expErr) {
                toast({
                    title: 'Error logging in',
                    description: expErr.message,
                    variant: 'destructive',
                });
            }

            if (!tripErr && !actErr && !expErr && !listErr) {
            router.push(`/trip/${trip.trip_uuid}`);
            }
        }
    };
    
    const handleFacebookLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
        });

        if (error) {
            toast({
                title: 'Error logging in with Facebook',
                description: error.message,
                variant: 'destructive',
            });
        } 
        console.log('Facebook login initiated');
    };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 font-body">
        <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
            <div className="flex justify-center"><Image src="/images/logo.png" alt="logo" width={150} height={150} /></div>
            <CardTitle className="text-2xl font-headline">{t('loginTitle')}</CardTitle>
            <CardDescription>
            {t('login')}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="grid gap-2">
                <div className="flex items-center">
                <Label htmlFor="password">{t('password')}</Label>
                <Link
                    href={`/${locale}/forgot-password`}
                    className="ml-auto inline-block text-sm underline"
                >
                    {t('forgotPassword')}
                </Link>
                </div>
                <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            <Button type="submit" className="w-full" onClick={handleLogin}>
                {t('login')}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGuestLogin}>
                {t('loginAsGuest')}
            </Button>
            <Button variant="outline" className="w-full" onClick={handleFacebookLogin}>
                <Facebook className="mr-2 h-4 w-4" />
                {t('loginWithFacebook')}
            </Button>
            </div>
            <div className="mt-4 text-center text-sm">
            {t("dontHaveAnAccount?")}{' '}
            <Link href={`/${locale}/signup`} className="underline">
                {t('signup')}
            </Link>
            </div>
        </CardContent>
        </Card>
    </main>
  );
}
