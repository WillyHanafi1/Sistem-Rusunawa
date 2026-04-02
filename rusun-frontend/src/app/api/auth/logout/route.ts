import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ success: true });
    
    // Clear the HttpOnly access_token cookie
    response.cookies.set("access_token", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
    });

    return response;
}
