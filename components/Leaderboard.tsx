import React, { useMemo, useState } from 'react';
import { Movie } from '../types';
import { Trophy, ArrowLeft, Download, Search } from 'lucide-react';
import Button from './Button';
import { INITIAL_ELO } from '../constants';

interface LeaderboardProps {
  movies: Movie[];
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ movies, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const sortedMovies = useMemo(() => {
    return [...movies]
      .sort((a, b) => b.elo - a.elo)
      .map((m, i) => ({ ...m, rank: i + 1 }));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return sortedMovies.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedMovies, searchTerm]);

  const downloadCSV = () => {
    const headers = ['Rank', 'Name', 'Year', 'Rating', 'ELO', 'Matches', 'Wins', 'Losses'];
    const rows = sortedMovies.map(m => [
      m.rank,
      `"${m.name.replace(/"/g, '""')}"`,
      m.year,
      m.rating || '',
      Math.round(m.elo),
      m.matches,
      m.wins,
      m.losses
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cinerank_elo_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Button onClick={onBack} variant="ghost" className="mb-2 pl-0 hover:bg-transparent hover:text-lb-green">
            <ArrowLeft size={18} className="mr-1 inline" /> Back to Voting
          </Button>
          <h2 className="text-3xl font-serif font-bold text-white">Your Rankings</h2>
          <p className="text-lb-text text-sm mt-1">
            Based on {movies.reduce((acc, m) => acc + m.matches, 0) / 2} comparisons
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lb-text" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-lb-gray/50 border border-lb-gray rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-lb-green"
            />
          </div>
          <Button onClick={downloadCSV} variant="outline" className="whitespace-nowrap">
            <Download size={18} />
          </Button>
        </div>
      </div>

      <div className="bg-lb-gray rounded-xl overflow-hidden shadow-xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-lb-text text-xs uppercase tracking-wider border-b border-white/5">
                <th className="p-4 font-semibold w-16 text-center">Rank</th>
                <th className="p-4 font-semibold">Film</th>
                <th className="p-4 font-semibold w-24 text-right">ELO</th>
                <th className="p-4 font-semibold w-24 text-center hidden sm:table-cell">W/L</th>
                <th className="p-4 font-semibold w-24 text-center hidden sm:table-cell">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMovies.slice(0, 100).map((movie) => (
                <tr 
                  key={movie.id} 
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="p-4 text-center">
                    <div className={`
                      font-mono font-bold text-lg
                      ${movie.rank === 1 ? 'text-yellow-400' : 
                        movie.rank === 2 ? 'text-gray-300' : 
                        movie.rank === 3 ? 'text-amber-600' : 'text-lb-text'}
                    `}>
                      {movie.rank}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Simple visual colored square if no poster */}
                      <div 
                        className="w-10 h-14 rounded bg-lb-dark flex-shrink-0 shadow-inner"
                        style={{ backgroundColor: `hsl(${parseInt(movie.id.split('-').pop()||'0')*137%360}, 50%, 30%)` }}
                      ></div>
                      <div>
                        <div className="font-bold text-white group-hover:text-lb-blue transition-colors text-lg">
                          {movie.name}
                        </div>
                        <div className="text-sm text-lb-text">{movie.year}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-mono font-bold text-lb-green text-lg">
                      {Math.round(movie.elo)}
                    </span>
                    {movie.elo !== INITIAL_ELO && (
                        <div className="text-[10px] text-lb-text">
                            {movie.elo > INITIAL_ELO ? '+' : ''}{Math.round(movie.elo - INITIAL_ELO)}
                        </div>
                    )}
                  </td>
                  <td className="p-4 text-center hidden sm:table-cell">
                    <span className="text-xs text-white bg-white/10 px-2 py-1 rounded-full">
                      {movie.wins} - {movie.losses}
                    </span>
                  </td>
                  <td className="p-4 text-center hidden sm:table-cell">
                     {movie.rating ? (
                       <span className="text-lb-green font-bold">★ {movie.rating}</span>
                     ) : <span className="text-lb-text/20">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredMovies.length > 100 && (
          <div className="p-4 text-center text-lb-text text-sm bg-black/20">
            Showing top 100 of {filteredMovies.length} movies. Download CSV for full list.
          </div>
        )}
        {filteredMovies.length === 0 && (
            <div className="p-12 text-center text-lb-text">
                No movies found matching "{searchTerm}"
            </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
