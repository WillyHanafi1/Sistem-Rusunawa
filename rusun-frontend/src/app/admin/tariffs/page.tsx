"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Tags, Loader2, CheckCircle2, Building, Car, Navigation, Home } from "lucide-react";

export default function TariffsPage() {
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Room Base Price Matrix State
    const [matrix, setMatrix] = useState<Record<number, Record<number, number>>>({
        21: { 1: 365000, 2: 350000, 3: 335000, 4: 320000, 5: 320000 }, // Lt 5 default
        24: { 1: 400000, 2: 385000, 3: 370000, 4: 355000, 5: 340000 },
        27: { 1: 440000, 2: 425000, 3: 410000, 4: 395000, 5: 380000 }  // Lt 5 default
    });

    const handleMatrixChange = (type: number, floor: number, val: string) => {
        setMatrix(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [floor]: Number(val)
            }
        }));
    };

    // Motor Parking Price State
    // As per DB, Motor cycle price is handled per count. We'll set a global config or update existing tenants later.
    // Assuming backend needs to know it's a global config update.
    const [motorPrice, setMotorPrice] = useState(30000);
    const [motorMsg, setMotorMsg] = useState("");

    useEffect(() => {
        const fetchCurrentPrices = async () => {
             try {
                  const res = await api.get('/rooms?limit=1000');
                  const rooms = res.data;
                  const newMatrix = { ...matrix };
                  let dataChanged = false;

                  const found = new Set<string>();

                  for (const room of rooms) {
                      const key = `${room.room_type}-${room.floor}`;
                      if (!found.has(key)) {
                          if (newMatrix[room.room_type] && newMatrix[room.room_type][room.floor] !== undefined) {
                              newMatrix[room.room_type][room.floor] = Math.floor(Number(room.price));
                              found.add(key);
                              dataChanged = true;
                          }
                      }
                  }

                  if (dataChanged) {
                      setMatrix(newMatrix);
                  }
             } catch (err) {
                 console.error("Failed to fetch initial matrix prices", err);
             } finally {
                 setFetchingData(false);
             }
        };
        fetchCurrentPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (successMsg) {
            const t = setTimeout(() => setSuccessMsg(""), 5000);
            return () => clearTimeout(t);
        }
    }, [successMsg]);

    const handleMotorSave = async () => {
        // TODO: Backend integration for Motor/Car flat fees 
        // We will mock this for now until API is updated
    };

    const handleCombinedSave = async () => {
        setLoading(true); setError(""); setSuccessMsg(""); setMotorMsg("");
        try {
            const prices = [];
            for (const type of [21, 24, 27]) {
                for (const floor of [1, 2, 3, 4, 5]) {
                    prices.push({
                        room_type: type,
                        floor: floor,
                        new_price: matrix[type][floor]
                    });
                }
            }

            const res = await api.patch("/rooms/bulk-price", { prices });
            setSuccessMsg(res.data.message || `Berhasil memperbarui matriks harga.`);
            if (motorPrice !== 30000) {
                 setMotorMsg("Sistem belum memiliki API untuk update tarif parkir global. Hanya kamar yang tersimpan.");
            }
        } catch (e: any) {
             setError(e.response?.data?.detail || "Gagal melakukan update massal. Pastikan isian valid.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 pb-24">
            <div className="mb-10 text-center sm:text-left">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-3">
                    <Tags className="w-8 h-8 text-amber-500" /> Tipe & Tarif Layanan
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">Atur ulang harga kotor tagihan massal untuk Sewa Kamar dan Parkir Kendaraan secara cepat.</p>
            </div>

            {error && <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">❌ {error}</div>}
            {successMsg && <div className="mb-6 p-4 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> {successMsg}</div>}

            {fetchingData ? (
                <div className="flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> 
                    <p className="font-medium text-sm">Mensinkronkan data matriks terakhir dengan server...</p>
                </div>
            ) : (
                <>
                {/* Modul 1: Update Harga Sewa Kamar Massal */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-blue-600 p-5 sm:p-6 flex items-center gap-3 text-white">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Home className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Matriks Harga Sewa Kamar</h2>
                            <p className="text-blue-100 text-sm mt-0.5">Ubah harga berdasarkan Tipe Kamar & Lantai secara serentak.</p>
                        </div>
                    </div>
                    <div className="p-0 overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10">
                                    <th className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">TIPE \ LANTAI</th>
                                    {[1, 2, 3, 4, 5].map(floor => (
                                        <th key={floor} className="py-4 px-3 font-semibold text-slate-700 dark:text-slate-200 text-sm text-center">Lantai {floor}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[21, 24, 27].map((type) => (
                                    <tr key={type} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-6 font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                            Tipe {type}
                                            <p className="font-normal text-xs text-slate-400 mt-1">
                                                {type === 21 && "Cigugur Tengah"}
                                                {type === 24 && "Cibeureum (A-C), Leuwigajah"}
                                                {type === 27 && "Cibeureum (D)"}
                                            </p>
                                        </td>
                                        {[1, 2, 3, 4, 5].map(floor => (
                                            <td key={floor} className="py-3 px-2">
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">Rp</span>
                                                    <input 
                                                        type="number" 
                                                        value={matrix[type][floor] || ""} 
                                                        onChange={(e) => handleMatrixChange(type, floor, e.target.value)}
                                                        className="w-full pl-8 pr-2 py-2.5 bg-slate-50 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-right"
                                                    />
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                
                                {/* Start Sub-Items (Global) */}
                                <tr className="border-t-[3px] border-slate-200 dark:border-white/20 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                                    <td className="py-3 px-6 font-bold text-emerald-800 dark:text-emerald-400 sticky left-0 bg-emerald-50/50 dark:bg-slate-900 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <div className="flex items-center gap-2">
                                            <Navigation className="w-4 h-4" /> Parkir Motor
                                        </div>
                                        <p className="font-normal text-xs text-emerald-600/70 dark:text-emerald-400/60 mt-1">
                                            Tarif Tetap Bulanan
                                        </p>
                                    </td>
                                    <td colSpan={5} className="py-3 px-2">
                                         <div className="relative max-w-sm mx-auto">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-500/50 text-xs">Rp</span>
                                            <input 
                                                type="number" 
                                                value={motorPrice} 
                                                onChange={(e) => setMotorPrice(Number(e.target.value))}
                                                className="w-full pl-8 pr-3 py-2.5 bg-white dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-sm font-semibold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-right shadow-sm"
                                            />
                                        </div>
                                    </td>
                                </tr>
                                <tr className="border-b border-slate-100 dark:border-white/5 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                                    <td className="py-3 px-6 font-bold text-amber-800 dark:text-amber-400 sticky left-0 bg-amber-50/50 dark:bg-slate-900 z-10 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                        <div className="flex items-center gap-2">
                                            <Car className="w-4 h-4" /> Parkir Mobil
                                        </div>
                                        <p className="font-normal text-xs text-amber-600/70 dark:text-amber-400/60 mt-1">
                                            Tarif Tetap Bulanan
                                        </p>
                                    </td>
                                    <td colSpan={5} className="py-3 px-2">
                                         <div className="relative max-w-sm mx-auto">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-amber-500/50 text-xs">Rp</span>
                                            <input 
                                                type="number" 
                                                value={150000} 
                                                disabled
                                                className="w-full pl-8 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800 opacity-60 border border-amber-200 dark:border-amber-500/20 rounded-lg text-sm font-semibold text-amber-700 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-right cursor-not-allowed"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
                        {motorMsg && <div className="mb-4 text-center text-sm font-bold text-amber-600 dark:text-amber-500 animate-pulse bg-amber-50 dark:bg-amber-500/10 py-2 rounded-lg">{motorMsg}</div>}
                        <button onClick={handleCombinedSave} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] transform hover:-translate-y-0.5">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5"/> Terapkan & Simpan Semua Perubahan Matriks</>}
                        </button>
                    </div>
                </div>
                </>
            )}
        </div>
    );
}
