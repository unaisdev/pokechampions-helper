/**
 * Flujo manual: el usuario pega este prompt en Gemini (web), adjunta la captura,
 * y devuelve a la app un JSON con forma fija {@link GeminiManualTeamScanV1}.
 */

export type GeminiManualTeamScanV1 = {
  version: 1;
  /** Equipo del jugador, columna izquierda, de arriba a abajo (slugs PokéAPI en inglés). */
  nuestro_equipo: string[];
  /** Equipo rival, columna derecha, de arriba a abajo. */
  rival: string[];
};

/** Texto que debe pegarse en Gemini junto con la imagen. */
export const GEMINI_TEAM_SCAN_PROMPT = `Eres un asistente que lee capturas de Pokémon (pantalla previa de combate con dos equipos de hasta 6 Pokémon).

La imagen tiene a la IZQUIERDA el equipo del jugador ("Nuestro equipo" o similar) y a la DERECHA el del rival.

Identifica cada Pokémon visible en cada columna de arriba a abajo (máximo 6 por lado). Usa el nombre de especie en inglés en minúsculas, formato slug de PokéAPI (ejemplos: dragonite, mr-mime, ho-oh, palafin, archaludon).

IMPORTANTE — Tu respuesta debe ser ÚNICAMENTE un objeto JSON válido, sin markdown ni bloques de código, sin texto antes ni después. Estructura exacta:
{"version":1,"nuestro_equipo":["slug", "..."],"rival":["slug", "..."]}

Reglas:
- "version" siempre debe ser el número 1.
- Orden: de arriba a abajo en cada columna.
- Si hay menos de 6 en un lado, incluye solo los que veas.
- Si no lees bien un Pokémon, omítelo de la lista (no inventes).`;

const MAX_PER_SIDE = 6;

function stripJsonFence(text: string): string {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (m ? m[1] : text).trim();
}

function parseLooseJson(text: string): unknown {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  const inner = stripJsonFence(trimmed);
  try {
    return JSON.parse(inner);
  } catch {
    const start = inner.indexOf('{');
    const end = inner.lastIndexOf('}');
    if (start < 0 || end <= start) {
      throw new Error('No se encontró un objeto JSON.');
    }
    return JSON.parse(inner.slice(start, end + 1));
  }
}

function normalizeSlugList(arr: unknown, label: string): string[] {
  if (!Array.isArray(arr)) {
    throw new Error(`Falta el array "${label}" o no es una lista.`);
  }
  const out: string[] = [];
  for (const item of arr) {
    if (typeof item !== 'string') continue;
    const s = item.trim().toLowerCase();
    if (s) out.push(s);
    if (out.length >= MAX_PER_SIDE) break;
  }
  return out;
}

/**
 * Interpreta lo que el usuario pegó desde Gemini (JSON solo o envuelto en \`\`\`json).
 */
export function parseGeminiTeamScanResponse(raw: string): GeminiManualTeamScanV1 {
  let data: unknown;
  try {
    data = parseLooseJson(raw);
  } catch {
    throw new Error('No es un JSON válido. Copia solo el objeto que devolvió Gemini.');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('El JSON debe ser un objeto.');
  }

  const o = data as Record<string, unknown>;
  if (o.version !== 1) {
    throw new Error('El campo "version" debe ser 1.');
  }

  return {
    version: 1,
    nuestro_equipo: normalizeSlugList(o.nuestro_equipo, 'nuestro_equipo'),
    rival: normalizeSlugList(o.rival, 'rival'),
  };
}
