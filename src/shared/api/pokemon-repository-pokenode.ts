import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import type { MainClient, Move, Pokemon, Type } from 'pokenode-ts';

import type { PokemonMoveLearnable, PokemonSummary } from '@src/entities/pokemon-summary';
import {
  formatMoveEffectPlaceholders,
  moveFlavorTextForLocales,
  moveShortEffectRawForLocales,
} from '@src/shared/lib/move-effect-text';
import { abilityShortEffectForLocales } from '@src/shared/lib/ability-effect-text';
import { PokemonNetworkError, PokemonNotFoundError } from '@src/shared/lib/errors';
import { megaFormOptionsFromSpecies } from '@src/shared/lib/pokemon-mega-forms';
import { formatPokemonSlugAsTitle, normalizePokemonNameQuery } from '@src/shared/lib/pokemon-name';
import {
  pickLocalizedName,
  pokeApiLanguagePreference,
} from '@src/shared/lib/pokeapi-localized-name';
import { parseTypeIdFromPokeApiUrl, pokeApiTypeIconUrl } from '@src/shared/lib/type-sprites';

import { mapPokemonToSummary } from './map-pokemon-to-summary';
import type {
  MoveLearnablesFetchOptions,
  PokemonAbilityDetail,
  PokemonRepository,
} from './pokemon-repository';

/** v10: `moveNames` en resumen; detalle de movimientos bajo demanda (sin fan-out en `getByName`). */
const STORAGE_PREFIX = '@pc/pokemon_cache/v10/';

/** Limita peticiones concurrentes a `/move/*` (varios Pokémon en paralelo saturaban PokéAPI → 429 y datos «unknown»). */
const MOVE_FETCH_MAX_PARALLEL = 6;
let moveFetchActive = 0;
const moveFetchWaitQueue: Array<() => void> = [];

function acquireMoveFetchSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (moveFetchActive < MOVE_FETCH_MAX_PARALLEL) {
      moveFetchActive += 1;
      resolve();
      return;
    }
    moveFetchWaitQueue.push(() => {
      moveFetchActive += 1;
      resolve();
    });
  });
}

