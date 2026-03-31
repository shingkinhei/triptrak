
'use client';
import { useState, useEffect } from 'react';
import { LogOut, User, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/context/CurrencyContext';
import { BottomNav } from '@/components/bottom-nav';
import type { Currency, CurrencySetup } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
    const { homeCurrency, setHomeCurrency, currencies } = useCurrency();
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    
    const [fullName, setFullName] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        setIsClient(true);
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: userInfo, error } = await supabase
                    .from('users_info')
                    .select('display_name, home_currency')
                    .eq('user_id', user.id)
                    .single();

                if (userInfo) {
                    setFullName(userInfo.display_name || user.user_metadata.full_name || '');
                    if (userInfo.home_currency) {
                        setHomeCurrency(userInfo.home_currency as Currency);
                    }
                } else if (error) {
                    // Fallback to user_metadata if users_info is not available yet
                     setFullName(user.user_metadata.full_name || '');
                }
            }
        };
        fetchUserData();
    }, [supabase, setHomeCurrency]);

    const handleUpdateProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // First update auth.users metadata
        const { error: authError } = await supabase.auth.updateUser({
            data: { full_name: fullName }
        });

        // Then update users_info table
        const { error: dbError } = await supabase
            .from('users_info')
            .update({ display_name: fullName })
            .eq('user_id', user.id);

        if (authError || dbError) {
            toast({
                title: 'Error updating profile',
                description: authError?.message || dbError?.message,
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
    
    const handleCurrencyChange = async (newCurrency: Currency) => {
        setHomeCurrency(newCurrency); // Optimistic UI update
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { error } = await supabase
            .from('users_info')
            .update({ home_currency: newCurrency })
            .eq('user_id', user.id);

        if (error) {
            toast({
                title: 'Error updating currency',
                description: error.message,
                variant: 'destructive',
            });
            // Revert on error if needed, though useCurrency context is not easily reverted from here
        } else {
            toast({
                title: 'Home Currency Updated',
                description: `Your home currency is now ${newCurrency}.`,
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
    <main className="bg-background mx-0 lg:mx-24 font-body flex flex-col h-screen">
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
                            <Select value={homeCurrency} onValueChange={(value) => handleCurrencyChange(value as Currency)}>
                                <SelectTrigger id="home-currency">
                                    <SelectValue placeholder="Select your home currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map(c => (
                                        <SelectItem key={c.currency_code} value={c.currency_code}>
                                            {c.name} ({c.currency_code})
                                        </SelectItem>
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
