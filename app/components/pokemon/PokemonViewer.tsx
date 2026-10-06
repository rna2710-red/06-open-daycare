"use client";

import { useCallback, useEffect, useState } from "react";

interface PokemonType {
  type: { name: string };
}

interface PokemonStat {
  base_stat: number;
  stat: { name: string };
}

interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: {
        front_default: string | null;
      };
    };
  };
  types: PokemonType[];
  stats: PokemonStat[];
}

const TYPE_LABELS: Record<string, string> = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "At. Esp.",
  "special-defense": "Def. Esp.",
  speed: "Velocidad",
};

const TYPE_COLORS: Record<string, string> = {
  normal: "bg-[#A8A77A]",
  fire: "bg-[#EE8130]",
  water: "bg-[#6390F0]",
  electric: "bg-[#F7D02C]",
  grass: "bg-[#7AC74C]",
  ice: "bg-[#96D9D6]",
  fighting: "bg-[#C22E28]",
  poison: "bg-[#A33EA1]",
  ground: "bg-[#E2BF65]",
  flying: "bg-[#A98FF3]",
  psychic: "bg-[#F95587]",
  bug: "bg-[#A6B91A]",
  rock: "bg-[#B6A136]",
  ghost: "bg-[#735797]",
  dragon: "bg-[#6F35FC]",
  dark: "bg-[#705746]",
  steel: "bg-[#B7B7CE]",
  fairy: "bg-[#D685AD]",
};

const MIN_ID = 1;
const MAX_ID = 1025;

function formatName(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PokemonViewer() {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPokemon = useCallback(async (id: number) => {
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${id}`
      );
      if (!response.ok) {
        throw new Error("No se pudo cargar el Pokémon");
      }
      const data: Pokemon = await response.json();
      setPokemon(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error desconocido"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPokemon(MIN_ID);
  }, [loadPokemon]);

  const handlePrevious = () => {
    if (!pokemon || isLoading) return;
    setIsLoading(true);
    const nextId = pokemon.id <= MIN_ID ? MAX_ID : pokemon.id - 1;
    loadPokemon(nextId);
  };

  const handleNext = () => {
    if (!pokemon || isLoading) return;
    setIsLoading(true);
    const nextId = pokemon.id >= MAX_ID ? MIN_ID : pokemon.id + 1;
    loadPokemon(nextId);
  };

  const artwork =
    pokemon?.sprites.other?.["official-artwork"]?.front_default ??
    pokemon?.sprites.front_default ??
    null;

  return (
    <div className="mx-auto w-full max-w-[400px] rounded-[20px] border border-borde bg-superficie p-6 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isLoading}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-coral-medio font-display text-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          aria-label="Pokémon anterior"
        >
          ←
        </button>
        <span className="text-sm font-extrabold tracking-[.5px] text-tinta-mute">
          {pokemon ? `#${String(pokemon.id).padStart(3, "0")}` : "—"}
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-coral-medio font-display text-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          aria-label="Pokémon siguiente"
        >
          →
        </button>
      </div>

      {isLoading && (
        <div className="flex h-[220px] items-center justify-center">
          <p className="text-sm font-bold text-tinta-suave">
            Cargando...
          </p>
        </div>
      )}

      {!isLoading && error && (
        <div className="flex h-[220px] flex-col items-center justify-center gap-2">
          <p className="text-sm font-bold text-coral-medio">{error}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              loadPokemon(MIN_ID);
            }}
            className="text-sm font-extrabold text-acento-oscuro underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && pokemon && (
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-[200px] w-full items-center justify-center rounded-2xl bg-[#F4ECE1]">
            {artwork ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artwork}
                alt={formatName(pokemon.name)}
                className="h-[180px] w-[180px] object-contain"
              />
            ) : (
              <p className="text-sm text-tinta-suave">
                Imagen no disponible
              </p>
            )}
          </div>

          <h2 className="font-display text-[26px] font-semibold text-tinta">
            {formatName(pokemon.name)}
          </h2>

          <div className="mt-2 flex gap-2">
            {pokemon.types.map(({ type }) => (
              <span
                key={type.name}
                className={`rounded-full px-3 py-1 text-xs font-extrabold tracking-[.5px] text-white ${TYPE_COLORS[type.name] ?? "bg-gray-400"}`}
              >
                {TYPE_LABELS[type.name] ?? type.name}
              </span>
            ))}
          </div>

          <div className="mt-5 w-full space-y-2">
            {pokemon.stats.map(({ base_stat, stat }) => (
              <div key={stat.name} className="flex items-center gap-3">
                <span className="w-[80px] flex-none text-[12px] font-bold text-tinta-mute">
                  {STAT_LABELS[stat.name] ?? stat.name}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E7DAC8]">
                  <div
                    className="h-full rounded-full bg-acento-medio"
                    style={{
                      width: `${Math.min((base_stat / 255) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="w-[32px] flex-none text-right text-[12px] font-extrabold text-tinta">
                  {base_stat}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
