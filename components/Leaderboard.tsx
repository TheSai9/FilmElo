
import React, { useMemo, useState } from 'react';
import { Movie } from '../types';
import { Trophy, ArrowLeft, Download, Search, ArrowUpDown, Calendar, Hash, Award, ImageIcon } from 'lucide-react';
import Button from './Button';
import { INITIAL_ELO } from '../constants';

interface LeaderboardProps {
  movies: Movie[];
  onBack: () => void;
}

type SortField = 'elo' | 'name' | 'year' | 'matches';
type SortDirection = 'asc' | 'desc';

const Leaderboard: React.FC<LeaderboardProps> = ({ movies, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('elo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
    link.setAttribute('download', 'cinerank_elo_export.csv');
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
      {/* Header */}
      <div className="bg-bauhaus-blue p-6 md:p-10 text-white border-4 border-bauhaus-black shadow-hard-lg mb-10 relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-bauhaus-red rounded-full border-4 border-bauhaus-black opacity-50"></div>
        <div className="absolute right-20 -bottom-10 w-20 h-20 bg-bauhaus-yellow rotate-45 border-4 border-bauhaus-black opacity-50"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <Button onClick={onBack} variant="ghost" className="mb-4 text-white hover:text-bauhaus-yellow pl-0 border-none shadow-none">
                <ArrowLeft size={20} className="mr-2 inline" /> Return to Arena
              </Button>
              <h2 className="text-5xl font-black uppercase tracking-tighter">Leaderboard</h2>
              <p className="mt-2 text-white/80 font-mono text-sm border-l-4 border-bauhaus-yellow pl-3">
                {movies.reduce((acc, m) => acc + m.matches, 0) / 2} BATTLES RECORDED
              </p>
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

      {/* Table Container */}
      <div className="bg-white border-4 border-bauhaus-black shadow-hard-lg">
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
              {processedMovies.slice(0, 100).map((movie) => (
                <tr 
                  key={movie.id} 
                  className="border-b-2 border-bauhaus-muted hover:bg-bauhaus-yellow/10 transition-colors group"
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
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 w-fit px-1 rounded-sm mt-1 border border-gray-300">
                          {movie.year}
                        </span>
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
    </div>
  );
};

export default Leaderboard;