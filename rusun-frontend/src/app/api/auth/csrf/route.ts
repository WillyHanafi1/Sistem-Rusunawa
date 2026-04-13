import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_INTERNAL_URL || "http://127.0.0.1:8100";

export async function GET(req: NextRequest) {
  try {
    // Forward request ke backend FastAPI
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/csrf`, {
      method: "GET",
      // Penting: Sertakan cookie dari browser (seperti access_token) jika diperlukan oleh backend
      headers: {
        "Cookie": req.headers.get("cookie") || "",
      },
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // Buat response Next.js
    const response = NextResponse.json(data);

    // Dapatkan cookie dari backend (terutama csrftoken)
    const backendCookies = backendRes.headers.getSetCookie?.() || [];
    
    // Forward ALL Set-Cookie headers ke browser
    for (const cookie of backendCookies) {
      response.headers.append("Set-Cookie", cookie);
    }

    return response;
  } catch (err) {
    console.error("API CSRF Route Error:", err);
    return NextResponse.json(
      { detail: "Internal Server Error di API Route CSRF" },
      { status: 500 }
    );
  }
}
