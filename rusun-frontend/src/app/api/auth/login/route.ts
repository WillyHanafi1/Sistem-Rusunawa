import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_INTERNAL_URL || "http://127.0.0.1:8100";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text(); // Ambil form data as-is

    // Forward ke backend FastAPI yang asli
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // Buat response Next.js
    const response = NextResponse.json(data);

    // Forward ALL Set-Cookie headers dari backend
    const backendCookies = backendRes.headers.getSetCookie?.() || [];
    for (const cookie of backendCookies) {
      response.headers.append("Set-Cookie", cookie);
    }

    // Juga set cookie dari Next.js server-side sebagai fallback
    // (jika backend cookie tidak di-forward karena beda domain/port)
    const tokenCookie = backendCookies.find(c => c.startsWith("access_token="));
    if (tokenCookie) {
      const tokenValue = tokenCookie.split("=")[1]?.split(";")[0];
      if (tokenValue) {
        response.cookies.set("access_token", tokenValue, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 hari
          secure: process.env.NODE_ENV === "production",
        });
      }
    }

    return response;
  } catch (err) {
    console.error("API Login Route Error:", err);
    return NextResponse.json(
      { detail: "Internal Server Error di API Route Login" },
      { status: 500 }
    );
  }
}
