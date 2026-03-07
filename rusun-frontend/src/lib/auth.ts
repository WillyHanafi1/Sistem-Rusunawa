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

    const res = await api.post<LoginResponse>("/auth/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const data = res.data;
    Cookies.set("access_token", data.access_token, { expires: 1, sameSite: "Lax" });
    Cookies.set("user_role", data.role, { expires: 1, sameSite: "Lax" });
    Cookies.set("user_name", data.name, { expires: 1, sameSite: "Lax" });
    return data;
}

export function logout() {
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
    return !!Cookies.get("access_token");
}
