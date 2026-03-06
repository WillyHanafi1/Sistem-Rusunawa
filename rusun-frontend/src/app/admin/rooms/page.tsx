"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";

interface Room {
    id: number;
    rusunawa: string;
    building: string;
    floor: number;
    unit_number: number;
    room_number: string;
    price: number;
    status: string;
}

const STATUS_BADGE: Record<string, string> = {
    kosong: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    isi: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    rusak: "bg-red-500/20 text-red-400 border-red-500/30",
};

const EMPTY_FORM = { rusunawa: "Cigugur Tengah", building: "A", floor: 1, unit_number: 1, price: 750000, status: "kosong" };

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState<Room | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await api.get("/rooms/");
            setRooms(res.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setError(""); setModal(true); };
    const openEdit = (r: Room) => { setEditing(r); setForm({ rusunawa: r.rusunawa, building: r.building, floor: r.floor, unit_number: r.unit_number, price: r.price, status: r.status }); setError(""); setModal(true); };

    const handleSave = async () => {
        setSaving(true); setError("");
        try {
            if (editing) {
                await api.patch(`/rooms/${editing.id}`, form);
            } else {
                await api.post("/rooms/", form);
            }
            setModal(false);
            fetch();
        } catch (e: any) {
            setError(e.response?.data?.detail || "Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin hapus kamar ini?")) return;
        await api.delete(`/rooms/${id}`);
        fetch();
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manajemen Kamar</h1>
                    <p className="text-slate-400 text-sm mt-1">{rooms.length} kamar terdaftar</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                    <Plus className="w-4 h-4" /> Tambah Kamar
                </button>
            </div>

            {loading ? (
                <div className="flex items-center gap-2 text-slate-400 py-8"><Loader2 className="w-4 h-4 animate-spin" /> Memuat...</div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-400">
                                {["No. Kamar", "Rusunawa", "Gedung", "Lantai", "Harga/Bulan", "Status", "Aksi"].map(h => (
                                    <th key={h} className="text-left px-6 py-3 font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rooms.map((r) => (
                                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{r.room_number}</td>
                                    <td className="px-6 py-4 text-slate-300">{r.rusunawa}</td>
                                    <td className="px-6 py-4 text-slate-300">Gedung {r.building}</td>
                                    <td className="px-6 py-4 text-slate-300">Lt. {r.floor}</td>
                                    <td className="px-6 py-4 text-slate-300">Rp {Number(r.price).toLocaleString("id-ID")}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs border font-medium capitalize ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {rooms.length === 0 && <p className="text-center text-slate-500 py-12">Belum ada data kamar</p>}
                </div>
            )}

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-white font-semibold">{editing ? "Edit Kamar" : "Tambah Kamar"}</h2>
                            <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-300 text-sm mb-1.5">Rusunawa</label>
                                <select value={(form as any).rusunawa} onChange={(e) => setForm(f => ({ ...f, rusunawa: e.target.value }))} disabled={!!editing}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50">
                                    <option value="Cigugur Tengah">Cigugur Tengah</option>
                                    <option value="Cibeureum">Cibeureum</option>
                                    <option value="Leuwigajah">Leuwigajah</option>
                                </select>
                            </div>
                            {[
                                { label: "Gedung (A/B/C/D)", field: "building", type: "text", placeholder: "A", disabled: !!editing },
                                { label: "Lantai (1-5)", field: "floor", type: "number", placeholder: "1", disabled: !!editing },
                                { label: "No. Unit", field: "unit_number", type: "number", placeholder: "1", disabled: !!editing },
                                { label: "Harga/Bulan (Rp)", field: "price", type: "number", placeholder: "500000" },
                            ].map(({ label, field, type, placeholder, disabled }) => (
                                <div key={field}>
                                    <label className="block text-slate-300 text-sm mb-1.5">{label}</label>
                                    <input type={type} value={(form as any)[field]} placeholder={placeholder} disabled={disabled}
                                        onChange={(e) => setForm(f => ({ ...f, [field]: type === "number" ? Number(e.target.value) : e.target.value }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                                    />
                                </div>
                            ))}

                            <div>
                                <label className="block text-slate-300 text-sm mb-1.5">Status</label>
                                <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500">
                                    <option value="kosong">Kosong</option>
                                    <option value="isi">Isi</option>
                                    <option value="rusak">Rusak</option>
                                </select>
                            </div>
                            {error && <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">{error}</p>}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setModal(false)} className="flex-1 py-2.5 border border-white/10 text-slate-300 hover:text-white rounded-xl text-sm transition-all">Batal</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</> : "Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
