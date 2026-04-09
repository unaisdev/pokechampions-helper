import type { PokemonSpecies } from 'pokenode-ts';

import type { PokemonMegaFormOption } from '@src/entities/pokemon-summary';

function formatMegaLabel(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * PokéAPI lists megas as separate `/pokemon/{slug}` varieties on the species resource.
 */
export function megaFormOptionsFromSpecies(species: PokemonSpecies): {
  defaultFormSlug: string;
  megaForms: PokemonMegaFormOption[];
} {
  const varieties = species.varieties ?? [];
  const defaultEntry = varieties.find((v) => v.is_default);
  const defaultFormSlug = defaultEntry?.pokemon.name ?? species.name;

  const megaForms: PokemonMegaFormOption[] = [];
  for (const v of varieties) {
    const slug = v.pokemon.name;
    if (!slug.includes('-mega')) {
      continue;
    }
    megaForms.push({
      slug,
      label: formatMegaLabel(slug),
    });
  }

  return { defaultFormSlug, megaForms };
}
