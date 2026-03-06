import React, { useState } from "react";
import { CheckCircle2, XCircle, Home } from "lucide-react";

type RoomStatus = "available" | "occupied";

interface Room {
  id: string;
  number: string;
  status: RoomStatus;
  type: string;
}

interface FloorPlanProps {
  locationName: string;
}

// Dummy data generator for the prototype
const generateDummyRooms = (floorCount: number, roomsPerFloor: number): Record<number, Room[]> => {
  const data: Record<number, Room[]> = {};
  for (let floor = 1; floor <= floorCount; floor++) {
    const rooms: Room[] = [];
    for (let r = 1; r <= roomsPerFloor; r++) {
      // Randomly assign available or occupied for demo purposes
      const isOccupied = Math.random() > 0.6; // 40% chance of being occupied
      const roomNumber = `${floor}${r.toString().padStart(2, '0')}`;
      
      rooms.push({
        id: `room-${roomNumber}`,
        number: roomNumber,
        status: isOccupied ? "occupied" : "available",
        type: `Type ${Math.random() > 0.5 ? '21' : '24'}`
      });
    }
    data[floor] = rooms;
  }
  return data;
};

export function FloorPlan({ locationName }: FloorPlanProps) {
  // Use state to hold our mock data. In a real app, this would be fetched from the API.
  const [activeFloor, setActiveFloor] = useState<number>(1);
  const totalFloors = 5;
  const [floorData] = useState(() => generateDummyRooms(totalFloors, 16));
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const currentRooms = floorData[activeFloor] || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-xl border border-slate-200 dark:border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="text-blue-500" /> Ketersediaan Unit
          </h3>
          <p className="text-sm text-slate-500 mt-1">Denah interaktif hunian {locationName}. Pilih lantai untuk melihat status kamar.</p>
        </div>
        
        {/* Floor Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl self-start md:self-auto overflow-x-auto w-full md:w-auto">
          {[1, 2, 3, 4, 5].map((floor) => (
            <button
              key={floor}
              onClick={() => {
                setActiveFloor(floor);
                setSelectedRoom(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeFloor === floor 
                  ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Lantai {floor}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* The Floor Plan Grid (Left Side - 2 Cols) */}
        <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-950 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-white/5 relative overflow-hidden">
          
          {/* Lorong indikator */}
          <div className="absolute top-1/2 left-0 w-full h-12 -translate-y-1/2 bg-slate-200/50 dark:bg-slate-800/50 flex items-center justify-center">
             <span className="tracking-[0.5em] text-slate-400 dark:text-slate-600 font-bold uppercase text-xs">Lorong Utama</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 relative z-10 min-h-[250px] content-between">
            {/* Top row of rooms (1-8) */}
            {currentRooms.slice(0, 8).map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`
                  aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95
                  ${room.status === "available" 
                    ? "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300"
                    : "bg-red-100 border-red-400 text-red-700 dark:bg-red-900/40 dark:border-red-500 dark:text-red-300"
                  }
                  ${selectedRoom?.id === room.id ? "ring-4 ring-blue-500/50 scale-110 z-20 shadow-xl" : "shadow-sm"}
                `}
                title={`Kamar ${room.number} - ${room.status === "available" ? "Tersedia" : "Terisi"}`}
              >
                <span className="font-bold text-lg">{room.number}</span>
              </button>
            ))}

            {/* Spacer for hallway */}
            <div className="col-span-full h-16"></div>

            {/* Bottom row of rooms (9-16) */}
            {currentRooms.slice(8, 16).map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                 className={`
                  aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95
                  ${room.status === "available" 
                    ? "bg-green-100 border-green-400 text-green-700 dark:bg-green-900/40 dark:border-green-500 dark:text-green-300"
                    : "bg-red-100 border-red-400 text-red-700 dark:bg-red-900/40 dark:border-red-500 dark:text-red-300"
                  }
                  ${selectedRoom?.id === room.id ? "ring-4 ring-blue-500/50 scale-110 z-20 shadow-xl" : "shadow-sm"}
                `}
                title={`Kamar ${room.number} - ${room.status === "available" ? "Tersedia" : "Terisi"}`}
              >
                <span className="font-bold text-lg">{room.number}</span>
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 flex items-center justify-center gap-6 border-t border-slate-200 dark:border-white/10 pt-6">
             <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-green-100 border-2 border-green-400 dark:bg-green-900/40 dark:border-green-500"></div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tersedia</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-red-100 border-2 border-red-400 dark:bg-red-900/40 dark:border-red-500"></div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Terisi</span>
             </div>
          </div>
        </div>

        {/* Room Details Sidebar (Right Side - 1 Col) */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col">
          <h4 className="font-bold text-lg text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-4 mb-4">
            Informasi Unit
          </h4>
          
          {selectedRoom ? (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{selectedRoom.number}</span>
                {selectedRoom.status === "available" ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Tersedia
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-bold">
                    <XCircle className="w-4 h-4" /> Terisi
                  </span>
                )}
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-slate-500 text-sm mb-1">Tipe Unit</p>
                  <p className="font-semibold text-slate-900 dark:text-white capitalize">{selectedRoom.type}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">Lantai</p>
                  <p className="font-semibold text-slate-900 dark:text-white">Lantai {activeFloor}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm mb-1">Letak</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {parseInt(selectedRoom.number.slice(-2)) <= 8 ? "Menghadap Utara" : "Menghadap Selatan"}
                  </p>
                </div>
              </div>

              <div className="mt-auto">
                {selectedRoom.status === "available" ? (
                  <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/30">
                    Pilih Unit Ini
                  </button>
                ) : (
                  <button disabled className="w-full py-3 bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-bold rounded-xl cursor-not-allowed">
                    Unit Tidak Tersedia
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12">
              <Home className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4 opacity-50" />
              <p>Klik salah satu ruangan pada denah untuk melihat detail ketersediaannya.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
