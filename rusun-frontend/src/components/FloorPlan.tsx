"use client";
import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle2, XCircle, Home, Loader2, RefreshCw, Building } from "lucide-react";
import api from "@/lib/api";

interface Room {
  id: number;
  rusunawa: string;
  building: string;
  floor: number;
  unit_number: number;
  room_number: string;
  price: number;
  status: "kosong" | "isi" | "rusak";
  _isGhost?: boolean;
}

interface FloorPlanProps {
  locationName: string;
}

// Data Struktur Geografis / Fisik Bangunan dari Database Default
const CIGUGUR_TENGAH = {
  buildings: ["A", "B", "C", "D"],
  floors: [1, 2, 3, 4], // reversed agar Lantai 1 di atas
  unitsPerFloor: {
    1: 12, 2: 12, 3: 12, 4: 12
  }
};

const CIBEUREUM = {
  buildings: ["A", "B", "C", "D"],
  floors: [1, 2, 3, 4, 5],
  getUnitsPerFloor: (building: string, floor: number) => {
    if (building === "D") {
       if (floor === 1) return 14;
       if (floor <= 4) return 20;
       return 0; // Gedung D tidak ada lantai 5
    }
    // Gedung A, B, C
    if (floor === 1) return 3;
    return 24;
  }
};

const LEUWIGAJAH = {
  buildings: ["A", "B", "C"], // Tidak ada Gedung D
  floors: [1, 2, 3, 4, 5],
  getUnitsPerFloor: (building: string, floor: number) => {
    if (floor === 1) return 3;
    return 24;
  }
};


