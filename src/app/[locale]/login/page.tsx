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
            <Button variant="outline" className="w-full" onClick={handleFacebookLogin}>
                <Facebook className="mr-2 h-4 w-4" />
                Login with Facebook
            </Button>
            </div>
            <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href={`/${locale}/signup`} className="underline">
                {t('signup')}
            </Link>
            </div>
        </CardContent>
        </Card>
    </main>
  );
}
