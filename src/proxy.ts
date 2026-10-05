// =============================================================================
// FILE: src/proxy.ts
// LAYER: Network Boundary (runs on the server BEFORE any page renders)
//
// PURPOSE:
//   This is the Next.js 16 "Proxy" (formerly called "Middleware" in older
//   versions — the file and function were renamed in Next.js v16.0.0).
//   It protects the /dashboard route by verifying the Supabase session
//   server-side before any React code is allowed to render.
//
// HOW IT WORKS:
//   1. Every HTTP request that matches the `config.matcher` pattern below
//      is intercepted here, before the target page is loaded.
//   2. We create a short-lived Supabase server client that reads the
//      session from the request cookies (where @supabase/ssr stores it).
//   3. We call supabase.auth.getUser() — this re-validates the JWT with
//      the Supabase API every time, so it is secure and cannot be spoofed
//      by tampering with the local cookie. (getSession() is NOT used here
//      because it only reads the local cookie without re-validation.)
//   4. Based on the result:
//        - Unauthenticated + visiting /dashboard → redirect to /login
//        - Authenticated + visiting /login → redirect to /dashboard
//        - Everything else → pass through unchanged
//
// COOKIE HANDLING (getAll / setAll):
//   @supabase/ssr requires two cookie methods:
//   - getAll: reads cookies from the incoming Request so we can identify
//             the current session.
//   - setAll: writes refreshed cookies back to the outgoing Response so
//             that token refreshes are persisted. Without this, users would
//             get randomly logged out when their access token expires.
//
// IMPORTANT — Next.js 16 Breaking Change:
//   The file is named `proxy.ts` (not `middleware.ts`).
//   The exported function is named `proxy` (not `middleware`).
//   Using the old names is silently ignored in Next.js 16 — auth
//   protection simply would not work.
//
// MATCHER:
//   The matcher tells Next.js which paths trigger this proxy function.
//   We exclude _next/* (internal build assets), static files, images,
//   and favicon.ico so we only intercept real page navigations.
// =============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * The Proxy function — intercepts requests before any page renders.
 * It validates the Supabase session and enforces route-level access control.
 */
export async function proxy(request: NextRequest) {
  // We start by cloning the request headers. This lets us forward any
  // cookie mutations (e.g. refreshed tokens) to the browser.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a server-side Supabase client that reads cookies from the
  // incoming request and writes refreshed cookies to the outgoing response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // getAll: reads every cookie from the incoming request.
        // Supabase uses this to find the stored session tokens.
        getAll() {
          return request.cookies.getAll();
        },

        // setAll: writes cookies to the outgoing response.
        // Supabase calls this after a token refresh so the new tokens
        // are saved in the browser for the next request.
        setAll(cookiesToSet) {
          // First, apply the cookies to the request (for this request cycle).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild the response with the updated request headers.
          response = NextResponse.next({
            request,
          });
          // Then, apply the cookies to the response (so the browser saves them).
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() makes a network call to the Supabase API to validate the JWT.
  // This is intentionally secure: it cannot be bypassed by forging a cookie.
  // (getSession() only reads the local cookie without server validation —
  // it is NOT safe to use for access control decisions.)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Access Control Rules ──────────────────────────────────────────────────

  let isAdmin = false;
  if (user) {
    const { data: row } = await supabase
      .from('users').select('role').eq('id', user.id).single();
    isAdmin = row?.role === 'Admin';
  }

  if (!isAdmin && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (isAdmin && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Rule 3: All other requests (public routes, API routes that match the
  // pattern, etc.) are allowed through unchanged.
  return response;
}

/**
 * Matcher configuration — defines which request paths trigger this proxy.
 *
 * The regex below matches every path EXCEPT:
 *   - _next/static  — compiled JS, CSS, and other build assets
 *   - _next/image   — Next.js image optimisation responses
 *   - favicon.ico   — browser favicon request
 *   - Files with an extension (e.g. .png, .svg, .woff2)
 *
 * This ensures the proxy only runs for real page navigations, not for
 * asset fetches that have nothing to do with authentication.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
};
