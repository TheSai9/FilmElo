
import React, { useMemo } from 'react';
import { Movie, MatchRecord } from '../types';
import { X, Trophy, TrendingUp, TrendingDown, Minus, Calendar, AlertCircle } from 'lucide-react';
import { INITIAL_ELO } from '../constants';

interface MovieDetailModalProps {
  movie: Movie;
  onClose: () => void;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie, onClose }) => {
  
  // Create Graph Points
  const graphPoints = useMemo(() => {
    // Start with initial state
    const points = [{ index: 0, elo: INITIAL_ELO }]; 
    
    // If we have history, reconstruct the timeline
    // Note: If 'history' is undefined (old data), we can't show much
    if (movie.history && movie.history.length > 0) {
       // We need to sort by timestamp just in case
       const sortedHistory = [...movie.history].sort((a, b) => a.timestamp - b.timestamp);
       
       // Calculate running total or use stored newElo
       sortedHistory.forEach((match, idx) => {
         points.push({ index: idx + 1, elo: match.newElo });
       });
    } else if (movie.matches > 0 && (!movie.history || movie.history.length === 0)) {
       // Fallback for old data: just show start and end
       points.push({ index: movie.matches, elo: movie.elo });
    }

    return points;
  }, [movie]);

  // Generate SVG Path
  const svgPath = useMemo(() => {
    if (graphPoints.length < 2) return "";
    
    const width = 100; // viewBox units
    const height = 50;
    
    const minElo = Math.min(...graphPoints.map(p => p.elo)) - 50;
    const maxElo = Math.max(...graphPoints.map(p => p.elo)) + 50;
    const eloRange = maxElo - minElo || 100; // avoid divide by zero

    return graphPoints.map((p, i) => {
      const x = (i / (graphPoints.length - 1)) * width;
      const y = height - ((p.elo - minElo) / eloRange) * height;
      return `${x},${y}`;
    }).join(" ");
  }, [graphPoints]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bauhaus-black/60 backdrop-blur-sm animate-fade-in">
       
       <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border-4 border-bauhaus-black shadow-hard-xl relative flex flex-col">
          
          {/* Header */}
          <div className="sticky top-0 bg-bauhaus-blue text-white p-6 border-b-4 border-bauhaus-black flex justify-between items-start z-10">
             <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">{movie.name}</h2>
                <div className="flex gap-3">
                   <span className="bg-bauhaus-black px-2 py-0.5 text-xs font-bold font-mono">{movie.year}</span>
                   {movie.rating && (
                     <span className="bg-bauhaus-yellow text-bauhaus-black px-2 py-0.5 text-xs font-bold flex items-center gap-1">
                        ★ {movie.rating}
                     </span>
                   )}
                </div>
             </div>
             <button onClick={onClose} className="p-1 hover:bg-white hover:text-bauhaus-blue transition-colors">
                <X size={24} strokeWidth={3} />
             </button>
          </div>

          <div className="p-6">
             
             {/* Stats Grid */}
             <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-3 bg-gray-50 border-2 border-bauhaus-black">
                   <div className="text-xs font-bold uppercase text-gray-400">Current Elo</div>
                   <div className="text-2xl font-black text-bauhaus-blue">{Math.round(movie.elo)}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 border-2 border-bauhaus-black">
                   <div className="text-xs font-bold uppercase text-gray-400">Win Rate</div>
                   <div className="text-2xl font-black text-bauhaus-black">
                      {movie.matches > 0 ? Math.round((movie.wins / movie.matches) * 100) : 0}%
                   </div>
                </div>
                <div className="text-center p-3 bg-gray-50 border-2 border-bauhaus-black">
                   <div className="text-xs font-bold uppercase text-gray-400">Matches</div>
                   <div className="text-2xl font-black text-bauhaus-black">{movie.matches}</div>
                </div>
             </div>

             {/* Graph Area */}
             <div className="mb-8 border-4 border-bauhaus-black p-4 bg-white relative">
                <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2">
                   <TrendingUp size={16} /> Rating Trajectory
                </h3>
                
                {graphPoints.length > 1 ? (
                   <div className="w-full h-40 bg-gray-50 border border-gray-200 relative overflow-hidden">
                       <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full block">
                           {/* Grid Lines */}
                           <line x1="0" y1="12.5" x2="100" y2="12.5" stroke="#e5e7eb" strokeWidth="0.5" />
                           <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
                           <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="#e5e7eb" strokeWidth="0.5" />
                           
                           {/* The Data Line */}
                           <polyline 
                             fill="none" 
                             stroke="#D02020" 
                             strokeWidth="1.5" 
                             points={svgPath} 
                             vectorEffect="non-scaling-stroke"
                           />
                       </svg>
                       {/* Overlay info */}
                       <div className="absolute top-1 right-1 text-[10px] font-mono bg-white/80 px-1">Max: {Math.max(...graphPoints.map(p => p.elo)).toFixed(0)}</div>
                       <div className="absolute bottom-1 right-1 text-[10px] font-mono bg-white/80 px-1">Min: {Math.min(...graphPoints.map(p => p.elo)).toFixed(0)}</div>
                   </div>
                ) : (
                   <div className="w-full h-40 bg-gray-50 flex items-center justify-center text-gray-400 text-sm font-bold uppercase">
                      Not enough data
                   </div>
                )}
             </div>

             {/* Match History */}
             <div>
                <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2">
                   <Calendar size={16} /> Battle Log
                </h3>
                
                <div className="border-2 border-bauhaus-black max-h-60 overflow-y-auto">
                    {movie.history && movie.history.length > 0 ? (
                       <table className="w-full text-sm text-left">
                          <thead className="bg-bauhaus-black text-white text-xs uppercase sticky top-0">
                             <tr>
                                <th className="p-2">Result</th>
                                <th className="p-2">Opponent</th>
                                <th className="p-2 text-right">Change</th>
                             </tr>
                          </thead>
                          <tbody>
                             {[...movie.history].reverse().map((match, idx) => (
                                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                   <td className="p-2">
                                      {match.result === 'WIN' ? (
                                        <span className="text-green-600 font-black text-xs border border-green-600 px-1">WIN</span>
                                      ) : (
                                        <span className="text-red-600 font-black text-xs border border-red-600 px-1">LOSS</span>
                                      )}
                                   </td>
                                   <td className="p-2 font-bold truncate max-w-[150px]">{match.opponentName}</td>
                                   <td className={`p-2 text-right font-mono font-bold ${match.eloChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {match.eloChange > 0 ? '+' : ''}{Math.round(match.eloChange)}
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    ) : (
                       <div className="p-8 text-center text-gray-400 font-medium">
                          <AlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                          No detailed history available for this film.
                       </div>
                    )}
                </div>
             </div>

          </div>
       </div>
    </div>
  );
};

export default MovieDetailModal;
