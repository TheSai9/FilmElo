import React, { useState, useEffect, useCallback } from 'react';
import { Movie, AIAnalysis } from '../types';
import { updateMovieStats } from '../services/eloCalculator';
import { getMovieComparisonVibe } from '../services/geminiService';
import MovieCard from './MovieCard';
import Button from './Button';
import { Sparkles, Shuffle, BarChart2 } from 'lucide-react';

interface VotingArenaProps {
  movies: Movie[];
  onUpdateMovies: (movies: Movie[]) => void;
  onFinish: () => void;
}

const VotingArena: React.FC<VotingArenaProps> = ({ movies, onUpdateMovies, onFinish }) => {
  const [currentPair, setCurrentPair] = useState<[number, number] | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [history, setHistory] = useState<number[]>([]); // Track voted pairs to avoid immediate repeats? Or just simplistic random.

  const pickNewPair = useCallback(() => {
    if (movies.length < 2) return;

    // Smart pairing: occasionally pick movies with similar Elo to refine rankings
    // Or pure random for variety. Let's do a mix.
    // 70% chance of random, 30% chance of "close match"
    
    let idx1 = Math.floor(Math.random() * movies.length);
    let idx2 = Math.floor(Math.random() * movies.length);

    const useSmartPairing = Math.random() > 0.7;

    if (useSmartPairing) {
        // Find someone close in ELO to idx1
        const targetElo = movies[idx1].elo;
        // Filter candidates within 100 ELO points
        const candidates = movies.map((m, i) => ({ idx: i, diff: Math.abs(m.elo - targetElo) }))
                                 .filter(c => c.idx !== idx1 && c.diff < 200)
                                 .sort((a, b) => a.diff - b.diff);
        
        if (candidates.length > 0) {
            // Pick a random one from top 5 closest
            const poolSize = Math.min(candidates.length, 5);
            idx2 = candidates[Math.floor(Math.random() * poolSize)].idx;
        }
    }

    // Fallback: ensure they aren't same
    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * movies.length);
    }

    setCurrentPair([idx1, idx2]);
    setAiAnalysis(null); // Reset AI data
  }, [movies]);

  useEffect(() => {
    if (!currentPair) pickNewPair();
  }, [pickNewPair, currentPair]);

  const handleVote = (winnerIndex: number, loserIndex: number) => {
    const winner = movies[winnerIndex];
    const loser = movies[loserIndex];

    const { winner: newWinner, loser: newLoser } = updateMovieStats(winner, loser);

    const newMovies = [...movies];
    newMovies[winnerIndex] = newWinner;
    newMovies[loserIndex] = newLoser;

    onUpdateMovies(newMovies);
    pickNewPair();
  };

  const fetchAiInsight = async () => {
    if (!currentPair) return;
    setLoadingAi(true);
    const m1 = movies[currentPair[0]];
    const m2 = movies[currentPair[1]];
    
    const analysis = await getMovieComparisonVibe(m1.name, m1.year, m2.name, m2.year);
    if (analysis) {
      setAiAnalysis(analysis);
    }
    setLoadingAi(false);
  };

  if (!currentPair) return <div className="text-center p-20">Loading movies...</div>;

  const m1 = movies[currentPair[0]];
  const m2 = movies[currentPair[1]];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-6xl mx-auto px-4">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-6 py-4 border-b border-white/5">
        <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
          Face Off <span className="text-lb-green ml-2 text-sm font-sans font-normal uppercase tracking-widest">Vote for the better film</span>
        </h2>
        <div className="flex gap-3">
           <Button onClick={pickNewPair} variant="ghost" title="Skip this pair">
             <Shuffle size={20} />
           </Button>
           <Button onClick={onFinish} variant="secondary" className="flex items-center gap-2">
             <BarChart2 size={18} /> View Rankings
           </Button>
        </div>
      </div>

      {/* Arena */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
        
        {/* VS Badge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="bg-lb-orange text-white font-black text-xl rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-4 border-lb-dark">
            VS
          </div>
        </div>

        <MovieCard 
          movie={m1} 
          onClick={() => handleVote(currentPair[0], currentPair[1])} 
          aiData={aiAnalysis?.movie1}
        />
        <MovieCard 
          movie={m2} 
          onClick={() => handleVote(currentPair[1], currentPair[0])} 
          aiData={aiAnalysis?.movie2}
        />
      </div>

      {/* AI Controls */}
      <div className="mt-8 mb-4 flex flex-col items-center justify-center min-h-[100px]">
        {aiAnalysis ? (
           <div className="max-w-2xl text-center bg-white/5 p-4 rounded-lg border border-white/10 animate-fade-in-up">
             <p className="text-lb-text text-sm mb-2 uppercase tracking-widest font-bold">AI Comparison</p>
             <p className="text-lg font-serif italic text-white">"{aiAnalysis.comparison}"</p>
           </div>
        ) : (
          <Button 
            onClick={fetchAiInsight} 
            disabled={loadingAi}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none text-white shadow-lg shadow-purple-900/20"
          >
            {loadingAi ? (
              <span className="animate-pulse">Consulting the oracle...</span>
            ) : (
              <>
                <Sparkles size={18} /> tough choice? Ask AI
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default VotingArena;
