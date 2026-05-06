import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }: any) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always refresh the session so auth cookies stay valid.
  // This must happen before any route checks.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes, admin, notifications AND reservation flow
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/espace-') ||
    request.nextUrl.pathname.startsWith('/reservation') ||
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/notifications') ||
    request.nextUrl.pathname.startsWith('/ajouter-salle')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('mode', 'register')
    url.searchParams.set('redirect_to', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
