import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("✅ route.ts LOGIN dipanggil");
  try {
    const body = await req.text(); // Ambil form data as-is

    // Forward ke backend FastAPI yang asli
    const backendRes = await fetch("http://127.0.0.1:8000/api/auth/login", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        // Teruskan header penting lainnya jika perlu
      },
      body,
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // Buat response Next.js
    const response = NextResponse.json(data);

    // Set cookie secara eksplisit dari Next.js (Server-side)
    // Ini menjamin cookie terbaca oleh browser di domain localhost:3000
    response.cookies.set("access_token", data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      secure: process.env.NODE_ENV === "production",
      domain: process.env.NODE_ENV === "production" ? ".rusunawa.com" : undefined, // Explicitly undefined for localhost
    });

    return response;
  } catch (err) {
    console.error("API Login Route Error:", err);
    return NextResponse.json(
      { detail: "Internal Server Error di API Route Login" },
      { status: 500 }
    );
  }
}
