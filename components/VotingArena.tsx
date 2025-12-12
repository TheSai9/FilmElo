import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie, AIAnalysis } from '../types';
import { updateMovieStats } from '../services/eloCalculator';
import { getMovieComparisonVibe } from '../services/geminiService';
import { fetchMoviePoster } from '../services/tmdbService';
import MovieCard from './MovieCard';
import Button from './Button';
import { Sparkles, Shuffle, BarChart2, Undo2, Keyboard, TrendingUp, TrendingDown } from 'lucide-react';

interface VotingArenaProps {
  movies: Movie[];
  // Updated type to allow functional state updates for background processing
  onUpdateMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
  onFinish: () => void;
}

const QUEUE_SIZE = 5;

// Animation States
type VoteResult = {
  winnerId: string;
  loserId: string;
  winnerDiff: number;
  loserDiff: number;
};

const VotingArena: React.FC<VotingArenaProps> = ({ movies, onUpdateMovies, onFinish }) => {
  const [currentPair, setCurrentPair] = useState<[number, number] | null>(null);
  const [matchupQueue, setMatchupQueue] = useState<[number, number][]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Animation State
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  
  // Undo History: Stores snapshots of the movie list before changes
  const [history, setHistory] = useState<Movie[][]>([]);
  
  // Track fetching IDs to prevent duplicate requests in the background
  const fetchingIds = useRef<Set<string>>(new Set());

  // --- Matchup Generation Logic ---

  const generatePair = useCallback((currentMovies: Movie[]): [number, number] => {
    if (currentMovies.length < 2) return [0, 0];
    
    let idx1 = Math.floor(Math.random() * currentMovies.length);
    let idx2 = Math.floor(Math.random() * currentMovies.length);
    
    // 60% chance smart pairing (match similar Elos)
    const useSmartPairing = Math.random() > 0.6;
    
    if (useSmartPairing) {
        const targetElo = currentMovies[idx1].elo;
        // Optimization: Sample a subset instead of sorting entire array for performance
        const candidates: {idx: number, diff: number}[] = [];
        const attempts = Math.min(currentMovies.length - 1, 20); // Try 20 random candidates
        
        for (let i = 0; i < attempts; i++) {
           const r = Math.floor(Math.random() * currentMovies.length);
           if (r !== idx1) {
              candidates.push({ idx: r, diff: Math.abs(currentMovies[r].elo - targetElo) });
           }
        }
        
        candidates.sort((a, b) => a.diff - b.diff);
        if (candidates.length > 0) {
            // Pick from the top 3 closest matches to keep it slightly varied
            const pool = candidates.slice(0, 3);
            idx2 = pool[Math.floor(Math.random() * pool.length)].idx;
        }
    }

    // Fallback: Ensure not same
    let safety = 0;
    while (idx1 === idx2 && safety < 100) {
      idx2 = Math.floor(Math.random() * currentMovies.length);
      safety++;
    }

    return [idx1, idx2];
  }, []);

  // --- Queue Management ---

  // Effect: Maintain Queue Depth
  useEffect(() => {
    if (movies.length < 2) return;

    setMatchupQueue(prevQueue => {
      if (prevQueue.length >= QUEUE_SIZE) return prevQueue;

      const newQueue = [...prevQueue];
      // Generate enough pairs to fill the buffer
      while (newQueue.length < QUEUE_SIZE) {
        newQueue.push(generatePair(movies));
      }
      return newQueue;
    });
  }, [movies, generatePair]); 

  // Effect: Initialize First Pair if empty
  useEffect(() => {
    if (!currentPair && matchupQueue.length > 0) {
      const next = matchupQueue[0];
      setCurrentPair(next);
      setMatchupQueue(q => q.slice(1));
    } else if (!currentPair && movies.length >= 2) {
      // Immediate fallback if queue isn't ready
      setCurrentPair(generatePair(movies));
    }
  }, [matchupQueue, currentPair, movies, generatePair]);

  // --- Background Image Pre-loading ---

  useEffect(() => {
    // Collect all unique movie indices from the queue + current pair
    const indicesToLoad = new Set<number>();
    if (currentPair) {
      indicesToLoad.add(currentPair[0]);
      indicesToLoad.add(currentPair[1]);
    }
    matchupQueue.forEach(pair => {
      indicesToLoad.add(pair[0]);
      indicesToLoad.add(pair[1]);
    });

    indicesToLoad.forEach(idx => {
      const movie = movies[idx];
      if (!movie) return;

      // Check if we need to load: No poster path AND not currently fetching
      if (!movie.posterPath && !fetchingIds.current.has(movie.id)) {
        fetchingIds.current.add(movie.id);

        // Fetch in background
        fetchMoviePoster(movie.name, movie.year).then((path) => {
          if (path) {
            // Functional state update to ensure we don't clobber other updates
            onUpdateMovies((prevMovies) => {
              const newMovies = [...prevMovies];
              // Find index by ID in case array order changed (unlikely but safe)
              const targetIndex = newMovies.findIndex(m => m.id === movie.id);
              if (targetIndex !== -1) {
                newMovies[targetIndex] = { ...newMovies[targetIndex], posterPath: path };
              }
              return newMovies;
            });
          }
        }).finally(() => {
          fetchingIds.current.delete(movie.id);
        });
      }
    });
  }, [matchupQueue, currentPair, movies, onUpdateMovies]);


  // --- Event Handlers ---

  const advanceQueue = useCallback(() => {
    if (matchupQueue.length > 0) {
      const next = matchupQueue[0];
      setCurrentPair(next);
      setMatchupQueue(prev => prev.slice(1));
      setAiAnalysis(null);
      setVoteResult(null); // Clear animation state
    } else {
      // Emergency generation if queue empty
      setCurrentPair(generatePair(movies));
      setAiAnalysis(null);
      setVoteResult(null);
    }
  }, [matchupQueue, movies, generatePair]);

  const handleVote = useCallback((winnerIndex: number, loserIndex: number) => {
    if (voteResult) return; // Prevent double clicks during animation

    // Save history
    setHistory(prev => [...prev.slice(-10), [...movies]]);

    const winner = movies[winnerIndex];
    const loser = movies[loserIndex];
    const { winner: newWinner, loser: newLoser } = updateMovieStats(winner, loser);
    
    // 1. Trigger Animation
    const winnerDiff = newWinner.elo - winner.elo;
    const loserDiff = newLoser.elo - loser.elo;
    
    setVoteResult({
      winnerId: winner.id,
      loserId: loser.id,
      winnerDiff,
      loserDiff
    });

    // 2. Delayed State Update (wait for animation)
    setTimeout(() => {
        onUpdateMovies(prevMovies => {
          const newMovies = [...prevMovies];
          newMovies[winnerIndex] = newWinner;
          newMovies[loserIndex] = newLoser;
          return newMovies;
        });
        
        advanceQueue();
    }, 800); // 800ms animation duration

  }, [movies, onUpdateMovies, advanceQueue, voteResult]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    onUpdateMovies(previousState);
    advanceQueue(); 
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
      if (!currentPair || voteResult) return; // Disable keys during animation
      
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
          advanceQueue();
          break;
        case 'Backspace':
          if (history.length > 0) handleUndo();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPair, handleVote, advanceQueue, history, voteResult]);

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
                <Button onClick={handleUndo} variant="outline" title="Undo Last Vote (Backspace)" disabled={!!voteResult}>
                    <Undo2 size={20} />
                </Button>
            )}
           <Button onClick={advanceQueue} variant="outline" title="Skip Pair (Space)" disabled={!!voteResult}>
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
        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none hidden md:flex transition-opacity duration-300 ${voteResult ? 'opacity-0' : 'opacity-100'}`}>
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
            <div className="relative">
                {voteResult?.winnerId === m1.id && (
                     <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-green-500/10 backdrop-blur-[2px] border-4 border-green-500 animate-slide-up">
                         <div className="text-center">
                            <span className="text-6xl font-black text-green-600 drop-shadow-md">WIN</span>
                            <div className="flex items-center justify-center text-green-700 font-bold text-3xl mt-2 bg-white px-4 py-1 border-2 border-green-700 shadow-hard-sm">
                                <TrendingUp size={24} className="mr-2"/> +{Math.round(voteResult.winnerDiff)}
                            </div>
                         </div>
                     </div>
                )}
                {voteResult?.loserId === m1.id && (
                     <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-red-500/10 backdrop-blur-[2px] border-4 border-red-500 animate-slide-up">
                        <div className="text-center">
                            <div className="flex items-center justify-center text-red-700 font-bold text-3xl mt-2 bg-white px-4 py-1 border-2 border-red-700 shadow-hard-sm">
                                <TrendingDown size={24} className="mr-2"/> {Math.round(voteResult.loserDiff)}
                            </div>
                        </div>
                     </div>
                )}
                <MovieCard 
                  movie={m1} 
                  onClick={() => handleVote(currentPair[0], currentPair[1])} 
                  aiData={aiAnalysis?.movie1}
                />
            </div>
            
            {/* Mobile VS Badge */}
            <div className="md:hidden flex justify-center -my-4 z-10">
               <div className="bg-bauhaus-yellow text-bauhaus-black font-black text-xl w-14 h-14 flex items-center justify-center border-4 border-bauhaus-black shadow-hard-sm">VS</div>
            </div>

            <div className="relative">
                {voteResult?.winnerId === m2.id && (
                     <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-green-500/10 backdrop-blur-[2px] border-4 border-green-500 animate-slide-up">
                         <div className="text-center">
                            <span className="text-6xl font-black text-green-600 drop-shadow-md">WIN</span>
                            <div className="flex items-center justify-center text-green-700 font-bold text-3xl mt-2 bg-white px-4 py-1 border-2 border-green-700 shadow-hard-sm">
                                <TrendingUp size={24} className="mr-2"/> +{Math.round(voteResult.winnerDiff)}
                            </div>
                         </div>
                     </div>
                )}
                {voteResult?.loserId === m2.id && (
                     <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-red-500/10 backdrop-blur-[2px] border-4 border-red-500 animate-slide-up">
                         <div className="text-center">
                            <div className="flex items-center justify-center text-red-700 font-bold text-3xl mt-2 bg-white px-4 py-1 border-2 border-red-700 shadow-hard-sm">
                                <TrendingDown size={24} className="mr-2"/> {Math.round(voteResult.loserDiff)}
                            </div>
                         </div>
                     </div>
                )}
                <MovieCard 
                  movie={m2} 
                  onClick={() => handleVote(currentPair[1], currentPair[0])} 
                  aiData={aiAnalysis?.movie2}
                />
            </div>
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
            disabled={loadingAi || !!voteResult}
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