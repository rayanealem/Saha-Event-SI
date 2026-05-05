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

  // Protect dashboard routes AND reservation flow
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/espace-') ||
    request.nextUrl.pathname.startsWith('/reservation')

  if (isProtectedRoute) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('mode', 'register')
      url.searchParams.set('redirect_to', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  // Handle authenticated routing: Role checks
  // Note: we fetch the profile from supabase using the anon key.
  // We can do this here or inside the layout.
  // It's probably better to do role checks in layouts/components, or here if we have a simple check.

  return supabaseResponse
}
