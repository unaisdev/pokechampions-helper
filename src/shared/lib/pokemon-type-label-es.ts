/** PokéAPI type slugs → etiqueta corta en español (UI). */
const TYPE_SLUG_TO_ES: Record<string, string> = {
  normal: 'Normal',
  fighting: 'Lucha',
  flying: 'Volador',
  poison: 'Veneno',
  ground: 'Tierra',
  rock: 'Roca',
  bug: 'Bicho',
  ghost: 'Fantasma',
  steel: 'Acero',
  fire: 'Fuego',
  water: 'Agua',
  grass: 'Planta',
  electric: 'Eléctrico',
  psychic: 'Psíquico',
  ice: 'Hielo',
  dragon: 'Dragón',
  dark: 'Siniestro',
  fairy: 'Hada',
  stellar: 'Astral',
  unknown: '???',
};

export function pokemonTypeLabelEs(slug: string): string {
  return TYPE_SLUG_TO_ES[slug] ?? slug.replace(/-/g, ' ');
}
