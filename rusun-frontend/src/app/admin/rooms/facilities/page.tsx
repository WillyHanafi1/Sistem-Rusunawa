"use client";
import React, { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Users, AlertTriangle } from "lucide-react";
import { AdminFloorPlan } from "@/components/AdminFloorPlan";

const RUSUNAWA_LOCATIONS = [
  { id: "Cigugur Tengah", name: "Rusunawa Cigugur Tengah" },
  { id: "Cibeureum", name: "Rusunawa Cibeureum" },
  { id: "Leuwigajah", name: "Rusunawa Leuwigajah" },
];

export default function AdminFacilitiesPage() {
  const [selectedLocation, setSelectedLocation] = useState(RUSUNAWA_LOCATIONS[0].name);

  return (
    <div className="flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight">Matriks Unit</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              A
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Control Panel */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
               <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     <Users className="w-5 h-5 text-blue-500" /> Pilih Lokasi Rusunawa
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Pilih area untuk melihat ketersediaan unit dan rincian penyewa.</p>
               </div>
               
               <div className="w-full md:w-72">
                  <select
                     value={selectedLocation}
                     onChange={(e) => setSelectedLocation(e.target.value)}
                     className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 dark:text-slate-200"
                  >
                     {RUSUNAWA_LOCATIONS.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                     ))}
                  </select>
               </div>
            </div>

            {/* Matrix Viewer */}
            <AdminFloorPlan locationName={selectedLocation} />

          </div>
        </main>
      </div>
  );
}
