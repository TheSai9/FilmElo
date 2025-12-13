
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Movie } from '../types';
import { runSimulationRound } from '../services/simulationService';
import { getProjectedTasteProfile } from '../services/geminiService';
import Button from './Button';
import { Play, Pause, RotateCcw, ArrowLeft, BrainCircuit, Sparkles, TrendingUp, Cpu } from 'lucide-react';

interface SimulationViewProps {
  movies: Movie[];
  onBack: () => void;
}

interface DataPoint {
  round: number;
  elo: number;
}

const SimulationView: React.FC<SimulationViewProps> = ({ movies: initialMovies, onBack }) => {
  const [currentMovies, setCurrentMovies] = useState<Movie[]>(initialMovies);
  const [round, setRound] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<Map<string, DataPoint[]>>(new Map());
  const [tasteProfile, setTasteProfile] = useState<{
      profileName: string;
      description: string;
      keyThemes: string[];
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);

  // --- Simulation Logic ---

  const step = () => {
    setCurrentMovies(prev => {
        const next = runSimulationRound(prev);
        
        // Update history for visualization
        setHistory(prevHist => {
            const newHist = new Map(prevHist);
            next.forEach(m => {
                const points = newHist.get(m.id) || [{ round: 0, elo: m.elo }]; // Init if empty
                points.push({ round: round + 1, elo: m.elo });
                newHist.set(m.id, points);
            });
            return newHist;
        });
        
        setRound(r => r + 1);
        return next;
    });
  };

  useEffect(() => {
    if (isRunning) {
      const loop = () => {
        step();
        // Slow down slightly for visual effect? No, let it rip but throttle slightly via timeout if needed
        // For 60fps, we use requestAnimationFrame
        // But the calculation is heavy, so let's do setTimeout to give UI breathing room
        requestRef.current = window.setTimeout(loop, 50); 
      };
      requestRef.current = window.setTimeout(loop, 50);
    }
    return () => {
        if (requestRef.current) clearTimeout(requestRef.current);
    };
  }, [isRunning, round]); // Depend on round to re-trigger

  // --- Visualization Logic (Canvas) ---

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
    }
    
    // Y-Axis grid (Elo)
    // Dynamic Scale
    let maxElo = 1200;
    let minElo = 1200;
    currentMovies.forEach(m => {
        if (m.elo > maxElo) maxElo = m.elo;
        if (m.elo < minElo) minElo = m.elo;
    });
    // Add padding
    maxElo += 50;
    minElo -= 50;
    const range = maxElo - minElo || 1;

    // Draw Lines
    // We only draw lines for:
    // 1. Currently Top 10 (Colored)
    // 2. A random sample of others (Gray, opacity low) to show "the swarm"
    
    const sortedMovies = [...currentMovies].sort((a, b) => b.elo - a.elo);
    const topIds = new Set(sortedMovies.slice(0, 10).map(m => m.id));

    // Helper: Elo to Y
    const getY = (elo: number) => height - ((elo - minElo) / range) * height;
    // Helper: Round to X (Scale x based on max rounds... dynamic)
    // Let's assume max 100 rounds for width, or expand if needed
    const maxRounds = Math.max(round + 10, 50);
    const getX = (r: number) => (r / maxRounds) * width;

    history.forEach((points, id) => {
        const isTop = topIds.has(id);
        if (!isTop && Math.random() > 0.1) return; // Optimization: only draw 10% of background noise

        ctx.beginPath();
        
        if (points.length > 0) {
            ctx.moveTo(getX(points[0].round), getY(points[0].elo));
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(getX(points[i].round), getY(points[i].elo));
            }
        }

        if (isTop) {
            // Bauhaus colors for top 10
            const rank = sortedMovies.findIndex(m => m.id === id);
            const colors = ['#D02020', '#1040C0', '#F0C020', '#121212'];
            ctx.strokeStyle = colors[rank % colors.length];
            ctx.lineWidth = 3;
            ctx.globalAlpha = 1;
            ctx.stroke();
            
            // Draw end dot
            const last = points[points.length - 1];
            if (last) {
                ctx.fillStyle = colors[rank % colors.length];
                ctx.beginPath();
                ctx.arc(getX(last.round), getY(last.elo), 4, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.1;
            ctx.stroke();
        }
    });

    ctx.globalAlpha = 1; // Reset

  }, [history, currentMovies, round]);

  // --- Handlers ---

  const handleReset = () => {
      setIsRunning(false);
      setRound(0);
      setCurrentMovies(initialMovies);
      setHistory(new Map());
      setTasteProfile(null);
  };

  const handleGenerateProfile = async () => {
      setLoadingProfile(true);
      setIsRunning(false);
      const sorted = [...currentMovies].sort((a, b) => b.elo - a.elo);
      const profile = await getProjectedTasteProfile(sorted);
      setTasteProfile(profile);
      setLoadingProfile(false);
  };

  const sortedCurrent = [...currentMovies].sort((a, b) => b.elo - a.elo);

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] max-w-7xl mx-auto px-4 md:px-8 py-6">
       {/* Header */}
       <div className="flex justify-between items-center mb-6">
           <div>
               <Button onClick={onBack} variant="ghost" className="pl-0 hover:bg-transparent">
                   <ArrowLeft size={20} className="mr-2" /> Back
               </Button>
               <h2 className="text-3xl font-black uppercase text-bauhaus-black flex items-center gap-2">
                   <BrainCircuit size={32} className="text-bauhaus-blue" />
                   Neural Projection
               </h2>
           </div>
           
           <div className="flex gap-2">
               <Button onClick={handleReset} variant="outline" title="Reset Simulation">
                   <RotateCcw size={20} />
               </Button>
               <Button onClick={() => setIsRunning(!isRunning)} variant="primary" className="w-32 flex justify-center">
                   {isRunning ? <Pause size={20} /> : <Play size={20} />}
                   <span className="ml-2">{isRunning ? 'Pause' : 'Simulate'}</span>
               </Button>
           </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Chart Area */}
           <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border-4 border-bauhaus-black shadow-hard-lg p-4 relative">
                    <div className="absolute top-4 right-4 bg-bauhaus-yellow px-2 py-1 text-xs font-bold border-2 border-bauhaus-black z-10">
                        ROUND: {round}
                    </div>
                    <canvas 
                        ref={canvasRef} 
                        width={800} 
                        height={400} 
                        className="w-full h-auto bg-gray-50 border border-gray-200"
                    />
                    <div className="flex justify-between mt-2 text-xs font-bold uppercase text-gray-400">
                        <span>Starting Elo</span>
                        <span>Projected Future</span>
                    </div>
                </div>

                {/* AI Analysis Card */}
                <div className="bg-bauhaus-black text-white border-4 border-bauhaus-black shadow-hard-lg p-8 min-h-[200px] relative overflow-hidden group">
                     {/* BG Tech Decoration */}
                     <Cpu size={200} className="absolute -right-10 -bottom-10 text-white/5 rotate-12" />
                     
                     {!tasteProfile ? (
                         <div className="flex flex-col items-center justify-center h-full text-center z-10 relative">
                             <Sparkles size={48} className="mb-4 text-bauhaus-yellow animate-pulse" />
                             <h3 className="text-xl font-bold uppercase mb-2">Unlock AI Analysis</h3>
                             <p className="text-gray-400 text-sm mb-6 max-w-md">
                                 Let the simulation run to stabilize rankings, then ask the AI to construct your psychographic taste profile based on the projected winners.
                             </p>
                             <Button 
                                onClick={handleGenerateProfile} 
                                variant="yellow" 
                                disabled={round < 10 || loadingProfile}
                                className="px-8"
                             >
                                 {loadingProfile ? 'Analyzing Patterns...' : 'Generate Taste Profile'}
                             </Button>
                             {round < 10 && <p className="text-[10px] uppercase mt-2 opacity-50">Run at least 10 rounds first</p>}
                         </div>
                     ) : (
                         <div className="relative z-10 animate-slide-up">
                             <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-bauhaus-yellow text-xs font-black uppercase tracking-widest mb-1">Projected Persona</p>
                                    <h3 className="text-3xl font-black uppercase">{tasteProfile.profileName}</h3>
                                </div>
                                <BrainCircuit size={32} className="text-bauhaus-blue" />
                             </div>
                             
                             <p className="text-lg font-medium leading-relaxed mb-6 border-l-4 border-bauhaus-red pl-4">
                                 "{tasteProfile.description}"
                             </p>

                             <div className="flex flex-wrap gap-2">
                                 {tasteProfile.keyThemes.map((theme, i) => (
                                     <span key={i} className="px-3 py-1 bg-white/10 border border-white/30 text-xs font-bold uppercase rounded-full">
                                         {theme}
                                     </span>
                                 ))}
                             </div>
                         </div>
                     )}
                </div>
           </div>

           {/* Live Leaderboard */}
           <div className="bg-white border-4 border-bauhaus-black shadow-hard-lg p-0 flex flex-col h-[600px]">
               <div className="p-4 border-b-4 border-bauhaus-black bg-gray-50 flex justify-between items-center">
                   <h3 className="font-black uppercase flex items-center gap-2">
                       <TrendingUp size={20} /> Projected Top 10
                   </h3>
                   <span className="text-xs font-bold bg-bauhaus-blue text-white px-2 py-1 rounded-full">LIVE</span>
               </div>
               
               <div className="overflow-y-auto flex-1 p-2 space-y-2">
                   {sortedCurrent.slice(0, 15).map((m, idx) => {
                       const rankChange = initialMovies.find(im => im.id === m.id)?.elo || 0;
                       const diff = m.elo - rankChange;
                       
                       return (
                           <div key={m.id} className="flex items-center gap-3 p-3 border-2 border-gray-100 hover:border-bauhaus-black transition-colors bg-white">
                               <div className={`
                                   w-8 h-8 flex-shrink-0 flex items-center justify-center font-black border-2 border-bauhaus-black shadow-hard-sm
                                   ${idx === 0 ? 'bg-bauhaus-yellow' : idx === 1 ? 'bg-gray-300' : idx === 2 ? 'bg-bauhaus-red text-white' : 'bg-white'}
                               `}>
                                   {idx + 1}
                               </div>
                               <div className="flex-1 min-w-0">
                                   <div className="font-bold truncate text-sm">{m.name}</div>
                                   <div className="flex justify-between items-center mt-1">
                                       <span className="text-[10px] font-mono text-gray-500">{m.year}</span>
                                       <div className="flex items-center gap-1 text-[10px] font-bold">
                                           <span>{Math.round(m.elo)}</span>
                                           {diff !== 0 && (
                                               <span className={diff > 0 ? 'text-green-600' : 'text-red-600'}>
                                                   {diff > 0 ? '↑' : '↓'}
                                               </span>
                                           )}
                                       </div>
                                   </div>
                               </div>
                           </div>
                       );
                   })}
               </div>
           </div>
       </div>
    </div>
  );
};

export default SimulationView;
