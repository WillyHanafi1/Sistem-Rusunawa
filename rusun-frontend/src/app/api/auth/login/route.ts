import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text(); // Ambil form data as-is

    // Forward ke backend FastAPI yang asli
    const backendRes = await fetch("http://localhost:8100/api/auth/login", {
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

    // Forward Set-Cookie header dari backend jika ada
    const setCookieHeader = backendRes.headers.get("set-cookie");
    if (setCookieHeader) {
      // Backend sudah mengirim HttpOnly cookie — forward langsung
      response.headers.set("set-cookie", setCookieHeader);
    }

    // Juga set cookie dari Next.js server-side sebagai fallback
    // (jika backend cookie tidak di-forward karena beda domain/port)
    // Kita perlu token dari cookie backend, bukan dari response body
    const backendCookies = backendRes.headers.getSetCookie?.() || [];
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

