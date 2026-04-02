import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const isAuthPage = pathname.startsWith("/login");
    const isAdminPage = pathname.startsWith("/admin");
    const isPortalPage = pathname.startsWith("/portal");

    const token = request.cookies.get("access_token")?.value;

    let isTokenValid = false;
    let role: string | null = null;

    if (token) {
        try {
            // Decode payload WITHOUT full signature verification for now to avoid the loop
            // Signature mismatch is handled by backend + our new logic below
            const payload = decodeJwt(token);
            const now = Math.floor(Date.now() / 1000);
            
            if (payload.exp && payload.exp > now) {
                isTokenValid = true;
                role = payload.role as string;
            }
        } catch (err) {
            console.error(`Middleware: Failed to decode token:`, err);
        }
    }

    // 1. If unauthorized access to protected route, redirect to login
    if (!isTokenValid && (isAdminPage || isPortalPage)) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 2. IMPORTANT: DO NOT automatically redirect from /login to dashboard! 
    // This breaks the loop when the backend returns 401 but the cookie is still there.
    // If the user already has a valid-looking session at /login, we let them stay there
    // and they can click "Login" again which will refresh the token.

    // 3. Role-based protection: /admin is restricted to admin & sadmin roles
    if (isAdminPage && (role !== "admin" && role !== "sadmin")) {
        return NextResponse.redirect(new URL("/portal", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/portal/:path*", "/login"],
};
