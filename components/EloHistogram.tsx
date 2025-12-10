
import React, { useMemo } from 'react';
import { Movie } from '../types';

interface EloHistogramProps {
  movies: Movie[];
}

const EloHistogram: React.FC<EloHistogramProps> = ({ movies }) => {
  const data = useMemo(() => {
    // 1. Determine bins (e.g., 50 point increments)
    const binSize = 50;
    const bins = new Map<number, number>();
    
    let minElo = Infinity;
    let maxElo = -Infinity;

    movies.forEach(m => {
      const bin = Math.floor(m.elo / binSize) * binSize;
      bins.set(bin, (bins.get(bin) || 0) + 1);
      if (m.elo < minElo) minElo = m.elo;
      if (m.elo > maxElo) maxElo = m.elo;
    });

    const startBin = Math.floor(minElo / binSize) * binSize;
    const endBin = Math.floor(maxElo / binSize) * binSize;
    
    const chartData = [];
    for (let b = startBin; b <= endBin; b += binSize) {
      chartData.push({
        range: b,
        label: `${b}`,
        count: bins.get(b) || 0
      });
    }

    return chartData;
  }, [movies]);

  if (data.length === 0) return null;

  const maxCount = Math.max(...data.map(d => d.count));
  
  return (
    <div className="bg-white border-4 border-bauhaus-black p-6 shadow-hard-md mb-8">
       <h3 className="font-black uppercase text-bauhaus-black mb-4 flex items-center gap-2">
         <span className="w-3 h-3 bg-bauhaus-red"></span> Distribution Curve
       </h3>
       
       <div className="h-32 flex items-end gap-1 md:gap-2">
         {data.map((bin) => {
            const heightPerc = (bin.count / maxCount) * 100;
            // Bauhaus color rotation
            const colorClass = bin.range < 1000 ? 'bg-gray-400' : 
                               bin.range < 1200 ? 'bg-bauhaus-blue' :
                               bin.range < 1400 ? 'bg-bauhaus-yellow' : 'bg-bauhaus-red';

            return (
              <div key={bin.range} className="flex-1 flex flex-col items-center group relative">
                 {/* Tooltip */}
                 <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-bauhaus-black text-white text-[10px] p-1 font-bold whitespace-nowrap z-10 pointer-events-none">
                    {bin.range} - {bin.range + 49} : {bin.count} films
                 </div>

                 <div 
                   className={`w-full ${colorClass} border-2 border-bauhaus-black transition-all duration-300 relative`}
                   style={{ height: `${Math.max(heightPerc, 5)}%` }}
                 >
                    {/* Pattern Overlay for higher elo */}
                    {bin.range > 1400 && (
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDAsMCwwLDAuMikiLz48L3N2Zz4=')] opacity-30"></div>
                    )}
                 </div>
                 <span className="text-[9px] font-mono text-gray-500 mt-1 hidden md:block rotate-[-45deg] origin-left translate-y-2">
                    {bin.range}
                 </span>
              </div>
            );
         })}
       </div>
    </div>
  );
};

export default EloHistogram;
