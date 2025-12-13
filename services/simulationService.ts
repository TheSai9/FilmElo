
import { Movie } from '../types';
import { calculateNewRatings } from './eloCalculator';

export interface SimulationStep {
  round: number;
  movies: Movie[]; // Snapshot of movies at this step
}

/**
 * Runs a single round of "Swiss System" pairings.
 * Sorts movies by Elo, pairs adjacent neighbors, simulates match based on probability.
 */
export const runSimulationRound = (currentMovies: Movie[]): Movie[] => {
  // 1. Deep clone to avoid mutating state directly in the loop
  let movies = currentMovies.map(m => ({ ...m, history: [...m.history] }));
  
  // 2. Sort by Elo (High to Low) to find closest matchups
  // Randomize slightly to avoid deterministic loops where same movies fight forever
  movies.sort((a, b) => (b.elo - a.elo) + (Math.random() * 10 - 5));

  const nextMoviesMap = new Map<string, Movie>();
  movies.forEach(m => nextMoviesMap.set(m.id, m));

  const paired = new Set<string>();

  for (let i = 0; i < movies.length - 1; i++) {
    const m1 = movies[i];
    if (paired.has(m1.id)) continue;

    const m2 = movies[i + 1];
    if (paired.has(m2.id)) continue;

    // Found a pair
    paired.add(m1.id);
    paired.add(m2.id);

    // 3. Calculate Win Probability
    // Expected score formula: 1 / (1 + 10^((Rb - Ra) / 400))
    const probM1Wins = 1 / (1 + Math.pow(10, (m2.elo - m1.elo) / 400));
    
    // 4. Roll the die
    // Add a slight "Upset Factor" - occasionally the underdog wins more than stats suggest? 
    // No, let's keep it pure math for accurate projection.
    const m1IsWinner = Math.random() < probM1Wins;

    const winner = m1IsWinner ? m1 : m2;
    const loser = m1IsWinner ? m2 : m1;

    // 5. Calculate new Elos
    // We increase match counts to simulate "confidence" growing
    const [newWinnerElo, newLoserElo] = calculateNewRatings(
      winner.elo,
      winner.matches,
      loser.elo,
      loser.matches
    );

    // 6. Update objects
    // Note: We don't add full history records here to save memory during mass simulation,
    // just stats needed for ranking.
    const updatedWinner: Movie = {
        ...winner,
        elo: newWinnerElo,
        matches: winner.matches + 1,
        wins: winner.wins + 1,
    };

    const updatedLoser: Movie = {
        ...loser,
        elo: newLoserElo,
        matches: loser.matches + 1,
        losses: loser.losses + 1
    };

    nextMoviesMap.set(updatedWinner.id, updatedWinner);
    nextMoviesMap.set(updatedLoser.id, updatedLoser);
  }

  return Array.from(nextMoviesMap.values());
};
