import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname }  = request.nextUrl;

  // ── Supabase not configured — let everything through ──────────────
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  // ── Static / API / auth routes — never intercept these ────────────
  const skip = [
    '/api/', '/_next/', '/favicon', '/logo', '/images',
    '/staff/login', '/login', '/signup', '/forgot-password', '/reset-password',
  ];
  if (skip.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Build Supabase client with cookie forwarding ───────────────────
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(toSet) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session (required by @supabase/ssr)
  const { data: { user }, error } = await supabase.auth.getUser();

  // If Supabase itself errored (network, misconfigured) — let the request through
  // so the page can show its own error rather than a redirect loop
  if (error) {
    return response;
  }

  // ── Protected customer routes — redirect to login if not authed ────
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // ── Protected staff routes — redirect to staff login ──────────────
  if (!user && pathname.startsWith('/staff')) {
    return NextResponse.redirect(new URL('/staff/login', request.url));
  }

  // ── Staff routes: check role from profiles (safe try/catch) ────────
  if (user && pathname.startsWith('/staff')) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role ?? 'customer';
      const isStaff = ['support_agent', 'finance', 'partnership_manager', 'admin'].includes(role);

      if (!isStaff) {
        // Logged in but not staff — send them home
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // profiles table doesn't exist yet — let through so staff can see the error
      return response;
    }
  }

  return response;
}
