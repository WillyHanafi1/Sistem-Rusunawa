"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { format, addYears } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle2, Search, Loader2, FileText, Download, Building, Users, Calendar, Wallet, UserX } from "lucide-react";
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

interface FamilyMember {
    name: string;
    age: number;
    gender: string;
    religion: string;
    marital_status: string;
    relation: string;
    occupation: string;
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
    const [activeTab, setActiveTab] = useState<"antrean" | "diterima" | "ditolak">("antrean");

    const statusMap = {
        antrean: "interview",
        diterima: "contract_created",
        ditolak: "rejected"
    };

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
    const [interviewResult, setInterviewResult] = useState<{success: boolean, links: {label: string, url: string}[]} | null>(null);

    // Checklist
    const [checkKtp, setCheckKtp] = useState(false);
    const [checkKk, setCheckKk] = useState(false);
    const [checkNikah, setCheckNikah] = useState(false);
    const [checkSlip, setCheckSlip] = useState(false);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(0); // 0: Bio, 1: Keluarga, 2: Legal, 3: Unit
    
    // Step 1: Bio Data
    const [placeOfBirth, setPlaceOfBirth] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [religion, setReligion] = useState("Islam");
    const [maritalStatus, setMaritalStatus] = useState("Belum Kawin");
    const [occupation, setOccupation] = useState("");
    const [previousAddress, setPreviousAddress] = useState("");

    // Step 2: Keluarga
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

