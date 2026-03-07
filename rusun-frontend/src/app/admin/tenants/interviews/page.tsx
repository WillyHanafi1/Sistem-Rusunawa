"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { format, addYears } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Search, Loader2, FileText, Download, Building, Users, Calendar, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Application {
    id: number;
    nik: string;
    full_name: string;
    phone_number: string;
    email: string;
    rusunawa_target: string;
    family_members_count: number;
    status: string;
    ktp_file_path: string | null;
    created_at: string;
}

interface Room {
    id: number;
    rusunawa: string;
    building: string;
    floor: number;
    floor_roman: string;
    unit_number: number;
    room_number: string;
    price: number;
    room_type: number;
    status: string;
    description: string | null;
}

export default function InterviewsPage() {
    const [apps, setApps] = useState<Application[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal State
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [selectedRoomId, setSelectedRoomId] = useState<number | "">("");
    const [contractStart, setContractStart] = useState<string>(format(new Date(), "yyyy-MM-dd"));
    const [contractEnd, setContractEnd] = useState<string>(format(addYears(new Date(), 1), "yyyy-MM-dd"));
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [motorCount, setMotorCount] = useState<number>(0);
    const [notes, setNotes] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // Checklist
    const [checkKtp, setCheckKtp] = useState(false);
    const [checkKk, setCheckKk] = useState(false);
    const [checkNikah, setCheckNikah] = useState(false);
    const [checkSlip, setCheckSlip] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [appRes, roomRes] = await Promise.all([
                api.get("/applications/?status=interview"),
                api.get("/rooms/")
            ]);
            setApps(appRes.data);
            setRooms(roomRes.data.filter((r: Room) => r.status === "kosong"));
        } catch (error) {
            console.error("Failed fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Automatically set deposit to 3x rent when room is selected
    useEffect(() => {
        if (selectedRoomId) {
            const room = rooms.find(r => r.id === Number(selectedRoomId));
            if (room) {
                setDepositAmount(room.price * 3);
            }
        }
    }, [selectedRoomId, rooms]);

    const handleOpenModal = (app: Application) => {
        setSelectedApp(app);
        setIsModalOpen(true);
        // Reset form
        setSelectedRoomId("");
        setContractStart(format(new Date(), "yyyy-MM-dd"));
        setContractEnd(format(addYears(new Date(), 1), "yyyy-MM-dd"));
        setDepositAmount(0);
        setMotorCount(0);
        setNotes("");
        setCheckKtp(false);
        setCheckKk(false);
        setCheckNikah(false);
        setCheckSlip(false);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedApp(null);
    };

    const handleSubmitInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApp || !selectedRoomId) return;
        
        const allChecked = checkKtp && checkKk && checkSlip;
        if (!allChecked) {
            if (!confirm("Beberapa dokumen wajib belum dicentang. Apakah Anda yakin ingin melanjutkan?")) {
                return;
            }
        }

        try {
            setActionLoading(true);
            const payload = {
                room_id: Number(selectedRoomId),
                contract_start: contractStart,
                contract_end: contractEnd,
                deposit_amount: depositAmount,
                motor_count: motorCount,
                notes: notes,
                status: "contract_created"
            };

            await api.post(`/applications/${selectedApp.id}/interview`, payload);
            alert("Kontrak berhasil dibuat! Silakan cek di Data Penghuni untuk melihat kontrak.");
            setIsModalOpen(false);
            fetchData(); // Refresh data
        } catch (error: any) {
            alert(error.response?.data?.detail || "Gagal menyimpan keputusan wawancara.");
        } finally {
            setActionLoading(false);
        }
    };

    const filteredApps = apps.filter(app =>
        app.full_name.toLowerCase().includes(search.toLowerCase()) ||
        app.nik.includes(search)
    );

    const availableRoomsForTarget = selectedApp 
        ? rooms.filter(r => r.rusunawa === selectedApp.rusunawa_target)
        : [];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Tahap Wawancara
                    </h1>
                    <p className="text-slate-500 mt-1">Verifikasi dokumen dan pembuatan kontrak sewa unit.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari NIK atau Nama..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto text-sm">
                    <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2 border border-blue-100 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        {apps.length} Antrean Wawancara
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <p>Memuat data wawancara...</p>
                    </div>
                ) : filteredApps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 gap-3">
                        <Users className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                        <p>Tidak ada jadwal wawancara saat ini.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Tgl Daftar</th>
                                    <th className="px-6 py-4">Pendaftar</th>
                                    <th className="px-6 py-4">Lokasi Target</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <AnimatePresence>
                                    {filteredApps.map(app => (
                                        <motion.tr
                                            key={app.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-slate-900 dark:text-white">
                                                    {format(new Date(app.created_at), "dd MMM yyyy", { locale: id })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 min-w-[250px]">
                                                <div className="font-bold text-slate-900 dark:text-white">{app.full_name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5 space-y-0.5">
                                                    <p>NIK: <span className="font-mono">{app.nik}</span></p>
                                                    <p>WA: {app.phone_number}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-blue-600 dark:text-blue-400">{app.rusunawa_target}</div>
                                                <div className="text-xs text-slate-500">{app.family_members_count} Anggota Keluarga</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleOpenModal(app)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-blue-500/25"
                                                >
                                                    Mulai Wawancara
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Form Wawancara */}
            <AnimatePresence>
                {isModalOpen && selectedApp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                            onClick={handleCloseModal}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl custom-scrollbar"
                        >
                            <form onSubmit={handleSubmitInterview}>
                                {/* Header Modal */}
                                <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Formulir Wawancara & Kontrak</h2>
                                        <p className="text-sm text-slate-500">Pemohon: {selectedApp.full_name} ({selectedApp.nik})</p>
                                    </div>
                                    <button type="button" onClick={handleCloseModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                        &times;
                                    </button>
                                </div>

                                <div className="p-6 space-y-8">
                                    {/* Section 1: Verifikasi Dokumen */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Verifikasi Dokumen Fisik</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={checkKtp} onChange={e => setCheckKtp(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">KTP Asli Sesuai</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={checkKk} onChange={e => setCheckKk(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Kartu Keluarga Asli Sesuai</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={checkSlip} onChange={e => setCheckSlip(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Surat Keterangan Penghasilan / SKTM</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={checkNikah} onChange={e => setCheckNikah(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Surat Nikah (Opsional)</span>
                                            </label>
                                        </div>
                                    </section>

                                    {/* Section 2: Pemilihan Kamar */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                                <Building className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Penentuan Kamar</h3>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Pilih Kamar Kosong ({selectedApp.rusunawa_target})</label>
                                                <select
                                                    required
                                                    value={selectedRoomId}
                                                    onChange={e => setSelectedRoomId(Number(e.target.value))}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                >
                                                    <option value="" disabled>-- Pilih Kamar --</option>
                                                    {availableRoomsForTarget.map(r => (
                                                        <option key={r.id} value={r.id}>
                                                            {r.room_number} (Tipe {r.room_type}) - Rp{r.price.toLocaleString("id-ID")}/Bulan
                                                        </option>
                                                    ))}
                                                </select>
                                                {availableRoomsForTarget.length === 0 && (
                                                    <p className="text-sm text-red-500 mt-2">Tidak ada kamar kosong yang tersedia di rusunawa ini.</p>
                                                )}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Section 3: Detail Kontrak */}
                                    <section>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Detail Kontrak & Biaya</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tanggal Mulai Huni</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={contractStart}
                                                    onChange={e => {
                                                        setContractStart(e.target.value);
                                                        setContractEnd(format(addYears(new Date(e.target.value), 1), "yyyy-MM-dd"));
                                                    }}
                                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tanggal Selesai Kontrak</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={contractEnd}
                                                    onChange={e => setContractEnd(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Uang Jaminan (Deposit)</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                                                    <input
                                                        type="number"
                                                        required
                                                        min="0"
                                                        value={depositAmount}
                                                        onChange={e => setDepositAmount(Number(e.target.value))}
                                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">Default: 3x Harga Sewa Kamar</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Jumlah Kendaraan Motor</label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    max="4"
                                                    value={motorCount}
                                                    onChange={e => setMotorCount(Number(e.target.value))}
                                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                />
                                                <p className="text-xs text-slate-500 mt-1">Rp 30.000 / motor per bulan</p>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Catatan Wawancara (Opsional)</label>
                                                <textarea
                                                    rows={3}
                                                    value={notes}
                                                    onChange={e => setNotes(e.target.value)}
                                                    placeholder="Catatan khusus dari petugas wawancara..."
                                                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Footer Actions */}
                                <div className="sticky bottom-0 z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-end gap-3 rounded-b-3xl">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading || !selectedRoomId}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                                        Simpan & Buat Dokumen Kontrak
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
