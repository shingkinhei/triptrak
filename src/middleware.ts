import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let response = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const localeMatch = pathname.match(/^\/(en|zh-TW)/);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;

  const authPages = ["login", "signup", "forgot-password"];
  const isAuthPage = authPages.some((page) => pathname.includes(`/${page}`));

  const isLocalizedRoot = /^\/(en|zh-TW)\/?$/.test(pathname);

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/trips`;
    return NextResponse.redirect(url);
  }

  if (
    !user &&
    !isAuthPage &&
    !isLocalizedRoot &&
    /^\/(en|zh-TW)\//.test(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|api/).*)",
  ],
};
