import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;
    const role = request.cookies.get("user_role")?.value;
    const { pathname } = request.nextUrl;

    const isAuthPage = pathname.startsWith("/login");
    const isAdminPage = pathname.startsWith("/admin");

    // 1. Halaman login selalu bisa diakses siapa saja.
    //    Jika user sudah login, login page sendiri yang handle redirect (client-side).
    //    Ini mencegah infinite loop antara middleware dan client-side auth check.
    if (isAuthPage) {
        return NextResponse.next();
    }

    // 2. Proteksi route: jika tidak ada token, tendang ke login
    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 3. Proteksi admin: hanya admin/sadmin yang boleh akses /admin
    if (isAdminPage && role !== "admin" && role !== "sadmin") {
        return NextResponse.redirect(new URL("/portal", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/portal/:path*", "/login"],
};
