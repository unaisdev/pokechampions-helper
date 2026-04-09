import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import type { PokemonClient } from 'pokenode-ts';

import type { PokemonSummary } from '@src/entities/pokemon-summary';
import { PokemonNetworkError, PokemonNotFoundError } from '@src/shared/lib/errors';
import { normalizePokemonNameQuery } from '@src/shared/lib/pokemon-name';

import { mapPokemonToSummary } from './map-pokemon-to-summary';
import type { PokemonRepository } from './pokemon-repository';

const STORAGE_PREFIX = '@pc/pokemon_cache/v2/';

export class PokemonRepositoryPokenode implements PokemonRepository {
  constructor(private readonly client: PokemonClient) {}

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
      const pokemon = await this.client.getPokemonByName(key);
      const summary = mapPokemonToSummary(pokemon);
      await AsyncStorage.setItem(storageKey, JSON.stringify(summary));
      return summary;
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 404) {
        throw new PokemonNotFoundError(key);
      }
      throw new PokemonNetworkError('Could not reach PokéAPI.', e);
    }
  }
}
