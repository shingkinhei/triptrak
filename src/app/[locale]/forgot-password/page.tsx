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
import { ChevronLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function ForgotPasswordPage() {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 font-body">
        <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
            <CardTitle className="text-2xl font-headline">Forgot Password</CardTitle>
            <CardDescription>
            Enter your email and we will send you a link to reset your password.
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
                />
            </div>
            
            <Button type="submit" className="w-full">
                Send Reset Link
            </Button>
            </div>
            <div className="mt-4 text-center text-sm">
                <Link href={`/${locale}/login`} className="flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="h-4 w-4" />
                    Back to login
                </Link>
            </div>
        </CardContent>
        </Card>
    </main>
  );
}
