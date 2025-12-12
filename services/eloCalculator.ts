
import { Movie, MatchRecord } from '../types';

// Dynamic K-Factors configuration
const K_PLACEMENT = 80;    // 0-5 matches: High volatility to find rank fast
const K_CALIBRATION = 40;  // 6-15 matches: Medium volatility
const K_ESTABLISHED = 20;  // 16+ matches: High stability

/**
 * Determines the K-Factor based on how many matches a movie has played.
 * New movies move fast (Placement), established movies are stable.
 */
const getKFactor = (matches: number): number => {
  if (matches < 5) return K_PLACEMENT;
  if (matches < 15) return K_CALIBRATION;
  return K_ESTABLISHED;
};

/**
 * Calculates the expected score for player A against player B
 */
const getExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

/**
 * Updates ratings for a winner and a loser using asymmetric K-Factors.
 * Returns the new ratings [winnerNewElo, loserNewElo]
 */
export const calculateNewRatings = (
  winnerElo: number, 
  winnerMatches: number, 
  loserElo: number, 
  loserMatches: number
): [number, number] => {
  const expectedWinner = getExpectedScore(winnerElo, loserElo);
  const expectedLoser = getExpectedScore(loserElo, winnerElo);

  // Get dynamic K-Factors for each participant
  const winnerK = getKFactor(winnerMatches);
  const loserK = getKFactor(loserMatches);

  // Apply updates independently
  // If a new movie beats an established one:
  // - New movie gains A LOT (High K)
  // - Established movie loses A LITTLE (Low K)
  const newWinnerElo = winnerElo + winnerK * (1 - expectedWinner);
  const newLoserElo = loserElo + loserK * (0 - expectedLoser);

  return [Math.round(newWinnerElo), Math.round(newLoserElo)];
};

/**
 * Helper to update movie objects immutable style
 */
export const updateMovieStats = (winner: Movie, loser: Movie): { winner: Movie; loser: Movie } => {
  const [newWinnerElo, newLoserElo] = calculateNewRatings(
    winner.elo, 
    winner.matches, 
    loser.elo, 
    loser.matches
  );
  
  const timestamp = Date.now();

  const winnerDiff = newWinnerElo - winner.elo;
  const loserDiff = newLoserElo - loser.elo;

  const winnerRecord: MatchRecord = {
    timestamp,
    opponentId: loser.id,
    opponentName: loser.name,
    result: 'WIN',
    eloChange: winnerDiff,
    newElo: newWinnerElo,
    opponentElo: loser.elo
  };

  const loserRecord: MatchRecord = {
    timestamp,
    opponentId: winner.id,
    opponentName: winner.name,
    result: 'LOSS',
    eloChange: loserDiff,
    newElo: newLoserElo,
    opponentElo: winner.elo
  };

  const updatedWinner: Movie = {
    ...winner,
    elo: newWinnerElo,
    matches: winner.matches + 1,
    wins: winner.wins + 1,
    history: [...(winner.history || []), winnerRecord]
  };

  const updatedLoser: Movie = {
    ...loser,
    elo: newLoserElo,
    matches: loser.matches + 1,
    losses: loser.losses + 1,
    history: [...(loser.history || []), loserRecord]
  };

  return { winner: updatedWinner, loser: updatedLoser };
};
