"use client";
import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, Loader2, X, Tags, CheckCircle2, Filter } from "lucide-react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

interface Room {
    id: number;
    rusunawa: string;
    building: string;
    floor: number;
    unit_number: number;
    room_number: string;
    price: number;
    status: string;
    // Extended fields
    tenant_name?: string | null;
    contract_start?: string | null;
    contract_end?: string | null;
    parking_price?: number;
    total_unpaid_bill?: number;
}

const STATUS_BADGE: Record<string, string> = {
    kosong: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    isi: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    rusak: "bg-red-500/20 text-red-400 border-red-500/30",
};

const EMPTY_FORM = { rusunawa: "Cigugur Tengah", building: "A", floor: 1, unit_number: 1, price: 750000, status: "kosong" };
const EMPTY_BULK_FORM = { rusunawa: "Cigugur Tengah", building: "", floor: "", new_price: 500000 };

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [filterSearch, setFilterSearch] = useState("");
    const [filterRusunawa, setFilterRusunawa] = useState("");
    const [filterBuilding, setFilterBuilding] = useState("");
    const [filterFloor, setFilterFloor] = useState("");
    const [filterUnit, setFilterUnit] = useState("");
    
    // Normal Room Form State
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState<Room | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    
    // Shared State
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetch = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterSearch) params.append("search", filterSearch);
            if (filterRusunawa) params.append("rusunawa", filterRusunawa);
            if (filterBuilding) params.append("building", filterBuilding);
            if (filterFloor) params.append("floor", filterFloor);
            if (filterUnit) params.append("unit_number", filterUnit);
            
            const res = await api.get(`/rooms/extended/all?${params.toString()}`);
            setRooms(res.data);
        } catch (err) {
            console.error("Failed to fetch rooms:", err);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search typing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetch();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filterSearch, filterRusunawa, filterBuilding, filterFloor, filterUnit]);

    // Form Handlers
    const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setError(""); setModal(true); };
    const openEdit = (r: Room) => { setEditing(r); setForm({ rusunawa: r.rusunawa, building: r.building, floor: r.floor, unit_number: r.unit_number, price: r.price, status: r.status }); setError(""); setModal(true); };

    // Clear success message after 5 seconds
    useEffect(() => {
        if (successMsg) {
            const t = setTimeout(() => setSuccessMsg(""), 5000);
            return () => clearTimeout(t);
        }
    }, [successMsg]);

    const handleSave = async () => {
        setSaving(true); setError("");
        try {
            if (editing) {
                await api.patch(`/rooms/${editing.id}`, form);
                setSuccessMsg(`Pembaruan data kamar ${editing.room_number} berhasil disimpan.`);
            } else {
                await api.post("/rooms/", form);
                setSuccessMsg(`Kamar baru berhasil ditambahkan.`);
            }
            setModal(false);
            fetch();
        } catch (e: any) {
            setError(e.response?.data?.detail || "Terjadi kesalahan saat menyimpan data.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin hapus kamar ini sesamanya? Data tidak bisa dikembalikan.")) return;
        await api.delete(`/rooms/${id}`);
        setSuccessMsg("Kamar berhasil dihapus selamanya.");
        fetch();
    };

    const columnHelper = createColumnHelper<Room>();

    const columns = useMemo(() => [
        columnHelper.accessor('rusunawa', {
            header: () => (
                <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1"><Filter className="w-3 h-3 text-blue-500" /> Rusunawa</span>
                    <select 
                        value={filterRusunawa} 
                        onChange={(e) => setFilterRusunawa(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[11px] rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-sm"
                    >
                        <option value="">Semua Lokasi</option>
                        <option value="Cigugur Tengah">Cigugur Tengah</option>
                        <option value="Cibeureum">Cibeureum</option>
                        <option value="Leuwigajah">Leuwigajah</option>
                    </select>
                </div>
            ),
            cell: info => <span className="font-bold text-slate-700 dark:text-slate-200">{info.getValue()}</span>,
        }),
        columnHelper.accessor('building', {
            header: () => (
                 <div className="flex flex-col gap-1.5 items-center">
                    <span className="flex items-center gap-1 leading-tight"><Filter className="w-3 h-3 text-blue-500" /> Gedung</span>
                    <select 
                        value={filterBuilding} 
                        onChange={(e) => setFilterBuilding(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[10px] rounded px-0.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-sm text-center w-full"
                    >
                        <option value="">Semua</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                    </select>
                </div>
            ),
            cell: info => <span className="font-bold text-slate-900 dark:text-white text-sm text-center block">{info.getValue()}</span>,
        }),
        columnHelper.accessor('floor', {
            header: () => (
                <div className="flex flex-col gap-1.5 items-center">
                    <span className="flex items-center gap-1 leading-tight"><Filter className="w-3 h-3 text-blue-500" /> Lantai</span>
                    <select 
                        value={filterFloor} 
                        onChange={(e) => setFilterFloor(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[10px] rounded px-0.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-sm text-center w-full"
                    >
                        <option value="">Semua</option>
                        <option value="1">I</option>
                        <option value="2">II</option>
                        <option value="3">III</option>
                        <option value="4">IV</option>
                        <option value="5">V</option>
                    </select>
                </div>
            ),
            cell: info => <span className="font-bold text-slate-900 dark:text-white text-sm text-center block">{(info.row.original as any).floor_roman || info.getValue()}</span>,
        }),
        columnHelper.accessor('unit_number', {
            header: () => (
                <div className="flex flex-col gap-1.5 items-center">
                    <span className="flex items-center gap-1 leading-tight"><Filter className="w-3 h-3 text-blue-500" /> Unit</span>
                    <input 
                        type="text" 
                        value={filterUnit}
                        placeholder="Semua"
                        onChange={(e) => setFilterUnit(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[10px] rounded px-0.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-sm text-center w-full placeholder-slate-400"
                    />
                </div>
            ),
            cell: info => <span className="font-bold text-slate-900 dark:text-white text-sm text-center block">{info.getValue()}</span>,
        }),
        columnHelper.accessor('tenant_name', {
            header: () => (
                <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1"><Filter className="w-3 h-3 text-blue-500" /> Nama Penghuni Aktif</span>
                    <input 
                        type="text" 
                        placeholder="Cari nama penghuni..." 
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[11px] rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal placeholder-slate-400 shadow-sm"
                    />
                </div>
            ),
            cell: info => {
                const val = info.getValue();
                if (val) {
                    return (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                                {val.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{val}</span>
                        </div>
                    )
                }
                return <span className="text-slate-400 dark:text-slate-500 italic text-[11px] bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-white/5">Kosong</span>
            }
        }),
        columnHelper.accessor('contract_start', {
            header: () => <div className="py-2.5">Masa Kontrak</div>,
            cell: info => {
                const r = info.row.original;
                if (r.contract_start) {
                    return (
                        <div className="flex flex-col gap-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500"></span> {new Date(r.contract_start).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                            <div className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500"></span> {new Date(r.contract_end!).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                        </div>
                    )
                }
                return <span className="text-slate-300 dark:text-slate-600">-</span>
            }
        }),
        columnHelper.accessor('price', {
            header: () => <div className="text-right w-full py-2.5">Harga Sewa</div>,
            cell: info => <div className="text-right font-bold text-slate-900 dark:text-slate-100 text-sm">{Number(info.getValue()).toLocaleString("id-ID")}</div>
        }),
        columnHelper.accessor('parking_price', {
            header: () => <div className="text-right w-full py-2.5">Biaya Parkir</div>,
            cell: info => {
                const v = info.getValue();
                return <div className="text-right text-slate-600 dark:text-slate-300 text-sm">{v && v > 0 ? <span className="font-medium">{Number(v).toLocaleString("id-ID")}</span> : <span className="text-slate-300 dark:text-slate-600">-</span>}</div>
            }
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center py-2.5">Aksi & Status</div>,
            cell: info => {
                const r = info.row.original;
                return (
                    <div className="flex justify-between items-center px-1">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                        <div className="flex gap-1 ml-2">
                            <button onClick={() => openEdit(r)} className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-all" title="Edit"><Pencil className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                )
            }
        })
    ], [filterRusunawa, filterBuilding, filterSearch]);

    const table = useReactTable({
        data: rooms,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="p-8 pb-24">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen & Data Kamar</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{rooms.length} unit kamar terdaftar berdasarkan filter saat ini</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-500/20 active:scale-95">
                        <Plus className="w-4 h-4" /> Tambah Kamar Fisik
                    </button>
                </div>
            </div>
            
            {loading ? (
                <div className="flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> 
                    <p className="font-medium text-sm">Menyinkronkan dan memuat data kamar...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm rounded-2xl overflow-hidden mt-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id} className="border-b border-t border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 whitespace-nowrap text-xs">
                                        {headerGroup.headers.map(header => {
                                            const tight = ['building', 'floor', 'unit_number'].includes(header.id);
                                            return (
                                                <th key={header.id} className={`border-x border-slate-200/60 dark:border-white/5 font-bold tracking-wide align-bottom ${tight ? 'px-1 py-1 w-12 text-center' : 'px-4 py-2 text-left'}`}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="border-b border-slate-200/60 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        {row.getVisibleCells().map(cell => {
                                            const tight = ['building', 'floor', 'unit_number'].includes(cell.column.id);
                                            return (
                                                <td key={cell.id} className={`border-x border-slate-200/60 dark:border-white/5 whitespace-nowrap ${tight ? 'px-1 py-1' : 'px-4 py-2'}`}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {rooms.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-16 font-medium">Belum ada data unit kamar satupun di dalam Database Anda.</p>}
                </div>
            )}

            {/* Modal: Single Room (Create/Edit) */}
            {modal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl text-slate-900 dark:text-white font-bold">{editing ? "✏️ Edit Parameter Kamar" : "🏠 Tambah Unit Baru"}</h2>
                            <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 bg-slate-100 dark:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1.5">Lokasi Rusunawa Target</label>
                                <select value={(form as any).rusunawa} onChange={(e) => setForm(f => ({ ...f, rusunawa: e.target.value }))} disabled={!!editing}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                                    <option value="Cigugur Tengah">Cigugur Tengah</option>
                                    <option value="Cibeureum">Cibeureum</option>
                                    <option value="Leuwigajah">Leuwigajah</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Blok Gedung (A/B/C/D)", field: "building", type: "text", placeholder: "A", disabled: !!editing },
                                    { label: "Lantai (1-5)", field: "floor", type: "number", placeholder: "1", disabled: !!editing },
                                    { label: "Nomor Pintu", field: "unit_number", type: "number", placeholder: "12", disabled: !!editing },
                                    { label: "Harga/Bulan (Rp)", field: "price", type: "number", placeholder: "500000" },
                                ].map(({ label, field, type, placeholder, disabled }) => (
                                    <div key={field} className={field === 'price' ? 'col-span-2' : ''}>
                                        <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1.5">{label}</label>
                                        <input type={type} value={(form as any)[field]} placeholder={placeholder} disabled={disabled}
                                            onChange={(e) => setForm(f => ({ ...f, [field]: type === "number" ? Number(e.target.value) : e.target.value }))}
                                            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 text-sm font-semibold mb-1.5">Status Hunian Kamar</label>
                                <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="kosong">🟢 Kosong (Tersedia)</option>
                                    <option value="isi">🔵 Terisi (Disewa)</option>
                                    <option value="rusak">🔴 Rusak (Perbaikan)</option>
                                </select>
                            </div>
                            
                            {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-500/10 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/20 font-medium">{error}</p>}
                        </div>
                        
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-transparent dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-all">Batal Saja</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30">
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Data"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
