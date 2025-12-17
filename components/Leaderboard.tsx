
import React, { useMemo, useState } from 'react';
import { Movie } from '../types';
import { Trophy, ArrowLeft, Download, Search, ArrowUpDown, Calendar, Hash, Award, ImageIcon, Zap, Flame, Scale, List } from 'lucide-react';
import Button from './Button';
import { INITIAL_ELO } from '../constants';
import EloHistogram from './EloHistogram';
import MovieDetailModal from './MovieDetailModal';

interface LeaderboardProps {
  movies: Movie[];
  onBack: () => void;
}

type SortField = 'elo' | 'name' | 'year' | 'matches';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'RANKINGS' | 'INSIGHTS';

const Leaderboard: React.FC<LeaderboardProps> = ({ movies, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('elo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('RANKINGS');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to desc for new fields usually
    }
  };

  const processedMovies = useMemo(() => {
    // 1. Filter
    const filtered = movies.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Sort
    const sorted = [...filtered].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Clean up strings for comparison
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      // Handle Year which is string in type but number conceptually
      if (sortField === 'year') {
         valA = parseInt(a.year || '0');
         valB = parseInt(b.year || '0');
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // 3. Add Ranks (based on Elo regardless of display sort, usually)
    const eloSorted = [...movies].sort((a, b) => b.elo - a.elo);
    const idToRank = new Map(eloSorted.map((m, i) => [m.id, i + 1]));

    return sorted.map(m => ({
      ...m,
      trueRank: idToRank.get(m.id) || 0
    }));

  }, [movies, searchTerm, sortField, sortDirection]);

  // --- Insights Calculation ---
  const insights = useMemo(() => {
     if (viewMode !== 'INSIGHTS') return null;

     let biggestUpset = { movieName: '', oppName: '', diff: 0, date: 0 };
     let longestStreak = { movie: null as Movie | null, streak: 0 };
     let mostPolarizing = { movie: null as Movie | null, volatility: 0 };

     // Scan all movies
     movies.forEach(m => {
        // 1. Longest Streak
        if (m.history) {
           let currentStreak = 0;
           let maxLocalStreak = 0;
           // History is chronological usually, but let's sort to be safe
           const sortedHistory = [...m.history].sort((a, b) => a.timestamp - b.timestamp);
           
           sortedHistory.forEach(match => {
              if (match.result === 'WIN') {
                 currentStreak++;
                 maxLocalStreak = Math.max(maxLocalStreak, currentStreak);
              } else {
                 currentStreak = 0;
              }

              // 2. Biggest Upset (Win against higher elo)
              // Calculate opp elo if not stored
              let oppElo = match.opponentElo;
              if (oppElo === undefined) {
                 // Estimation fallback
                 const myEloBefore = match.newElo - match.eloChange;
                 // If I gained > 20 points (K=32), I beat someone much higher
                 if (match.result === 'WIN' && match.eloChange > 20) {
                     // rough approximation
                     oppElo = myEloBefore + 100; 
                 } else {
                     oppElo = myEloBefore;
                 }
              }
              
              const myEloBefore = match.newElo - match.eloChange;
              if (match.result === 'WIN' && oppElo > myEloBefore) {
                  const diff = oppElo - myEloBefore;
                  if (diff > biggestUpset.diff) {
                      biggestUpset = {
                          movieName: m.name,
                          oppName: match.opponentName,
                          diff: Math.round(diff),
                          date: match.timestamp
                      };
                  }
              }
           });

           if (maxLocalStreak > longestStreak.streak) {
               longestStreak = { movie: m, streak: maxLocalStreak };
           }

           // 3. Polarizing (High volatility in recent history)
           if (m.matches > 5) {
               const changes = m.history.map(h => Math.abs(h.eloChange));
               const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
               if (avgChange > mostPolarizing.volatility) {
                   mostPolarizing = { movie: m, volatility: avgChange };
               }
           }
        }
     });

     return { biggestUpset, longestStreak, mostPolarizing };
  }, [movies, viewMode]);


  const downloadCSV = () => {
    const headers = ['Rank', 'Name', 'Year', 'Rating', 'ELO', 'Matches', 'Wins', 'Losses'];
    const rows = processedMovies.map(m => [
      m.trueRank,
      `"${m.name.replace(/"/g, '""')}"`,
      m.year,
      m.rating || '',
      Math.round(m.elo),
      m.matches,
      m.wins,
      m.losses
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'filmelo_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="opacity-20" />;
    return <ArrowUpDown size={14} className={`opacity-100 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
        />
      )}

      {/* Header */}
      <div className="bg-bauhaus-blue p-6 md:p-10 text-white border-4 border-bauhaus-black shadow-hard-lg mb-8 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-bauhaus-red rounded-full border-4 border-bauhaus-black opacity-50"></div>
        <div className="absolute right-20 -bottom-10 w-20 h-20 bg-bauhaus-yellow rotate-45 border-4 border-bauhaus-black opacity-50"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <Button onClick={onBack} variant="ghost" className="mb-4 text-white hover:text-bauhaus-yellow pl-0 border-none shadow-none">
                <ArrowLeft size={20} className="mr-2 inline" /> Return to Arena
              </Button>
              <h2 className="text-5xl font-black uppercase tracking-tighter">Leaderboard</h2>
              <div className="flex gap-4 mt-4">
                  <button 
                    onClick={() => setViewMode('RANKINGS')}
                    className={`text-sm font-bold uppercase tracking-widest px-3 py-1 border-2 border-white transition-colors ${viewMode === 'RANKINGS' ? 'bg-white text-bauhaus-blue' : 'text-white hover:bg-white/10'}`}
                  >
                    Rankings
                  </button>
                  <button 
                    onClick={() => setViewMode('INSIGHTS')}
                    className={`text-sm font-bold uppercase tracking-widest px-3 py-1 border-2 border-white transition-colors ${viewMode === 'INSIGHTS' ? 'bg-white text-bauhaus-blue' : 'text-white hover:bg-white/10'}`}
                  >
                    Meta Insights
                  </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bauhaus-black" size={18} />
                <input 
                  type="text" 
                  placeholder="SEARCH FILMS..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 bg-white border-2 border-bauhaus-black py-3 pl-10 pr-4 text-bauhaus-black font-bold placeholder:text-gray-400 focus:outline-none focus:shadow-hard-sm transition-all uppercase text-sm"
                />
              </div>
              <Button onClick={downloadCSV} variant="yellow">
                <Download size={18} />
              </Button>
            </div>
        </div>
      </div>
      
      {/* View Switcher */}
      {viewMode === 'RANKINGS' ? (
        <>
          {/* Overall Stats Graph */}
          <EloHistogram movies={movies} />

          {/* Table Container */}
          <div className="bg-white border-4 border-bauhaus-black shadow-hard-lg animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bauhaus-black text-white text-sm uppercase tracking-widest cursor-pointer select-none">
                    <th 
                        className="p-4 font-bold w-20 text-center hover:bg-white/10 transition-colors group"
                        onClick={() => handleSort('elo')}
                    >
                        <div className="flex items-center justify-center gap-1">
                            <Hash size={14} /> <SortIcon field="elo" />
                        </div>
                    </th>
                    <th 
                        className="p-4 font-bold border-l-2 border-white/20 hover:bg-white/10 transition-colors"
                        onClick={() => handleSort('name')}
                    >
                        <div className="flex items-center gap-2">
                            FILM <SortIcon field="name" />
                        </div>
                    </th>
                    <th 
                        className="p-4 font-bold text-right border-l-2 border-white/20 w-32 hover:bg-white/10 transition-colors"
                        onClick={() => handleSort('elo')}
                    >
                        <div className="flex items-center justify-end gap-2">
                             ELO <SortIcon field="elo" />
                        </div>
                    </th>
                    <th 
                        className="p-4 font-bold text-center border-l-2 border-white/20 hidden sm:table-cell hover:bg-white/10 transition-colors"
                        onClick={() => handleSort('matches')}
                    >
                        <div className="flex items-center justify-center gap-2">
                             MATCHES <SortIcon field="matches" />
                        </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedMovies.slice(0, 100).map((movie, index) => (
                    <tr 
                      key={movie.id} 
                      className="border-b-2 border-bauhaus-muted hover:bg-bauhaus-yellow/20 transition-colors group cursor-pointer"
                      onClick={() => setSelectedMovie(movie)}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="p-4 text-center">
                        <div className={`
                          font-black text-xl w-10 h-10 flex items-center justify-center mx-auto border-2 border-bauhaus-black shadow-hard-sm
                          ${movie.trueRank === 1 ? 'bg-bauhaus-yellow text-bauhaus-black' : 
                            movie.trueRank === 2 ? 'bg-gray-300 text-bauhaus-black' : 
                            movie.trueRank === 3 ? 'bg-bauhaus-red text-white' : 'bg-white text-bauhaus-black'}
                        `}>
                          {movie.trueRank}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Thumbnail with fallback */}
                          <div className="w-10 h-14 bg-gray-200 border-2 border-bauhaus-black flex-shrink-0 relative overflow-hidden">
                              {movie.posterPath ? (
                                  <img src={movie.posterPath} alt="" className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <ImageIcon size={16} />
                                  </div>
                              )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-lg text-bauhaus-black uppercase tracking-tight group-hover:text-bauhaus-blue transition-colors">
                              {movie.name}
                            </span>
                            <div className="flex gap-2 items-center mt-1">
                                 <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1 border border-gray-300">
                                    {movie.year}
                                 </span>
                                 <span className="text-[10px] uppercase font-bold text-bauhaus-blue opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Details
                                 </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-black text-xl text-bauhaus-black">
                          {Math.round(movie.elo)}
                        </span>
                        {movie.elo !== INITIAL_ELO && (
                            <div className={`text-[10px] font-bold ${movie.elo > INITIAL_ELO ? 'text-bauhaus-green' : 'text-gray-400'}`}>
                                {movie.elo > INITIAL_ELO ? '+' : ''}{Math.round(movie.elo - INITIAL_ELO)}
                            </div>
                        )}
                      </td>
                      <td className="p-4 text-center hidden sm:table-cell">
                        <span className="font-mono text-xs font-bold border border-bauhaus-black px-2 py-1 bg-white shadow-[2px_2px_0px_0px_black]">
                          {movie.wins}W - {movie.losses}L
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {processedMovies.length === 0 && (
                <div className="p-12 text-center font-bold uppercase text-gray-400">
                    No films match your search
                </div>
            )}
          </div>
        </>
      ) : (
        <div className="animate-slide-up grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Biggest Upset */}
            <div className="bg-white border-4 border-bauhaus-black p-8 shadow-hard-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap size={100} />
                </div>
                <h3 className="text-xl font-black uppercase text-bauhaus-red mb-4 flex items-center gap-2">
                    <Zap size={24} /> The Giant Slayer
                </h3>
                {insights?.biggestUpset.movieName ? (
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Single Biggest Upset</p>
                        <p className="text-3xl font-black text-bauhaus-black mb-2">{insights.biggestUpset.movieName}</p>
                        <div className="inline-block bg-bauhaus-yellow px-2 py-1 border-2 border-bauhaus-black font-bold text-xs uppercase mb-4">
                            Defeated {insights.biggestUpset.oppName}
                        </div>
                        <p className="text-sm font-medium">
                            Overcame a <span className="font-black text-bauhaus-red">{insights.biggestUpset.diff} point</span> Elo difference.
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-400 font-bold italic">Not enough data yet.</p>
                )}
            </div>

            {/* 2. Longest Streak */}
            <div className="bg-white border-4 border-bauhaus-black p-8 shadow-hard-md relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Flame size={100} />
                </div>
                <h3 className="text-xl font-black uppercase text-bauhaus-yellow mb-4 flex items-center gap-2">
                    <Flame size={24} className="text-bauhaus-black" /> The Unstoppable
                </h3>
                {insights?.longestStreak.movie ? (
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Longest Win Streak</p>
                        <p className="text-3xl font-black text-bauhaus-black mb-2">{insights.longestStreak.movie.name}</p>
                        <div className="inline-block bg-bauhaus-black text-white px-2 py-1 border-2 border-transparent font-bold text-xs uppercase mb-4">
                            {insights.longestStreak.streak} Consecutive Wins
                        </div>
                        <p className="text-sm font-medium">
                            A dominant run of form that crushed the competition.
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-400 font-bold italic">Not enough data yet.</p>
                )}
            </div>

             {/* 3. Most Polarizing */}
             <div className="bg-white border-4 border-bauhaus-black p-8 shadow-hard-md relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Scale size={100} />
                </div>
                <h3 className="text-xl font-black uppercase text-bauhaus-blue mb-4 flex items-center gap-2">
                    <Scale size={24} /> The Divider
                </h3>
                {insights?.mostPolarizing.movie ? (
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Most Volatile Rating</p>
                        <p className="text-3xl font-black text-bauhaus-black mb-2">{insights.mostPolarizing.movie.name}</p>
                        <div className="inline-block bg-bauhaus-blue text-white px-2 py-1 border-2 border-bauhaus-black font-bold text-xs uppercase mb-4">
                            High Variance
                        </div>
                        <p className="text-sm font-medium">
                            This film bounces between wins and losses more than any other.
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-400 font-bold italic">Not enough data yet.</p>
                )}
            </div>

            {/* 4. Top 5 List */}
            <div className="bg-bauhaus-black text-white border-4 border-bauhaus-black p-8 shadow-hard-md relative overflow-hidden">
                <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2 text-bauhaus-yellow">
                    <List size={24} /> Current Top 5
                </h3>
                <ul className="space-y-3">
                    {processedMovies.slice(0, 5).map((m, i) => (
                        <li key={m.id} className="flex items-center justify-between border-b border-white/20 pb-2">
                            <span className="font-bold text-lg"><span className="text-bauhaus-yellow mr-3">#{i+1}</span> {m.name}</span>
                            <span className="font-mono text-sm opacity-70">{Math.round(m.elo)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
