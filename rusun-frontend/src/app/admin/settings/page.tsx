"use client";
import React, { useEffect, useState } from "react";
import { 
    Settings, Users, ShieldCheck, UserCircle, 
    Bell, Lock, ChevronRight, LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";

export default function SettingsPage() {
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        setRole(Cookies.get("user_role") || "admin");
    }, []);

    const settingGroups = [
        {
            title: "Preferensi Akun",
            items: [
                { 
                    label: "Informasi Profil", 
                    desc: "Ubah nama, email, dan detail kontak Anda", 
                    icon: UserCircle, 
                    href: "#",
                    color: "text-blue-500",
                    bg: "bg-blue-50 dark:bg-blue-500/10"
                },
                { 
                    label: "Keamanan & Password", 
                    desc: "Ganti password dan amankan akun Anda", 
                    icon: Lock, 
                    href: "#",
                    color: "text-amber-500",
                    bg: "bg-amber-50 dark:bg-amber-500/10"
                }
            ]
        },
        {
            title: "Sistem & Notifikasi",
            items: [
                { 
                    label: "Notifikasi", 
                    desc: "Atur bagaimana Anda menerima pemberitahuan", 
                    icon: Bell, 
                    href: "#",
                    color: "text-emerald-500",
                    bg: "bg-emerald-50 dark:bg-emerald-500/10"
                }
            ]
        }
    ];

    // Additional group for Super Admin
    if (role === "sadmin") {
        settingGroups.push({
            title: "Administrasi Tingkat Lanjut",
            items: [
                { 
                    label: "Manajemen Kepengurusan", 
                    desc: "Atur struktur organisasi, pimpinan, dan staff rusunawa", 
                    icon: Users, 
                    href: "/admin/settings/management",
                    color: "text-indigo-500",
                    bg: "bg-indigo-50 dark:bg-indigo-500/10"
                }
            ]
        });
    }

    return (
        <div className="p-8 pb-24 max-w-5xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-slate-400" /> Pengaturan Sistem
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Kelola preferensi akun dan konfigurasi operasional Rusunawa.</p>
            </div>

            <div className="space-y-10">
                {settingGroups.map((group, idx) => (
                    <div key={idx} className="space-y-4">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">{group.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {group.items.map((item, itemIdx) => (
                                <Link 
                                    key={itemIdx} 
                                    href={item.href}
                                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/30 transition-all flex items-start gap-4"
                                >
                                    <div className={`p-3 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {item.label}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all self-center" />
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {role === "sadmin" && (
                <div className="mt-16 p-6 rounded-3xl bg-blue-600 shadow-xl shadow-blue-500/20 text-white relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h2 className="text-xl font-bold">Akses Super Admin Terdeteksi</h2>
                            <p className="text-blue-100 text-sm mt-1">Anda memiliki wewenang penuh untuk mengubah konfigurasi inti dan struktur kepengurusan Rusunawa.</p>
                        </div>
                    </div>
                    {/* Decorative blurred circle */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            )}
        </div>
    );
}
