import React from 'react';
import { Movie } from '../types';
import { Star, TrendingUp, Trophy, TrendingDown } from 'lucide-react';

export interface Feedback {
  type: 'WIN' | 'LOSS';
  diff: number;
}

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  aiData?: { vibe: string; strengths: string[] };
  feedback?: Feedback | null;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onClick, aiData, feedback }) => {
  // Deterministic "Art" Generation based on ID
  const seed = parseInt(movie.id.split('-').pop() || '0') + movie.name.length;
  
  // Bauhaus palette choices
  const colors = ['#D02020', '#1040C0', '#F0C020', '#121212', '#FFFFFF'];
  const bgColors = ['#D02020', '#1040C0', '#F0C020']; // Red, Blue, Yellow backgrounds
  
  const bgColor = bgColors[seed % bgColors.length];
  
  // Generate 3 decorative shapes
  const shapes = [1, 2, 3].map(i => {
    const type = (seed + i) % 3; // 0: Circle, 1: Square, 2: Triangle
    const color = colors[(seed + i * 2) % colors.length];
    const size = 40 + ((seed * i * 17) % 60); // % width
    const top = (seed * i * 23) % 80;
    const left = (seed * i * 31) % 80;
    const rotate = (seed * i * 45) % 360;
    
    return { type, color, size, top, left, rotate };
  });

  return (
    <div 
      onClick={onClick}
      className="group relative w-full cursor-pointer bg-white border-4 border-bauhaus-black shadow-hard-lg hover:shadow-hard-xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full overflow-hidden"
    >
      {/* Feedback Overlays - Inside the transformed container to track hover state */}
      {feedback?.type === 'WIN' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-green-500/10 backdrop-blur-[2px] border-4 border-green-500 animate-slide-up">
            <div className="text-center">
            <span className="text-6xl font-black text-green-600 drop-shadow-md block mb-4">WIN</span>
            <div className="inline-flex items-center justify-center text-green-700 font-bold text-3xl bg-white px-6 py-3 border-4 border-green-700 shadow-hard-md">
                <TrendingUp size={28} className="mr-3"/> +{Math.round(feedback.diff)}
            </div>
            </div>
        </div>
      )}
      
      {feedback?.type === 'LOSS' && (
         <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none bg-red-500/10 backdrop-blur-[2px] border-4 border-red-500 animate-slide-up">
             <div className="text-center">
                <div className="inline-flex items-center justify-center text-red-700 font-bold text-3xl bg-white px-6 py-3 border-4 border-red-700 shadow-hard-md">
                    <TrendingDown size={28} className="mr-3"/> {Math.round(feedback.diff)}
                </div>
             </div>
         </div>
      )}

      {/* 1. Poster / Art Area (Top 2/3) */}
      <div 
        className="relative h-64 md:h-80 w-full overflow-hidden border-b-4 border-bauhaus-black bg-gray-100"
      >
        {/* Fallback Geometric Composition - Always rendered but covered by image if present */}
        <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: bgColor }}>
           {shapes.map((s, idx) => (
            <div
              key={idx}
              className="absolute border-4 border-bauhaus-black opacity-90"
              style={{
                width: `${s.size}%`,
                height: s.type === 2 ? '0' : `${s.size}%`,
                top: `${s.top}%`,
                left: `${s.left}%`,
                transform: `rotate(${s.rotate}deg)`,
                backgroundColor: s.type === 2 ? 'transparent' : s.color,
                borderRadius: s.type === 0 ? '50%' : '0%',
                ...(s.type === 2 ? {
                   width: 0, height: 0,
                   borderLeft: `${s.size}px solid transparent`,
                   borderRight: `${s.size}px solid transparent`,
                   borderBottom: `${s.size * 1.5}px solid ${s.color}`,
                   borderTop: 'none',
                   backgroundColor: 'transparent',
                   border: 'none',
                   filter: 'drop-shadow(4px 4px 0px #121212)'
                } : {})
              }}
            />
          ))}
        </div>

        {/* TMDB Poster Image */}
        {movie.posterPath && (
          <img 
            src={movie.posterPath} 
            alt={`Poster for ${movie.name}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        )}
        
        {/* Rating Badge Overlay */}
        {movie.rating && (
          <div className="absolute top-4 right-4 bg-white border-2 border-bauhaus-black px-3 py-1 shadow-hard-sm flex items-center gap-1 z-10">
            <Star size={14} className="fill-bauhaus-yellow text-bauhaus-black" />
            <span className="font-bold text-sm">{movie.rating}</span>
          </div>
        )}

        {/* Year Badge Overlay */}
        <div className="absolute top-4 left-4 bg-bauhaus-black text-white px-3 py-1 font-mono text-sm font-bold shadow-hard-sm z-10">
          {movie.year}
        </div>
      </div>
      
      {/* 2. Content Area (Bottom 1/3) */}
      <div className="p-6 flex flex-col justify-between flex-1 bg-white relative">
        
        <div>
          <h3 className="text-2xl md:text-3xl font-black uppercase leading-none tracking-tight text-bauhaus-black mb-2 break-words">
            {movie.name}
          </h3>
          
          <div className="flex flex-wrap gap-2 mt-3">
             <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest bg-bauhaus-muted/30 px-2 py-1 border border-bauhaus-black">
               <TrendingUp size={12} /> ELO {Math.round(movie.elo)}
             </div>
             <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest bg-bauhaus-muted/30 px-2 py-1 border border-bauhaus-black">
               <Trophy size={12} /> {movie.matches} Matches
             </div>
          </div>
        </div>

        {/* AI Vibe Section */}
        {aiData ? (
          <div className="mt-4 pt-4 border-t-2 border-bauhaus-black/20 animate-slide-up">
            <div className="bg-bauhaus-yellow/20 p-3 border-l-4 border-bauhaus-blue">
              <p className="text-xs font-black uppercase text-bauhaus-blue mb-1">Vibe Check</p>
              <p className="text-sm font-medium italic">"{aiData.vibe}"</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t-2 border-bauhaus-black/20 opacity-50 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-black uppercase text-bauhaus-red tracking-widest">
              Click to Vote
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;