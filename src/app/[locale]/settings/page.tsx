"use client";

import { useState, useEffect } from "react";
import { LogOut, User, KeyRound } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/context/CurrencyContext";
import { BottomNav } from "@/components/bottom-nav";
import type { Currency } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AppLocale = "en" | "zh-TW";

function homeLanguageFromDb(value: string | null | undefined): AppLocale {
  if (!value) return "en";
  const v = value.trim();
  const upper = v.toUpperCase();
  if (v === "zh-TW" || upper === "ZHT" || upper === "ZH-TW") return "zh-TW";
  if (v === "en" || upper === "ENG") return "en";
  return "en";
}

function homeLanguageToDb(locale: AppLocale): string {
  return locale === "zh-TW" ? "zh-TW" : "ENG";
}

export default function SettingsPage() {
    const { homeCurrency, setHomeCurrency, currencies } = useCurrency();
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const routeLocale = (params?.locale as string) || 'en';
    const supabase = createClient();
    const { toast } = useToast();
    
    const [fullName, setFullName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [homeLanguage, setHomeLanguage] = useState<AppLocale>('en');

    const t = useTranslations('settings');
    const ct = useTranslations('common');
    useEffect(() => {
        setIsClient(true);
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: userInfo, error } = await supabase
                    .from('users_info')
                    .select('display_name, home_currency, home_language')
                    .eq('user_id', user.id)
                    .single();

                if (userInfo) {
                    setFullName(userInfo.display_name || user.user_metadata.full_name || '');
                    if (userInfo.home_currency) {
                        setHomeCurrency(userInfo.home_currency as Currency);
                    }
                    setHomeLanguage(homeLanguageFromDb(userInfo.home_language));
                } else if (error) {
                    // Fallback to user_metadata if users_info is not available yet
                    setFullName(user.user_metadata.full_name || "");
                    if (routeLocale === "en" || routeLocale === "zh-TW") {
                        setHomeLanguage(routeLocale);
                    }
                }
            }
        };
        fetchUserData();
    }, [supabase, setHomeCurrency, routeLocale]);

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

    const handleLanguageChange = async (newLocale: AppLocale) => {
        setHomeLanguage(newLocale);
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const dbValue = homeLanguageToDb(newLocale);
        const { error } = await supabase
            .from("users_info")
            .update({ home_language: dbValue })
            .eq("user_id", user.id);

        if (error) {
            toast({
                title: t("languageUpdateError"),
                description: error.message,
                variant: "destructive",
            });
            const { data: row } = await supabase
                .from("users_info")
                .select("home_language")
                .eq("user_id", user.id)
                .single();
            setHomeLanguage(homeLanguageFromDb(row?.home_language));
            return;
        }

        toast({
            title: t("languageUpdated"),
            description: t("languageUpdatedDescription"),
        });

        if (routeLocale !== newLocale && pathname) {
            const segments = pathname.split("/").filter(Boolean);
            if (
                segments.length > 0 &&
                (segments[0] === "en" || segments[0] === "zh-TW")
            ) {
                segments[0] = newLocale;
                router.replace(`/${segments.join("/")}`);
                router.refresh();
            }
        }
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast({
                title: "Error logging out",
                description: error.message,
                variant: "destructive",
            });
        } else {
            router.push(`/${routeLocale}/login`);
            router.refresh();
        }
    };

  return (
    <main className="bg-background mx-0 lg:mx-24 font-body flex flex-col h-screen">
        <header className="mb-4 flex items-center justify-between px-4 pt-4 shrink-0 mt-4">
            <div>
                <h1 className="text-2xl font-bold font-headline text-foreground">
                    {t('title')}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {t('titleDescription')}
                </p>
            </div>
        </header>

        <div className="flex-grow px-4 space-y-6 overflow-y-auto pb-24">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/>{t('profile')}</CardTitle>
                    <CardDescription>{t('profileDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full-name">{t('fullName')}</Label>
                        <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <Button onClick={handleUpdateProfile}>{t("saveChanges")}</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/>{t('password')}</CardTitle>
                    <CardDescription>{t('passwordDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">{t('newPassword')}</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('passwordPlaceholder')}/>
                    </div>
                    <Button onClick={handleUpdatePassword}>{t("changePassword")}</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("preferences")}</CardTitle>
                    <CardDescription>{t("preferencesDescription")}</CardDescription>
                </CardHeader>
                 <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="home-currency">{t("homeCurrency")}</Label>
                        <p className="text-sm text-muted-foreground">
                            {t("homeCurrencyDescription")}
                        </p>
                        {isClient && (
                            <Select value={homeCurrency} onValueChange={(value) => handleCurrencyChange(value as Currency)}>
                                <SelectTrigger id="home-currency">
                                    <SelectValue placeholder={t("homeCurrencyPlaceholder")} />
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
                    <div className="space-y-2 mt-6">
                        <Label htmlFor="preferred-language">{t("language")}</Label>
                        <p className="text-sm text-muted-foreground">
                            {t("languageDescription")}
                        </p>
                        {isClient && (
                            <Select
                                value={homeLanguage}
                                onValueChange={(value) => handleLanguageChange(value as AppLocale)}
                            >
                                <SelectTrigger id="preferred-language">
                                    <SelectValue placeholder={t("languagePlaceholder")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">{ct("english")}</SelectItem>
                                    <SelectItem value="zh-TW">{ct("chineseTraditional")}</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardContent>
            </Card>

             <div className="space-y-4 pt-4">
                 <Button variant="destructive" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("logout")}
                </Button>
            </div>
        </div>
        <BottomNav activeItem="settings" />
    </main>
  );
}
