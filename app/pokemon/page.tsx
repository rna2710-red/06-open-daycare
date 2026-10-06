import PokemonViewer from "@/app/components/pokemon/PokemonViewer";

export default function PokemonPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-fondo p-6">
      <div className="w-full max-w-[400px]">
        <h1 className="mb-6 text-center font-display text-[28px] font-semibold text-tinta">
          Pokédex
        </h1>
        <PokemonViewer />
      </div>
    </div>
  );
}
