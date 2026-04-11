'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

export default function SignupPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const supabase = createClient();
    const { toast } = useToast();
    const t = useTranslations('auth');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');


    const handleSignup = async () => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });

        if (error) {
            toast({
                title: 'Error signing up',
                description: error.message,
                variant: 'destructive',
            });
        } else if (data.user) {
            if (data.user.identities && data.user.identities.length === 0) {
                 toast({
                    title: 'Confirmation required',
                    description: 'Please check your email to confirm your account. The user already exists.',
                    variant: 'default',
                });
            } else {
                 // Insert into users_info table
                const homeLanguage = locale === "zh-TW" ? "zh-TW" : "ENG";
                const { error: insertError } = await supabase.from('users_info').insert({
                    user_id: data.user.id,
                    email: data.user.email,
                    display_name: fullName,
                    home_currency: 'USD',
                    home_language: homeLanguage,
                });

                if (insertError) {
                     toast({
                        title: 'Error creating user profile',
                        description: insertError.message,
                        variant: 'destructive',
                    });
                } else {
                     toast({
                        title: 'Confirmation required',
                        description: 'Please check your email to confirm your account.',
                        variant: 'default',
                    });
                    router.push(`/${locale}/login`);
                }
            }
        }
    }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 font-body">
        <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
            <CardTitle className="text-xl font-headline">{t('signupTitle')}</CardTitle>
            <CardDescription>
            {t('signup')}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
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
                <Label htmlFor="password">{t('password')}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" onClick={handleSignup}>
                Create an account
            </Button>
            </div>
            <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href={`/${locale}/login`} className="underline">
                {t('login')}
            </Link>
            </div>
        </CardContent>
        </Card>
    </main>
  );
}
