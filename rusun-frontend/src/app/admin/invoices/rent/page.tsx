"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import api, { handleDownload, previewPdf } from "@/lib/api";
import { Loader2, Filter, ChevronLeft, ChevronRight, AlertCircle, Sparkles, FileText, TrendingUp, AlertTriangle, DollarSign, Layers, X, CheckCircle2, ArrowRight, Calendar, Hash, Printer, ShieldCheck, Ban } from "lucide-react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import InvoiceMonthDrawer, { InvoiceDetail } from "@/components/InvoiceMonthDrawer";

interface Room {
    id: number;
    rusunawa: string;
    building: string;
    floor: number;
    unit_number: number;
    room_number: string;
    price: number;
    status: "kosong" | "isi" | "rusak";
    tenant_name?: string | null;
    contract_start?: string | null;
    contract_end?: string | null;
    parking_price?: number;
    total_unpaid_bill?: number;
    tenant_id?: number | null;
    notes?: string | null;
    renewal_count?: number;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const ROMAN: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X" };
const toRoman = (n: number) => ROMAN[n] || String(n);

const SITE_ORDER: Record<string, number> = {
    "Cigugur Tengah": 1,
    "Cibeureum": 2,
    "Leuwigajah": 3
};

const STATUS_BADGE: Record<string, string> = {
    kosong: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    isi: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
    rusak: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
};

// ---
// Mini 12-Month Payment Matrix Cell Component
// ---
interface MatrixCellProps {
    month: number; // 1-12
    year: number;
    contractStart?: string | null;
    contractEnd?: string | null;
    invoice?: InvoiceDetail;
    disabled: boolean; // before contract start
    onClick: (inv: InvoiceDetail) => void;
}

function MatrixCell({ month, year, contractStart, contractEnd, invoice, disabled, onClick }: MatrixCellProps) {
    const cellStyle = useMemo(() => {
        if (disabled) {
            return "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-300 dark:text-slate-600 cursor-not-allowed";
        }
        if (!invoice) {
            return "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 cursor-not-allowed";
        }
        if (invoice.status === "paid") {
            return "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-500/20";
        }
        if (invoice.status === "overdue") {
            return "bg-red-100 dark:bg-red-500/20 border-red-500 dark:border-red-500/60 text-red-700 dark:text-red-400 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:shadow-red-500/20 animate-pulse";
        }
        if (invoice.status === "unpaid") {
            return "bg-amber-100 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500/50 text-amber-700 dark:text-amber-400 cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:shadow-amber-500/20";
        }
        if (invoice.status === "cancelled") {
            return "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-400 cursor-pointer";
        }
        return "";
    }, [disabled, invoice]);

    const MONTHS_LONG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const statusLabel: Record<string, string> = { paid: "Lunas", unpaid: "Belum Dibayar", overdue: "Jatuh Tempo", cancelled: "Dibatalkan" };

    const tooltip = disabled
        ? `Sebelum masa kontrak`
        : invoice
            ? `${MONTHS_LONG[month - 1]} ${year} — ${statusLabel[invoice.status] ?? invoice.status}`
            : `${MONTHS_LONG[month - 1]} ${year} — Belum di-generate`;

    const isClickable = !disabled && !!invoice;

    return (
        <button
            disabled={!isClickable}
            onClick={() => isClickable && onClick(invoice!)}
            title={tooltip}
            className={`w-6 h-6 flex-shrink-0 rounded-md border-2 flex items-center justify-center font-bold text-[9px] transition-all duration-150 select-none ${cellStyle}`}
        >
            {month}
        </button>
    );
}

// ---
// Summary Card Component
// ---
function SummaryCard({ icon, label, value, subtext, color }: { icon: React.ReactNode; label: string; value: string | number; subtext?: string; color: string }) {
    const colorMap: Record<string, string> = {
        blue: "bg-blue-50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400",
        amber: "bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400",
        red: "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400",
        emerald: "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    };
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${colorMap[color]}`}>
            <div className="shrink-0">{icon}</div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
                <p className="text-lg font-black leading-tight">{value}</p>
                {subtext && <p className="text-[10px] font-medium opacity-60">{subtext}</p>}
            </div>
        </div>
    );
}

// ---
// Main Page
// ---
export default function RentInvoicesPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    // Invoice map: tenant_id → month → invoice
    const [invoiceMap, setInvoiceMap] = useState<Map<number, Map<number, InvoiceDetail>>>(new Map());

    // Selected invoice for drawer
    const [selectedInvoice, setSelectedInvoice] = useState<{ invoice: InvoiceDetail; tenantName: string; roomNumber: string } | null>(null);

    // Mass Action Panel State
    const [massActionPanelOpen, setMassActionPanelOpen] = useState(false);
    const [massActionTarget, setMassActionTarget] = useState<string>("skrd");
    const [massActionPreview, setMassActionPreview] = useState<{ count: number, message: string } | null>(null);
    const [isMassActionLoading, setIsMassActionLoading] = useState(false);
    const [massActionDone, setMassActionDone] = useState(false);
    const [massActionStartNo, setMassActionStartNo] = useState<number | undefined>(undefined);
    const [massActionSignDate, setMassActionSignDate] = useState<string>(new Date().toISOString().split("T")[0]); // YYYY-MM-DD
    // SKRD-specific inputs
    const [massActionMonth, setMassActionMonth] = useState(new Date().getMonth() + 1);
    const [massActionYear, setMassActionYear] = useState(new Date().getFullYear());
    const [skrdDueDay, setSkrdDueDay] = useState(20);
    const [skrdStartNo, setSkrdStartNo] = useState<number | undefined>(undefined);
    // Prerequisite checking
    const [prerequisiteData, setPrerequisiteData] = useState<{
        counts: Record<string, number>;
        unpaid_counts: Record<string, number>;
        prerequisites: Record<string, boolean>;
        total_invoices: number;
    } | null>(null);
    const [isLoadingPrereqs, setIsLoadingPrereqs] = useState(false);

    // Mass Print Job State
    const [printJobId, setPrintJobId] = useState<string | null>(null);
    const [printJobData, setPrintJobData] = useState<{ status: string, processed: number, total: number, error?: string } | null>(null);

    // Filters & Search State
    const [filterSearch, setFilterSearch] = useState("");
    const [filterRusunawa, setFilterRusunawa] = useState("");
    const [filterBuilding, setFilterBuilding] = useState("");
    const [filterFloor, setFilterFloor] = useState("");
    const [filterUnit, setFilterUnit] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterBilling, setFilterBilling] = useState(""); // billing-specific filter
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());

    // --- Fetch rooms ---
    const fetchRooms = async () => {
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
            console.error("Failed to fetch extended rooms:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- Fetch all invoices for selected year ---
    const fetchInvoicesForYear = async (year: number) => {
        setLoadingInvoices(true);
        try {
            const res = await api.get(`/invoices?year=${year}&limit=9999`);
            const invoices: InvoiceDetail[] = res.data;

            // Build Map<tenant_id, Map<month, Invoice>>
            const map = new Map<number, Map<number, InvoiceDetail>>();
            for (const inv of invoices) {
                const tId = Number(inv.tenant_id);
                if (!map.has(tId)) {
                    map.set(tId, new Map());
                }
                map.get(tId)!.set(inv.period_month, inv);
            }
            setInvoiceMap(map);
        } catch (err) {
            console.error("Failed to fetch invoices for year:", err);
        } finally {
            setLoadingInvoices(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchRooms, 400);
        return () => clearTimeout(timer);
    }, [filterSearch, filterRusunawa, filterBuilding, filterFloor, filterUnit]);

    useEffect(() => {
        if (rooms.length === 0) return;
        fetchInvoicesForYear(filterYear);
    }, [filterYear, rooms]);

    // --- Mass Actions Logic ---
    const MASS_ACTION_TYPES = [
        { key: "skrd", label: "SKRD", desc: "Surat Ketetapan Retribusi Daerah", color: "blue" },
        { key: "strd", label: "STRD", desc: "Surat Tagihan Retribusi Daerah", color: "amber" },
        { key: "teguran1", label: "Teguran 1", desc: "Surat Teguran Pertama", color: "orange" },
        { key: "teguran2", label: "Teguran 2", desc: "Surat Teguran Kedua", color: "rose" },
        { key: "teguran3", label: "Teguran 3", desc: "Surat Teguran Ketiga", color: "red" },
    ];

    const getMassActionLabel = (target: string) => {
        return MASS_ACTION_TYPES.find(t => t.key === target)?.label || "Dokumen";
    };

    const openMassPanel = () => {
        setMassActionPanelOpen(true);
        setMassActionTarget("skrd");
        setMassActionPreview(null);
        setMassActionDone(false);
        setMassActionSignDate(new Date().toISOString().split("T")[0]);
        setPrerequisiteData(null);
    };

    // Fetch prerequisite data when period changes
    const fetchPrerequisites = useCallback(async () => {
        setIsLoadingPrereqs(true);
        try {
            const res = await api.get(`/tasks/check-prerequisites?period_month=${massActionMonth}&period_year=${massActionYear}`);
            setPrerequisiteData(res.data);
        } catch (err) {
            console.error("Failed to fetch prerequisites:", err);
        } finally {
            setIsLoadingPrereqs(false);
        }
    }, [massActionMonth, massActionYear]);

    useEffect(() => {
        if (massActionPanelOpen) {
            fetchPrerequisites();
        }
    }, [massActionPanelOpen, fetchPrerequisites]);

    // --- Polling for Mass Print Job ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (printJobId && printJobData?.status !== "completed" && printJobData?.status !== "failed") {
            interval = setInterval(async () => {
                try {
                    const res = await api.get(`/invoices/print-bulk/status/${printJobId}`);
                    setPrintJobData(res.data);
                } catch (err) {
                    console.error("Job status check failed", err);
                }
            }, 2000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [printJobId, printJobData?.status]);

    const triggerMassPreview = useCallback(async () => {
        setIsMassActionLoading(true);
        setMassActionPreview(null);
        setMassActionDone(false);
        try {
            if (massActionTarget === "skrd") {
                setMassActionPreview({
                    count: -1,
                    message: `Akan men-generate SKRD untuk seluruh penghuni aktif pada periode ${MONTHS_SHORT[massActionMonth - 1]} ${massActionYear}. Penghuni yang sudah memiliki tagihan di bulan ini akan di-skip otomatis.`
                });
            } else {
                const res = await api.post("/tasks/mass-escalate", {
                    target_doc_type: massActionTarget,
                    dry_run: true,
                    period_month: massActionMonth,
                    period_year: massActionYear
                });
                setMassActionPreview({ count: res.data.processed, message: res.data.message });
            }
        } catch (err: any) {
            alert(err.response?.data?.detail || "Gagal memproses pratinjau");
        } finally {
            setIsMassActionLoading(false);
        }
    }, [massActionTarget, massActionMonth, massActionYear]);

    const confirmMassAction = async () => {
        // Validasi field wajib sebelum eksekusi
        if (massActionTarget !== "skrd") {
            if (!massActionStartNo) {
                alert("Nomor urut awal wajib diisi.");
                return;
            }
            if (!massActionSignDate) {
                alert("Tanggal surat wajib diisi.");
                return;
            }
        } else {
            if (!massActionSignDate) {
                alert("Tanggal surat wajib diisi.");
                return;
            }
        }

        setIsMassActionLoading(true);
        try {
            if (massActionTarget === "skrd") {
                const dueDate = `${massActionYear}-${String(massActionMonth).padStart(2, '0')}-${String(skrdDueDay).padStart(2, '0')}`;
                const res = await api.post("/invoices/mass-generate", {
                    period_month: massActionMonth,
                    period_year: massActionYear,
                    due_date: dueDate,
                    sign_date: massActionSignDate || null,
                    start_skrd_no: skrdStartNo || null,
                    notes: `Generate Massal Manual — ${MONTHS_SHORT[massActionMonth - 1]} ${massActionYear}`
                });
                setMassActionPreview({ count: res.data.generated, message: res.data.message });
            } else {
                const res = await api.post("/tasks/mass-escalate", {
                    target_doc_type: massActionTarget,
                    dry_run: false,
                    start_no: massActionStartNo,
                    period_month: massActionMonth,
                    period_year: massActionYear,
                    sign_date: massActionSignDate || null
                });
                setMassActionPreview({ count: res.data.processed, message: res.data.message });
            }
            setMassActionDone(true);
            fetchInvoicesForYear(filterYear);
            fetchPrerequisites(); // Refresh prerequisite data after action
        } catch (err: any) {
            alert(err.response?.data?.detail || "Gagal mengeksekusi tindakan massal");
        } finally {
            setIsMassActionLoading(false);
        }
    };

    const handleMassPrintAsync = async () => {
        setPrintJobId(null);
        setPrintJobData(null);
        setIsMassActionLoading(true);
        try {
            const res = await api.get(`/invoices/print-bulk/async?month=${massActionMonth}&year=${massActionYear}&doc_type=${massActionTarget}`);
            setPrintJobId(res.data.job_id);
            setPrintJobData({ status: "processing", processed: 0, total: 100 }); // Optimistic start
        } catch (err: any) {
            alert(err.response?.data?.detail || err.message || "Gagal memulai tugas cetak massal.");
        } finally {
            setIsMassActionLoading(false);
        }
    };

    const handleDownloadMassPrint = async () => {
        if (!printJobId) return;
        try {
            const downloadUrl = `/api/invoices/print-bulk/download/${printJobId}`;
            window.open(downloadUrl, '_blank');
        } catch (err: any) {
            alert(err.message || "Gagal membuka dokumen massal.");
        }
    };

    // --- Compute Summary Stats ---
    const summaryStats = useMemo(() => {
        let totalInvoices = 0;
        let unpaidCount = 0;
        let overdueCount = 0;
        let unpaidAmount = 0;

        invoiceMap.forEach(monthMap => {
            monthMap.forEach(inv => {
                totalInvoices++;
                if (inv.status === "unpaid") {
                    unpaidCount++;
                    unpaidAmount += Number(inv.total_amount);
                }
                if (inv.status === "overdue") {
                    overdueCount++;
                    unpaidAmount += Number(inv.total_amount);
                }
            });
        });

        return { totalInvoices, unpaidCount, overdueCount, unpaidAmount };
    }, [invoiceMap]);

    // --- Compute Overdue Months Per Tenant (for tunggakan column) ---
    const overdueCountByTenant = useMemo(() => {
        const map = new Map<number, number>();
        invoiceMap.forEach((monthMap, tenantId) => {
            let count = 0;
            monthMap.forEach(inv => {
                if (inv.status === "overdue") count++;
            });
            map.set(tenantId, count);
        });
        return map;
    }, [invoiceMap]);

    // --- Filter rooms ---
    const filteredRooms = useMemo(() => {
        let result = [...rooms];
        if (filterStatus) result = result.filter(r => r.status === filterStatus);

        // Billing-specific filter
        if (filterBilling === "ada_tunggakan") {
            result = result.filter(r => {
                if (!r.tenant_id) return false;
                const tenantInvoices = invoiceMap.get(Number(r.tenant_id));
                if (!tenantInvoices) return false;
                let hasOverdueOrUnpaid = false;
                tenantInvoices.forEach(inv => {
                    if (inv.status === "overdue" || inv.status === "unpaid") hasOverdueOrUnpaid = true;
                });
                return hasOverdueOrUnpaid;
            });
        } else if (filterBilling === "semua_lunas") {
            result = result.filter(r => {
                if (!r.tenant_id) return false;
                const tenantInvoices = invoiceMap.get(Number(r.tenant_id));
                if (!tenantInvoices || tenantInvoices.size === 0) return false;
                let allPaid = true;
                tenantInvoices.forEach(inv => {
                    if (inv.status !== "paid" && inv.status !== "cancelled") allPaid = false;
                });
                return allPaid;
            });
        } else if (filterBilling === "overdue") {
            result = result.filter(r => {
                if (!r.tenant_id) return false;
                const tenantInvoices = invoiceMap.get(Number(r.tenant_id));
                if (!tenantInvoices) return false;
                let hasOverdue = false;
                tenantInvoices.forEach(inv => {
                    if (inv.status === "overdue") hasOverdue = true;
                });
                return hasOverdue;
            });
        }

        return result.sort((a, b) => {
            const priorityA = SITE_ORDER[a.rusunawa] || 99;
            const priorityB = SITE_ORDER[b.rusunawa] || 99;
            if (priorityA !== priorityB) return priorityA - priorityB;
            if (a.building !== b.building) return (a.building || "").localeCompare(b.building || "");
            if (a.floor !== b.floor) return a.floor - b.floor;
            return a.unit_number - b.unit_number;
        });
    }, [rooms, filterStatus, filterBilling, invoiceMap]);

    const columnHelper = createColumnHelper<Room>();

    const columns = useMemo(() => [
        columnHelper.accessor('rusunawa', {
            header: () => (
                <div className="flex flex-col gap-1.5 min-w-[120px]">
                    <span className="flex items-center gap-1"><Filter className="w-3 h-3 text-blue-500" /> Rusunawa</span>
                    <select
                        value={filterRusunawa}
                        onChange={(e) => setFilterRusunawa(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[11px] rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-sm dark:text-white"
                    >
                        <option value="">Semua</option>
                        <option value="Cigugur Tengah">Cigugur Tengah</option>
                        <option value="Cibeureum">Cibeureum</option>
                        <option value="Leuwigajah">Leuwigajah</option>
                    </select>
                </div>
            ),
            cell: info => (
                <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">{info.getValue()}</span>
            )
        }),
        columnHelper.accessor('building', {
            header: () => (
                <div className="flex flex-col gap-1 items-center w-full min-w-[50px]">
                    <span className="flex items-center gap-0.5 leading-tight"><Filter className="w-3 h-3 text-blue-500" /> Gd</span>
                    <select
                        value={filterBuilding}
                        onChange={(e) => setFilterBuilding(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[10px] rounded px-0 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-sm text-center w-full"
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
                <div className="flex flex-col gap-1 items-center w-full min-w-[50px]">
                    <span className="flex items-center gap-0.5 leading-tight"><Filter className="w-3 h-3 text-blue-500" /> Lt</span>
                    <select
                        value={filterFloor}
                        onChange={(e) => setFilterFloor(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[10px] rounded px-0 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-sm text-center w-full"
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
            cell: info => <span className="font-bold text-slate-900 dark:text-white text-sm text-center block">{toRoman(info.getValue())}</span>,
        }),
        columnHelper.accessor('unit_number', {
            header: () => (
                <div className="flex flex-col gap-1 items-center w-full min-w-[50px]">
                    <span className="flex items-center gap-0.5 leading-tight"><Filter className="w-3 h-3 text-blue-500" /> Unit</span>
                    <input
                        type="text"
                        value={filterUnit}
                        placeholder="Cari..."
                        onChange={(e) => setFilterUnit(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[10px] rounded px-0 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-sm text-center w-full placeholder-slate-400"
                    />
                </div>
            ),
            cell: info => <span className="font-bold text-slate-900 dark:text-white text-sm text-center block">{info.getValue()}</span>,
        }),
        columnHelper.accessor('tenant_name', {
            header: () => (
                <div className="flex flex-col gap-1.5">
                    <span className="flex items-center gap-1"><Filter className="w-3 h-3 text-blue-500" /> Nama Penghuni</span>
                    <input
                        type="text"
                        placeholder="Cari penghuni..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[11px] rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal placeholder-slate-400 shadow-sm dark:text-white"
                    />
                </div>
            ),
            cell: info => {
                const r = info.row.original;
                const val = info.getValue();
                if (val) {
                    const isExpired = r.contract_end ? new Date() > new Date(r.contract_end) : false;
                    return (
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase shrink-0 transition-colors ${isExpired
                                    ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                                    : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                }`}>
                                {val.charAt(0)}
                            </div>
                            <span className={`font-bold text-sm whitespace-nowrap ${isExpired ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"}`}>
                                {val}
                                {isExpired && <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 bg-rose-50 dark:bg-rose-500/10 rounded text-rose-500 border border-rose-100 dark:border-rose-500/20">Expired</span>}
                            </span>
                        </div>
                    );
                }
                return <span className="text-slate-400 dark:text-slate-500 italic text-[11px] bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-white/5">Kosong</span>;
            }
        }),
        columnHelper.accessor('contract_start', {
            header: () => <div className="text-slate-500 font-semibold py-2.5 min-w-[100px]">Masa Kontrak</div>,
            cell: info => {
                const r = info.row.original;
                if (r.contract_start && r.contract_end) {
                    return (
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-[12px] text-slate-600 dark:text-slate-300 min-w-[170px] whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                    {new Date(r.contract_start).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: '2-digit' })}
                                </div>
                                <span className="text-slate-400 mx-0.5">-</span>
                                <div className="flex items-center gap-1 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                    {new Date(r.contract_end).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: '2-digit' })}
                                </div>
                            </div>
                            {r.renewal_count && r.renewal_count > 0 ? (
                                <span className="text-[10px] text-blue-500 font-bold italic ml-3">
                                    (Perpanjangan ke-{r.renewal_count})
                                </span>
                            ) : null}
                        </div>
                    );
                }
                return <span className="text-slate-300 dark:text-slate-600 italic text-xs">Belum ada</span>;
            }
        }),

        // --- 12-MONTH PAYMENT MATRIX COLUMN ---
        columnHelper.display({
            id: 'payment_matrix',
            header: () => (
                <div className="flex flex-col gap-1.5 min-w-[320px]">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                            Tagihan
                            {loadingInvoices && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                        </span>
                        {/* Year Navigator — single source */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setFilterYear(y => y - 1)}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 min-w-[52px] text-center">
                                {filterYear}
                            </span>
                            <button
                                onClick={() => setFilterYear(y => y + 1)}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                    {/* Month labels */}
                    <div className="flex gap-1">
                        {MONTHS_SHORT.map(m => (
                            <div key={m} className="w-6 flex-shrink-0 text-center text-[9px] font-bold text-slate-400 uppercase">{m}</div>
                        ))}
                    </div>
                </div>
            ),
            cell: info => {
                const r = info.row.original;
                if (!r.tenant_id || r.status !== 'isi') {
                    return (
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 12 }, (_, i) => (
                                <div key={i} className="w-6 h-6 flex-shrink-0 rounded-md border-2 border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900" />
                            ))}
                        </div>
                    );
                }

                const tid = Number(r.tenant_id);
                const tenantInvoices = invoiceMap.get(tid) ?? new Map<number, InvoiceDetail>();
                const contractStartDate = r.contract_start ? new Date(r.contract_start) : null;
                const contractStartYear = contractStartDate?.getFullYear() ?? filterYear;
                const contractStartMonth = contractStartDate ? contractStartDate.getMonth() + 1 : 1;

                return (
                    <div className="flex items-center gap-1">
                        {Array.from({ length: 12 }, (_, i) => {
                            const month = i + 1;
                            const isBeforeContract =
                                filterYear < contractStartYear ||
                                (filterYear === contractStartYear && month < contractStartMonth);

                            const invoice = tenantInvoices.get(month);

                            return (
                                <MatrixCell
                                    key={month}
                                    month={month}
                                    year={filterYear}
                                    contractStart={r.contract_start}
                                    contractEnd={r.contract_end}
                                    invoice={invoice}
                                    disabled={isBeforeContract}
                                    onClick={(inv) => setSelectedInvoice({
                                        invoice: inv,
                                        tenantName: r.tenant_name ?? "—",
                                        roomNumber: r.room_number,
                                    })}
                                />
                            );
                        })}
                    </div>
                );
            }
        }),

        // --- TUNGGAKAN COLUMN (OVERDUE MONTHS) ---
        columnHelper.display({
            id: 'tunggakan',
            header: () => (
                <div className="text-center py-2.5 min-w-[70px]">
                    <span className="text-slate-500 font-semibold flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-400" /> Tunggak
                    </span>
                </div>
            ),
            cell: info => {
                const r = info.row.original;
                if (!r.tenant_id || r.status !== 'isi') {
                    return <div className="text-center"><span className="text-slate-300 dark:text-slate-600 text-[10px]">—</span></div>;
                }

                const count = overdueCountByTenant.get(Number(r.tenant_id)) ?? 0;

                if (count === 0) {
                    return (
                        <div className="flex justify-center">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                0 bln
                            </span>
                        </div>
                    );
                }
                if (count === 1) {
                    return (
                        <div className="flex justify-center">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                                {count} bln
                            </span>
                        </div>
                    );
                }
                // >= 2 months = CRITICAL (Perwal: tunggak 2 bulan = dasar pemutusan)
                return (
                    <div className="flex justify-center">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-2 border-red-400 dark:border-red-500/40 animate-pulse shadow-sm shadow-red-500/10">
                            ⚠ {count} bln
                        </span>
                    </div>
                );
            }
        }),

        columnHelper.accessor('status', {
            id: 'status',
            header: () => (
                <div className="flex flex-col gap-1.5 items-center w-full">
                    <span className="flex items-center gap-1 leading-tight"><Filter className="w-3 h-3 text-blue-500" /> Status</span>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 text-[10px] rounded px-0.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal shadow-sm text-center w-full"
                    >
                        <option value="">Semua</option>
                        <option value="isi">Terisi</option>
                        <option value="kosong">Kosong</option>
                        <option value="rusak">Rusak</option>
                    </select>
                </div>
            ),
            cell: info => {
                const r = info.row.original;
                return (
                    <div className="flex justify-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition-all shadow-sm ${STATUS_BADGE[r.status]}`}>
                            {r.status === 'isi' ? 'Terisi' : r.status === 'kosong' ? 'Kosong' : 'Rusak'}
                        </span>
                    </div>
                );
            }
        }),
    ], [filterRusunawa, filterBuilding, filterFloor, filterUnit, filterStatus, filterSearch, invoiceMap, filterYear, loadingInvoices, overdueCountByTenant]);

    const table = useReactTable({
        data: filteredRooms,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="p-8 pb-24 md:p-10 max-w-[1600px] mx-auto min-h-screen">
            {/* Header section */}
            <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-3xl flex items-center justify-center text-white dark:text-slate-900 shadow-2xl">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Tagihan</h1>
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 font-medium text-sm mt-1.5">Kelola tagihan sewa, cetak SKRD/STRD, dan teguran penagihan — klik kotak bulan untuk detail.</p>
                </div>
                <button
                    onClick={openMassPanel}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:translate-y-0"
                >
                    <Layers className="w-5 h-5" />
                    <span className="font-bold">Aksi Massal</span>
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <SummaryCard
                    icon={<FileText className="w-5 h-5" />}
                    label="Total Invoice"
                    value={summaryStats.totalInvoices}
                    subtext={`Tahun ${filterYear}`}
                    color="blue"
                />
                <SummaryCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    label="Belum Dibayar"
                    value={summaryStats.unpaidCount}
                    subtext="invoice pending"
                    color="amber"
                />
                <SummaryCard
                    icon={<AlertTriangle className="w-5 h-5" />}
                    label="Overdue"
                    value={summaryStats.overdueCount}
                    subtext="lewat jatuh tempo"
                    color="red"
                />
                <SummaryCard
                    icon={<DollarSign className="w-5 h-5" />}
                    label="Total Tunggakan"
                    value={`Rp ${(summaryStats.unpaidAmount / 1_000_000).toFixed(1)} jt`}
                    subtext="belum terbayar"
                    color="emerald"
                />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                {/* Room Status Filters */}
                {[
                    { label: "Semua", value: "" },
                    { label: "Terisi", value: "isi" },
                    { label: "Kosong", value: "kosong" },
                    { label: "Rusak", value: "rusak" },
                ].map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setFilterStatus(opt.value)}
                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === opt.value ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xl" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-400"}`}
                    >
                        {opt.label}
                    </button>
                ))}
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                {/* Billing-Specific Filters */}
                {[
                    { label: "Semua Tagihan", value: "" },
                    { label: "Ada Tunggakan", value: "ada_tunggakan" },
                    { label: "Semua Lunas", value: "semua_lunas" },
                    { label: "Overdue", value: "overdue" },
                ].map((opt) => (
                    <button
                        key={`billing-${opt.value}`}
                        onClick={() => setFilterBilling(opt.value)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${filterBilling === opt.value ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" : "bg-blue-50 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 hover:border-blue-400"}`}
                    >
                        {opt.label}
                    </button>
                ))}

                <div className="ml-auto hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        <span className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-500 inline-block"></span> Lunas
                        <span className="w-3 h-3 rounded-sm bg-amber-300 border border-amber-400 inline-block ml-2"></span> Belum
                        <span className="w-3 h-3 rounded-sm bg-red-400 border border-red-500 inline-block ml-2"></span> Overdue
                        <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 inline-block ml-2"></span> N/A
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Memuat Basis Data...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl overflow-hidden transition-colors duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id} className="border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 whitespace-nowrap text-xs">
                                        {headerGroup.headers.map(header => {
                                            const tight = ['building', 'floor', 'unit_number', 'status', 'tunggakan'].includes(header.id);
                                            return (
                                                <th
                                                    key={header.id}
                                                    className={`text-left py-3 font-bold tracking-wide align-bottom border-r border-slate-200 dark:border-white/8 last:border-r-0 ${tight ? 'px-1 w-16 text-center' : 'px-4'}`}
                                                >
                                                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map(row => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        {row.getVisibleCells().map(cell => {
                                            const tight = ['building', 'floor', 'unit_number', 'status', 'tunggakan'].includes(cell.column.id);
                                            return (
                                                <td key={cell.id} className={`py-1 align-middle border-r border-slate-100 dark:border-white/5 last:border-r-0 ${tight ? 'px-1' : 'px-4'}`}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredRooms.length === 0 && (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-12">Tidak ada data yang cocok.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Full-Screen Month Drawer */}
            {selectedInvoice && (
                <InvoiceMonthDrawer
                    invoice={selectedInvoice.invoice}
                    tenantName={selectedInvoice.tenantName}
                    roomNumber={selectedInvoice.roomNumber}
                    onClose={() => {
                        setSelectedInvoice(null);
                        fetchInvoicesForYear(filterYear); // refresh list
                    }}
                />
            )}

            {/* ========== FULL-SCREEN MASS ACTION PANEL ========== */}
            {massActionPanelOpen && (
                <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
                    {/* Panel Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 shrink-0">
                        <div className="flex items-center gap-3">
                            <Layers className="w-6 h-6 text-blue-500" />
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Pusat Aksi Massal</h2>
                                <p className="text-xs text-slate-500">Generate dokumen penagihan secara massal dengan kontrol penuh</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setMassActionPanelOpen(false)}
                            className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-500 hover:text-red-500 flex items-center justify-center transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Panel Body: Left Menu + Right Content */}
                    <div className="flex flex-1 overflow-hidden">
                        {/* LEFT: Menu Sidebar */}
                        <div className="w-64 shrink-0 bg-slate-50 dark:bg-slate-900/60 border-r border-slate-200 dark:border-white/10 p-4 flex flex-col gap-2 overflow-y-auto">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Pilih Tipe Dokumen</p>
                            {MASS_ACTION_TYPES.map(t => {
                                const isActive = massActionTarget === t.key;
                                const prereqOk = prerequisiteData?.prerequisites?.[t.key] ?? true;
                                const totalCount = prerequisiteData?.counts?.[t.key] ?? 0;
                                const unpaidCount = prerequisiteData?.unpaid_counts?.[t.key] ?? 0;

                                // Determine source count for escalation targets
                                const sourceMap: Record<string, string> = { strd: "skrd", teguran1: "strd", teguran2: "teguran1", teguran3: "teguran2" };
                                const sourceKey = sourceMap[t.key];
                                const sourceUnpaid = sourceKey ? (prerequisiteData?.unpaid_counts?.[sourceKey] ?? 0) : 0;

                                return (
                                    <button
                                        key={t.key}
                                        onClick={() => { setMassActionTarget(t.key); setMassActionPreview(null); setMassActionDone(false); }}
                                        disabled={!prereqOk}
                                        className={`w-full text-left px-4 py-3 rounded-xl flex flex-col gap-0.5 transition-all border ${!prereqOk
                                                ? 'bg-slate-50 dark:bg-slate-800/30 border-transparent opacity-50 cursor-not-allowed'
                                                : isActive
                                                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30 shadow-lg shadow-blue-500/10'
                                                    : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-300 dark:hover:border-white/10 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`font-bold text-sm ${!prereqOk ? 'text-slate-400 dark:text-slate-600' :
                                                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                                                }`}>{t.label}</span>
                                            {prerequisiteData && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${totalCount > 0
                                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                                                    }`}>{totalCount}</span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-500">{t.desc}</span>
                                        {/* Prerequisite info for escalation types */}
                                        {sourceKey && prerequisiteData && (
                                            <div className={`text-[10px] mt-1 flex items-center gap-1 ${prereqOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                                                }`}>
                                                {prereqOk ? <ShieldCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                                {prereqOk
                                                    ? `${sourceUnpaid} ${sourceKey.toUpperCase()} siap eskalasi`
                                                    : `Belum ada ${sourceKey.toUpperCase()}`
                                                }
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* RIGHT: Content Area */}
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="max-w-xl mx-auto">
                                {/* Title */}
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Generate {getMassActionLabel(massActionTarget)}</h3>
                                <p className="text-sm text-slate-500 mb-8">{MASS_ACTION_TYPES.find(t => t.key === massActionTarget)?.desc}</p>

                                {/* ====== Common Period Selection ====== */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 mb-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Pilih Bulan</label>
                                            <select value={massActionMonth} onChange={e => setMassActionMonth(Number(e.target.value))} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                                                {MONTHS_SHORT.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Pilih Tahun</label>
                                            <input type="number" value={massActionYear} onChange={e => setMassActionYear(Number(e.target.value))} min={2020} max={2035} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* ====== SKRD Form ====== */}
                                {massActionTarget === "skrd" && (
                                    <div className="space-y-5">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-2xl text-sm text-blue-800 dark:text-blue-300">
                                            <strong>Informasi:</strong> Generate SKRD akan membuat tagihan sewa untuk seluruh penghuni aktif di bulan dan tahun yang ditentukan. Penghuni yang sudah memiliki tagihan di periode ini akan otomatis di-skip.
                                        </div>
                                        <div className="space-y-4 mb-4">
                                            <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Jatuh Tempo</label>
                                                    <input type="number" value={skrdDueDay} onChange={e => setSkrdDueDay(Number(e.target.value))} min={1} max={28} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Tanggal jatuh tempo (1-28)" />
                                                    <p className="text-[10px] text-slate-400 mt-1">Tanggal di bulan tersebut sebagai batas bayar</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Nomor Urut SKRD (Opsional)</label>
                                                    <input type="number" value={skrdStartNo || ''} onChange={e => setSkrdStartNo(e.target.value ? Number(e.target.value) : undefined)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="Misal: 2363" />
                                                    <p className="text-[10px] text-slate-400 mt-1">Nomor awal urut surat SKRD. Kosongkan jika tanpa penomoran.</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Surat / TTD</label>
                                                    <input type="date" value={massActionSignDate} onChange={e => setMassActionSignDate(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
                                                    <p className="text-[10px] text-slate-400 mt-1">Tanggal yang tertera di bagian tanda tangan dokumen. Jika dikosongkan, menggunakan tanggal sesuai batas bayar.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ====== Escalation Forms (STRD, Teguran 1, 2, 3) ====== */}
                                {["strd", "teguran1", "teguran2", "teguran3"].includes(massActionTarget) && (
                                    <div className="space-y-5">
                                        <div className={`p-4 border rounded-2xl text-sm ${massActionTarget === "strd" ? "bg-amber-50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/20 text-amber-800 dark:text-amber-300" :
                                                massActionTarget === "teguran1" ? "bg-orange-50 dark:bg-orange-500/5 border-orange-100 dark:border-orange-500/20 text-orange-800 dark:text-orange-300" :
                                                    massActionTarget === "teguran2" ? "bg-rose-50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20 text-rose-800 dark:text-rose-400" :
                                                        "bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20 text-red-800 dark:text-red-300"
                                            }`}>
                                            {(() => {
                                                const sourceMap: Record<string, string> = { strd: "SKRD", teguran1: "STRD", teguran2: "Teguran 1", teguran3: "Teguran 2" };
                                                const sourceKey: Record<string, string> = { strd: "skrd", teguran1: "strd", teguran2: "teguran1", teguran3: "teguran2" };
                                                const src = sourceMap[massActionTarget] || "";
                                                const count = prerequisiteData?.unpaid_counts?.[sourceKey[massActionTarget]] ?? 0;
                                                return (
                                                    <>
                                                        <strong>Prasyarat Terpenuhi:</strong> Ditemukan <strong>{count}</strong> tagihan {src} yang belum lunas pada periode {MONTHS_SHORT[massActionMonth - 1]} {massActionYear}. Seluruhnya akan di-eskalasi menjadi {getMassActionLabel(massActionTarget)}.
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Nomor Urut Awal {getMassActionLabel(massActionTarget)}</label>
                                                <input
                                                    type="number"
                                                    value={massActionStartNo || ''}
                                                    onChange={e => setMassActionStartNo(e.target.value ? Number(e.target.value) : undefined)}
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                    placeholder="Misal: 1001"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1">Sistem akan men-generate nomor dokumen secara urut mulai dari angka ini.</p>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Surat / TTD</label>
                                                <input
                                                    type="date"
                                                    value={massActionSignDate}
                                                    onChange={e => setMassActionSignDate(e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1">Tanggal yang tertera di bagian tanda tangan dokumen. Jika kosong, menggunakan tanggal hari ini.</p>
                                            </div>

                                            <div className="pt-2">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Proses yang akan dilakukan:</p>
                                                <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                                                    <li className="flex items-start gap-2"><ArrowRight className={`w-4 h-4 shrink-0 mt-0.5 ${massActionTarget === "strd" ? "text-amber-500" :
                                                            massActionTarget === "teguran1" ? "text-orange-500" :
                                                                massActionTarget === "teguran2" ? "text-rose-500" : "text-red-500"
                                                        }`} /> Update status dokumen menjadi {getMassActionLabel(massActionTarget)}</li>
                                                    <li className="flex items-start gap-2"><ArrowRight className={`w-4 h-4 shrink-0 mt-0.5 ${massActionTarget === "strd" ? "text-amber-500" :
                                                            massActionTarget === "teguran1" ? "text-orange-500" :
                                                                massActionTarget === "teguran2" ? "text-rose-500" : "text-red-500"
                                                        }`} /> Generate nomor surat otomatis</li>
                                                    {massActionTarget === "strd" && (
                                                        <li className="flex items-start gap-2"><ArrowRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> Hitung denda keterlambatan 2%</li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ====== Preview Result ====== */}
                                {massActionPreview && (
                                    <div className={`mt-6 p-5 rounded-2xl border ${massActionDone
                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                                            : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'
                                        }`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            {massActionDone ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            ) : (
                                                <AlertTriangle className="w-5 h-5 text-blue-500" />
                                            )}
                                            <span className={`font-bold text-sm ${massActionDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                                {massActionDone ? 'Eksekusi Berhasil' : 'Hasil Pratinjau'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{massActionPreview.message}</p>
                                        {!massActionDone && massActionPreview.count === 0 && massActionTarget !== "skrd" && (
                                            <p className="text-xs text-slate-500 mt-2">Tidak ada tagihan yang memenuhi kriteria saat ini.</p>
                                        )}
                                    </div>
                                )}

                                {/* ====== Print Job Progress ====== */}
                                {printJobData && (
                                    <div className="mt-6 p-5 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                {printJobData.status === "processing" ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> :
                                                    printJobData.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                                                        <AlertTriangle className="w-4 h-4 text-red-500" />}
                                                {printJobData.status === "processing" ? "Sedang Memproses Dokumen..." :
                                                    printJobData.status === "completed" ? "Selesai Memproses Dokumen" :
                                                        "Gagal Memproses Dokumen"}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-500">{printJobData.processed} / {printJobData.total}</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-4 overflow-hidden">
                                            <div
                                                className={`h-2.5 rounded-full transition-all duration-500 ${printJobData.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'}`}
                                                style={{ width: `${Math.max(5, (printJobData.processed / (printJobData.total || 1)) * 100)}%` }}
                                            ></div>
                                        </div>

                                        {printJobData.error && (
                                            <p className="text-sm text-red-500 font-medium mb-3">{printJobData.error}</p>
                                        )}

                                        {printJobData.status === "completed" && (
                                            <button
                                                onClick={handleDownloadMassPrint}
                                                className="w-full px-4 py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex justify-center items-center gap-2"
                                            >
                                                <Printer className="w-4 h-4" /> Unduh Dokumen PDF
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* ====== Action Buttons ====== */}
                                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                                    {!massActionDone && !printJobData && (
                                        <>
                                            <button
                                                onClick={triggerMassPreview}
                                                disabled={isMassActionLoading}
                                                className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-white/10 transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isMassActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                                Pratinjau
                                            </button>
                                            <button
                                                onClick={confirmMassAction}
                                                disabled={isMassActionLoading || (!massActionPreview)}
                                                className="px-6 py-3 rounded-xl font-bold text-sm bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                                            >
                                                {isMassActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                Eksekusi Generate
                                            </button>
                                            <button
                                                onClick={handleMassPrintAsync}
                                                disabled={isMassActionLoading}
                                                className="px-6 py-3 rounded-xl font-bold text-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                                            >
                                                {isMassActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                                Cetak Masal
                                            </button>
                                        </>
                                    )}
                                    {massActionDone && (
                                        <button
                                            onClick={() => setMassActionPanelOpen(false)}
                                            className="px-6 py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Selesai & Kembali
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
