import React, { useMemo } from 'react';
import { Movie } from '../types';
import { INITIAL_ELO } from '../constants';

interface EloHistogramProps {
  movies: Movie[];
}

const EloHistogram: React.FC<EloHistogramProps> = ({ movies }) => {
  const { data, scaleMax, isScaled } = useMemo(() => {
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

    // If no variance, show a default range centered on 1200
    if (minElo === Infinity) {
        minElo = INITIAL_ELO;
        maxElo = INITIAL_ELO;
    }

    const startBin = Math.floor(minElo / binSize) * binSize;
    const endBin = Math.floor(maxElo / binSize) * binSize;
    
    // Ensure we have a few empty bins on sides for aesthetics
    const displayStart = startBin - binSize;
    const displayEnd = endBin + binSize;

    const chartData = [];
    let absoluteMax = 0;
    let maxExcludingInitial = 0;
    const initialBinStart = Math.floor(INITIAL_ELO / binSize) * binSize;

    for (let b = displayStart; b <= displayEnd; b += binSize) {
      const count = bins.get(b) || 0;
      chartData.push({
        range: b,
        label: `${b}`,
        count: count
      });
      
      if (count > absoluteMax) absoluteMax = count;
      if (b !== initialBinStart && count > maxExcludingInitial) {
        maxExcludingInitial = count;
      }
    }

    // Smart Scaling:
    // If the unranked pile (Initial Elo) dominates the graph, scale based on the
    // rest of the distribution so we can actually see the shape of the curve.
    let calculatedScaleMax = absoluteMax;
    let scaled = false;
    
    // If the biggest bar is the initial pile, and it's > 1.5x larger than the next biggest thing...
    if (absoluteMax > maxExcludingInitial * 1.5 && maxExcludingInitial > 0) {
        calculatedScaleMax = maxExcludingInitial * 1.2; // Scale to the "active" movies + 20% headroom
        scaled = true;
    }

    return { data: chartData, scaleMax: calculatedScaleMax, isScaled: scaled };
  }, [movies]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white border-4 border-bauhaus-black p-6 shadow-hard-md mb-8">
       <div className="flex justify-between items-end mb-4">
         <div>
            <h3 className="font-black uppercase text-bauhaus-black flex items-center gap-2">
            <span className="w-3 h-3 bg-bauhaus-red"></span> Distribution Curve
            </h3>
            {isScaled && (
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wide">
                    * Zoomed in on active rankings
                </p>
            )}
         </div>
         <span className="text-xs font-mono text-gray-500 font-bold">{movies.length} FILMS</span>
       </div>
       
       {/* Height increased to h-80 (320px) */}
       <div className="h-80 flex items-end gap-1 md:gap-2 border-b-2 border-bauhaus-black pb-px relative mt-6">
         {/* Background Grid Lines for Scale Context */}
         <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 z-0">
            <div className="w-full h-px bg-bauhaus-black"></div>
            <div className="w-full h-px bg-bauhaus-black"></div>
            <div className="w-full h-px bg-bauhaus-black"></div>
            <div className="w-full h-px bg-bauhaus-black"></div>
         </div>

         {data.map((bin) => {
            const heightPerc = Math.min((bin.count / scaleMax) * 100, 100);
            const isClipped = bin.count > scaleMax;
            const isZero = bin.count === 0;

            // Bauhaus color coding based on Elo tiers
            const colorClass = bin.range < 1000 ? 'bg-gray-400' : 
                               bin.range < 1200 ? 'bg-bauhaus-blue' :
                               bin.range < 1400 ? 'bg-bauhaus-yellow' : 'bg-bauhaus-red';

            return (
              <div key={bin.range} className="flex-1 flex flex-col items-center group relative z-10 h-full justify-end">
                 {/* Tooltip */}
                 <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-bauhaus-black text-white text-[10px] p-2 font-bold whitespace-nowrap z-50 pointer-events-none shadow-hard-sm">
                    <div className="text-bauhaus-yellow mb-1">ELO {bin.range} - {bin.range + 49}</div>
                    <div>{bin.count} films</div>
                 </div>

                 {/* Bar */}
                 <div 
                   className={`
                      w-full relative transition-all duration-300
                      ${isZero ? 'bg-gray-100' : `${colorClass} border-x-2 border-t-2 border-bauhaus-black`}
                   `}
                   style={{ 
                       height: isZero ? '4px' : `${Math.max(heightPerc, 2)}%`,
                       opacity: isZero ? 0.5 : 1
                   }} 
                 >
                    {/* Pattern Overlay for higher elo */}
                    {bin.range > 1400 && !isZero && (
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSJyZ2JhKDAsMCwwLDAuMikiLz48L3N2Zz4=')] opacity-30"></div>
                    )}

                    {/* Clipped Indicator (Stripes) if bar goes off chart */}
                    {isClipped && (
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDRMMCAwTDQgNEw0IDhaIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiLz48L3N2Zz4=')] opacity-50 border-t-4 border-dashed border-white/50"></div>
                    )}
                 </div>
                 
                 {/* X Axis Label */}
                 <div className="h-8 w-full relative">
                    <span className="text-[9px] font-mono font-bold text-gray-500 absolute top-2 left-1/2 -translate-x-1/2 rotate-[-45deg] whitespace-nowrap origin-center">
                        {bin.range}
                    </span>
                 </div>
              </div>
            );
         })}
       </div>
    </div>
  );
};

export default EloHistogram;