export function FloorPlan({ locationName }: FloorPlanProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Menentukan Layout Struktur Gedung berdasarkan Nama Lokasi (Prop)
  const siteConfig = useMemo(() => {
     if (locationName.includes("Cibeureum")) return { type: "Cibeureum", config: CIBEUREUM };
     if (locationName.includes("Leuwigajah")) return { type: "Leuwigajah", config: LEUWIGAJAH };
     return { type: "Cigugur Tengah", config: CIGUGUR_TENGAH };
  }, [locationName]);

  const { type, config } = siteConfig;

  const fetchRooms = async () => {
    setLoading(true);
    setError("");
    try {
      const apiLocationName = locationName.replace("Rusunawa ", "");
      const res = await api.get(`/rooms?rusunawa=${encodeURIComponent(apiLocationName)}`);
      setRooms(res.data);
    } catch (err: any) {
      console.error("Failed to fetch rooms for floor plan:", err);
      setError("Gagal mengambil data kamar dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [locationName]);

  // Helper untuk mendapatkan slot array statis jumlah kamar di suatu lantai+gedung
  const getGridSlotsForFloor = (building: string, floor: number) => {
    const slots: Room[] = [];
    
    // Tentukan limit max unit berdasarkan site (Penting untuk Cibeureum/Leuwigajah yg dinamis beda lantai)
    let maxUnits = 12;
    if (type === "Cibeureum" || type === "Leuwigajah") {
       // @ts-ignore
       maxUnits = config.getUnitsPerFloor(building, floor);
    } else {
       // @ts-ignore
       maxUnits = config.unitsPerFloor[floor] || 0;
    }

    if (maxUnits === 0) return slots; // Lantai tidak valid (misal Gedung D Cibeureum lantai 5)

    for (let i = 1; i <= maxUnits; i++) {
       const existingRoom = rooms.find(r => r.building === building && r.floor === floor && r.unit_number === i);
       if (existingRoom) {
          slots.push(existingRoom);
       } else {
          // Buat ghost room jika belum ada di database (agar grid slot ttp muncul greyed-out)
          slots.push({
             id: -(building.charCodeAt(0) * 1000 + floor * 100 + i), // Unique negative ID
             rusunawa: locationName,
             building: building,
             floor: floor,
             unit_number: i,
             room_number: `${building} ${floor} ${i}`,
             price: 0,
             status: "kosong" as const,
             _isGhost: true,
          } as Room);
       }
    }
    return slots;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-white/5">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 border-b border-slate-200 dark:border-white/10 pb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="text-blue-500" /> Matriks Ketersediaan Unit 
            {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin ml-2" />}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Dasbor status seluruh unit di {locationName}. Klik pada kotak kamar untuk melihat rincian tarif sewa.
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-white/5">
           <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 border-2 border-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-500"></div>
              <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Tersedia</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-rose-100 border-2 border-rose-400 dark:bg-rose-900/40 dark:border-rose-500"></div>
              <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Terisi</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-400 dark:bg-amber-900/40 dark:border-amber-500"></div>
              <span className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Rusak</span>
           </div>
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/20 my-10">
           <p className="text-red-500 font-medium mb-4">{error}</p>
           <button onClick={fetchRooms} className="px-5 py-2.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 transition-colors font-semibold flex items-center gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" /> Coba Lagi
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* LEFT PANEL: THE MATRIX SCROLLER (Takes 3 Columns on Desktop) */}
          <div className="xl:col-span-3">
             {/* Unified Scrolling Container */}
             <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-inner flex flex-col h-[700px]">
               <div className="flex-1 overflow-y-auto overflow-x-auto p-4 md:p-6 custom-scrollbar">
                  
                  {config.buildings.map((building) => (
                    <div key={`building-${building}`} className="mb-10 last:mb-0">
                      
                      {/* Building Header Sticky */}
                      <div className="sticky left-0 z-20 flex items-center gap-3 mb-4 inline-flex px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-lg shadow-sm">
                        <Building className="w-4 h-4 text-slate-300" />
                        <h4 className="font-bold tracking-widest uppercase text-sm">Gedung / Blok {building}</h4>
                      </div>

                      {/* Floors Matrix */}
                      <div className="flex flex-col gap-3">
                        {config.floors.map((floor) => {
                          const slots = getGridSlotsForFloor(building, floor);
                          if (slots.length === 0) return null; // Dont render empty 5th floor in Cibeureum D

                          return (
                            <div key={`b${building}-f${floor}`} className="flex items-start gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/60 dark:border-white/5 shadow-sm">
                              {/* Floor Label */}
                              <div className="w-16 flex-shrink-0 text-center font-bold text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider py-2">
                                Lnt {floor}
                              </div>

                              {/* Rooms Array */}
                              <div className="flex flex-wrap flex-1 gap-2.5">
                                {slots.map((room) => {
                                  const isGhost = room._isGhost;
                                  return (
                                    <button
                                      key={room.id}
                                      disabled={isGhost}
                                      onClick={() => setSelectedRoom(room)}
                                      className={`
                                        w-10 h-10 flex-shrink-0 md:w-11 md:h-11 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/30
                                        ${!isGhost && "hover:-translate-y-1 hover:shadow-md cursor-pointer"}
                                        ${isGhost ? "bg-slate-100 border-slate-200 text-slate-300 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-700 cursor-not-allowed" : 
                                          room.status === "kosong" 
                                          ? "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500/50 dark:text-emerald-400"
                                          : room.status === "isi"
                                          ? "bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-900/20 dark:border-rose-500/50 dark:text-rose-400"
                                          : "bg-amber-50 border-amber-400 text-amber-700 dark:bg-amber-900/20 dark:border-amber-500/50 dark:text-amber-400"
                                        }
                                        ${selectedRoom?.id === room.id ? "ring-4 ring-blue-500 border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 scale-110 z-10 shadow-lg" : ""}
                                      `}
                                      title={isGhost ? "Data tidak tersedia" : `Kamar ${room.room_number}`}
                                    >
                                      {room.unit_number}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  ))}
                  
               </div>
             </div>
          </div>


          {/* RIGHT PANEL: SELECTED ROOM DETAILS (Takes 1 Col on Desktop) */}
          <div className="xl:col-span-1">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col h-full sticky top-24 shadow-sm">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-4 mb-4">
                  Rincian Unit Terpilih
                </h4>
                
                {selectedRoom ? (
                  <div className="flex flex-col flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="mb-6">
                        <span className="text-4xl font-black text-slate-900 dark:text-white block mb-2 tracking-tight">
                           Blok {selectedRoom.building} / {selectedRoom.unit_number}
                        </span>
                        
                        {selectedRoom.status === "kosong" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Unit Tersedia
                          </span>
                        ) : selectedRoom.status === "rusak" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                            <XCircle className="w-3.5 h-3.5" /> Perbaikan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full text-xs font-bold uppercase tracking-wider">
                            <XCircle className="w-3.5 h-3.5" /> Telah Disewa
                          </span>
                        )}
                    </div>

                    <div className="space-y-4 mb-8 bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm text-sm">
                      <div>
                        <p className="text-slate-500 mb-0.5">Kode Resmi Ruangan</p>
                        <p className="font-bold text-slate-900 dark:text-white">{selectedRoom.room_number}</p>
                      </div>
                      <div className="h-px w-full bg-slate-100 dark:bg-white/5"></div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Letak Lantai</p>
                        <p className="font-bold text-slate-900 dark:text-white">Lantai {selectedRoom.floor}</p>
                      </div>
                      <div className="h-px w-full bg-slate-100 dark:bg-white/5"></div>
                      <div>
                        <p className="text-slate-500 mb-0.5">Rincian Tarif Dasar (Bulanan)</p>
                        <p className="font-bold text-slate-900 dark:text-white text-lg text-blue-600 dark:text-blue-400">
                           Rp {Number(selectedRoom.price).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto">
                      {selectedRoom.status === "kosong" ? (
                        <button onClick={() => {
                           document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
                        }} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 active:scale-95 uppercase tracking-wide text-sm">
                          Isi Formulir Untuk Unit Ini
                        </button>
                      ) : (
                        <button disabled className="w-full py-4 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl cursor-not-allowed uppercase tracking-wide text-sm">
                          Tidak Tersedia
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-10 px-2 opacity-80">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-5 border border-slate-200 dark:border-white/5 shadow-inner">
                        <Building className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-sm font-medium">Klik kotak nomor kamar (hijau) manapun pada daftar letak gedung di samping untuk mengintip tarif aslinya dan mendaftar.</p>
                  </div>
                )}
             </div>
          </div>

        </div>
      )}

      {/* Global CSS for custom scrollbar embedded inside the component for simplicity */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        @media (prefers-color-scheme: dark) {
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
          }
        }
      `}} />
    </div>
  );
}
