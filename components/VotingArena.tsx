
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie, AIAnalysis } from '../types';
import { updateMovieStats } from '../services/eloCalculator';
import { getMovieComparisonVibe } from '../services/geminiService';
import { fetchMoviePoster } from '../services/tmdbService';
import MovieCard from './MovieCard';
import Button from './Button';
import { Sparkles, Shuffle, BarChart2, Undo2, Keyboard } from 'lucide-react';

interface VotingArenaProps {
  movies: Movie[];
  onUpdateMovies: (movies: Movie[]) => void;
  onFinish: () => void;
}

const VotingArena: React.FC<VotingArenaProps> = ({ movies, onUpdateMovies, onFinish }) => {
  const [currentPair, setCurrentPair] = useState<[number, number] | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Undo History: Stores snapshots of the movie list before changes
  const [history, setHistory] = useState<Movie[][]>([]);

  const pickNewPair = useCallback(() => {
    if (movies.length < 2) return;
    
    let idx1 = Math.floor(Math.random() * movies.length);
    let idx2 = Math.floor(Math.random() * movies.length);
    
    const useSmartPairing = Math.random() > 0.6; // 60% chance smart pairing
    if (useSmartPairing) {
        const targetElo = movies[idx1].elo;
        const candidates = movies.map((m, i) => ({ idx: i, diff: Math.abs(m.elo - targetElo) }))
                                 .filter(c => c.idx !== idx1 && c.diff < 200)
                                 .sort((a, b) => a.diff - b.diff);
        if (candidates.length > 0) {
            const poolSize = Math.min(candidates.length, 6);
            idx2 = candidates[Math.floor(Math.random() * poolSize)].idx;
        }
    }

    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * movies.length);
    }
    setCurrentPair([idx1, idx2]);
    setAiAnalysis(null);
  }, [movies]);

  useEffect(() => {
    if (!currentPair) pickNewPair();
  }, [pickNewPair, currentPair]);

  // Lazy Load Posters for Current Pair
  useEffect(() => {
    if (!currentPair) return;

    const loadPosters = async () => {
      const idx1 = currentPair[0];
      const idx2 = currentPair[1];
      const m1 = movies[idx1];
      const m2 = movies[idx2];
      let updated = false;
      const newMovies = [...movies];

      if (!m1.posterPath) {
        const path = await fetchMoviePoster(m1.name, m1.year);
        if (path) {
          newMovies[idx1] = { ...m1, posterPath: path };
          updated = true;
        }
      }

      if (!m2.posterPath) {
        const path = await fetchMoviePoster(m2.name, m2.year);
        if (path) {
          newMovies[idx2] = { ...m2, posterPath: path };
          updated = true;
        }
      }

      if (updated) {
        // We do NOT add to history for purely cosmetic updates like posters
        // to avoid undoing just a poster load.
        onUpdateMovies(newMovies);
      }
    };

    loadPosters();
  }, [currentPair, movies, onUpdateMovies]);

  const handleVote = useCallback((winnerIndex: number, loserIndex: number) => {
    // Save current state to history before modifying
    setHistory(prev => [...prev.slice(-10), [...movies]]); // Keep last 10 states

    const winner = movies[winnerIndex];
    const loser = movies[loserIndex];
    const { winner: newWinner, loser: newLoser } = updateMovieStats(winner, loser);
    
    const newMovies = [...movies];
    newMovies[winnerIndex] = newWinner;
    newMovies[loserIndex] = newLoser;
    
    onUpdateMovies(newMovies);
    pickNewPair();
  }, [movies, onUpdateMovies, pickNewPair]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    onUpdateMovies(previousState);
    pickNewPair(); 
  };

  const fetchAiInsight = async () => {
    if (!currentPair) return;
    setLoadingAi(true);
    const m1 = movies[currentPair[0]];
    const m2 = movies[currentPair[1]];
    const analysis = await getMovieComparisonVibe(m1.name, m1.year, m2.name, m2.year);
    if (analysis) setAiAnalysis(analysis);
    setLoadingAi(false);
  };

  // Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPair) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          handleVote(currentPair[0], currentPair[1]);
          break;
        case 'ArrowRight':
          handleVote(currentPair[1], currentPair[0]);
          break;
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          pickNewPair();
          break;
        case 'Backspace':
          if (history.length > 0) handleUndo();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPair, handleVote, pickNewPair, history]);

  if (!currentPair) return (
    <div className="flex items-center justify-center h-[50vh]">
        <div className="text-2xl font-black uppercase tracking-tighter animate-pulse">Loading Cinema...</div>
    </div>
  );

  const m1 = movies[currentPair[0]];
  const m2 = movies[currentPair[1]];

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] max-w-7xl mx-auto px-4 md:px-8 py-6">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b-4 border-bauhaus-black pb-6 bg-white p-6 shadow-hard-md">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-bauhaus-black">
            Face Off
          </h2>
          <p className="text-bauhaus-blue font-bold uppercase tracking-widest text-sm mt-1">
            Construct Your Canon
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-center">
            {history.length > 0 && (
                <Button onClick={handleUndo} variant="outline" title="Undo Last Vote (Backspace)">
                    <Undo2 size={20} />
                </Button>
            )}
           <Button onClick={pickNewPair} variant="outline" title="Skip Pair (Space)">
             <Shuffle size={20} />
           </Button>
           <Button onClick={onFinish} variant="primary" className="flex items-center gap-2">
             <BarChart2 size={18} /> Rankings
           </Button>
        </div>
      </div>

      {/* Arena Grid */}
      <div className="flex-1 relative">
        {/* VS Badge - Geometric Centerpiece */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none hidden md:flex">
          <div className="bg-bauhaus-yellow text-bauhaus-black font-black text-2xl w-20 h-20 flex items-center justify-center border-4 border-bauhaus-black shadow-hard-md rotate-3">
            VS
          </div>
        </div>

        {/* Keyboard Hints */}
        <div className="absolute top-0 left-0 w-full flex justify-between pointer-events-none px-4 -mt-8 opacity-40 text-xs font-black uppercase tracking-widest hidden md:flex">
             <span>[←] Vote Left</span>
             <span>Vote Right [→]</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-stretch">
            <MovieCard 
              movie={m1} 
              onClick={() => handleVote(currentPair[0], currentPair[1])} 
              aiData={aiAnalysis?.movie1}
            />
            
            {/* Mobile VS Badge */}
            <div className="md:hidden flex justify-center -my-4 z-10">
               <div className="bg-bauhaus-yellow text-bauhaus-black font-black text-xl w-14 h-14 flex items-center justify-center border-4 border-bauhaus-black shadow-hard-sm">VS</div>
            </div>

            <MovieCard 
              movie={m2} 
              onClick={() => handleVote(currentPair[1], currentPair[0])} 
              aiData={aiAnalysis?.movie2}
            />
        </div>
      </div>

      {/* AI Controls & Insight */}
      <div className="mt-12 flex flex-col items-center justify-center min-h-[120px]">
        {aiAnalysis ? (
           <div className="max-w-3xl w-full text-center bg-white border-4 border-bauhaus-black p-8 shadow-hard-lg animate-slide-up relative overflow-hidden">
             {/* Decorative Corner Triangle */}
             <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-bauhaus-red"></div>
             
             <p className="text-bauhaus-blue text-xs font-black uppercase tracking-[0.2em] mb-3">AI Analysis</p>
             <p className="text-xl md:text-2xl font-bold font-sans italic text-bauhaus-black leading-relaxed">
                "{aiAnalysis.comparison}"
             </p>
           </div>
        ) : (
          <Button 
            onClick={fetchAiInsight} 
            disabled={loadingAi}
            variant="yellow"
            className="flex items-center gap-2 px-8 py-4 text-base"
          >
            {loadingAi ? (
              <span className="animate-pulse">Consulting Oracle...</span>
            ) : (
              <>
                <Sparkles size={20} /> Tough Choice? Ask AI
              </>
            )}
          </Button>
        )}
      </div>

        {/* Mobile Keyboard Hint */}
        <div className="md:hidden text-center mt-6 opacity-50">
            <Keyboard size={24} className="mx-auto mb-1" />
            <p className="text-[10px] uppercase font-bold tracking-widest">Desktop supports keyboard controls</p>
        </div>
    </div>
  );
};

export default VotingArena;