    // Step 3: Legal
    const [skNumber, setSkNumber] = useState("");
    const [skDate, setSkDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [psNumber, setPsNumber] = useState("");
    const [psDate, setPsDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [sipNumber, setSipNumber] = useState("");
    const [sipDate, setSipDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [baNumber, setBaNumber] = useState("");
    const [baDate, setBaDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [entryTime, setEntryTime] = useState("08:00");

    const fetchData = async () => {
        try {
            setLoading(true);
            const status = statusMap[activeTab];
            const [appRes, roomRes] = await Promise.all([
                api.get(`/applications?status=${status}`),
                api.get("/rooms")
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
    }, [activeTab]);

    // Automatically set deposit to 3x rent when room is selected
    useEffect(() => {
        if (selectedRoomId) {
            const room = rooms.find(r => r.id === Number(selectedRoomId));
            if (room) {
                setDepositAmount(room.price * 2);
            }
        }
    }, [selectedRoomId, rooms]);

    const handleOpenModal = (app: Application) => {
        setSelectedApp(app);
        setIsModalOpen(true);
        setCurrentStep(0);
        // Reset form
        setSelectedRoomId("");
        setContractStart(format(new Date(), "yyyy-MM-dd"));
        setContractEnd(format(addYears(new Date(), 1), "yyyy-MM-dd")); // Default 1 year (Perwal allows 6-24 months)
        setDepositAmount(0);
        setMotorCount(0);
        setNotes("");
        setCheckKtp(false);
        setCheckKk(false);
        setCheckNikah(false);
        setCheckSlip(false);
        
        // Reset Bio
        setPlaceOfBirth("");
        setDateOfBirth("");
        setReligion("Islam");
        setMaritalStatus("Belum Kawin");
        setOccupation("");
        setPreviousAddress("");
        setFamilyMembers([]);
        
        // Reset Legal
        const yearSuffix = new Date().getFullYear();
        setSkNumber(`648.1/SK/01.001/${yearSuffix}`);
        setSkDate(format(new Date(), "yyyy-MM-dd"));
        setPsNumber(`648.1/PS/01.${app.id}/${yearSuffix}`);
        setPsDate(format(new Date(), "yyyy-MM-dd"));
        setSipNumber(`648.1/SIP/01.${app.id < 10 ? '00' + app.id : app.id < 100 ? '0' + app.id : app.id}/${yearSuffix}`);
        setSipDate(format(new Date(), "yyyy-MM-dd"));
        setBaNumber(`648.1/BA/01.${app.id < 10 ? '00' + app.id : app.id < 100 ? '0' + app.id : app.id}/${yearSuffix}`);
        setBaDate(format(new Date(), "yyyy-MM-dd"));
        setEntryTime("08:00");
    };

    const addFamilyMember = () => {
        setFamilyMembers([...familyMembers, {
            name: "",
            age: 0,
            gender: "Laki-laki",
            religion: "Islam",
            marital_status: "Belum Kawin",
            relation: "Anak",
            occupation: ""
        }]);
    };

    const removeFamilyMember = (index: number) => {
        setFamilyMembers(familyMembers.filter((_, i) => i !== index));
    };

    const updateFamilyMember = (index: number, field: keyof FamilyMember, value: any) => {
        const updated = [...familyMembers];
        updated[index] = { ...updated[index], [field]: value };
        setFamilyMembers(updated);
    };

    const handleCloseModal = () => {
        if (currentStep > 0 && !interviewResult) {
            if (!confirm("Apakah Anda yakin ingin keluar? Data yang telah diisi akan hilang.")) {
                return;
            }
        }
        setIsModalOpen(false);
        setSelectedApp(null);
        setInterviewResult(null);
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
                status: "contract_created",
                
                // New Fields
                place_of_birth: placeOfBirth,
                date_of_birth: dateOfBirth,
                religion: religion,
                marital_status: maritalStatus,
                occupation: occupation,
                previous_address: previousAddress,
                
                family_members: familyMembers,
                
                sk_number: skNumber,
                sk_date: skDate,
                ps_number: psNumber,
                ps_date: psDate,
                sip_number: sipNumber,
                sip_date: sipDate,
                ba_number: baNumber,
                ba_date: baDate,
                entry_time: entryTime
            };

            const res = await api.post(`/applications/${selectedApp.id}/interview`, payload);
            
            // Check for success flag in notes
            const appData = res.data;
            if (appData.notes && appData.notes.includes("INTERVIEW_SUCCESS")) {
                const parts = appData.notes.split("|");
                const RawLinks = parts[1] || "";
                const parsedLinks = RawLinks.split("\n").map((line: string) => {
                    const [label, path] = line.split(": ");
                    return { label, url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100'}/api/${path}` };
                });
                setInterviewResult({ success: true, links: parsedLinks });
            } else {
                handleCloseModal();
                fetchData();
            }
        } catch (error: any) {
            alert(error.response?.data?.detail || "Gagal menyimpan keputusan wawancara.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedApp) return;
        
        const reason = prompt("Masukkan alasan penolakan:");
        if (reason === null) return; // Cancelled
        if (!reason.trim()) {
            alert("Alasan penolakan harus diisi.");
            return;
        }

        try {
            setActionLoading(true);
            await api.post(`/applications/${selectedApp.id}/interview`, {
                status: "rejected",
                notes: reason,
                room_id: null
            });
            handleCloseModal();
            fetchData();
            alert("Pengajuan telah ditolak.");
        } catch (error: any) {
            alert(error.response?.data?.detail || "Gagal menolak pengajuan.");
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600" />
                            Manajemen Wawancara
                        </h1>
                        <p className="text-slate-500 mt-1">Kelola proses seleksi calon penghuni rusunawa</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Cari NIK atau nama..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-64 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl mb-6 w-fit border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab("antrean")}
                        className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                            activeTab === "antrean"
                                ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                    >
                        Antrean
                    </button>
                    <button
                        onClick={() => setActiveTab("diterima")}
                        className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                            activeTab === "diterima"
                                ? "bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                    >
                        Diterima
                    </button>
                    <button
                        onClick={() => setActiveTab("ditolak")}
                        className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                            activeTab === "ditolak"
                                ? "bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                    >
                        Ditolak
                    </button>
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
                                    <th className="px-6 py-4">Nama</th>
                                    <th className="px-6 py-4">NIK</th>
                                    <th className="px-6 py-4">No. WA</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Lokasi Target</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                    <th className="px-6 py-4 text-center">Status</th>
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
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-slate-900 dark:text-white">{app.full_name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-mono text-xs">{app.nik}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs">{app.phone_number}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs">{app.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-blue-600 dark:text-blue-400">{app.rusunawa_target}</div>
                                                <div className="text-xs text-slate-500">{app.family_members_count} Anggota Keluarga</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {activeTab === "antrean" ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedApp(app);
                                                                const reason = prompt("Masukkan alasan penolakan:");
                                                                if (reason) {
                                                                    api.post(`/applications/${app.id}/interview`, {
                                                                        status: "rejected",
                                                                        notes: reason,
                                                                        room_id: null
                                                                    }).then(() => fetchData()).catch(err => alert(err.response?.data?.detail || "Gagal menolak"));
                                                                }
                                                            }}
                                                            className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-sm font-medium transition-all"
                                                            title="Tolak Pengajuan"
                                                        >
                                                            <UserX className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenModal(app)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-blue-500/25"
                                                        >
                                                            Mulai Wawancara
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenModal(app)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-all"
                                                    >
                                                        Lihat Detail
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {activeTab === "antrean" && (
                                                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">Menunggu</span>
                                                )}
                                                {activeTab === "diterima" && (
                                                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Diterima</span>
                                                )}
                                                {activeTab === "ditolak" && (
                                                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 border border-red-200">Ditolak</span>
                                                )}
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
                            // Removed onClick to prevent accidental progress loss
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
                                    <div className="flex items-center gap-3">
                                        {activeTab === "antrean" && !interviewResult && (
                                            <button 
                                                type="button" 
                                                onClick={handleReject}
                                                disabled={actionLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-sm font-bold transition-all"
                                            >
                                                <UserX className="w-4 h-4" />
                                                Tolak
                                            </button>
                                        )}
                                        <button type="button" onClick={handleCloseModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                                            &times;
                                        </button>
                                    </div>
                                </div>
                                {/* Body Scrollable Area */}
                                <div className="p-6 space-y-8 min-h-[500px]">
                                    {interviewResult ? (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="w-12 h-12" />
                                            </div>
                                            <div className="space-y-2">
                                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Wawancara Berhasil!</h2>
                                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Status pengajuan telah diperbarui dan data penghuni baru telah dibuat. Silakan unduh dokumen berikut:</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                                                {interviewResult.links.map((link, idx) => (
                                                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500 group-hover:text-emerald-500 transition-colors">
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <div className="text-left">
                                                                <span className="block text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tighter">{link.label.replace('_', ' ')}</span>
                                                                <span className="block text-xs text-slate-400">PDF Document</span>
                                                            </div>
                                                        </div>
                                                        <Download className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-all" />
                                                    </a>
                                                ))}
                                            </div>

                                            <button type="button" onClick={() => { handleCloseModal(); fetchData(); }} className="mt-8 px-10 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold transition-all hover:opacity-90">
                                                Selesai & Tutup
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <>
                                            {/* Stepper Header */}
                                    <div className="flex items-center justify-between px-4 mb-8">
                                        {[
                                            { label: "Biodata", icon: <UserX className="w-4 h-4" /> },
                                            { label: "Keluarga", icon: <Users className="w-4 h-4" /> },
                                            { label: "Legal", icon: <FileText className="w-4 h-4" /> },
                                            { label: "Unit", icon: <Building className="w-4 h-4" /> }
                                        ].map((s, idx) => (
                                            <React.Fragment key={idx}>
                                                <div className={`flex flex-col items-center gap-2 relative`}>
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${currentStep >= idx ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"}`}>
                                                        {currentStep > idx ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
                                                    </div>
                                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${currentStep >= idx ? "text-blue-600 dark:text-blue-400" : "text-slate-400"}`}>{s.label}</span>
                                                </div>
                                                {idx < 3 && <div className={`flex-1 h-0.5 mx-2 mb-6 transition-all ${currentStep > idx ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"}`} />}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    {/* Step 0: Biodata & Verifikasi */}
                                    {currentStep === 0 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                                        <FileText className="w-5 h-5 text-blue-500" /> Profil Pengguna
                                                    </h3>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tempat Lahir</label>
                                                        <input type="text" value={placeOfBirth} onChange={e => setPlaceOfBirth(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Contoh: Cimahi" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tanggal Lahir</label>
                                                        <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Agama</label>
                                                            <select value={religion} onChange={e => setReligion(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                                                                {["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"].map(a => <option key={a} value={a}>{a}</option>)}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Status Nikah</label>
                                                            <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                                                                {["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"].map(s => <option key={s} value={s}>{s}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                                        <Search className="w-5 h-5 text-blue-500" /> Informasi Pekerjaan & Asal
                                                    </h3>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Pekerjaan</label>
                                                        <input type="text" value={occupation} onChange={e => setOccupation(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Contoh: Karyawan Swasta" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Alamat Asal (Sesuai KTP)</label>
                                                        <textarea rows={3} value={previousAddress} onChange={e => setPreviousAddress(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Alamat lengkap sebelumnya..." />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                                <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-4 uppercase tracking-wider">Verifikasi Dokumen Fisik</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {[
                                                        { label: "KTP Asli", state: checkKtp, set: setCheckKtp },
                                                        { label: "Kartu Keluarga", state: checkKk, set: setCheckKk },
                                                        { label: "Surat Nikah", state: checkNikah, set: setCheckNikah },
                                                        { label: "Slip Gaji / SKTM", state: checkSlip, set: setCheckSlip }
                                                    ].map(check => (
                                                        <label key={check.label} className="flex items-center gap-3 cursor-pointer group">
                                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${check.state ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-700 group-hover:border-blue-400"}`}>
                                                                {check.state && <CheckCircle2 className="w-4 h-4" />}
                                                                <input type="checkbox" checked={check.state} onChange={e => check.set(e.target.checked)} className="hidden" />
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{check.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 1: Anggota Keluarga */}
                                    {currentStep === 1 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                                    <Users className="w-5 h-5 text-blue-500" /> Detail Anggota Keluarga (Untuk SIP)
                                                </h3>
                                                <button type="button" onClick={addFamilyMember} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                                                    + Tambah Anggota
                                                </button>
                                            </div>
                                            
                                            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                                                        <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                            <th className="px-4 py-3">Nama</th>
                                                            <th className="px-4 py-3">Umur</th>
                                                            <th className="px-4 py-3">L/P</th>
                                                            <th className="px-4 py-3">Hubungan</th>
                                                            <th className="px-4 py-3">Pekerjaan</th>
                                                            <th className="px-4 py-3 w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {familyMembers.map((fm, idx) => (
                                                            <tr key={idx} className="bg-white dark:bg-slate-900/50 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                                <td className="p-2"><input type="text" value={fm.name} onChange={e => updateFamilyMember(idx, 'name', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 rounded-lg outline-none transition-all" placeholder="Nama Lengkap" /></td>
                                                                <td className="p-2 w-20"><input type="number" value={fm.age} onChange={e => updateFamilyMember(idx, 'age', Number(e.target.value))} className="w-full px-3 py-2 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 rounded-lg outline-none transition-all" /></td>
                                                                <td className="p-2 w-28">
                                                                    <select value={fm.gender} onChange={e => updateFamilyMember(idx, 'gender', e.target.value)} className="w-full px-3 py-2 bg-transparent">
                                                                        <option value="L">L</option>
                                                                        <option value="P">P</option>
                                                                    </select>
                                                                </td>
                                                                <td className="p-2 w-32">
                                                                    <select value={fm.relation} onChange={e => updateFamilyMember(idx, 'relation', e.target.value)} className="w-full px-3 py-2 bg-transparent">
                                                                        {["Suami", "Istri", "Anak", "Orang Tua", "Mertua", "Saudara"].map(h => <option key={h} value={h}>{h}</option>)}
                                                                    </select>
                                                                </td>
                                                                <td className="p-2"><input type="text" value={fm.occupation} onChange={e => updateFamilyMember(idx, 'occupation', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 rounded-lg outline-none transition-all" placeholder="Pekerjaan" /></td>
                                                                <td className="p-2"><button type="button" onClick={() => removeFamilyMember(idx)} className="text-red-400 hover:text-red-600 transition-colors font-bold">&times;</button></td>
                                                            </tr>
                                                        ))}
                                                        {familyMembers.length === 0 && (
                                                            <tr>
                                                                <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">Klik tambah untuk memasukkan data keluarga</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 2: Penomoran Surat */}
                                    {currentStep === 2 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                             <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                                <FileText className="w-5 h-5 text-blue-500" /> Penomoran & Administrasi Surat
                                            </h3>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
                                                {/* Row 1: SK Wawancara */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Nomor SK Wawancara</label>
                                                        <input type="text" value={skNumber} onChange={e => setSkNumber(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tanggal SK</label>
                                                        <input type="date" value={skDate} onChange={e => setSkDate(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                    </div>
                                                </div>

                                                {/* Row 2: Perjanjian Sewa */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Nomor Perjanjian Sewa (PS)</label>
                                                        <input type="text" value={psNumber} onChange={e => setPsNumber(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tanggal PS</label>
                                                        <input type="date" value={psDate} onChange={e => setPsDate(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                    </div>
                                                </div>

                                                {/* Row 3: SIP */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Nomor SIP</label>
                                                        <input type="text" value={sipNumber} onChange={e => setSipNumber(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tanggal SIP</label>
                                                        <input type="date" value={sipDate} onChange={e => setSipDate(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                    </div>
                                                </div>

                                                {/* Row 4: BAST */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Nomor BAST (BA)</label>
                                                        <input type="text" value={baNumber} onChange={e => setBaNumber(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tanggal BAST</label>
                                                        <input type="date" value={baDate} onChange={e => setBaDate(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                    </div>
                                                </div>

                                                {/* Row 5: Time (Special case) */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="hidden md:block"></div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Jam Masuk (Untuk SIP)</label>
                                                        <input type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 3: Unit & Finansial */}
                                    {currentStep === 3 && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                            {/* Section 2: Pemilihan Kamar */}
                                            <section>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                                        <Building className="w-5 h-5" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Penempatan Unit</h3>
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
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Parameter Sewa & Finansial</h3>
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
                                                                setContractEnd(format(addYears(new Date(e.target.value), 2), "yyyy-MM-dd"));
                                                            }}
                                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tanggal Selesai (Default 2 Thn)</label>
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
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Catatan Wawancara / Hasil Verifikasi</label>
                                                        <textarea
                                                            rows={3}
                                                            value={notes}
                                                            onChange={e => setNotes(e.target.value)}
                                                            placeholder="Catatan hasil wawancara untuk BA..."
                                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </section>
                                        </motion.div>
                                    )}
                                        </>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                {!interviewResult && (
                                    <div className="sticky bottom-0 z-10 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between rounded-b-3xl">
                                    <button
                                        type="button"
                                        disabled={currentStep === 0}
                                        onClick={() => setCurrentStep(currentStep - 1)}
                                        className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors disabled:opacity-30"
                                    >
                                        Sebelumnya
                                    </button>
                                    
                                    <div className="flex items-center gap-3">
                                        {currentStep < 3 ? (
                                            <button
                                                type="button"
                                                onClick={() => setCurrentStep(currentStep + 1)}
                                                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25"
                                            >
                                                Lanjutkan
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={actionLoading || !selectedRoomId}
                                                className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                                            >
                                                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                                Simpan & Terbitkan 3 Dokumen
                                            </button>
                                        )}
                                    </div>
                                </div>
                                )}
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
