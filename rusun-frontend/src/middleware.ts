import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

/**
 * Next.js Edge Middleware — runs on EVERY matched request before page render.
 * Handles authentication gating and role-based access control.
 *
 * IMPORTANT: Function MUST be named `middleware` (not `proxy`) for Next.js to recognize it.
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isAuthPage = pathname.startsWith("/login");
    const isAdminPage = pathname.startsWith("/admin");
    const isPortalPage = pathname.startsWith("/portal");

    const token = request.cookies.get("access_token")?.value;

    let isTokenValid = false;
    let role: string | null = null;

    if (token) {
        try {
            // MED-04 FIX: Full signature verification instead of just decoding
            const { payload } = await jwtVerify(token, JWT_SECRET, {
                algorithms: ["HS256"],
            });

            isTokenValid = true;
            role = payload.role as string;
        } catch (err) {
            // Token invalid or expired — don't log full error to avoid noise
        }
    }

    // 1. If unauthorized access to protected route, redirect to login
    if (!isTokenValid && (isAdminPage || isPortalPage)) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 2. IMPORTANT: DO NOT automatically redirect from /login to dashboard!
    // This breaks the loop when the backend returns 401 but the cookie is still there.

    // 3. Role-based protection: /admin is restricted to admin & sadmin roles
    if (isAdminPage && (role !== "admin" && role !== "sadmin")) {
        return NextResponse.redirect(new URL("/portal", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/portal/:path*", "/login"],
};
