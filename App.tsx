import React, { useState } from 'react';
import { Movie, AppView } from './types';
import FileUpload from './components/FileUpload';
import VotingArena from './components/VotingArena';
import Leaderboard from './components/Leaderboard';
import { Film } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.UPLOAD);
  const [movies, setMovies] = useState<Movie[]>([]);

  const handleDataLoaded = (data: Movie[]) => {
    setMovies(data);
    setView(AppView.VOTE);
  };

  const renderContent = () => {
    switch (view) {
      case AppView.UPLOAD:
        return <FileUpload onDataLoaded={handleDataLoaded} />;
      case AppView.VOTE:
        return (
          <VotingArena 
            movies={movies} 
            onUpdateMovies={setMovies} 
            onFinish={() => setView(AppView.LEADERBOARD)}
          />
        );
      case AppView.LEADERBOARD:
        return (
          <Leaderboard 
            movies={movies} 
            onBack={() => setView(AppView.VOTE)} 
          />
        );
      default:
        return <div>Error</div>;
    }
  };

  return (
    <div className="min-h-screen bg-bauhaus-bg text-bauhaus-text font-sans selection:bg-bauhaus-yellow selection:text-bauhaus-black flex flex-col">
      {/* Geometric Navbar */}
      <nav className="bg-white border-b-4 border-bauhaus-black sticky top-0 z-50 shadow-hard-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Area */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => movies.length > 0 && setView(AppView.VOTE)}
          >
            {/* Geometric Logo Mark */}
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-bauhaus-blue border-2 border-bauhaus-black transition-transform group-hover:translate-x-1 group-hover:translate-y-1"></div>
                <div className="absolute inset-0 bg-bauhaus-red border-2 border-bauhaus-black -translate-x-1 -translate-y-1 flex items-center justify-center">
                    <Film size={20} className="text-white" strokeWidth={3} />
                </div>
            </div>
            
            <div className="flex flex-col leading-none">
              <span className="font-black text-2xl uppercase tracking-tighter text-bauhaus-black group-hover:text-bauhaus-red transition-colors">
                CineRank
              </span>
              <span className="font-bold text-xs uppercase tracking-[0.3em] text-bauhaus-blue">
                Bauhaus
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {movies.length > 0 && (
               <div className="hidden md:flex items-center gap-2 px-4 py-1 bg-bauhaus-black text-white font-mono text-xs font-bold border-2 border-transparent">
                  <span className="text-bauhaus-yellow">●</span> {movies.length} FILMS LOADED
               </div>
             )}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full animate-fade-in py-8">
        {renderContent()}
      </main>

      {/* Footer Decoration */}
      <footer className="border-t-4 border-bauhaus-black bg-bauhaus-yellow py-6 text-center">
        <p className="font-black uppercase tracking-widest text-xs opacity-70">
           Form Follows Function • 2025
        </p>
      </footer>
    </div>
  );
};

export default App;