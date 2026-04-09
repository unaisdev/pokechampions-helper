import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import type { Pokemon, PokemonClient } from 'pokenode-ts';

import type { PokemonSummary } from '@src/entities/pokemon-summary';
import { abilityShortEffectForLocales } from '@src/shared/lib/ability-effect-text';
import { PokemonNetworkError, PokemonNotFoundError } from '@src/shared/lib/errors';
import { megaFormOptionsFromSpecies } from '@src/shared/lib/pokemon-mega-forms';
import { normalizePokemonNameQuery } from '@src/shared/lib/pokemon-name';

import { mapPokemonToSummary } from './map-pokemon-to-summary';
import type { PokemonRepository } from './pokemon-repository';

const STORAGE_PREFIX = '@pc/pokemon_cache/v5/';

export class PokemonRepositoryPokenode implements PokemonRepository {
  constructor(private readonly client: PokemonClient) {}

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
        const species = await this.client.getPokemonSpeciesByName(normalized);
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
      const species = await this.client.getPokemonSpeciesByName(speciesName);
      return species.varieties.map((v) => v.pokemon.name);
    } catch {
      return [];
    }
  }

  private async resolvePokemon(slug: string): Promise<Pokemon> {
    try {
      return await this.client.getPokemonByName(slug);
    } catch (e) {
      if (!isAxiosError(e) || e.response?.status !== 404) {
        throw e;
      }
    }

    try {
      const species = await this.client.getPokemonSpeciesByName(slug);
      const defaultForm = species.varieties[0]?.pokemon?.name;
      if (!defaultForm) {
        throw new PokemonNotFoundError(slug);
      }
      return await this.client.getPokemonByName(defaultForm);
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 404) {
        throw new PokemonNotFoundError(slug);
      }
      throw e;
    }
  }

  private async abilityShortEffectsByName(pokemon: Pokemon): Promise<Map<string, string | null>> {
    const names = [...new Set(pokemon.abilities.map((a) => a.ability.name))];
    const pairs = await Promise.all(
      names.map(async (name) => {
        try {
          const ability = await this.client.getAbilityByName(name);
          return [name, abilityShortEffectForLocales(ability, ['es', 'en'])] as const;
        } catch {
          return [name, null] as const;
        }
      }),
    );
    return new Map(pairs);
  }

  async getByName(rawName: string): Promise<PokemonSummary> {
    const key = normalizePokemonNameQuery(rawName);
    if (!key) {
      throw new PokemonNotFoundError(rawName);
    }

    const storageKey = STORAGE_PREFIX + key;
    try {
      const cached = await AsyncStorage.getItem(storageKey);
      if (cached) {
        return JSON.parse(cached) as PokemonSummary;
      }
    } catch {
      // ignore corrupt cache
    }

    try {
      const pokemon = await this.resolvePokemon(key);
      const species = await this.client.getPokemonSpeciesByName(pokemon.species.name);
      const { defaultFormSlug, megaForms } = megaFormOptionsFromSpecies(species);
      const effectByName = await this.abilityShortEffectsByName(pokemon);
      const base = mapPokemonToSummary(pokemon, {
        speciesDefaultFormSlug: defaultFormSlug,
        megaForms,
      });
      const summary: PokemonSummary = {
        ...base,
        abilities: base.abilities.map((a) => ({
          ...a,
          shortEffect: effectByName.get(a.name) ?? null,
        })),
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
