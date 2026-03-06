"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Loader2, X } from "lucide-react";

interface Tenant {
    id: number;
    user_id: number;
    room_id: number;
    contract_start: string;
    contract_end: string;
    is_active: boolean;
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ user_id: 0, room_id: 0, contract_start: "", contract_end: "", deposit_amount: 0, motor_count: 0, notes: "" });

    const fetchAll = async () => {
        setLoading(true);
        try { 
            const res = await api.get("/tenants/"); 
            setTenants(res.data); 
        } catch (err) {
            console.error("Failed to fetch tenants:", err);
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleSave = async () => {
        setSaving(true); setError("");
        try {
            await api.post("/tenants/", { ...form, user_id: Number(form.user_id), room_id: Number(form.room_id) });
            setModal(false);
            fetchAll();
        } catch (e: any) {
            setError(e.response?.data?.detail || "Terjadi kesalahan");
        } finally { setSaving(false); }
    };

    const handleDeactivate = async (id: number) => {
        if (!confirm("Nonaktifkan penghuni ini? Status kamarnya akan berubah menjadi Kosong.")) return;
        await api.patch(`/tenants/${id}`, { is_active: false });
        fetchAll();
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen Penghuni</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{tenants.filter(t => t.is_active).length} penghuni aktif</p>
                </div>
                <button onClick={() => { setError(""); setModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                    <Plus className="w-4 h-4" /> Tambah Penghuni
                </button>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-8"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
            ) : (
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl overflow-hidden transition-colors duration-300">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-transparent">
                                {["ID", "User ID", "Kamar ID", "Mulai Kontrak", "Akhir Kontrak", "Status", "Aksi"].map(h => (
                                    <th key={h} className="text-left px-6 py-3 font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map((t) => (
                                <tr key={t.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">#{t.id}</td>
                                    <td className="px-6 py-4 text-slate-900 dark:text-white">User #{t.user_id}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Kamar #{t.room_id}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{t.contract_start}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{t.contract_end}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs border font-medium ${t.is_active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
                                            {t.is_active ? "Aktif" : "Tidak Aktif"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {t.is_active && (
                                            <button onClick={() => handleDeactivate(t.id)}
                                                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition-all">
                                                Nonaktifkan
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {tenants.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-12">Belum ada data penghuni</p>}
                </div>
            )}

            {modal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-slate-900 dark:text-white font-semibold">Tambah Penghuni</h2>
                            <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">Pastikan user penghuni sudah dibuat di sistem (via Register Admin) sebelum assign ke kamar.</p>
                        <div className="space-y-4">
                            {[
                                { label: "User ID Penghuni", field: "user_id", type: "number" },
                                { label: "Kamar ID", field: "room_id", type: "number" },
                                { label: "Tanggal Mulai Kontrak", field: "contract_start", type: "date" },
                                { label: "Tanggal Akhir Kontrak", field: "contract_end", type: "date" },
                                { label: "Deposit (Rp)", field: "deposit_amount", type: "number" },
                                { label: "Jumlah Motor (0-4)", field: "motor_count", type: "number" },
                            ].map(({ label, field, type }) => (
                                <div key={field}>
                                    <label className="block text-slate-700 dark:text-slate-300 text-sm mb-1.5">{label}</label>
                                    <input type={type} value={(form as any)[field]}
                                        onChange={e => setForm(f => ({ ...f, [field]: type === "number" ? Number(e.target.value) : e.target.value }))}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                                    />
                                </div>
                            ))}
                            {error && <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">{error}</p>}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setModal(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm transition-all">Batal</button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</> : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
