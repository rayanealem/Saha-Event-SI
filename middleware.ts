import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let res = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          res = NextResponse.next({ request });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options as any));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  
  // Protected routes that require authentication
  const protected_ = ['/dashboard', '/reserve', '/admin', '/owner', '/profile'];
  if (protected_.some(p => path.startsWith(p)) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }
  
  // Redirect logged-in users away from auth page
  if (path === '/auth' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
