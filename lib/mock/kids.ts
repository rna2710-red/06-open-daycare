export interface Parent {
  name: string;
  role: string;
  status: "active" | "pending";
  initial: string;
  color: string;
  textColor: string;
}

export interface Child {
  id: string;
  name: string;
  age: string;
  room: string;
  initial: string;
  avatarColor: string;
  avatarTextColor: string;
  allergyBadge?: string;
  allergies?: string;
  birthday: string;
  admissionDate: string;
  parents: Parent[];
}

export interface Room {
  id: string;
  name: string;
}

export const rooms: Room[] = [
  { id: "soles", name: "Soles" },
  { id: "lunas", name: "Lunas" },
  { id: "estrellas", name: "Estrellas" },
];

export const children: Child[] = [
  {
    id: "mateo-fernandez",
    name: "Mateo Fernández",
    age: "3 años",
    room: "Soles",
    initial: "M",
    avatarColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    allergyBadge: "MANÍ",
    allergies: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    birthday: "12 mar 2022",
    admissionDate: "feb 2025",
    parents: [
      { name: "Lucía Fernández", role: "Mamá", status: "active", initial: "L", color: "#C9B6E8", textColor: "#fff" },
      { name: "Diego Fernández", role: "Papá", status: "pending", initial: "D", color: "#A9C7E8", textColor: "#fff" },
    ],
  },
  {
    id: "sofia-mendez",
    name: "Sofía Méndez",
    age: "2 años",
    room: "Soles",
    initial: "S",
    avatarColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
    birthday: "8 ago 2023",
    admissionDate: "mar 2025",
    parents: [
      { name: "Camila Méndez", role: "Mamá", status: "active", initial: "C", color: "#F2937A", textColor: "#fff" },
    ],
  },
  {
    id: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    age: "3 años",
    room: "Soles",
    initial: "B",
    avatarColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
    birthday: "15 ene 2022",
    admissionDate: "ene 2025",
    parents: [
      { name: "Laura Ruiz", role: "Mamá", status: "active", initial: "L", color: "#F4B8CC", textColor: "#fff" },
      { name: "Martín Ruiz", role: "Papá", status: "active", initial: "M", color: "#A9D9E8", textColor: "#fff" },
    ],
  },
  {
    id: "valentina-soto",
    name: "Valentina Soto",
    age: "2 años",
    room: "Soles",
    initial: "V",
    avatarColor: "#F4DC8E",
    avatarTextColor: "#9A7B1E",
    birthday: "3 abr 2023",
    admissionDate: "abr 2025",
    parents: [],
  },
  {
    id: "tomas-diaz",
    name: "Tomás Díaz",
    age: "3 años",
    room: "Soles",
    initial: "T",
    avatarColor: "#C9B6E8",
    avatarTextColor: "#7B5FC0",
    allergyBadge: "LACTOSA",
    allergies: "Intolerancia a la lactosa. Evitar lácteos en comidas y meriendas.",
    birthday: "27 jul 2022",
    admissionDate: "feb 2025",
    parents: [
      { name: "Paula Díaz", role: "Mamá", status: "active", initial: "P", color: "#F4DC8E", textColor: "#fff" },
    ],
  },
  {
    id: "emma-castro",
    name: "Emma Castro",
    age: "2 años",
    room: "Soles",
    initial: "E",
    avatarColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
    birthday: "19 sep 2023",
    admissionDate: "sep 2025",
    parents: [
      { name: "Andrea Castro", role: "Mamá", status: "active", initial: "A", color: "#B9DEC4", textColor: "#fff" },
    ],
  },
  {
    id: "lucas-romero",
    name: "Lucas Romero",
    age: "3 años",
    room: "Soles",
    initial: "L",
    avatarColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    birthday: "2 feb 2022",
    admissionDate: "feb 2025",
    parents: [
      { name: "Sofía Romero", role: "Mamá", status: "active", initial: "S", color: "#C9B6E8", textColor: "#fff" },
    ],
  },
  {
    id: "olivia-vega",
    name: "Olivia Vega",
    age: "2 años",
    room: "Soles",
    initial: "O",
    avatarColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
    birthday: "11 nov 2023",
    admissionDate: "nov 2025",
    parents: [
      { name: "Mariana Vega", role: "Mamá", status: "active", initial: "M", color: "#F4B8CC", textColor: "#fff" },
    ],
  },
];

export function generateInvitationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
