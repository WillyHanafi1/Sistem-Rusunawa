import Cookies from "js-cookie";
import api from "./api";

export interface LoginResponse {
    access_token: string;
    token_type: string;
    role: "sadmin" | "admin" | "penghuni";
    name: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);

    // fetch langsung ke Next.js API route — bypass axios/rewrite
    const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
        credentials: "include",
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Email atau password salah");
    }

    const data: LoginResponse = await res.json();
    
    Cookies.set("user_role", data.role, { expires: 7, sameSite: "Lax", path: "/" });
    Cookies.set("user_name", data.name, { expires: 7, sameSite: "Lax", path: "/" });
    
    return data;
}

export async function logout() {
    try {
        await api.post("/auth/logout");
    } catch (e) {
        console.error("Logout error", e);
    }

    // Sapu bersih semua kemungkinan cookie di berbagai path
    const paths = ['/', '/admin', '/portal', '/login'];
    paths.forEach(path => {
        Cookies.remove("access_token", { path });
        Cookies.remove("user_role", { path });
        Cookies.remove("user_name", { path });
    });
    
    // Fallback tanpa path
    Cookies.remove("access_token");
    Cookies.remove("user_role");
    Cookies.remove("user_name");

    window.location.href = "/login";
}

export function getRole(): string | undefined {
    return Cookies.get("user_role");
}

export function getUserName(): string | undefined {
    return Cookies.get("user_name");
}

export function isLoggedIn(): boolean {
    // Karena access_token sekarang HttpOnly, kita tidak bisa mengeceknya dari JS.
    // Kita gunakan user_role sebagai indikator login sederhana untuk UI.
    return !!Cookies.get("user_role");
}
