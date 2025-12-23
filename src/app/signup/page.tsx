
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
import { useRouter } from 'next/navigation';

export default function SignupPage() {
    const router = useRouter();

    const handleSignup = () => {
        // Mock signup logic
        console.log('Signing up...');
        router.push('/trips');
    }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 font-body">
        <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
            <CardTitle className="text-xl font-headline">Sign Up</CardTitle>
            <CardDescription>
            Enter your information to create an account
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input id="full-name" placeholder="John Doe" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" />
            </div>
            <Button type="submit" className="w-full" onClick={handleSignup}>
                Create an account
            </Button>
            <Button variant="outline" className="w-full">
                Sign up with Google
            </Button>
            </div>
            <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
                Login
            </Link>
            </div>
        </CardContent>
        </Card>
    </main>
  );
}
