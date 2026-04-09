import type { GeminiManualTeamScanV1 } from './gemini-manual-team-scan';

const TEAM_SIZE = 6;

/**
 * Especies en formato slug PokéAPI (formas base habituales) para rellenar equipos de prueba sin Gemini.
 */
const DEMO_SLUG_POOL: readonly string[] = [
  'pikachu',
  'charizard',
  'blastoise',
  'venusaur',
  'gyarados',
  'dragonite',
  'garchomp',
  'lucario',
  'metagross',
  'tyranitar',
  'salamence',
  'gardevoir',
  'machamp',
  'snorlax',
  'lapras',
  'arcanine',
  'scizor',
  'umbreon',
  'espeon',
  'hydreigon',
  'volcarona',
  'excadrill',
  'ferrothorn',
  'toxapex',
  'dragapult',
  'corviknight',
  'rillaboom',
  'incineroar',
  'clefable',
  'amoonguss',
  'gliscor',
  'heatran',
  'latios',
  'latias',
  'greninja',
  'kommo-o',
  'pelipper',
  'talonflame',
  'magnezone',
  'rotom-wash',
];

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = t;
  }
}

/** Dos equipos de 6 Pokémon distintos, elegidos al azar del pool de demo. */
export function randomDemoTeamScan(): GeminiManualTeamScanV1 {
  const pool = [...DEMO_SLUG_POOL];
  shuffleInPlace(pool);
  return {
    version: 1,
    nuestro_equipo: pool.slice(0, TEAM_SIZE),
    rival: pool.slice(TEAM_SIZE, TEAM_SIZE * 2),
  };
}
