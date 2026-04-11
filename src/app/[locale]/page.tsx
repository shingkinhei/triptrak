"use client";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(`/${locale}/trips`);
      } else {
        router.replace(`/${locale}/login`);
      }
    };

    checkSession();
  }, [router, locale, supabase]);

  const ct = useTranslations('common');
  return (
    <main className="flex min-h-screen gap-2 items-center justify-center p-4 font-body bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center">
        <p>ct('loading')</p>
      </div>
    </main>
  );
}