function releaseMoveFetchSlot(): void {
  moveFetchActive -= 1;
  const next = moveFetchWaitQueue.shift();
  if (next) {
    next();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function moveFetchShouldRetry(e: unknown): boolean {
  if (!isAxiosError(e)) {
    return true;
  }
  const status = e.response?.status;
  if (status === 404) {
    return false;
  }
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function isValidCachedSummary(raw: unknown): raw is PokemonSummary {
  if (raw == null || typeof raw !== 'object') {
    return false;
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.displayName !== 'string' || !Array.isArray(o.moveNames)) {
    return false;
  }
  return o.moveNames.every((n) => typeof n === 'string');
}

function mapMoveToLearnable(move: Move, langs: string[], typeDisplayName: string): PokemonMoveLearnable {
  const typeId = parseTypeIdFromPokeApiUrl(move.type.url);
  const dc = move.damage_class?.name;
  const damageClass: PokemonMoveLearnable['damageClass'] =
    dc === 'physical' || dc === 'special' || dc === 'status' ? dc : 'unknown';
  const displayName =
    pickLocalizedName(move.names, langs, move.name) || formatPokemonSlugAsTitle(move.name);
  const shortRaw = moveShortEffectRawForLocales(move, langs);
  const effectChance = move.effect_chance;
  const shortEffect = shortRaw
    ? formatMoveEffectPlaceholders(shortRaw, effectChance)
    : null;
  const flavorText = moveFlavorTextForLocales(move, langs);
  const meta = move.meta
    ? {
        ailmentSlug: move.meta.ailment?.name ?? null,
        ailmentChance: move.meta.ailment_chance,
        flinchChance: move.meta.flinch_chance,
        statChance: move.meta.stat_chance,
      }
    : null;
  return {
    name: move.name,
    displayName,
    typeName: move.type.name,
    typeDisplayName,
    typeIconUrl: typeId != null ? pokeApiTypeIconUrl(typeId) : null,
    damageClass,
    power: move.power,
    accuracy: move.accuracy,
    pp: move.pp,
    priority: move.priority,
    effectChance,
    shortEffect,
    flavorText,
    meta,
  };
}

export class PokemonRepositoryPokenode implements PokemonRepository {
  private readonly moveLearnableCache = new Map<string, PokemonMoveLearnable>();
  private readonly typeResourceCache = new Map<string, Type>();

  constructor(private readonly client: MainClient) {}

  /**
   * Some species (e.g. Palafin) have no `/pokemon/{species}` entry; PokeAPI uses per-form slugs
   * (`palafin-zero`, `palafin-hero`). Resolve via `/pokemon-species/{name}` and the default variety.
   */
  private async resolveSpeciesNameFromSlug(normalized: string): Promise<string | null> {
    try {
      const pokemon = await this.resolvePokemon(normalized);
      return pokemon.species.name;
    } catch {
      try {
        const species = await this.client.pokemon.getPokemonSpeciesByName(normalized);
        return species.name;
      } catch {
        return null;
      }
    }
  }

  async listFormSlugsForPokemonQuery(rawSlug: string): Promise<string[]> {
    const key = normalizePokemonNameQuery(rawSlug);
    if (!key) {
      return [];
    }
    const speciesName = await this.resolveSpeciesNameFromSlug(key);
    if (!speciesName) {
      return [];
    }
    try {
      const species = await this.client.pokemon.getPokemonSpeciesByName(speciesName);
      return species.varieties.map((v) => v.pokemon.name);
    } catch {
      return [];
    }
  }

  private async resolvePokemon(slug: string): Promise<Pokemon> {
    try {
      return await this.client.pokemon.getPokemonByName(slug);
    } catch (e) {
      if (!isAxiosError(e) || e.response?.status !== 404) {
        throw e;
      }
    }

    try {
      const species = await this.client.pokemon.getPokemonSpeciesByName(slug);
      const defaultForm = species.varieties[0]?.pokemon?.name;
      if (!defaultForm) {
        throw new PokemonNotFoundError(slug);
      }
      return await this.client.pokemon.getPokemonByName(defaultForm);
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 404) {
        throw new PokemonNotFoundError(slug);
      }
      throw e;
    }
  }

  private async getTypeCached(slug: string): Promise<Type> {
    const hit = this.typeResourceCache.get(slug);
    if (hit) {
      return hit;
    }
    const t = await this.client.pokemon.getTypeByName(slug);
    this.typeResourceCache.set(slug, t);
    return t;
  }

  private async localizedTypeName(slug: string, langs: string[]): Promise<string> {
    try {
      const t = await this.getTypeCached(slug);
      return pickLocalizedName(t.names, langs, slug) || formatPokemonSlugAsTitle(slug);
    } catch {
      return formatPokemonSlugAsTitle(slug);
    }
  }

  private async getMoveLearnable(moveName: string, langs: string[]): Promise<PokemonMoveLearnable> {
    const cacheKey = `${langs[0]}:${moveName}`;
    const hit = this.moveLearnableCache.get(cacheKey);
    if (hit) {
      return hit;
    }

    await acquireMoveFetchSlot();
    try {
      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const move = await this.client.move.getMoveByName(moveName);
          const typeDisplayName = await this.localizedTypeName(move.type.name, langs);
          const row = mapMoveToLearnable(move, langs, typeDisplayName);
          this.moveLearnableCache.set(cacheKey, row);
          return row;
        } catch (e) {
          lastErr = e;
          if (moveFetchShouldRetry(e) && attempt < 2) {
            await sleep(400 * (attempt + 1));
            continue;
          }
          break;
        }
      }
      if (__DEV__) {
        const status = isAxiosError(lastErr) ? lastErr.response?.status : undefined;
        console.warn(
          `[PokemonRepository] getMoveByName failed: ${moveName}`,
          status != null ? `HTTP ${status}` : lastErr,
        );
      }
      return {
        name: moveName,
        displayName: formatPokemonSlugAsTitle(moveName),
        typeName: 'unknown',
        typeDisplayName: '—',
        typeIconUrl: null,
        damageClass: 'unknown',
        power: null,
        accuracy: null,
        pp: null,
        priority: 0,
        effectChance: null,
        shortEffect: null,
        flavorText: null,
        meta: null,
      };
    } finally {
      releaseMoveFetchSlot();
    }
  }

  async getMoveLearnableByName(
    rawMoveName: string,
    options?: { pokeApiLanguage?: string },
  ): Promise<PokemonMoveLearnable> {
    const key = normalizePokemonNameQuery(rawMoveName) || rawMoveName.trim().toLowerCase();
    if (!key) {
      return {
        name: rawMoveName,
        displayName: formatPokemonSlugAsTitle(rawMoveName.trim() || 'move'),
        typeName: 'unknown',
        typeDisplayName: '—',
        typeIconUrl: null,
        damageClass: 'unknown',
        power: null,
        accuracy: null,
        pp: null,
        priority: 0,
        effectChance: null,
        shortEffect: null,
        flavorText: null,
        meta: null,
      };
    }
    const pokeApiLanguage = options?.pokeApiLanguage ?? 'en';
    const langs = pokeApiLanguagePreference(pokeApiLanguage);
    return this.getMoveLearnable(key, langs);
  }

  async getMoveLearnablesForSlugs(
    moveSlugs: string[],
    options?: MoveLearnablesFetchOptions,
  ): Promise<PokemonMoveLearnable[]> {
    const pokeApiLanguage = options?.pokeApiLanguage ?? 'en';
    const langs = pokeApiLanguagePreference(pokeApiLanguage);
    const names = [
      ...new Set(
        moveSlugs
          .map((s) => normalizePokemonNameQuery(s) || s.trim().toLowerCase())
          .filter((n): n is string => n.length > 0),
      ),
    ].sort((a, b) => a.localeCompare(b));
    const onProgress = options?.onProgress;
    onProgress?.(0, names.length);
    if (names.length === 0) {
      return [];
    }
    const batchSize = 4;
    const out: PokemonMoveLearnable[] = [];
    for (let i = 0; i < names.length; i += batchSize) {
      const chunk = names.slice(i, i + batchSize);
      const rows = await Promise.all(chunk.map((n) => this.getMoveLearnable(n, langs)));
      out.push(...rows);
      onProgress?.(out.length, names.length);
    }
    return out;
  }

  async getAbilityDetail(
    rawAbilityName: string,
    options?: { pokeApiLanguage?: string },
  ): Promise<PokemonAbilityDetail> {
    const key = normalizePokemonNameQuery(rawAbilityName) || rawAbilityName.trim().toLowerCase();
    const langs = pokeApiLanguagePreference(options?.pokeApiLanguage ?? 'en');
    if (!key) {
      return { displayName: formatPokemonSlugAsTitle(rawAbilityName.trim() || 'ability'), shortEffect: null };
    }
    try {
      const ability = await this.client.pokemon.getAbilityByName(key);
      const displayName =
        pickLocalizedName(ability.names, langs, key) || formatPokemonSlugAsTitle(key);
      return {
        displayName,
        shortEffect: abilityShortEffectForLocales(ability, langs),
      };
    } catch {
      return { displayName: formatPokemonSlugAsTitle(key), shortEffect: null };
    }
  }

  async getByName(
    rawName: string,
    options?: { pokeApiLanguage?: string },
  ): Promise<PokemonSummary> {
    const key = normalizePokemonNameQuery(rawName);
    if (!key) {
      throw new PokemonNotFoundError(rawName);
    }

    const pokeApiLanguage = options?.pokeApiLanguage ?? 'en';
    const langs = pokeApiLanguagePreference(pokeApiLanguage);
    const storageKey = `${STORAGE_PREFIX}${pokeApiLanguage}/${key}`;

    try {
      const cached = await AsyncStorage.getItem(storageKey);
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        if (isValidCachedSummary(parsed)) {
          return parsed;
        }
        await AsyncStorage.removeItem(storageKey);
      }
    } catch {
      // ignore corrupt cache
    }

    try {
      const pokemon = await this.resolvePokemon(key);
      const species = await this.client.pokemon.getPokemonSpeciesByName(pokemon.species.name);
      const { defaultFormSlug, megaForms } = megaFormOptionsFromSpecies(species);
      const base = mapPokemonToSummary(pokemon, {
        speciesDefaultFormSlug: defaultFormSlug,
        megaForms,
      });
      const displayName =
        pickLocalizedName(species.names, langs, pokemon.name) || base.displayName;

      const summary: PokemonSummary = {
        ...base,
        displayName,
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(summary));
      return summary;
    } catch (e) {
      if (e instanceof PokemonNotFoundError) {
        throw e;
      }
      if (isAxiosError(e) && e.response?.status === 404) {
        throw new PokemonNotFoundError(key);
      }
      throw new PokemonNetworkError('Could not reach PokéAPI.', e);
    }
  }
}
