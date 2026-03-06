"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout, getUserName } from "@/lib/auth";
import { useEffect, useState } from "react";
import {
    Building2, Home, Users, FileText, LogOut, LayoutDashboard,
} from "lucide-react";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/rooms", label: "Kamar", icon: Home },
    { href: "/admin/tenants", label: "Penghuni", icon: Users },
    { href: "/admin/invoices", label: "Tagihan", icon: FileText },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [name, setName] = useState<string>("Admin");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const userName = getUserName();
        if (userName) {
            setName(userName);
        }
    }, []);

    return (
        <aside className="w-64 min-h-screen bg-slate-900 border-r border-white/5 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm">Rusunawa</p>
                        <p className="text-slate-500 text-xs">Admin Panel</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* User & Logout */}
            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {mounted ? name.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{mounted ? name : "Admin"}</p>
                        <p className="text-slate-500 text-xs">Administrator</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Keluar
                </button>
            </div>
        </aside>
    );
}
