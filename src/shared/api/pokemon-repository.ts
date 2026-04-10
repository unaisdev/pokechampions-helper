import type { PokemonMoveLearnable, PokemonSummary } from '@src/entities/pokemon-summary';

export type PokeApiFetchOptions = {
  /** PokéAPI `language.name` for `names` / `effect_entries` (e.g. `es`, `en`). */
  pokeApiLanguage?: string;
};

export type MoveLearnablesFetchOptions = PokeApiFetchOptions & {
  /** Deduped total; first call `(0, total)`, then `(loaded, total)` after each batch. */
  onProgress?: (loaded: number, total: number) => void;
};

export type PokemonAbilityDetail = {
  displayName: string;
  shortEffect: string | null;
};

export type PokemonRepository = {
  getByName(rawName: string, options?: PokeApiFetchOptions): Promise<PokemonSummary>;
  /**
   * Full move row from PokéAPI `/move/{name}` (cached in-memory). Safe for repeated calls.
   */
  getMoveLearnableByName(
    rawMoveName: string,
    options?: PokeApiFetchOptions,
  ): Promise<PokemonMoveLearnable>;
  /**
   * Batch-resolve `/move/{name}` for many slugs (deduped, sorted; chunked to limit parallel calls).
   */
  getMoveLearnablesForSlugs(
    moveSlugs: string[],
    options?: MoveLearnablesFetchOptions,
  ): Promise<PokemonMoveLearnable[]>;
  /**
   * Localized ability label + short effect (PokéAPI `/ability/{name}`).
   */
  getAbilityDetail(
    rawAbilityName: string,
    options?: PokeApiFetchOptions,
  ): Promise<PokemonAbilityDetail>;
  /**
   * All `/pokemon/{slug}` forms for the same species as the given query (e.g. palafin → palafin-zero, palafin-hero).
   * Empty array if the species cannot be resolved.
   */
  listFormSlugsForPokemonQuery(rawSlug: string): Promise<string[]>;
};
