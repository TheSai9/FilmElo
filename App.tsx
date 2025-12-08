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
    <div className="min-h-screen bg-lb-dark text-white font-sans selection:bg-lb-green selection:text-white">
      {/* Global Nav */}
      <nav className="border-b border-white/5 bg-lb-dark/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer group"
            onClick={() => movies.length > 0 && setView(AppView.VOTE)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-lb-green to-lb-blue rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
               <Film size={18} strokeWidth={3} />
            </div>
            <span className="group-hover:text-white transition-colors">
              Cine<span className="text-lb-green">Rank</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
             {movies.length > 0 && (
               <div className="hidden md:flex items-center gap-1 text-lb-text">
                  <span className="text-white">{movies.length}</span> films loaded
               </div>
             )}
          </div>
        </div>
      </nav>

      <main className="animate-fade-in">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
