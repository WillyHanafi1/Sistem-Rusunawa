"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import { Loader2, Filter, Download, UserX, Building2, Home, ChevronLeft, ChevronRight, FileSpreadsheet, Calendar, PlusCircle, AlertCircle } from "lucide-react";
import { format, addMonths } from "date-fns";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import InvoiceMonthDrawer, { InvoiceDetail } from "@/components/InvoiceMonthDrawer";
import TenantImportModal from "@/components/TenantImportModal";
import { getRole } from "@/lib/auth";

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

    const isClickable = !disabled && !!invoice;

    return (
        <button
            disabled={!isClickable}
            onClick={() => isClickable && onClick(invoice!)}
            title={disabled ? `Sebelum masa kontrak` : invoice ? `${MONTHS_SHORT[month - 1]} ${year} — ${invoice.status}` : `${MONTHS_SHORT[month - 1]} ${year} — Belum di-generate`}
            className={`w-6 h-6 flex-shrink-0 rounded-md border-2 flex items-center justify-center font-bold text-[9px] transition-all duration-150 select-none ${cellStyle}`}
        >
            {month}
        </button>
    );
}

// ---
// Main Page
// ---
export default function ContractRoomPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingInvoices, setLoadingInvoices] = useState(false);

    // Invoice map: tenant_id → month → invoice
    const [invoiceMap, setInvoiceMap] = useState<Map<number, Map<number, InvoiceDetail>>>(new Map());

    // Selected invoice for drawer
    const [selectedInvoice, setSelectedInvoice] = useState<{ invoice: InvoiceDetail; tenantName: string; roomNumber: string } | null>(null);

    // Filters & Search State
    const [filterSearch, setFilterSearch] = useState("");
    const [filterRusunawa, setFilterRusunawa] = useState("");
    const [filterBuilding, setFilterBuilding] = useState("");
    const [filterFloor, setFilterFloor] = useState("");
    const [filterUnit, setFilterUnit] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [showImportModal, setShowImportModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    
    // Renew Logic
    const [renewModalOpen, setRenewModalOpen] = useState(false);
    const [selectedRoomForRenew, setSelectedRoomForRenew] = useState<Room | null>(null);
    const [newEndDate, setNewEndDate] = useState("");
    const [renewNotes, setRenewNotes] = useState("");
    const [renewLoading, setRenewLoading] = useState(false);

    const userRole = getRole();

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
            const res = await api.get(`/invoices/?year=${year}&limit=9999`);
            const invoices: InvoiceDetail[] = res.data;

            // Build Map<tenant_id, Map<month, Invoice>>
            const map = new Map<number, Map<number, InvoiceDetail>>();
            for (const inv of invoices) {
                if (!map.has(inv.tenant_id)) {
                    map.set(inv.tenant_id, new Map());
                }
                map.get(inv.tenant_id)!.set(inv.period_month, inv);
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
        fetchInvoicesForYear(filterYear);
    }, [filterYear]);

    const handleDeactivate = async (tenantId: number) => {
        if (!confirm("Nonaktifkan penghuni ini? Status kamarnya akan berubah menjadi Kosong.")) return;
        try {
            await api.patch(`/tenants/${tenantId}`, { is_active: false });
            fetchRooms();
        } catch {
            alert("Gagal menonaktifkan penghuni.");
        }
    };

    const handleDownloadContract = (notes: string | undefined) => {
        if (!notes) return;
        const contractMatch = notes.match(/Kontrak path: (.*)/);
        const contractPath = contractMatch ? contractMatch[1] : null;
        if (contractPath) {
            const safePath = contractPath.replace(/\\/g, '/');
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100'}/api/${safePath}`;
            window.open(url, '_blank');
        } else {
            alert("File kontrak tidak ditemukan.");
        }
    };

    const handleOpenRenew = (room: Room) => {
        setSelectedRoomForRenew(room);
        if (room.contract_end) {
            setNewEndDate(format(addMonths(new Date(room.contract_end), 12), "yyyy-MM-dd"));
        } else {
            setNewEndDate(format(addMonths(new Date(), 12), "yyyy-MM-dd"));
        }
        setRenewNotes("");
        setRenewModalOpen(true);
    };

    const handleRenewSubmit = async () => {
        if (!selectedRoomForRenew?.tenant_id) return;
        setRenewLoading(true);
        try {
            await api.post(`/tenants/${selectedRoomForRenew.tenant_id}/renew`, {
                new_end_date: newEndDate,
                notes: renewNotes
            });
            setRenewModalOpen(false);
            fetchRooms();
        } catch (err: any) {
            const msg = err.response?.data?.detail || "Gagal memperpanjang kontrak.";
            alert(msg);
        } finally {
            setRenewLoading(false);
        }
    };

    const filteredRooms = useMemo(() => {
        let result = [...rooms];
        if (filterStatus) result = result.filter(r => r.status === filterStatus);
        
        // Custom Sort by Site Priority
        return result.sort((a, b) => {
            const priorityA = SITE_ORDER[a.rusunawa] || 99;
            const priorityB = SITE_ORDER[b.rusunawa] || 99;
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            
            // Secondary sort by Room Number for consistency
            return a.room_number.localeCompare(b.room_number);
        });
    }, [rooms, filterStatus]);

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
                <div className="flex flex-col gap-1.5 items-center w-full">
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
                <div className="flex flex-col gap-1.5 items-center w-full">
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
            cell: info => <span className="font-bold text-slate-900 dark:text-white text-sm text-center block">{toRoman(info.getValue())}</span>,
        }),
        columnHelper.accessor('unit_number', {
            header: () => (
                <div className="flex flex-col gap-1.5 items-center w-full">
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
                const val = info.getValue();
                if (val) {
                    return (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                                {val.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">{val}</span>
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
                        {/* Year Navigator */}
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

                const tenantInvoices = invoiceMap.get(r.tenant_id) ?? new Map<number, InvoiceDetail>();
                const contractStartDate = r.contract_start ? new Date(r.contract_start) : null;
                const contractStartYear = contractStartDate?.getFullYear() ?? filterYear;
                const contractStartMonth = contractStartDate ? contractStartDate.getMonth() + 1 : 1; // 1-indexed

                return (
                    <div className="flex items-center gap-1">
                        {Array.from({ length: 12 }, (_, i) => {
                            const month = i + 1; // 1-12
                            // Before contract start (considering year)
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

        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center py-2.5 text-slate-500 font-semibold">Aksi</div>,
            cell: info => {
                const r = info.row.original;
                return (
                    <div className="flex justify-center gap-1.5">
                        {r.status === 'isi' ? (
                            <>
                                <button
                                    onClick={() => handleDownloadContract(r.notes!)}
                                    className={`p-1.5 rounded-lg transition-all ${r.notes ? "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-transparent hover:border-blue-200" : "text-slate-200 cursor-not-allowed"}`}
                                    title={r.notes ? "Unduh Kontrak" : "Kontrak belum diunggah"}
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleOpenRenew(r)}
                                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-transparent hover:border-emerald-200 rounded-lg transition-all"
                                    title="Perpanjang Kontrak"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => r.tenant_id && handleDeactivate(r.tenant_id)}
                                    className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 rounded-lg transition-all"
                                    title="Akhiri Sewa"
                                >
                                    <UserX className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <div className="py-1">
                                <span className="text-[10px] text-slate-300 dark:text-slate-600 font-medium italic">N/A</span>
                            </div>
                        )}
                    </div>
                );
            }
        }),
    ], [filterRusunawa, filterBuilding, filterFloor, filterUnit, filterStatus, filterSearch, invoiceMap, filterYear, loadingInvoices]);

    const table = useReactTable({
        data: filteredRooms,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="p-8 pb-24 md:p-10 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600" /> Manajemen & Kontrak Hunian
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">Klik kotak bulan (hijau/merah) untuk melihat detail tagihan dan status pembayaran.</p>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 bg-blue-50/50 dark:bg-blue-500/5 text-blue-700 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-500/10 shadow-sm backdrop-blur-sm">
                    <Home className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-base">{rooms.filter((r: Room) => r.status === 'isi').length}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">{rooms.length} Unit Terisi</span>
                </div>
                {isMounted && userRole === "sadmin" && (
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
                    >
                        <FileSpreadsheet className="w-5 h-5" />
                        Import Excel
                    </button>
                )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
                {[
                    { label: "Semua", value: "" },
                    { label: "Terisi", value: "isi" },
                    { label: "Kosong", value: "kosong" },
                    { label: "Rusak", value: "rusak" },
                ].map((opt: { label: string; value: string }) => (
                    <button
                        key={opt.value}
                        onClick={() => setFilterStatus(opt.value)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterStatus === opt.value ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-blue-400"}`}
                    >
                        {opt.label}
                    </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                        <span className="w-3 h-3 rounded-sm bg-emerald-400 border border-emerald-500 inline-block"></span> Lunas
                        <span className="w-3 h-3 rounded-sm bg-amber-300 border border-amber-400 inline-block ml-2"></span> Belum
                        <span className="w-3 h-3 rounded-sm bg-red-400 border border-red-500 inline-block ml-2"></span> Overdue
                        <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 inline-block ml-2"></span> N/A
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-8">
                    <Loader2 className="w-4 h-4 animate-spin" /> Memuat data hunian...
                </div>
            ) : (
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl overflow-hidden transition-colors duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id} className="border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 whitespace-nowrap text-xs">
                                {headerGroup.headers.map(header => {
                                    const tight = ['building', 'floor', 'unit_number', 'status', 'actions'].includes(header.id);
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
                                            const tight = ['building', 'floor', 'unit_number', 'status', 'actions'].includes(cell.column.id);
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

            {selectedInvoice && (
                <InvoiceMonthDrawer
                    invoice={selectedInvoice.invoice}
                    tenantName={selectedInvoice.tenantName}
                    roomNumber={selectedInvoice.roomNumber}
                    onClose={() => setSelectedInvoice(null)}
                    onPaymentSuccess={() => fetchInvoicesForYear(filterYear)}
                />
            )}

            {showImportModal && (
                <TenantImportModal
                    onClose={() => setShowImportModal(false)}
                    onSuccess={fetchRooms}
                />
            )}

            {/* Renew Modal */}
            <RenewModal
                isOpen={renewModalOpen}
                room={selectedRoomForRenew}
                newEndDate={newEndDate}
                notes={renewNotes}
                loading={renewLoading}
                onClose={() => setRenewModalOpen(false)}
                onNewEndDateChange={setNewEndDate}
                onNotesChange={setRenewNotes}
                onSubmit={handleRenewSubmit}
            />
        </div>
    );
}

interface RenewModalProps {
    isOpen: boolean;
    room: Room | null;
    newEndDate: string;
    notes: string;
    loading: boolean;
    onClose: () => void;
    onNewEndDateChange: (val: string) => void;
    onNotesChange: (val: string) => void;
    onSubmit: () => Promise<void>;
}

function RenewModal({ isOpen, room, newEndDate, notes, loading, onClose, onNewEndDateChange, onNotesChange, onSubmit }: RenewModalProps) {
    if (!isOpen || !room) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                            <PlusCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Perpanjang Kontrak</h2>
                            <p className="text-xs text-slate-500">Kamar {room.room_number} — {room.tenant_name}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                                <div className="text-xs text-amber-800 dark:text-amber-300">
                                    <p className="font-bold mb-1 underline">Ketentuan Perwal:</p>
                                    <p>Setiap kali perpanjangan maksimal **12 bulan**. Tanggal berakhir baru tidak boleh kurang dari kontrak saat ini.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Berakhir Kontrak Saat Ini</label>
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400">
                                {room.contract_end ? new Date(room.contract_end).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Berakhir Baru</label>
                            <input
                                type="date"
                                value={newEndDate}
                                onChange={(e) => onNewEndDateChange(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Catatan Perpanjangan</label>
                            <textarea
                                value={notes}
                                onChange={(e) => onNotesChange(e.target.value)}
                                placeholder="Alasan perpanjangan atau detail tambahan..."
                                rows={2}
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-all"
                        >
                            Batal
                        </button>
                        <button
                            disabled={loading || !newEndDate}
                            onClick={onSubmit}
                            className="flex-[2] px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                            Simpan Perpanjangan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
