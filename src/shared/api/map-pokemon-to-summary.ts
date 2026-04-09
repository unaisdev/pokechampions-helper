import type { Pokemon } from 'pokenode-ts';

import type { PokemonMegaFormOption, PokemonSummary } from '@src/entities/pokemon-summary';
import { parseTypeIdFromPokeApiUrl, pokeApiTypeIconUrl } from '@src/shared/lib/type-sprites';

export type PokemonSummarySpeciesMeta = {
  speciesDefaultFormSlug: string;
  megaForms: PokemonMegaFormOption[];
};

export function mapPokemonToSummary(
  pokemon: Pokemon,
  speciesMeta: PokemonSummarySpeciesMeta,
): PokemonSummary {
  const types = [...pokemon.types]
    .sort((a, b) => a.slot - b.slot)
    .map((t) => {
      const id = parseTypeIdFromPokeApiUrl(t.type.url);
      return {
        name: t.type.name,
        iconUrl: id != null ? pokeApiTypeIconUrl(id) : null,
      };
    });

  const stats = pokemon.stats.map((s) => ({
    name: s.stat.name,
    baseStat: s.base_stat,
  }));

  const abilities = [...pokemon.abilities]
    .sort((a, b) => a.slot - b.slot)
    .map((a) => ({
      name: a.ability.name,
      isHidden: a.is_hidden,
      slot: a.slot,
      shortEffect: null as string | null,
    }));

  return {
    id: pokemon.id,
    name: pokemon.name,
    spriteUrl:
      pokemon.sprites.front_default ??
      pokemon.sprites.other?.['official-artwork']?.front_default ??
      null,
    types,
    stats,
    abilities,
    baseExperience: pokemon.base_experience,
    heightDm: pokemon.height,
    weightHg: pokemon.weight,
    speciesDefaultFormSlug: speciesMeta.speciesDefaultFormSlug,
    megaForms: speciesMeta.megaForms,
  };
}
