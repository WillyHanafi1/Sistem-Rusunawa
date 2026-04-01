"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout, getUserName } from "@/lib/auth";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { ThemeToggle } from "./ThemeToggle";
import { 
    Building2, Home, Users, FileText, LogOut, LayoutDashboard, MessageSquare, ClipboardList, 
    ChevronDown, ChevronRight, Settings, BedDouble, UserCheck, History, AlertTriangle, FileWarning, Wallet
} from "lucide-react";

type NavItem = {
    label: string;
    icon: any;
    href?: string;
    children?: { label: string; href: string; icon?: any; role?: "sadmin" | "admin" }[];
    role?: "sadmin" | "admin";
};

const navItems: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    {
        label: "Kamar",
        icon: Home,
        children: [
            { href: "/admin/rooms", label: "Data Kamar", icon: BedDouble },
            { href: "/admin/tariffs", label: "Tipe & Tarif", icon: Wallet },
            { href: "/admin/rooms/facilities", label: "Matriks Unit", icon: ClipboardList }
        ]
    },
    {
        label: "Penghuni",
        icon: Users,
        children: [
            { href: "/admin/applications", label: "Pengajuan", icon: ClipboardList },
            { href: "/admin/tenants/interviews", label: "Wawancara", icon: Users },
            { href: "/admin/tenants", label: "Kontrak", icon: UserCheck },
            { href: "/admin/checkouts", label: "Pengembalian (Refund)", icon: History },
            { href: "/admin/tenants/history", label: "Riwayat / Alumni", icon: History }
        ]
    },
    {
        label: "Tagihan",
        icon: FileText,
        children: [
            { href: "/admin/invoices", label: "Semua Tagihan", icon: FileText },
            { href: "/admin/invoices/rent", label: "Tagihan Sewa (SKRD)", icon: Wallet },
            { href: "/admin/invoices/warnings", label: "Surat Teguran", icon: FileWarning }
        ]
    },
    {
        label: "Keluhan",
        icon: MessageSquare,
        children: [
            { href: "/admin/tickets", label: "Semua Keluhan", icon: MessageSquare },
            { href: "/admin/tickets/open", label: "Perlu Tindakan", icon: AlertTriangle },
            { href: "/admin/tickets/closed", label: "Riwayat Selesai", icon: History }
        ]
    },
    { 
        label: "Pengaturan", 
        icon: Settings, 
        children: [
            { href: "/admin/settings", label: "Utama", icon: Settings },
            { href: "/admin/settings/management", label: "Kepengurusan", icon: Users, role: "sadmin" },
        ]
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [name, setName] = useState<string>("Admin");
    const [mounted, setMounted] = useState(false);
    
    // State to track which parent menu is expanded
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    // Auto-open menu on mount based on active route
    useEffect(() => {
        setMounted(true);
        const userName = getUserName();
        if (userName) setName(userName);

        const currentParent = navItems.find(item => 
            item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + "/"))
        );
        if (currentParent) {
            setOpenMenu(currentParent.label);
        }
    }, [pathname]);

    const handleMenuClick = (label: string) => {
        setOpenMenu(prev => prev === label ? null : label);
    };

    const userRole = mounted ? Cookies.get("user_role") : undefined;

    return (
        <aside className="w-64 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 flex flex-col transition-colors duration-300 overflow-hidden">
            {/* Logo */}
            <div className="p-6 border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">Rusunawa</p>
                        <p className="text-slate-500 text-xs">Admin Panel</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto align-top custom-scrollbar">
                {navItems.filter(item => !item.role || item.role === userRole).map((item) => {
                    const hasChildren = !!item.children;
                    const isOpen = openMenu === item.label;
                    
                    // For flat items (like Dashboard/Settings)
                    if (!hasChildren && item.href) {
                        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                    }`}
                            >
                                <item.icon className="w-4.5 h-4.5" />
                                {item.label}
                            </Link>
                        );
                    }

                    // For Accordion items
                    const isChildActive = item.children?.some(child => pathname === child.href || pathname.startsWith(child.href + "/"));
                    
                    return (
                        <div key={item.label} className="flex flex-col">
                            <button
                                onClick={() => handleMenuClick(item.label)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full ${
                                    isChildActive && !isOpen
                                    ? "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10"
                                    : isOpen 
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className="w-4.5 h-4.5" />
                                    {item.label}
                                </div>
                                <div className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                                    <ChevronDown className="w-4 h-4 opacity-50" />
                                </div>
                            </button>
                            
                            {/* Children Smooth Collapse */}
                            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"}`}>
                                <div className="overflow-hidden space-y-1">
                                    {item.children?.filter(child => !child.role || child.role === userRole).map(child => {
                                        const isNavActive = pathname === child.href;
                                        return (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className={`flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                                                    isNavActive
                                                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 relative before:absolute before:left-4 before:w-1.5 before:h-1.5 before:bg-blue-500 before:rounded-full"
                                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-300"
                                                }`}
                                            >
                                                {child.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* User & Logout */}
            <div className="p-4 border-t border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                        {mounted ? name.charAt(0).toUpperCase() : "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-slate-900 dark:text-white text-xs font-medium truncate">{mounted ? name : "Admin"}</p>
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                            {mounted ? (userRole === "sadmin" ? "Super Admin" : "Administrator") : "Loading..."}
                        </p>
                    </div>
                    <ThemeToggle />
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-sm transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Keluar
                </button>
            </div>
        </aside>
    );
}
