
import { K_FACTOR } from '../constants';
import { Movie, MatchRecord } from '../types';

/**
 * Calculates the expected score for player A against player B
 */
const getExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

/**
 * Updates ratings for a winner and a loser
 * Returns the new ratings [winnerNewElo, loserNewElo]
 */
export const calculateNewRatings = (winnerElo: number, loserElo: number): [number, number] => {
  const expectedWinner = getExpectedScore(winnerElo, loserElo);
  const expectedLoser = getExpectedScore(loserElo, winnerElo);

  const newWinnerElo = winnerElo + K_FACTOR * (1 - expectedWinner);
  const newLoserElo = loserElo + K_FACTOR * (0 - expectedLoser);

  return [Math.round(newWinnerElo), Math.round(newLoserElo)];
};

/**
 * Helper to update movie objects immutable style
 */
export const updateMovieStats = (winner: Movie, loser: Movie): { winner: Movie; loser: Movie } => {
  const [newWinnerElo, newLoserElo] = calculateNewRatings(winner.elo, loser.elo);
  const timestamp = Date.now();

  const winnerDiff = newWinnerElo - winner.elo;
  const loserDiff = newLoserElo - loser.elo;

  const winnerRecord: MatchRecord = {
    timestamp,
    opponentId: loser.id,
    opponentName: loser.name,
    result: 'WIN',
    eloChange: winnerDiff,
    newElo: newWinnerElo
  };

  const loserRecord: MatchRecord = {
    timestamp,
    opponentId: winner.id,
    opponentName: winner.name,
    result: 'LOSS',
    eloChange: loserDiff,
    newElo: newLoserElo
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
