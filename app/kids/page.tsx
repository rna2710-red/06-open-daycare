"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/app/components/shared/Sidebar";
import { KidCard } from "@/app/components/kids/KidCard";
import AddChildModal from "@/app/components/kids/AddChildModal";
import { createClient } from "@/utils/supabase/client";
import type { Child } from "@/lib/mock/kids";

interface DbChild {
  id: string;
  full_name: string;
  birth_date: string;
  room_id: string;
  allergy_tags: string[] | null;
  medical_notes: string | null;
  rooms: { name: string } | null;
}

interface Room {
  id: string;
  name: string;
}

const AVATAR_COLORS = [
  { bg: "#A9D9E8", text: "#1F7A93" },
  { bg: "#F4B8CC", text: "#C44A7A" },
  { bg: "#B9DEC4", text: "#3E8B62" },
  { bg: "#F4DC8E", text: "#9A7B1E" },
  { bg: "#C9B6E8", text: "#7B5FC0" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function computeAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
  }
  if (years === 0) {
    const totalMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    return `${totalMonths} ${totalMonths === 1 ? "mes" : "meses"}`;
  }
  return `${years} ${years === 1 ? "año" : "años"}`;
}

function mapDbChildToChild(dbChild: DbChild): Child {
  const avatar = getAvatarColor(dbChild.full_name);
  return {
    id: dbChild.id,
    name: dbChild.full_name,
    age: computeAge(dbChild.birth_date),
    room: dbChild.rooms?.name ?? "",
    initial: dbChild.full_name.charAt(0).toUpperCase(),
    avatarColor: avatar.bg,
    avatarTextColor: avatar.text,
    allergyBadge: dbChild.allergy_tags && dbChild.allergy_tags.length > 0
      ? dbChild.allergy_tags[0].toUpperCase()
      : undefined,
    allergies: dbChild.medical_notes ?? undefined,
    birthday: new Date(dbChild.birth_date).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }),
    admissionDate: "",
    parents: [],
  };
}

const searchIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#B0A290"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const plusIcon = (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fff"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function KidsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    const { data: roomsData } = await supabase
      .from("rooms")
      .select("id, name");

    setRooms(roomsData ?? []);

    const { data: childrenData } = await supabase
      .from("children")
      .select("id, full_name, birth_date, room_id, allergy_tags, medical_notes, rooms(name)")
      .eq("status", "active");

    setChildren((childrenData as DbChild[] | null)?.map(mapDbChildToChild) ?? []);
  }, []);

  const filteredChildren = children.filter((child) => {
    const matchesRoom = selectedRoom === "all" || (() => {
      const room = rooms.find((r) => r.name === child.room);
      return room?.id === selectedRoom;
    })();
    const query = searchQuery.toLowerCase();
    const matchesSearch = query === "" ||
      child.name.toLowerCase().includes(query) ||
      child.room.toLowerCase().includes(query);
    return matchesRoom && matchesSearch;
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const { data: roomsData } = await supabase
        .from("rooms")
        .select("id, name");

      setRooms(roomsData ?? []);

      const { data: childrenData } = await supabase
        .from("children")
        .select("id, full_name, birth_date, room_id, allergy_tags, medical_notes, rooms(name)")
        .eq("status", "active");

      setChildren((childrenData as DbChild[] | null)?.map(mapDbChildToChild) ?? []);
    }
    load();
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-fondo md:flex-row">
      <Sidebar itemActivo="ninos" />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-5 pb-20 pt-[34px] md:px-10">
          <div className="mb-[22px] flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-acento">
                GESTIÓN
              </p>
              <h1 className="font-display text-[30px] font-semibold text-tinta">
                Niños
              </h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-[14px] bg-linear-to-b from-coral to-coral-fuerte px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
            >
              {plusIcon}Agregar niño
            </button>
          </div>

          <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-borde bg-superficie px-4 py-3">
            {searchIcon}
            <input
              placeholder="Buscar niño…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none bg-transparent text-[15px] text-tinta placeholder:text-[#B6A99B] focus:outline-none"
            />
          </div>

          <div className="mb-3.5 flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="appearance-none rounded-full border border-borde bg-superficie px-3 py-1.5 pr-8 text-[12.5px] font-extrabold tracking-[.8px] text-tinta focus:outline-none"
              >
                <option value="all">Todas las salas</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94887B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            <span className="text-[13px] text-tinta-mute">
              {filteredChildren.length} niños
            </span>
            <span className="h-px flex-1 bg-[#E7DAC8]" />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {filteredChildren.map((child) => (
              <KidCard key={child.id} child={child} />
            ))}
          </div>
        </div>
      </main>
      <AddChildModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rooms={rooms}
        onSave={fetchData}
      />
    </div>
  );
}
