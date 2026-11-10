/** Holds every game the dashboard lists, looked up by game id (PL-05). */
export class BrowserGameRegistry<Game extends { readonly id: string }> {
  private readonly gamesById = new Map<string, Game>();

  register(game: Game): void {
    if (this.gamesById.has(game.id)) {
      throw new Error(`A game with id '${game.id}' is already registered`);
    }
    this.gamesById.set(game.id, game);
  }

  /** Returns null for an unknown id, since the id comes from the page URL. */
  findGame(gameId: string): Game | null {
    return this.gamesById.get(gameId) ?? null;
  }

  listGames(): readonly Game[] {
    return [...this.gamesById.values()];
  }
}
