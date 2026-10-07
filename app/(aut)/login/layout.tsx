import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión | OpenDayCare",
  description: "Ingresá para ver el día de hoy.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
