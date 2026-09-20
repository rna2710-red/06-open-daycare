export type PostCategory = "achievement" | "activity" | "announcement";

export interface Post {
  id: string;
  type: PostCategory;
  child: string | null;
  initial: string;
  time: string;
  publishedByYou: boolean;
  audience: string;
  text: string;
  photo?: string;
  likes: number;
  comments: number;
}

export interface User {
  name: string;
  role: string;
  initial: string;
}

export const classroom = {
  name: "Sala Soles",
  childrenCount: 12,
  today: "martes 17 jun",
};

export const user: User = {
  name: "Caro Giménez",
  role: "Maestra · Soles",
  initial: "C",
};

export const posts: Post[] = [
  {
    id: "1",
    type: "achievement",
    child: "Mateo",
    initial: "M",
    time: "14:20",
    publishedByYou: true,
    audience: "familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "2",
    type: "activity",
    child: "Mateo",
    initial: "M",
    time: "09:40",
    publishedByYou: true,
    audience: "familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photo: "Foto · pintando con témperas",
    likes: 5,
    comments: 2,
  },
  {
    id: "3",
    type: "announcement",
    child: null,
    initial: "",
    time: "07:50",
    publishedByYou: true,
    audience: "toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];

export interface PostType {
  id: string;
  label: string;
  bgColor: string;
  textColor: string;
}

export const postTypes: PostType[] = [
  { id: "comida", label: "Comida", bgColor: "#9A7B1E", textColor: "#fff" },
  { id: "siesta", label: "Siesta", bgColor: "#E7DCF6", textColor: "#7B5FC0" },
  { id: "actividad", label: "Actividad", bgColor: "#2E89A6", textColor: "#fff" },
  { id: "logro", label: "Logro", bgColor: "#CFEBD8", textColor: "#3E9B6C" },
  { id: "animo", label: "Ánimo", bgColor: "#F9D2DE", textColor: "#C56486" },
  { id: "foto", label: "Foto", bgColor: "#FBD8CC", textColor: "#D9684A" },
  { id: "anuncio", label: "Anuncio", bgColor: "#CCD8F4", textColor: "#4E72C8" },
];
