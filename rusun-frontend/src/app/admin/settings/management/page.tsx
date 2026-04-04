"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { 
    Users, Plus, Pencil, Trash2, Loader2, Save, X, 
    ShieldCheck, UserPlus, Image as ImageIcon, Briefcase, Hash,
    Facebook, Twitter, Instagram
} from "lucide-react";

interface Staff {
    id: number;
    name: string;
    role: string;
    nip: string;
    tier: number;
    image_url: string;
    socials: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
    };
    is_active: boolean;
}

export default function StaffManagementPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        role: "",
        nip: "",
        tier: 3,
        image_url: "",
        socials: {
            facebook: "",
            twitter: "",
            instagram: ""
        },
        is_active: true
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await api.get("/management");
            setStaff(res.data);
        } catch (err: any) {
            setError("Gagal mengambil data staff");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item?: Staff) => {
        if (item) {
            setEditingStaff(item);
            setFormData({
                name: item.name,
                role: item.role,
                nip: item.nip,
                tier: item.tier,
                image_url: item.image_url,
                socials: {
                    facebook: item.socials?.facebook || "",
                    twitter: item.socials?.twitter || "",
                    instagram: item.socials?.instagram || ""
                },
                is_active: item.is_active
            });
        } else {
            setEditingStaff(null);
            setFormData({
                name: "",
                role: "",
                nip: "",
                tier: 3,
                image_url: "",
                socials: { facebook: "", twitter: "", instagram: "" },
                is_active: true
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            if (editingStaff) {
                await api.put(`/management/${editingStaff.id}`, formData);
            } else {
                await api.post("/management", formData);
            }
            await fetchStaff();
            setShowModal(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Gagal menyimpan data");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus staff ini?")) return;
        
        try {
            await api.delete(`/management/${id}`);
            await fetchStaff();
        } catch (err: any) {
            alert("Gagal menghapus data");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-8 pb-24 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-500" /> Manajemen Kepengurusan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Kelola struktur pimpinan dan staff operasional rusunawa (Super Admin Only).
                    </p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Tambah Staff
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 flex items-center gap-3">
                    <X className="w-5 h-5" /> {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10">
                                <th className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm">Nama & Jabatan</th>
                                <th className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm">NIP</th>
                                <th className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm">Tier / Hirarki</th>
                                <th className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm">Status</th>
                                <th className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {staff.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-white/10 group-hover:border-blue-400 transition-colors">
                                                {item.image_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                        <ImageIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</p>
                                                <p className="text-slate-500 text-xs">{item.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400 font-mono">
                                        {item.nip || "-"}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            item.tier === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                            item.tier === 2 ? "bg-blue-100 text-blue-700 border border-blue-200" :
                                            "bg-slate-100 text-slate-600 border border-slate-200"
                                        }`}>
                                            {item.tier === 1 ? "Top Leader" : item.tier === 2 ? "Sub-Leader" : "Operational"}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium">
                                        {item.is_active ? 
                                            <span className="text-emerald-500 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Aktif</span> : 
                                            <span className="text-slate-400">Nonaktif</span>
                                        }
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleOpenModal(item)}
                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4.5 h-4.5" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {staff.length === 0 && (
                    <div className="py-20 text-center">
                        <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">Belum ada data staff. Klik "Tambah Staff" untuk memulai.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in transition-all">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleSave}>
                            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {editingStaff ? <Pencil className="w-5 h-5 text-blue-500" /> : <Plus className="w-5 h-5 text-blue-500" />}
                                    {editingStaff ? "Edit Staff" : "Tambah Staff Baru"}
                                </h2>
                                <button type="button" onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Nama Lengkap
                                        </label>
                                        <input 
                                            required
                                            type="text" 
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Contoh: Drs. H. Ahmad Fauzi"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    {/* Role */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <Briefcase className="w-3.5 h-3.5" /> Jabatan
                                        </label>
                                        <input 
                                            required
                                            type="text" 
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                            placeholder="Contoh: Kepala UPTD"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    {/* NIP */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <Hash className="w-3.5 h-3.5" /> NIP
                                        </label>
                                        <input 
                                            type="text" 
                                            value={formData.nip}
                                            onChange={(e) => setFormData({...formData, nip: e.target.value})}
                                            placeholder="19xxxxxxxxxxxxxxx"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-mono"
                                        />
                                    </div>
                                    {/* Tier */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Hirarki (Tier)
                                        </label>
                                        <select 
                                            value={formData.tier}
                                            onChange={(e) => setFormData({...formData, tier: Number(e.target.value)})}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                        >
                                            <option value={1}>Tier 1 (Top Leader)</option>
                                            <option value={2}>Tier 2 (Sub-Leader)</option>
                                            <option value={3}>Tier 3 (Operational)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Image URL */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <ImageIcon className="w-3.5 h-3.5" /> URL Foto Profile
                                    </label>
                                    <input 
                                        type="text" 
                                        value={formData.image_url}
                                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                    />
                                </div>

                                {/* Socials */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Social Media (Opsional)</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="relative">
                                            <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                                            <input 
                                                type="text" 
                                                placeholder="Link Facebook"
                                                value={formData.socials.facebook}
                                                onChange={(e) => setFormData({
                                                    ...formData, 
                                                    socials: { ...formData.socials, facebook: e.target.value }
                                                })}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Link Twitter"
                                                value={formData.socials.twitter}
                                                onChange={(e) => setFormData({
                                                    ...formData, 
                                                    socials: { ...formData.socials, twitter: e.target.value }
                                                })}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none focus:ring-1 focus:ring-sky-400"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                                            <input 
                                                type="text" 
                                                placeholder="Link Instagram"
                                                value={formData.socials.instagram}
                                                onChange={(e) => setFormData({
                                                    ...formData, 
                                                    socials: { ...formData.socials, instagram: e.target.value }
                                                })}
                                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs outline-none focus:ring-1 focus:ring-pink-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-white/5 flex items-center justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
