import React from 'react';
import { Movie, AIAnalysis } from '../types';
import { Star, TrendingUp, Award } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  aiData?: { vibe: string; strengths: string[] };
  isWinning?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, aiData, isWinning }) => {
  // Deterministic placeholder based on ID for color
  const hue = parseInt(movie.id.split('-').pop() || '0') * 137 % 360;
  
  return (
    <div 
      onClick={onClick}
      className="group relative w-full h-full min-h-[400px] cursor-pointer bg-lb-gray rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lb-green/20 ring-1 ring-white/10 hover:ring-lb-green/50"
    >
      {/* Background / Poster Placeholder */}
      <div 
        className="absolute inset-0 opacity-40 transition-opacity group-hover:opacity-30"
        style={{ 
          backgroundColor: `hsl(${hue}, 60%, 20%)`,
          backgroundImage: `linear-gradient(to bottom, transparent, #14181c)`
        }} 
      />
      
      {/* Content Container */}
      <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
        
        {/* Header */}
        <div>
          <div className="flex justify-between items-start">
            <span className="bg-black/40 backdrop-blur px-3 py-1 rounded text-xs font-mono text-lb-text border border-white/10">
              {movie.year}
            </span>
            {movie.rating && (
              <div className="flex items-center gap-1 text-lb-green bg-black/40 backdrop-blur px-2 py-1 rounded border border-lb-green/20">
                <Star size={12} fill="currentColor" />
                <span className="text-xs font-bold">{movie.rating}</span>
              </div>
            )}
          </div>
          
          <h3 className="mt-4 text-3xl md:text-4xl font-serif font-bold text-white leading-tight drop-shadow-lg group-hover:text-lb-blue transition-colors">
            {movie.name}
          </h3>
          
          <div className="flex gap-2 mt-4 flex-wrap">
             <div className="flex items-center gap-1 text-xs text-lb-text bg-lb-dark/50 px-2 py-1 rounded">
               <TrendingUp size={12} /> ELO {Math.round(movie.elo)}
             </div>
             <div className="flex items-center gap-1 text-xs text-lb-text bg-lb-dark/50 px-2 py-1 rounded">
               <Award size={12} /> {movie.matches} Matches
             </div>
          </div>
        </div>

        {/* AI Vibe Section */}
        {aiData ? (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-lb-dark/80 backdrop-blur-md p-4 rounded-lg border-l-2 border-lb-blue shadow-lg">
              <p className="text-sm text-lb-blue font-bold uppercase tracking-wider text-xs mb-1">Vibe Check</p>
              <p className="text-white italic">"{aiData.vibe}"</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {aiData.strengths.map((s, i) => (
                <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <span className="text-lb-green font-bold text-lg tracking-widest uppercase border-2 border-lb-green px-6 py-2 rounded">
              Pick Me
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
