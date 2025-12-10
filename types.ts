
export interface Movie {
  id: string;
  name: string;
  year: string;
  rating?: number; // User's original 0.5-5 star rating
  elo: number;
  matches: number;
  wins: number;
  losses: number;
  uri?: string; // Letterboxd URI
  posterPath?: string; // TMDB Poster Path
}

export enum AppView {
  UPLOAD = 'UPLOAD',
  VOTE = 'VOTE',
  LEADERBOARD = 'LEADERBOARD',
}

export interface ComparisonResult {
  winnerId: string;
  loserId: string;
}

export interface AIAnalysis {
  movie1: {
    vibe: string;
    strengths: string[];
  };
  movie2: {
    vibe: string;
    strengths: string[];
  };
  comparison: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error';
