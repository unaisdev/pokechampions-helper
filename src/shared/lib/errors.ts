export class PokemonNotFoundError extends Error {
  readonly code = 'POKEMON_NOT_FOUND' as const;
  constructor(name: string) {
    super(`Pokémon not found: ${name}`);
    this.name = 'PokemonNotFoundError';
  }
}

export class PokemonNetworkError extends Error {
  readonly code = 'POKEMON_NETWORK' as const;
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PokemonNetworkError';
  }
}
