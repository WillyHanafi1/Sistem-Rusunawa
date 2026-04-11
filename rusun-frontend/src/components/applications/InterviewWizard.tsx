"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { format, addYears } from "date-fns";
import { CheckCircle2, Loader2, FileText, Download, Building, Users, Calendar, Wallet, UserX, Search, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────
interface Application {
    id: number;
    nik: string;
    full_name: string;
    phone_number: string;
    email: string;
    rusunawa_target: string;
    family_members_count: number;
    status: string;
    created_at: string;
    place_of_birth: string | null;
    date_of_birth: string | null;
    religion: string | null;
    marital_status: string | null;
    occupation: string | null;
    previous_address: string | null;
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

interface InterviewWizardProps {
    /** If provided, this is a "continue interview" for an existing application. */
    application?: Application | null;
    /** If true, we're creating a new direct onboarding (no existing application). */
    isDirectOnboarding?: boolean;
    /** Called when wizard completes or is closed. */
    onClose: () => void;
    /** Called after successful submission to refresh data. */
    onSuccess: () => void;
}

// ─── Component ─────────────────────────────────────────
export default function InterviewWizard({ application, isDirectOnboarding = false, onClose, onSuccess }: InterviewWizardProps) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    // Wizard Step (0-4 for direct, 0-3 for existing app)
    const totalSteps = isDirectOnboarding ? 5 : 4;
    const [currentStep, setCurrentStep] = useState(0);

    // Step 0 (Direct only): Registration Data
    const [nik, setNik] = useState("");
    const [fullName, setFullName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [rusunTarget, setRusunTarget] = useState("Cigugur Tengah");
    const [familyMembersCount, setFamilyMembersCount] = useState(1);

    // Step: Bio Data
    const [placeOfBirth, setPlaceOfBirth] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [religion, setReligion] = useState("Islam");
    const [maritalStatus, setMaritalStatus] = useState("Belum Kawin");
    const [occupation, setOccupation] = useState("");
    const [previousAddress, setPreviousAddress] = useState("");

    // Step: Keluarga
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

    // Step: Legal
    const [skNumber, setSkNumber] = useState("");
    const [skDate, setSkDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [psNumber, setPsNumber] = useState("");
    const [psDate, setPsDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [sipNumber, setSipNumber] = useState("");
    const [sipDate, setSipDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [baNumber, setBaNumber] = useState("");
    const [baDate, setBaDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [entryTime, setEntryTime] = useState("08:00");

    // Step: Unit & Financial
    const [selectedRoomId, setSelectedRoomId] = useState<number | "">("");
    const [contractStart, setContractStart] = useState(format(new Date(), "yyyy-MM-dd"));
    const [contractEnd, setContractEnd] = useState(format(addYears(new Date(), 2), "yyyy-MM-dd"));
    const [depositAmount, setDepositAmount] = useState(0);
    const [motorCount, setMotorCount] = useState(0);
    const [notes, setNotes] = useState("");

    // Checklist
    const [checkKtp, setCheckKtp] = useState(false);
    const [checkKk, setCheckKk] = useState(false);
    const [checkNikah, setCheckNikah] = useState(false);
    const [checkSlip, setCheckSlip] = useState(false);

    // Result
    const [actionLoading, setActionLoading] = useState(false);
    const [interviewResult, setInterviewResult] = useState<{ success: boolean; links: { label: string; url: string }[] } | null>(null);

    // ─ Fetch rooms
    useEffect(() => {
        (async () => {
            try {
                const roomRes = await api.get("/rooms");
                setRooms(roomRes.data.filter((r: Room) => r.status === "kosong"));
            } catch (error) {
                console.error("Failed fetching rooms:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ─ Pre-fill from existing application
    useEffect(() => {
        if (application) {
            setPlaceOfBirth(application.place_of_birth || "");
            setDateOfBirth(application.date_of_birth || "");
            setReligion(application.religion || "Islam");
            setMaritalStatus(application.marital_status || "Belum Kawin");
            setOccupation(application.occupation || "");
            setPreviousAddress(application.previous_address || "");
            setRusunTarget(application.rusunawa_target);

            // Auto-generate legal numbers
            const yearSuffix = new Date().getFullYear();
            setSkNumber(`648.1/SK/01.001/${yearSuffix}`);
            setPsNumber(`648.1/PS/01.${application.id}/${yearSuffix}`);
            const paddedId = String(application.id).padStart(3, '0');
            setSipNumber(`648.1/SIP/01.${paddedId}/${yearSuffix}`);
            setBaNumber(`648.1/BA/01.${paddedId}/${yearSuffix}`);
        }
    }, [application]);

    // ─ Auto deposit when room changes
    useEffect(() => {
        if (selectedRoomId) {
            const room = rooms.find(r => r.id === Number(selectedRoomId));
            if (room) setDepositAmount(room.price * 2);
        }
    }, [selectedRoomId, rooms]);

    // ─ Wizard step mapping
    const getStepConfig = () => {
        if (isDirectOnboarding) {
            return [
                { label: "Pendaftaran", icon: <User className="w-4 h-4" /> },
                { label: "Biodata", icon: <UserX className="w-4 h-4" /> },
                { label: "Keluarga", icon: <Users className="w-4 h-4" /> },
                { label: "Legal", icon: <FileText className="w-4 h-4" /> },
                { label: "Unit", icon: <Building className="w-4 h-4" /> },
            ];
        }
        return [
            { label: "Biodata", icon: <UserX className="w-4 h-4" /> },
            { label: "Keluarga", icon: <Users className="w-4 h-4" /> },
            { label: "Legal", icon: <FileText className="w-4 h-4" /> },
            { label: "Unit", icon: <Building className="w-4 h-4" /> },
        ];
    };

    // ─ Resolve step to content index
    const getContentStep = () => {
        if (isDirectOnboarding) return currentStep;
        // Existing app skips registration step
        return currentStep + 1;
    };

    const steps = getStepConfig();
    const contentStep = getContentStep();

    // ─ Available rooms filter
    const targetRusun = application?.rusunawa_target || rusunTarget;
    const availableRooms = rooms.filter(r => r.rusunawa === targetRusun);

    // ─ Family member CRUD
    const addFamilyMember = () => {
        setFamilyMembers([...familyMembers, {
            name: "", age: 0, gender: "Laki-laki", religion: "Islam",
            marital_status: "Belum Kawin", relation: "Anak", occupation: ""
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

    // ─ Close handler with confirmation
    const handleClose = () => {
        if (currentStep > 0 && !interviewResult) {
            if (!confirm("Apakah Anda yakin ingin keluar? Data yang telah diisi akan hilang.")) return;
        }
        onClose();
    };

    // ─ Reject handler (for existing applications)
    const handleReject = async () => {
        if (!application) return;
        const reason = prompt("Masukkan alasan penolakan:");
        if (reason === null) return;
        if (!reason.trim()) { alert("Alasan penolakan harus diisi."); return; }
        try {
            setActionLoading(true);
            await api.post(`/applications/${application.id}/interview`, {
                status: "rejected", notes: reason, room_id: null
            });
            onClose();
            onSuccess();
            alert("Pengajuan telah ditolak.");
        } catch (error: any) {
            alert(error.response?.data?.detail || "Gagal menolak pengajuan.");
        } finally {
            setActionLoading(false);
        }
    };

    // ─ Submit handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoomId) return;

        try {
            setActionLoading(true);

            const commonPayload = {
                room_id: Number(selectedRoomId),
                contract_start: contractStart,
                contract_end: contractEnd,
                deposit_amount: depositAmount,
                motor_count: motorCount,
                notes,
                status: "contract_created",
                place_of_birth: placeOfBirth,
                date_of_birth: dateOfBirth,
                religion,
                marital_status: maritalStatus,
                occupation,
                previous_address: previousAddress,
                family_members: familyMembers,
                sk_number: skNumber, sk_date: skDate,
                ps_number: psNumber, ps_date: psDate,
                sip_number: sipNumber, sip_date: sipDate,
                ba_number: baNumber, ba_date: baDate,
                entry_time: entryTime,
            };

            let res;
            if (isDirectOnboarding) {
                // Direct onboarding endpoint
                res = await api.post("/applications/direct-onboarding", {
                    ...commonPayload,
                    nik, full_name: fullName, phone_number: phoneNumber,
                    email, rusunawa_target: rusunTarget,
                    family_members_count: familyMembersCount,
                });
            } else if (application) {
                // Existing application interview
                res = await api.post(`/applications/${application.id}/interview`, commonPayload);
            } else {
                return;
            }

            const appData = res.data;
            if (appData.notes && appData.notes.includes("INTERVIEW_SUCCESS")) {
                const parts = appData.notes.split("|");
                const rawLinks = parts[1] || "";
                const parsedLinks = rawLinks.split("\n").map((line: string) => {
                    const [label, path] = line.split(": ");
                    return { label, url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100'}/api/${path}` };
                });
                setInterviewResult({ success: true, links: parsedLinks });
            } else {
                onClose();
                onSuccess();
            }
        } catch (error: any) {
            alert(error.response?.data?.detail || "Gagal menyimpan data kontrak.");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Render ────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl custom-scrollbar"
            >
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {isDirectOnboarding ? "🚀 Tambah Kontrak Langsung" : "Formulir Wawancara & Kontrak"}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {isDirectOnboarding
                                    ? "Input data pendaftar, biodata, dan kontrak dalam satu langkah"
                                    : `Pemohon: ${application?.full_name} (${application?.nik})`
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isDirectOnboarding && application?.status === "interview" && !interviewResult && (
                                <button
                                    type="button"
                                    onClick={handleReject}
                                    disabled={actionLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-sm font-bold transition-all"
                                >
                                    <UserX className="w-4 h-4" /> Tolak
                                </button>
                            )}
                            <button type="button" onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 text-xl font-bold">
                                &times;
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-8 min-h-[500px]">
                        {interviewResult ? (
                            /* ─── Success Screen ─── */
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {isDirectOnboarding ? "Kontrak Berhasil Dibuat!" : "Wawancara Berhasil!"}
                                    </h2>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                        Status pengajuan telah diperbarui dan data penghuni baru telah dibuat. Silakan unduh dokumen berikut:
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                                    {interviewResult.links.map((link, idx) => (
                                        <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group"
                                        >
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
                                <button type="button" onClick={() => { onClose(); onSuccess(); }}
                                    className="mt-8 px-10 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold transition-all hover:opacity-90"
                                >
                                    Selesai & Tutup
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                {/* ─── Stepper Header ─── */}
                                <div className="flex items-center justify-between px-4 mb-8">
                                    {steps.map((s, idx) => (
                                        <React.Fragment key={idx}>
                                            <div className="flex flex-col items-center gap-2 relative">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                                    currentStep >= idx
                                                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30"
                                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                                                }`}>
                                                    {currentStep > idx ? <CheckCircle2 className="w-6 h-6" /> : s.icon}
                                                </div>
                                                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                                    currentStep >= idx ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                                                }`}>{s.label}</span>
                                            </div>
                                            {idx < steps.length - 1 && (
                                                <div className={`flex-1 h-0.5 mx-2 mb-6 transition-all ${
                                                    currentStep > idx ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
                                                }`} />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>

                                {/* ─── Step 0 (Direct): Pendaftaran ─── */}
                                {contentStep === 0 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                            <User className="w-5 h-5 text-emerald-500" /> Data Pendaftaran
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">NIK KTP <span className="text-red-500">*</span></label>
                                                <input type="text" value={nik} onChange={e => setNik(e.target.value.replace(/\D/g, ''))}
                                                    required maxLength={16} minLength={10}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="16 Digit NIK" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                                    required
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="Sesuai KTP" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">No. WhatsApp <span className="text-red-500">*</span></label>
                                                <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                                    required
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="08xxxxxxxxxx" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Email <span className="text-red-500">*</span></label>
                                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                                    required
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="email@gmail.com" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Lokasi Rusunawa <span className="text-red-500">*</span></label>
                                                <select value={rusunTarget} onChange={e => setRusunTarget(e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                                                >
                                                    <option value="Cigugur Tengah">Cigugur Tengah</option>
                                                    <option value="Cibeureum">Cibeureum</option>
                                                    <option value="Leuwigajah">Leuwigajah</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Jumlah Anggota Keluarga</label>
                                                <input type="number" value={familyMembersCount} onChange={e => setFamilyMembersCount(Number(e.target.value))}
                                                    min={1} max={10}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ─── Step: Biodata ─── */}
                                {contentStep === 1 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-4">
                                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                                    <FileText className="w-5 h-5 text-blue-500" /> Profil Pengguna
                                                </h3>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tempat Lahir</label>
                                                    <input type="text" value={placeOfBirth} onChange={e => setPlaceOfBirth(e.target.value)} required
                                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        placeholder="Contoh: Cimahi" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tanggal Lahir</label>
                                                    <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required
                                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Agama</label>
                                                        <select value={religion} onChange={e => setReligion(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                                                            {["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"].map(a => <option key={a} value={a}>{a}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Status Nikah</label>
                                                        <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)}
                                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
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
                                                    <input type="text" value={occupation} onChange={e => setOccupation(e.target.value)} required
                                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        placeholder="Contoh: Karyawan Swasta" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Alamat Asal (Sesuai KTP)</label>
                                                    <textarea rows={3} value={previousAddress} onChange={e => setPreviousAddress(e.target.value)} required
                                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        placeholder="Alamat lengkap sebelumnya..." />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Document Checklist */}
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
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                                            check.state ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-700 group-hover:border-blue-400"
                                                        }`}>
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

                                {/* ─── Step: Keluarga ─── */}
                                {contentStep === 2 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                                <Users className="w-5 h-5 text-blue-500" /> Detail Anggota Keluarga (Untuk SIP)
                                            </h3>
                                            <button type="button" onClick={addFamilyMember}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
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
                                                            <td className="p-2">
                                                                <input type="text" value={fm.name} onChange={e => updateFamilyMember(idx, 'name', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 rounded-lg outline-none transition-all" placeholder="Nama Lengkap" />
                                                            </td>
                                                            <td className="p-2 w-20">
                                                                <input type="number" value={fm.age} onChange={e => updateFamilyMember(idx, 'age', Number(e.target.value))}
                                                                    className="w-full px-3 py-2 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 rounded-lg outline-none transition-all" />
                                                            </td>
                                                            <td className="p-2 w-28">
                                                                <select value={fm.gender} onChange={e => updateFamilyMember(idx, 'gender', e.target.value)} className="w-full px-3 py-2 bg-transparent">
                                                                    <option value="Laki-laki">L</option>
                                                                    <option value="Perempuan">P</option>
                                                                </select>
                                                            </td>
                                                            <td className="p-2 w-32">
                                                                <select value={fm.relation} onChange={e => updateFamilyMember(idx, 'relation', e.target.value)} className="w-full px-3 py-2 bg-transparent">
                                                                    {["Suami", "Istri", "Anak", "Orang Tua", "Mertua", "Saudara"].map(h => <option key={h} value={h}>{h}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="p-2">
                                                                <input type="text" value={fm.occupation} onChange={e => updateFamilyMember(idx, 'occupation', e.target.value)}
                                                                    className="w-full px-3 py-2 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 rounded-lg outline-none transition-all" placeholder="Pekerjaan" />
                                                            </td>
                                                            <td className="p-2">
                                                                <button type="button" onClick={() => removeFamilyMember(idx)} className="text-red-400 hover:text-red-600 transition-colors font-bold">&times;</button>
                                                            </td>
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

                                {/* ─── Step: Legal ─── */}
                                {contentStep === 3 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                            <FileText className="w-5 h-5 text-blue-500" /> Penomoran & Administrasi Surat
                                        </h3>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
                                            {/* SK */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Nomor SK Wawancara</label>
                                                    <input type="text" value={skNumber} onChange={e => setSkNumber(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tanggal SK</label>
                                                    <input type="date" value={skDate} onChange={e => setSkDate(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                </div>
                                            </div>
                                            {/* PS */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Nomor Perjanjian Sewa (PS)</label>
                                                    <input type="text" value={psNumber} onChange={e => setPsNumber(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tanggal PS</label>
                                                    <input type="date" value={psDate} onChange={e => setPsDate(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                </div>
                                            </div>
                                            {/* SIP */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Nomor SIP</label>
                                                    <input type="text" value={sipNumber} onChange={e => setSipNumber(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tanggal SIP</label>
                                                    <input type="date" value={sipDate} onChange={e => setSipDate(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                </div>
                                            </div>
                                            {/* BAST */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Nomor BAST (BA)</label>
                                                    <input type="text" value={baNumber} onChange={e => setBaNumber(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Tanggal BAST</label>
                                                    <input type="date" value={baDate} onChange={e => setBaDate(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                </div>
                                            </div>
                                            {/* Entry Time */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="hidden md:block"></div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 pl-1">Jam Masuk (Untuk SIP)</label>
                                                    <input type="time" value={entryTime} onChange={e => setEntryTime(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ─── Step: Unit & Finansial ─── */}
                                {contentStep === 4 && (
                                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                                        {/* Room Selection */}
                                        <section>
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                                    <Building className="w-5 h-5" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Penempatan Unit</h3>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                                        Pilih Kamar Kosong ({targetRusun})
                                                    </label>
                                                    <select required value={selectedRoomId} onChange={e => setSelectedRoomId(Number(e.target.value))}
                                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                    >
                                                        <option value="" disabled>-- Pilih Kamar --</option>
                                                        {availableRooms.map(r => (
                                                            <option key={r.id} value={r.id}>
                                                                {r.room_number} (Tipe {r.room_type}) - Rp{r.price.toLocaleString("id-ID")}/Bulan
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {availableRooms.length === 0 && (
                                                        <p className="text-sm text-red-500 mt-2">Tidak ada kamar kosong yang tersedia di rusunawa ini.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </section>

                                        {/* Financial */}
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
                                                    <input type="date" required value={contractStart}
                                                        onChange={e => { setContractStart(e.target.value); setContractEnd(format(addYears(new Date(e.target.value), 2), "yyyy-MM-dd")); }}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tanggal Selesai (Default 2 Thn)</label>
                                                    <input type="date" required value={contractEnd} onChange={e => setContractEnd(e.target.value)}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Uang Jaminan (Deposit)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                                                        <input type="number" required min="0" value={depositAmount} onChange={e => setDepositAmount(Number(e.target.value))}
                                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Jumlah Kendaraan Motor</label>
                                                    <input type="number" required min="0" max="4" value={motorCount} onChange={e => setMotorCount(Number(e.target.value))}
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Catatan Wawancara / Hasil Verifikasi</label>
                                                    <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                                                        placeholder="Catatan hasil wawancara untuk BA..."
                                                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
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
                                {currentStep < totalSteps - 1 ? (
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
                                        {isDirectOnboarding ? "Buat Kontrak & Terbitkan Dokumen" : "Simpan & Terbitkan Dokumen"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </form>
            </motion.div>
        </div>
    );
}
