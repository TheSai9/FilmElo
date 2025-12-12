import React, { useMemo } from 'react';
import { Movie, MatchRecord } from '../types';
import { X, Trophy, TrendingUp, TrendingDown, Minus, Calendar, AlertCircle, Activity, Zap, Shield, Target } from 'lucide-react';
import { INITIAL_ELO } from '../constants';

interface MovieDetailModalProps {
  movie: Movie;
  onClose: () => void;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie, onClose }) => {
  
  // --- 1. Graph Data Prep ---
  const graphPoints = useMemo(() => {
    // Start with initial state
    const points = [{ index: 0, elo: INITIAL_ELO }]; 
    
    // If we have history, reconstruct the timeline
    if (movie.history && movie.history.length > 0) {
       // We need to sort by timestamp just in case
       const sortedHistory = [...movie.history].sort((a, b) => a.timestamp - b.timestamp);
       
       sortedHistory.forEach((match, idx) => {
         points.push({ index: idx + 1, elo: match.newElo });
       });
    } else if (movie.matches > 0 && (!movie.history || movie.history.length === 0)) {
       // Fallback for old data: just show start and end
       points.push({ index: movie.matches, elo: movie.elo });
    }

    return points;
  }, [movie]);

  // --- 2. Advanced Stats Calculation ---
  const stats = useMemo(() => {
    const history = movie.history || [];
    
    // Peak / Lowest
    const elos = graphPoints.map(p => p.elo);
    const peakElo = Math.max(...elos);
    const lowestElo = Math.min(...elos);

    // Volatility (Std Dev of Elo changes - last 10 matches)
    // High volatility means the movie is still finding its place (or is controversial)
    const recentChanges = history.slice(-10).map(m => Math.abs(m.eloChange));
    const avgChange = recentChanges.reduce((a, b) => a + b, 0) / (recentChanges.length || 1);
    // Simple volatility Score: 0-100. Average change > 30 is highly volatile.
    const volatilityScore = Math.min(Math.round((avgChange / 32) * 100), 100);

    // Clutch Factor: Win Rate in "Close" games (Elo diff < 50)
    let closeWins = 0;
    let closeMatches = 0;
    
    // Upset Wins: Wins where Opponent Elo > My Elo + 100
    let upsetWins = 0;

    history.forEach(match => {
       // Fallback: If opponentElo missing (old data), estimate it
       let oppElo = match.opponentElo;
       if (oppElo === undefined) {
          // Reverse engineer roughly: Expected = 1 - (eloChange / K)
          // Not perfect but sufficient for older data stats
          const myEloBefore = match.newElo - match.eloChange;
          // Just assume it was close if unknown
          oppElo = myEloBefore; 
       }

       const myEloBefore = match.newElo - match.eloChange;
       const diff = Math.abs(myEloBefore - oppElo);

       if (diff < 50) {
           closeMatches++;
           if (match.result === 'WIN') closeWins++;
       }

       if (match.result === 'WIN' && oppElo > myEloBefore + 80) {
           upsetWins++;
       }
    });

    const clutchFactor = closeMatches > 0 ? Math.round((closeWins / closeMatches) * 100) : 0;
    
    // Confidence (Deviation): Based on match count.
    // 0 matches = 0% confidence. 20 matches = ~90% confidence.
    const confidence = Math.min(Math.round((movie.matches / 20) * 100), 100);

    return {
        peakElo,
        lowestElo,
        volatilityScore,
        clutchFactor,
        upsetWins,
        confidence,
        closeMatches
    };
  }, [movie, graphPoints]);

  // --- 3. SVG Path Generation ---
  const svgPath = useMemo(() => {
    if (graphPoints.length < 2) return "";
    const width = 100; // viewBox units
    const height = 50;
    const minElo = Math.min(...graphPoints.map(p => p.elo)) - 50;
    const maxElo = Math.max(...graphPoints.map(p => p.elo)) + 50;
    const eloRange = maxElo - minElo || 100;
    return graphPoints.map((p, i) => {
      const x = (i / (graphPoints.length - 1)) * width;
      const y = height - ((p.elo - minElo) / eloRange) * height;
      return `${x},${y}`;
    }).join(" ");
  }, [graphPoints]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bauhaus-black/60 backdrop-blur-sm animate-fade-in">
       
       <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto border-4 border-bauhaus-black shadow-hard-xl relative flex flex-col">
          
          {/* Header */}
          <div className="sticky top-0 bg-bauhaus-blue text-white p-6 border-b-4 border-bauhaus-black flex justify-between items-start z-10">
             <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-2">{movie.name}</h2>
                <div className="flex gap-3">
                   <span className="bg-bauhaus-black px-2 py-0.5 text-xs font-bold font-mono">{movie.year}</span>
                   {movie.rating && (
                     <span className="bg-bauhaus-yellow text-bauhaus-black px-2 py-0.5 text-xs font-bold flex items-center gap-1">
                        ★ {movie.rating}
                     </span>
                   )}
                   <span className="bg-white/20 px-2 py-0.5 text-xs font-bold uppercase">
                      Rank Confidence: {stats.confidence}%
                   </span>
                </div>
             </div>
             <button onClick={onClose} className="p-1 hover:bg-white hover:text-bauhaus-blue transition-colors">
                <X size={24} strokeWidth={3} />
             </button>
          </div>

          <div className="p-6 md:p-8">
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                 {/* Main Stats Column */}
                 <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 border-4 border-bauhaus-black bg-gray-50 shadow-hard-sm">
                        <div className="text-xs font-black uppercase text-gray-500">Current Rating</div>
                        <div className="text-4xl font-black text-bauhaus-blue">{Math.round(movie.elo)}</div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border-2 border-bauhaus-black bg-white">
                            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-bauhaus-green mb-1">
                                <TrendingUp size={12} /> Peak
                            </div>
                            <div className="text-xl font-bold">{Math.round(stats.peakElo)}</div>
                        </div>
                        <div className="p-3 border-2 border-bauhaus-black bg-white">
                            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-bauhaus-red mb-1">
                                <TrendingDown size={12} /> Low
                            </div>
                            <div className="text-xl font-bold">{Math.round(stats.lowestElo)}</div>
                        </div>
                     </div>

                     <div className="p-4 border-2 border-bauhaus-black bg-bauhaus-black text-white">
                        <div className="text-xs font-bold uppercase opacity-70 mb-2">Performance</div>
                        <div className="flex justify-between items-end">
                            <div className="text-3xl font-black">{movie.matches > 0 ? Math.round((movie.wins / movie.matches) * 100) : 0}%</div>
                            <div className="text-sm font-mono text-bauhaus-yellow">{movie.wins}W - {movie.losses}L</div>
                        </div>
                     </div>
                 </div>

                 {/* Advanced Analytics Column (Chess Style) */}
                 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {/* Volatility */}
                     <div className="p-4 border-2 border-bauhaus-black bg-white shadow-hard-sm">
                        <div className="flex items-center gap-2 mb-2 text-bauhaus-blue">
                             <Activity size={20} />
                             <span className="font-black uppercase text-sm">Volatility</span>
                        </div>
                        <div className="flex items-end gap-2">
                             <span className="text-3xl font-black">{stats.volatilityScore}</span>
                             <span className="text-xs font-bold text-gray-400 mb-1">/ 100</span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 mt-2">
                            {stats.volatilityScore > 50 ? "Wildly inconsistent results" : "Stable ranking performance"}
                        </p>
                     </div>

                     {/* Clutch Factor */}
                     <div className="p-4 border-2 border-bauhaus-black bg-white shadow-hard-sm">
                        <div className="flex items-center gap-2 mb-2 text-bauhaus-yellow">
                             <Target size={20} className="text-bauhaus-black"/>
                             <span className="font-black uppercase text-sm text-bauhaus-black">Clutch Factor</span>
                        </div>
                        <div className="flex items-end gap-2">
                             <span className="text-3xl font-black text-bauhaus-black">{stats.clutchFactor}%</span>
                             <span className="text-xs font-bold text-gray-400 mb-1">Win rate</span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 mt-2">
                            In {stats.closeMatches} close matchups (±50 Elo)
                        </p>
                     </div>

                     {/* Upset Wins */}
                     <div className="p-4 border-2 border-bauhaus-black bg-white shadow-hard-sm">
                        <div className="flex items-center gap-2 mb-2 text-bauhaus-red">
                             <Zap size={20} />
                             <span className="font-black uppercase text-sm text-bauhaus-black">Giant Slayer</span>
                        </div>
                        <div className="flex items-end gap-2">
                             <span className="text-3xl font-black text-bauhaus-black">{stats.upsetWins}</span>
                             <span className="text-xs font-bold text-gray-400 mb-1">Upsets</span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 mt-2">
                            Wins vs. much higher ranked films (+80 Elo)
                        </p>
                     </div>

                     {/* Confidence/Reliability */}
                     <div className="p-4 border-2 border-bauhaus-black bg-white shadow-hard-sm">
                        <div className="flex items-center gap-2 mb-2 text-green-600">
                             <Shield size={20} />
                             <span className="font-black uppercase text-sm text-bauhaus-black">Data Quality</span>
                        </div>
                        <div className="flex items-end gap-2">
                             <span className="text-3xl font-black text-bauhaus-black">
                                {stats.confidence < 30 ? 'LOW' : stats.confidence < 70 ? 'MED' : 'HIGH'}
                             </span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 mt-2">
                            Based on {movie.matches} total sample size
                        </p>
                     </div>
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