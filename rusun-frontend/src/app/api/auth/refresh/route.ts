import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.API_INTERNAL_URL || "http://127.0.0.1:8100";

export async function POST(request: Request) {
    // 1. Get the refresh token from cookies
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
        return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    try {
        // 2. Forward the request to the FastAPI backend using the refresh cookie
        const backendRes = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
            method: "POST",
            headers: {
                "Cookie": `refresh_token=${refreshToken}`
            }
        });

        if (!backendRes.ok) {
            return NextResponse.json(
                { error: "Refresh failed" },
                { status: backendRes.status }
            );
        }

        // 3. Extract the new access_token from the backend's Set-Cookie header
        const setCookieHeader = backendRes.headers.get("set-cookie");
        const data = await backendRes.json();

        // 4. Create the response and forward the new cookie to the browser
        const response = NextResponse.json(data);

        // Next.js (NextResponse) doesn't simply let us mass-forward set-cookie strings,
        // we must parse or forward it directly via the Headers object.
        if (setCookieHeader) {
            response.headers.append("Set-Cookie", setCookieHeader);
        }

        return response;
    } catch (error) {
        console.error("Refresh token proxy error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
