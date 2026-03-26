
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Facebook } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
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
            router.push('/trips');
            router.refresh();
        }
    };

    const handleFacebookLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            toast({
                title: 'Error logging in with Facebook',
                description: error.message,
                variant: 'destructive',
            });
        }
        console.log('Facebook login initiated');
        // Don't redirect manually - the OAuth callback will handle it
    };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 font-body">
        <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
            <CardTitle className="text-2xl font-headline">Login</CardTitle>
            <CardDescription>
            Enter your email below to login to your account
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Password</Label>
                <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline"
                >
                    Forgot your password?
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
                
                Login
            </Button>
            <Button variant="outline" className="w-full" onClick={handleFacebookLogin}>
                <Facebook className="mr-2 h-4 w-4" />
                Login with Facebook
            </Button>
            </div>
            <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
                Sign up
            </Link>
            </div>
        </CardContent>
        </Card>
    </main>
  );
}
