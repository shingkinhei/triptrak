
'use client';
import { useState, useEffect } from 'react';
import { LogOut, User, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/context/CurrencyContext';
import { BottomNav } from '@/components/bottom-nav';
import type { Currency } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
    const { homeCurrency, setHomeCurrency, rates } = useCurrency();
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    
    const [fullName, setFullName] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        setIsClient(true);
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setFullName(user.user_metadata.full_name || '');
            }
        };
        fetchUser();
    }, [supabase]);

    const handleUpdateProfile = async () => {
        const { error } = await supabase.auth.updateUser({
            data: { full_name: fullName }
        });
        if (error) {
            toast({
                title: 'Error updating profile',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Profile Updated',
                description: 'Your name has been successfully updated.',
            });
        }
    };
    
    const handleUpdatePassword = async () => {
        if (!newPassword) {
            toast({
                title: 'Password cannot be empty',
                variant: 'destructive',
            });
            return;
        }
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            toast({
                title: 'Error updating password',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            setNewPassword('');
            toast({
                title: 'Password Updated',
                description: 'Your password has been changed successfully.',
            });
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast({
                title: 'Error logging out',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            router.push('/login');
            router.refresh();
        }
    }

  return (
    <main className="bg-background font-body flex flex-col h-screen">
        <header className="mb-4 flex items-center justify-between px-4 pt-4 shrink-0 mt-4">
            <div>
                <h1 className="text-2xl font-bold font-headline text-foreground">
                    Settings
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage your app preferences and account.
                </p>
            </div>
        </header>

        <div className="flex-grow px-4 space-y-6 overflow-y-auto pb-24">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/> Profile</CardTitle>
                    <CardDescription>Manage your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <Button onClick={handleUpdateProfile}>Save Changes</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/> Password</CardTitle>
                    <CardDescription>Change your account password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter a new password"/>
                    </div>
                    <Button onClick={handleUpdatePassword}>Change Password</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize your app experience.</CardDescription>
                </CardHeader>
                 <CardContent>
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
                </CardContent>
            </Card>

             <div className="space-y-4 pt-4">
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
