import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;
    const role = request.cookies.get("user_role")?.value;
    const { pathname } = request.nextUrl;

    const isAuthPage = pathname.startsWith("/login");
    const isAdminPage = pathname.startsWith("/admin");
    const isPortalPage = pathname.startsWith("/portal");

    if (!token && !isAuthPage) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (token && isAuthPage) {
        if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
        return NextResponse.redirect(new URL("/portal", request.url));
    }

    if (token && isAdminPage && role !== "admin") {
        return NextResponse.redirect(new URL("/portal", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/portal/:path*", "/login"],
};
