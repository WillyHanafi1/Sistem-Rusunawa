"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, getRole, isLoggedIn } from "@/lib/auth";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [checking, setChecking] = useState(true);

    // Client-side: jika sudah login, redirect ke portal/admin
    useEffect(() => {
        if (isLoggedIn()) {
            const role = getRole();
            if (role === "admin" || role === "sadmin") {
                router.replace("/admin");
            } else {
                router.replace("/portal");
            }
        } else {
            setChecking(false);
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const data = await login(email, password);
            if (data.role === "admin" || data.role === "sadmin") {
                router.push("/admin");
            } else {
                router.push("/portal");
            }
        } catch (err: any) {
            setError(err.message || "Login gagal. Periksa email & password.");
        } finally {
            setLoading(false);
        }
    };

    // Jangan tampilkan form saat sedang cek status login
    if (checking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
            {/* Background circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl transition-all duration-300">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rusunawa</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sistem Manajemen Rumah Susun</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@rusunawa.com"
                                required
                                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 pr-12 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Masuk...
                                </>
                            ) : (
                                "Masuk"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-xs mt-6">
                        © 2024 Rusunawa Management System
                    </p>
                </div>
            </div>
        </div>
    );
}
